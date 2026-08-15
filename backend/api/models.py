from django.db import models

class CourseModule(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration_minutes = models.IntegerField(default=30)
    order = models.IntegerField(default=1)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Module {self.order}: {self.title}"

class EnrollmentSession(models.Model):
    email = models.EmailField()
    order_id = models.CharField(max_length=100, unique=True)
    amount_cents = models.IntegerField(default=49900)
    is_paid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.email} ({self.order_id})"
