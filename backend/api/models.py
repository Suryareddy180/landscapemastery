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
        ('THREECAPS_ADMIN', '3CAPSTECH Admin'),
        ('ADMIN', 'Legacy Admin'),
        ('STUDENT', 'Student'),
        ('EMPLOYEE', 'Employee'),
        ('HOUSEHOLD', 'Household'),
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
    slug = models.SlugField(unique=True, max_length=255)

class Instructor(models.Model):
    name = models.CharField(max_length=100)
    title = models.CharField(max_length=150, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)

class Course(models.Model):
    STATUS_CHOICES = (('DRAFT', 'Draft'), ('PUBLISHED', 'Published'), ('ARCHIVED', 'Archived'))
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    short_desc = models.TextField(blank=True, null=True)
    full_desc = models.TextField(blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    instructor = models.ForeignKey(Instructor, on_delete=models.SET_NULL, null=True, blank=True)
    thumbnail = models.CharField(max_length=500, blank=True, null=True)
    banner = models.CharField(max_length=500, blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=299.00, help_text="Effective selling price charged at checkout.")
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, default=299.00, help_text="Synchronized selling price for backward compatibility.")
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=None, help_text="Strike-off price (MRP) displayed with strikethrough. If null or <= price, no strike-off is shown.")
    duration_hrs = models.CharField(max_length=50, default='45 mins')
    level = models.CharField(max_length=50, default='All Levels')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PUBLISHED')
    seo_title = models.CharField(max_length=255, blank=True, null=True)
    seo_desc = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def get_selling_price(self):
        """Returns the actual effective selling price (what the customer pays)."""
        try:
            # If original_price is explicitly set, self.price is the authoritative selling price
            if self.original_price is not None and float(self.original_price) > 0:
                return float(self.price or 299.0)
            # Legacy compatibility: if discount_price is lower than price, discount_price was the selling price
            if self.discount_price and self.price and float(self.price) > float(self.discount_price):
                return float(self.discount_price)
            return float(self.price or self.discount_price or 299.0)
        except (ValueError, TypeError):
            return 299.0

    def get_original_price(self):
        """Returns the strike-off price (MRP) if higher than selling price, else None."""
        try:
            if self.original_price is not None and float(self.original_price) > 0:
                orig = float(self.original_price)
                if orig > self.get_selling_price():
                    return orig
            # Backward compatibility fallback if discount_price was stored as selling and price as original:
            if self.discount_price and self.price and float(self.price) > float(self.discount_price):
                return float(self.price)
        except (ValueError, TypeError):
            pass
        return None

    def has_discount(self):
        return self.get_original_price() is not None

    def get_discount_percentage(self):
        orig = self.get_original_price()
        selling = self.get_selling_price()
        if orig and orig > selling > 0:
            return int(round((orig - selling) / orig * 100))
        return 0

    def get_duration(self):
        """
        Dynamically calculates and returns the course duration based on uploaded videos/lessons.
        """
        try:
            from .duration_utils import update_course_duration
            return update_course_duration(self, save=True)
        except Exception:
            return self.duration_hrs or '45 mins'

