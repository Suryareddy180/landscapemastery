import uuid
from django.db import models
from django.utils import timezone

class Contact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    email = models.EmailField()
    company = models.CharField(max_length=160, null=True, blank=True)
    interest = models.CharField(max_length=80, null=True, blank=True)
    message = models.TextField(max_length=4000)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "company_contact"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Contact from {self.name} ({self.email})"


class Newsletter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "company_newsletter"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email


class CompanyEnrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    course_id = models.CharField(max_length=120)
    email = models.EmailField()
    name = models.CharField(max_length=120, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "company_enrollment"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Enrollment for {self.course_id} - {self.email}"


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=200)
    desc = models.TextField()
    icon = models.CharField(max_length=50, default="Code2", help_text="Lucide React icon name")
    link = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "company_product"
        ordering = ["created_at"]

    def __str__(self):
        return self.title


class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_id = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=200)
    desc = models.TextField()
    icon = models.CharField(max_length=50, default="Code2", help_text="Lucide React icon name")
    image = models.URLField(max_length=500, blank=True, null=True)
    tags = models.JSONField(default=list, help_text="List of tags (e.g. ['Android', 'iOS'])")
    items = models.JSONField(default=list, help_text="List of sub-items (e.g. ['Corporate Sites', 'E-Commerce'])")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "company_service"
        ordering = ["created_at"]

    def __str__(self):
        return self.title


class CompanyTestimonial(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=200)
    text = models.TextField()
    avatar = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "company_testimonial"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.name} - {self.role}"


class WebsiteSetting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.CharField(max_length=255, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "company_websitesetting"
        ordering = ["key"]

    def __str__(self):
        return self.key


class LeaderProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    title = models.CharField(max_length=200, help_text="e.g. Founder & CEO")
    bio = models.TextField(help_text="Short professional bio")
    photo = models.ImageField(upload_to="leaders/", blank=True, help_text="Upload profile photo")
    linkedin = models.URLField(max_length=500, blank=True, null=True)
    twitter = models.URLField(max_length=500, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0, help_text="Lower numbers appear first")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "company_leaderprofile"
        ordering = ["display_order", "created_at"]
        verbose_name = "Leader Profile"
        verbose_name_plural = "Leader Profiles"

    def __str__(self):
        return f"{self.name} - {self.title}"


class EnterpriseSolution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=150, help_text="e.g. Education, Healthcare, Finance")
    desc = models.TextField(help_text="Description of the solution")
    display_order = models.PositiveIntegerField(default=0, help_text="Lower numbers appear first")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "company_enterprisesolution"
        ordering = ["display_order", "created_at"]
        verbose_name = "Enterprise Solution"
        verbose_name_plural = "Enterprise Solutions"

    def __str__(self):
        return f"{self.name} ({self.category})"
