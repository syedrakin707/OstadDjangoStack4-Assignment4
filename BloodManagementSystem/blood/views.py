# blood/views.py
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action  # not used for custom endpoints, kept for future extension
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from .models import Profile, BloodBank, BloodDonationRequest, DonationOffer, BLOOD_GROUPS
from .serializers import (
    DonorRegisterSerializer,
    CivilianRegisterSerializer,
    ProfileSerializer,
    BloodBankSerializer,
    BloodDonationRequestSerializer,
    DonationOfferSerializer,
    UserSerializer,
    DonationOfferCreateSerializer
)


# -----------------------------
# Registration Views
# -----------------------------
class DonorRegisterView(APIView):
    def post(self, request):
        serializer = DonorRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CivilianRegisterView(APIView):
    def post(self, request):
        serializer = CivilianRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# -----------------------------
# Profile View
# -----------------------------
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Admins: can see all profiles (and filter by user_type via ?user_type=Donor|Civilian)
        Non-admins: can see only their own profile
        """
        user = self.request.user
        qs = super().get_queryset()
        if not user.is_staff:
            return qs.filter(user=user)

        # admin - optional filtering by user_type
        user_type = self.request.query_params.get('user_type')
        if user_type in ['Donor', 'Civilian']:
            qs = qs.filter(user_type=user_type)
        return qs
    
class MyProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Return the profile of the logged-in user
        return self.request.user.profile

    def get(self, request):
        serializer = ProfileSerializer(self.get_object())
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileSerializer(self.get_object(), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# -----------------------------
# Blood Bank View
# -----------------------------
class BloodBankViewSet(viewsets.ModelViewSet):
    queryset = BloodBank.objects.all()
    serializer_class = BloodBankSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        """
        PATCH /api/bloodbanks/<bank_id>/
        Body example:
        {
        "blood_group": "A+",
        "quantity": 5,
        "action": "add"        # or "allocate"
        }
        """
        bank = self.get_object()
        blood_group = request.data.get('blood_group')
        action_type = request.data.get('action')

        # validate inputs
        try:
            quantity = int(request.data.get('quantity', 0))
        except (TypeError, ValueError):
            return Response({"error": "quantity must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        if not blood_group or action_type not in ['add', 'allocate']:
            return Response({"error": "blood_group and valid action ('add' or 'allocate') are required"},
                            status=status.HTTP_400_BAD_REQUEST)

        valid_groups = {g[0] for g in BLOOD_GROUPS}
        if blood_group not in valid_groups:
            return Response({"error": "Invalid blood group"}, status=status.HTTP_400_BAD_REQUEST)

        # ensure dict keys exist
        available = bank.available_blood or {}
        available.setdefault(blood_group, 0)

        if action_type == 'add':
            available[blood_group] += quantity
        elif action_type == 'allocate':
            if available[blood_group] < quantity:
                return Response({"error": "Insufficient stock"}, status=status.HTTP_400_BAD_REQUEST)
            available[blood_group] -= quantity

        # persist change
        bank.available_blood = available
        bank.save(update_fields=['available_blood'])

        return Response({
            "id": bank.id,
            "name": bank.name,
            "location": bank.location,
            "available_blood": bank.available_blood,
            "blood_group": blood_group,
            "action": action_type,
            "quantity": quantity
        }, status=status.HTTP_200_OK)


# -----------------------------
# Blood Donation Request View
# -----------------------------
class BloodDonationRequestViewSet(viewsets.ModelViewSet):
    queryset = BloodDonationRequest.objects.all()
    serializer_class = BloodDonationRequestSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(civilian=self.request.user)

    def partial_update(self, request, *args, **kwargs):
        """Admin can approve/reject a request."""
        instance = self.get_object()
        status_action = request.data.get('status')
        bank_id = request.data.get('blood_bank')

        # Only admin can approve or reject
        if not request.user.is_staff:
            return Response({"error": "Only admin can approve or reject requests."},
                            status=status.HTTP_403_FORBIDDEN)

        if status_action == 'Approved':
            try:
                blood_bank = BloodBank.objects.get(id=bank_id)
                instance.approve(blood_bank)
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            except BloodBank.DoesNotExist:
                return Response({"error": "Blood bank not found."}, status=status.HTTP_404_NOT_FOUND)
            except ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        elif status_action == 'Rejected':
            instance.status = 'Rejected'
            instance.save(update_fields=['status'])
            serializer = self.get_serializer(instance)
            return Response(serializer.data)

        else:
            return Response({"error": "Invalid status action."}, status=status.HTTP_400_BAD_REQUEST)



# -----------------------------
# Donation Offer View
# -----------------------------
class DonationOfferViewSet(viewsets.ModelViewSet):
    queryset = DonationOffer.objects.all()
    serializer_class = DonationOfferSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create']:
            return DonationOfferCreateSerializer
        return DonationOfferSerializer

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Only the donor who made the offer can delete it
        if request.user != instance.donor:
            return Response(
                {"detail": "You can only delete your own offers."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return DonationOffer.objects.all()
        return DonationOffer.objects.filter(donor=user)
    

class DonorSearchView(ListAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Profile.objects.filter(user_type='Donor')

        blood_group = self.request.query_params.get('blood_group')
        available = self.request.query_params.get('available')

        if blood_group:
            return qs.filter(blood_group__iexact=blood_group)

        if available is not None:
            if available.lower() == 'true':
                return qs.filter(availability=True)
            elif available.lower() == 'false':
                return qs.filter(availability=False)

        return qs


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Return profile info for the logged-in user, 
    including a 'role' key for frontend routing.
    """
    user = request.user

    if user.is_staff:
        role = "Admin"
        # You may also include some admin-only info if needed
        profile_data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": role,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
        return Response(profile_data)

    # Non-staff users
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        return Response({"error": "Profile not found"}, status=404)

    serializer = ProfileSerializer(profile)
    data = serializer.data
    data["role"] = profile.user_type  # "Donor" or "Civilian"
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """
    Return stats for the admin dashboard:
    - total donors
    - total civilians
    - total blood donation requests
    - total available blood units by blood group
    """
    total_donors = Profile.objects.filter(user_type='Donor').count()
    total_civilians = Profile.objects.filter(user_type='Civilian').count()
    total_requests = BloodDonationRequest.objects.count()

    # Sum blood units by blood group from all blood banks
    blood_banks = BloodBank.objects.all()
    blood_units = {}
    for bank in blood_banks:
        for group, qty in (bank.available_blood or {}).items():
            blood_units[group] = blood_units.get(group, 0) + qty

    data = {
        "total_donors": total_donors,
        "total_civilians": total_civilians,
        "total_requests": total_requests,
        "available_blood_units": blood_units
    }

    return Response(data)