class Module(models.Model):
    course = models.ForeignKey(Course, related_name='modules', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    order = models.IntegerField(default=1)

class Lesson(models.Model):
    module = models.ForeignKey(Module, related_name='lessons', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    video_provider = models.CharField(max_length=50, default='veed', blank=True)
    video_id = models.CharField(max_length=120, blank=True, default='')
    video_url = models.CharField(max_length=500, blank=True, default='')
    duration = models.CharField(max_length=50, blank=True, default='')
    duration_seconds = models.IntegerField(default=0)
    order = models.IntegerField(default=1)
    is_free_preview = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey('Usr', on_delete=models.SET_NULL, null=True, blank=True, related_name='created_lessons')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        ordering = ['order', 'id']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        try:
            from .duration_utils import update_course_duration
            if self.module_id and getattr(self, 'module', None) and self.module.course_id:
                update_course_duration(self.module.course, save=True)
        except Exception:
            pass

    def delete(self, *args, **kwargs):
        course = getattr(getattr(self, 'module', None), 'course', None)
        super().delete(*args, **kwargs)
        try:
            from .duration_utils import update_course_duration
            if course:
                update_course_duration(course, save=True)
        except Exception:
            pass

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

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        try:
            from .duration_utils import update_course_duration
            if self.lesson and self.lesson.module and self.lesson.module.course:
                update_course_duration(self.lesson.module.course, save=True)
        except Exception:
            pass

    def delete(self, *args, **kwargs):
        course = getattr(getattr(getattr(self, 'lesson', None), 'module', None), 'course', None)
        super().delete(*args, **kwargs)
        try:
            from .duration_utils import update_course_duration
            if course:
                update_course_duration(course, save=True)
        except Exception:
            pass

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
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )
    user = models.ForeignKey(Usr, on_delete=models.SET_NULL, null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True, blank=True)
    order_id = models.CharField(max_length=100, unique=True)
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=499.00)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    customer_name = models.CharField(max_length=255, blank=True, null=True)
    customer_email = models.EmailField(blank=True, null=True)
    customer_phone = models.CharField(max_length=30, blank=True, null=True)
    account_type = models.CharField(max_length=20, default='STUDENT')
    checkout_metadata = models.JSONField(default=dict, blank=True)
    email_sent = models.BooleanField(default=False)
    email_error = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

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
    logo_url = models.TextField(default='/lm_logo.png')
    logo_size = models.IntegerField(default=48)
    logo_fit_mode = models.CharField(max_length=20, default='auto')
    course_price = models.DecimalField(max_digits=10, decimal_places=2, default=499.00)
    contact_email = models.EmailField(default='contact@landscapemastery.com')
    seo_meta_desc = models.TextField(default='Landscape Mastery - High-End Educational Architecture Portal')
    curriculum_pdf_url = models.TextField(default='/media/Landscape_Architecture_Syllabus_2026.pdf')
    curriculum_pdf_title = models.CharField(max_length=255, default='Landscape Architecture Masterclass Curriculum & Blueprint Guide 2026')
    curriculum_pdf_size = models.CharField(max_length=50, default='4.2 MB')

class AuditLog(models.Model):
    actor = models.ForeignKey(Usr, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=255, blank=True, null=True)
    details = models.TextField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True, null=True)


class UserProfile(models.Model):
    user = models.OneToOneField(Usr, on_delete=models.CASCADE, related_name='profile')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    email_verified = models.BooleanField(default=True)
    phone_verified = models.BooleanField(default=False)

    # Student specific fields
    qualification = models.CharField(max_length=100, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    passout_year = models.IntegerField(blank=True, null=True)
    college_name = models.CharField(max_length=255, blank=True, null=True)
    student_status = models.CharField(max_length=50, blank=True, null=True, default='Still Studying')
    student_id = models.CharField(max_length=50, blank=True, null=True)

    # Employee specific fields
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    employment_status = models.CharField(max_length=50, blank=True, null=True, default='Full-Time')

    # Household specific fields
    household_name = models.CharField(max_length=255, blank=True, null=True)
    household_id = models.CharField(max_length=50, blank=True, null=True)
    primary_contact_name = models.CharField(max_length=255, blank=True, null=True)
    residential_address = models.TextField(blank=True, null=True)
    member_count = models.IntegerField(blank=True, null=True, default=1)

    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        db_table = 'api_userprofile'
        ordering = ['-created_at']

    def __str__(self):
        return f"Profile of {self.user.email} ({self.user.role})"


class CommunityChannel(models.Model):
    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    topic = models.CharField(max_length=255, blank=True, default='')
    pinned_announcement = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    is_read_only = models.BooleanField(default=False)
    created_by = models.ForeignKey(Usr, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_channels')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_community_channel'
        ordering = ['slug']

    def __str__(self):
        return f"#{self.slug}"


class CommunityMessage(models.Model):
    channel = models.ForeignKey(CommunityChannel, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(Usr, on_delete=models.CASCADE, related_name='community_messages')
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(Usr, on_delete=models.SET_NULL, null=True, blank=True, related_name='moderated_messages')
    deleted_at = models.DateTimeField(null=True, blank=True)
    reactions = models.JSONField(default=dict, blank=True)
    flagged_count = models.IntegerField(default=0)
    is_flagged = models.BooleanField(default=False)
    moderation_note = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_community_message'
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.channel.slug}] {self.user.email}: {self.content[:30]}"


class CommunityMemberProfile(models.Model):
    user = models.OneToOneField(Usr, on_delete=models.CASCADE, related_name='community_profile')
    is_muted = models.BooleanField(default=False)
    mute_reason = models.CharField(max_length=255, blank=True, default='')
    muted_until = models.DateTimeField(null=True, blank=True)
    custom_role_title = models.CharField(max_length=100, blank=True, default='')
    warning_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'api_community_member_profile'

    def __str__(self):
        return f"Community Profile: {self.user.email} (Muted: {self.is_muted})"

