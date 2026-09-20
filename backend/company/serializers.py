from rest_framework import serializers
from .models import (
    Contact,
    Newsletter,
    CompanyEnrollment,
    Product,
    Service,
    CompanyTestimonial,
    WebsiteSetting,
    LeaderProfile,
    EnterpriseSolution,
)

class ContactSerializer(serializers.ModelSerializer):
    name = serializers.CharField(min_length=1, max_length=120)
    email = serializers.EmailField()
    company = serializers.CharField(max_length=160, required=False, allow_blank=True, allow_null=True)
    interest = serializers.CharField(max_length=80, required=False, allow_blank=True, allow_null=True)
    message = serializers.CharField(min_length=1, max_length=4000)

    class Meta:
        model = Contact
        fields = ["id", "name", "email", "company", "interest", "message", "created_at"]
        read_only_fields = ["id", "created_at"]


class NewsletterSerializer(serializers.Serializer):
    email = serializers.EmailField()


class NewsletterModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Newsletter
        fields = ["id", "email", "created_at"]
        read_only_fields = ["id", "created_at"]


class EnrollmentSerializer(serializers.ModelSerializer):
    course_id = serializers.CharField(min_length=1, max_length=120)
    email = serializers.EmailField()
    name = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = CompanyEnrollment
        fields = ["id", "course_id", "email", "name", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyTestimonial
        fields = '__all__'


class WebsiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteSetting
        fields = '__all__'


class LeaderProfileSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField(read_only=True)
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = LeaderProfile
        fields = ['id', 'name', 'title', 'bio', 'photo', 'photo_url', 'linkedin', 'twitter', 'email', 'is_active', 'display_order', 'created_at', 'updated_at']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        elif obj.photo:
            return obj.photo.url
        return None


class EnterpriseSolutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnterpriseSolution
        fields = ['id', 'name', 'category', 'desc', 'display_order', 'is_active', 'created_at', 'updated_at']
