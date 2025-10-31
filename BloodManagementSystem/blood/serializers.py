# blood/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BLOOD_GROUPS, Profile, BloodDonationRequest, DonationOffer, BloodBank

# -----------------------------
# Registration Serializers
# -----------------------------
class DonorRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    blood_group = serializers.ChoiceField(choices=BLOOD_GROUPS)  # require blood group

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'blood_group']

    def create(self, validated_data):
        blood_group = validated_data.pop('blood_group')  # extract blood group
        user = User.objects.create_user(**validated_data)
        # Create profile with blood_group
        Profile.objects.create(user=user, user_type='Donor', blood_group=blood_group)
        return user

class CivilianRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user, user_type='Civilian')
        return user

# -----------------------------
# User & Profile
# -----------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Profile
        fields = '__all__'

# -----------------------------
# Blood Bank Serializer
# -----------------------------
class BloodBankSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodBank
        fields = '__all__'

# -----------------------------
# Blood Donation Request Serializer
# -----------------------------
class BloodDonationRequestSerializer(serializers.ModelSerializer):
    civilian = UserSerializer(read_only=True)
    class Meta:
        model = BloodDonationRequest
        fields = '__all__'

# -----------------------------
# Donation Offer Serializer
# -----------------------------
# class DonationOfferSerializer(serializers.ModelSerializer):
#     donor = UserSerializer(read_only=True)
#     class Meta:
#         model = DonationOffer
#         fields = '__all__'
        
# Serializer for creating offers
class DonationOfferCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonationOffer
        fields = ('request',)  # donor will be set in perform_create

# Serializer for reading offers
class DonationOfferSerializer(serializers.ModelSerializer):
    donor = UserSerializer(read_only=True)
    request = BloodDonationRequestSerializer(read_only=True)
    request_id = serializers.PrimaryKeyRelatedField(
        queryset=BloodDonationRequest.objects.all(),
        source='request',
        write_only=True
    )

    class Meta:
        model = DonationOffer
        fields = '__all__'