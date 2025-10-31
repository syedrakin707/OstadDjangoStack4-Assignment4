# blood/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

USER_TYPES = (
    ('Donor', 'Donor'),
    ('Civilian', 'Civilian'),
)

BLOOD_GROUPS = (
    ('A+', 'A+'), ('A-', 'A-'),
    ('B+', 'B+'), ('B-', 'B-'),
    ('O+', 'O+'), ('O-', 'O-'),
    ('AB+', 'AB+'), ('AB-', 'AB-'),
)

REQUEST_STATUS = (
    ('Pending', 'Pending'),
    ('Partially Fulfilled', 'Partially Fulfilled'),
    ('Fulfilled', 'Fulfilled'),
    ('Rejected', 'Rejected'),
)

OFFER_STATUS = (
    ('Pending', 'Pending'),
    ('Approved', 'Approved'),
    ('Rejected', 'Rejected'),
)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    user_type = models.CharField(max_length=10, choices=USER_TYPES)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS, blank=True)
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    availability = models.BooleanField(default=True)  # Only meaningful for donors

    def __str__(self):
        return f"{self.user.username} - {self.user_type}"

class BloodBank(models.Model):
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    available_blood = models.JSONField(default=dict)

    def __str__(self):
        return self.name

    def add_blood(self, blood_group, quantity):
        """Increase available blood for a given group."""
        valid_groups = {g[0] for g in BLOOD_GROUPS}
        if blood_group not in valid_groups:
            raise ValidationError(f"Invalid blood group: {blood_group}")

        if quantity <= 0:
            raise ValidationError("Quantity must be positive")

        available = self.available_blood or {}
        available[blood_group] = available.get(blood_group, 0) + quantity
        self.available_blood = available
        self.save(update_fields=['available_blood'])

    def allocate_blood(self, blood_group, quantity):
        """Decrease available blood for a given group (if available)."""
        valid_groups = {g[0] for g in BLOOD_GROUPS}
        if blood_group not in valid_groups:
            raise ValidationError(f"Invalid blood group: {blood_group}")

        if quantity <= 0:
            raise ValidationError("Quantity must be positive")

        available = self.available_blood or {}
        current_stock = available.get(blood_group, 0)
        if current_stock < quantity:
            raise ValidationError(f"Insufficient stock for {blood_group}")

        available[blood_group] = current_stock - quantity
        self.available_blood = available
        self.save(update_fields=['available_blood'])

class BloodDonationRequest(models.Model):
    civilian = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blood_requests')
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS)
    quantity = models.PositiveIntegerField()
    address = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=[
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
    ], default='Pending')
    blood_bank = models.ForeignKey(BloodBank, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.civilian.username} - {self.blood_group} ({self.quantity})"

    def approve(self, blood_bank):
        """Approve and allocate blood from the given blood bank."""
        if not blood_bank:
            raise ValidationError("Blood bank is required to approve a request.")

        # Check if blood bank has enough
        available_units = blood_bank.available_blood.get(self.blood_group, 0)
        if available_units < self.quantity:
            raise ValidationError(f"Not enough {self.blood_group} blood available in {blood_bank.name}.")

        # Allocate the blood
        blood_bank.allocate_blood(self.blood_group, self.quantity)

        # Update request
        self.status = 'Approved'
        self.blood_bank = blood_bank
        self.save(update_fields=['status', 'blood_bank'])


class DonationOffer(models.Model):
    donor = models.ForeignKey(User, on_delete=models.CASCADE)
    request = models.ForeignKey(BloodDonationRequest, on_delete=models.CASCADE, related_name='offers')
    status = models.CharField(max_length=10, choices=OFFER_STATUS, default='Pending')
    offered_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Offer {self.id} by {self.donor.username}"
