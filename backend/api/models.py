from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UsrMgr(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError('Email required')
        email = self.normalize_email(email)
        usr = self.model(email=email, **extra)
        usr.set_password(password)
        usr.save(using=self._db)
        return usr

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra)

class Usr(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (('ADMIN', 'ADMIN'), ('STUDENT', 'STUDENT'))
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    paid = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UsrMgr()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

class Vid(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='videos/', blank=True, null=True)
    url = models.CharField(max_length=500, blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    dur = models.CharField(max_length=50, default='45 mins')
