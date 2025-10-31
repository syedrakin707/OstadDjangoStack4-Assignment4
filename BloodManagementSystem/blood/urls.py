# blood/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DonorRegisterView, CivilianRegisterView, ProfileViewSet, BloodBankViewSet,
    BloodDonationRequestViewSet, DonationOfferViewSet, DonorSearchView, MyProfileUpdateView, 
    get_profile, admin_dashboard_stats
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register('profiles', ProfileViewSet, basename='profile')
router.register('bloodbanks', BloodBankViewSet, basename='bloodbank')
router.register('requests', BloodDonationRequestViewSet, basename='request')
router.register('offers', DonationOfferViewSet, basename='offer')

urlpatterns = [
    path('register/donor/', DonorRegisterView.as_view(), name='register-donor'),
    path('register/civilian/', CivilianRegisterView.as_view(), name='register-civilian'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('donors/search/', DonorSearchView.as_view(), name='donor-search'), 
    path('profile/me/', MyProfileUpdateView.as_view(), name='profile-update'),
    path('', include(router.urls)),
    path('profile/', get_profile, name='get_profile'),
    path('admin/stats/', admin_dashboard_stats, name='admin-stats'),
]
