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
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    objects = UsrMgr()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

class ContentItem(models.Model):
    TYPE_CHOICES = (('short_video', 'Short Video (1-10 mins)'), ('long_video', 'Long Video (2+ hrs)'), ('pdf', 'PDF Blueprint / Document'))
    title = models.CharField(max_length=255)
    content_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='short_video')
    file = models.FileField(upload_to='content/', blank=True, null=True)
    url = models.CharField(max_length=500, blank=True, null=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration = models.CharField(max_length=50, default='45 mins')
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

class SiteSetting(models.Model):
    hero_title = models.CharField(max_length=255, default='Master the Art of Landscape Architecture')
    hero_subtitle = models.TextField(default='Elevate your architectural vision. Access industry-leading video modules, spatial planning frameworks, and achieve complete mastery.')
    logo_size = models.IntegerField(default=48)
    logo_fit_mode = models.CharField(max_length=20, default='auto')
    course_price = models.DecimalField(max_digits=10, decimal_places=2, default=499.00)
