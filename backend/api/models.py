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
        extra.setdefault('role', 'SUPER_ADMIN')
        return self.create_user(email, password, **extra)

class Usr(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('SUPER_ADMIN', 'Super Admin'),
        ('CONTENT_MANAGER', 'Content Manager'),
        ('SUPPORT_ADMIN', 'Support Admin'),
        ('ADMIN', 'Legacy Admin'),
        ('STUDENT', 'Student')
    )
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    paid = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    objects = UsrMgr()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

class Instructor(models.Model):
    name = models.CharField(max_length=100)
    title = models.CharField(max_length=150, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)

class Course(models.Model):
    STATUS_CHOICES = (('DRAFT', 'Draft'), ('PUBLISHED', 'Published'), ('ARCHIVED', 'Archived'))
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    short_desc = models.TextField(blank=True, null=True)
    full_desc = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    instructor = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, blank=True)
    thumbnail = models.CharField(max_length=500, blank=True, null=True)
    banner = models.CharField(max_length=500, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=499.00)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, default=499.00)
    duration_hrs = models.CharField(max_length=50, default='12.5 hrs')
    level = models.CharField(max_length=50, default='All Levels')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PUBLISHED')
    seo_title = models.CharField(max_length=255, blank=True, null=True)
    seo_desc = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

class Module(models.Model):
    course = models.ForeignKey(Course, related_name='modules', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    order = models.IntegerField(default=1)

class Lesson(models.Model):
    module = models.ForeignKey(Module, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    order = models.IntegerField(default=1)

class MediaAsset(models.Model):
    TYPE_CHOICES = (
        ('short_video', 'Short Video (1-10 mins)'),
        ('long_video', 'Long Video (2+ hrs)'),
        ('pdf', 'PDF Document'),
        ('doc', 'Document / Resource'),
        ('image', 'Image')
    )
    lesson = models.ForeignKey(Lesson, related_name='assets', on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=255)
    asset_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='short_video')
    file = models.FileField(upload_to='content/', blank=True, null=True)
    url = models.CharField(max_length=500, blank=True, null=True)
    duration = models.CharField(max_length=50, default='45 mins')
    size_bytes = models.BigIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

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

class Enrollment(models.Model):
    user = models.ForeignKey(Usr, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, default='ACTIVE')
    access_type = models.CharField(max_length=20, default='PAID')
    enrolled_at = models.DateTimeField(auto_now_add=True, null=True)

class LessonProgress(models.Model):
    user = models.ForeignKey(Usr, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

class VideoProgress(models.Model):
    user = models.ForeignKey(Usr, on_delete=models.CASCADE)
    asset = models.ForeignKey(MediaAsset, on_delete=models.CASCADE)
    last_position_sec = models.IntegerField(default=0)
    watched_sec = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

class PaymentRecord(models.Model):
    user = models.ForeignKey(Usr, on_delete=models.CASCADE, null=True, blank=True)
    order_id = models.CharField(max_length=100, unique=True)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=499.00)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, default='SUCCESS')
    created_at = models.DateTimeField(auto_now_add=True, null=True)

class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    discount_pct = models.IntegerField(default=10)
    max_uses = models.IntegerField(default=100)
    used_count = models.IntegerField(default=0)
    active = models.BooleanField(default=True)

class Testimonial(models.Model):
    student_name = models.CharField(max_length=100)
    student_title = models.CharField(max_length=100, default='Architect')
    content = models.TextField()
    rating = models.IntegerField(default=5)
    active = models.BooleanField(default=True)

class FAQ(models.Model):
    question = models.CharField(max_length=255)
    answer = models.TextField()
    order = models.IntegerField(default=1)
    active = models.BooleanField(default=True)

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

class SiteSetting(models.Model):
    site_name = models.CharField(max_length=100, default='Landscape Mastery')
    hero_title = models.CharField(max_length=255, default='Master the Art of Landscape Architecture')
    hero_subtitle = models.TextField(default='Elevate your architectural vision. Access industry-leading video modules, spatial planning frameworks, and achieve complete mastery.')
    logo_url = models.CharField(max_length=500, default='/lm_logo.png')
    logo_size = models.IntegerField(default=48)
    logo_fit_mode = models.CharField(max_length=20, default='auto')
    course_price = models.DecimalField(max_digits=10, decimal_places=2, default=499.00)
    contact_email = models.EmailField(default='contact@landscapemastery.com')
    seo_meta_desc = models.TextField(default='Landscape Mastery - High-End Educational Architecture Portal')

class AuditLog(models.Model):
    actor = models.ForeignKey(Usr, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=255, blank=True, null=True)
    details = models.TextField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True, null=True)
