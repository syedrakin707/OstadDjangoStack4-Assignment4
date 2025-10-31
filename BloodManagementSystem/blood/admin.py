# blood/admin.py
from django.contrib import admin
from .models import Profile, BloodBank, BloodDonationRequest, DonationOffer

admin.site.register(Profile)
admin.site.register(BloodBank)
admin.site.register(BloodDonationRequest)
admin.site.register(DonationOffer)
