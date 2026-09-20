import logging
from datetime import datetime, timezone
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAdminUser

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
from .serializers import (
    ContactSerializer,
    NewsletterSerializer,
    NewsletterModelSerializer,
    EnrollmentSerializer,
    ProductSerializer,
    ServiceSerializer,
    TestimonialSerializer,
    WebsiteSettingSerializer,
    LeaderProfileSerializer,
    EnterpriseSolutionSerializer,
)

logger = logging.getLogger(__name__)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@api_view(["GET"])
def api_root(request):
    return Response({
        "service": "3CAPSTECH API (Unified under Landscape Mastery)",
        "status": "ok",
        "time": now_iso()
    })


@api_view(["GET"])
def api_brand_config(request):
    brand_config = getattr(settings, "BRAND_CONFIG", {
        "name": "3CAPSTECH",
        "email": "md.3capstech@gmail.com",
        "phone": "+91 94409 99908",
        "address": "Phase 2, Shanthi Nilayam, 15-25/648, Kukatpally Housing Board Colony, KPHB Phase 2, Kukatpally, Hyderabad, Telangana 500085",
        "primary_color": "#11A831",
        "secondary_color": "#0549B1",
        "text_primary_light": "#1E293B",
        "text_secondary_light": "#64748B",
        "accent_glow": "rgba(17, 168, 49, 0.25)",
        "theme_mode": "dark-hybrid",
    })
    return Response(brand_config)


@api_view(["GET"])
def api_stats(request):
    return Response({
        "projects": 240,
        "clients": 120,
        "engineers": 50,
        "learners": 18500,
        "instructors": 65,
        "countries": 23,
        "satisfaction": 98,
    })


@api_view(["POST"])
def api_contact(request):
    serializer = ContactSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    instance = serializer.save()

    try:
        notification_email = getattr(settings, "CONTACT_NOTIFICATION_EMAIL", "md.3capstech@gmail.com")
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "3CAPSTECH <md.3capstech@gmail.com>")

        subject = f"New Inquiry from {instance.name} ({instance.interest or 'General'})"
        body = (
            f"You received a new inquiry from the 3CAPSTECH website:\n\n"
            f"Name: {instance.name}\n"
            f"Email: {instance.email}\n"
            f"Company: {instance.company or 'N/A'}\n"
            f"Interest: {instance.interest or 'General'}\n"
            f"Submitted At: {instance.created_at}\n\n"
            f"Message:\n{instance.message}\n"
        )
        send_mail(
            subject=subject,
            message=body,
            from_email=from_email,
            recipient_list=[notification_email],
            fail_silently=True,
        )

        user_subject = "Thank you for contacting 3CAPSTECH"
        user_body = (
            f"Hi {instance.name},\n\n"
            f"Thank you for contacting 3CAPSTECH Software Private Limited. "
            f"We have received your inquiry regarding {instance.interest or 'our solutions'}.\n\n"
            f"Our engineering team will review your requirements and reach out within 24 hours.\n\n"
            f"Best regards,\n"
            f"3CAPSTECH Team\n"
            f"Email: md.3capstech@gmail.com\n"
            f"Phone: +91 94409 99908\n"
            f"Address: Phase 2, Shanthi Nilayam, Kukatpally, Hyderabad, Telangana 500085\n"
        )
        send_mail(
            subject=user_subject,
            message=user_body,
            from_email=from_email,
            recipient_list=[instance.email],
            fail_silently=True,
        )
    except Exception as e:
        logger.warning("SMTP email sending notice: %s", e)

    return Response({
        "ok": True,
        "id": str(instance.id),
        "message": "Thanks! Our team will reach out within 24 hours."
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
def api_newsletter(request):
    serializer = NewsletterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]

    if Newsletter.objects.filter(email=email).exists():
        return Response({
            "ok": True,
            "message": "You're already on the list."
        }, status=status.HTTP_200_OK)

    Newsletter.objects.create(email=email)
    return Response({
        "ok": True,
        "message": "Subscribed! Welcome to the 3CAPSTECH inner circle."
    }, status=status.HTTP_200_OK)


@api_view(["POST"])
def api_enroll(request):
    serializer = EnrollmentSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    instance = serializer.save()
    return Response({
        "ok": True,
        "id": str(instance.id),
        "message": "Enrolment confirmed. Check your inbox for next steps."
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
def api_services(request):
    services = Service.objects.filter(is_active=True)
    if not services.exists():
        return Response({
            "count": 8,
            "services": [
                {"id": "software", "title": "Custom Software Development", "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=85"},
                {"id": "enterprise", "title": "Enterprise Solutions", "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85"},
                {"id": "web", "title": "Website & Web App Development", "image": "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1200&q=85"},
                {"id": "mobile", "title": "Mobile App Development", "image": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=85"},
                {"id": "cloud", "title": "Cloud & Hosting Services", "image": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=85"},
                {"id": "uiux", "title": "UI / UX Design", "image": "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=85"},
                {"id": "consulting", "title": "IT Consulting", "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85"},
                {"id": "support", "title": "Software Maintenance & Support", "image": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85"},
            ]
        })
    serializer = ServiceSerializer(services, many=True)
    return Response({
        "count": services.count(),
        "services": serializer.data
    })


@api_view(["GET"])
def api_products(request):
    products = Product.objects.filter(is_active=True)
    serializer = ProductSerializer(products, many=True)
    return Response({
        "count": products.count(),
        "products": serializer.data
    })


@api_view(["GET"])
def api_testimonials(request):
    testimonials = CompanyTestimonial.objects.filter(is_active=True)
    serializer = TestimonialSerializer(testimonials, many=True)
    return Response({
        "count": testimonials.count(),
        "testimonials": serializer.data
    })


@api_view(["POST"])
def api_engagement(request):
    event_type = request.data.get("event", "click")
    service_id = request.data.get("service_id", "general")
    return Response({
        "ok": True,
        "event": event_type,
        "service_id": service_id,
        "timestamp": now_iso()
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
def api_guidance(request):
    return Response({
        "prompts": [
            {
                "id": "scale",
                "problem": "Struggling with slow, legacy systems?",
                "solution": "We architect high-speed, scalable enterprise software.",
                "badge": "ENTERPRISE ARCHITECTURE",
            },
            {
                "id": "apps",
                "problem": "Need high-converting Web & Mobile Apps?",
                "solution": "We engineer intuitive SaaS platforms and native mobile apps.",
                "badge": "WEB & MOBILE SAAS",
            },
            {
                "id": "ai",
                "problem": "Want to automate workflows with AI?",
                "solution": "We deploy custom AI pipelines & intelligent automation.",
                "badge": "AI & AUTOMATION",
            },
        ],
        "guided_action": "Scroll down to discover custom engineering solutions and book instant review."
    })


@api_view(["GET"])
def api_leaders(request):
    leaders = LeaderProfile.objects.filter(is_active=True)
    serializer = LeaderProfileSerializer(leaders, many=True, context={'request': request})
    return Response({
        "count": leaders.count(),
        "leaders": serializer.data
    })


@api_view(["GET"])
def api_solutions(request):
    solutions = EnterpriseSolution.objects.filter(is_active=True).order_by("display_order", "created_at")
    serializer = EnterpriseSolutionSerializer(solutions, many=True)
    return Response({
        "count": solutions.count(),
        "solutions": serializer.data
    })


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAdminUser]


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = CompanyTestimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [IsAdminUser]


class LeaderProfileViewSet(viewsets.ModelViewSet):
    queryset = LeaderProfile.objects.all()
    serializer_class = LeaderProfileSerializer
    permission_classes = [IsAdminUser]


class EnterpriseSolutionViewSet(viewsets.ModelViewSet):
    queryset = EnterpriseSolution.objects.all()
    serializer_class = EnterpriseSolutionSerializer
    permission_classes = [IsAdminUser]


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all().order_by('-created_at')
    serializer_class = ContactSerializer
    permission_classes = [IsAdminUser]


class NewsletterViewSet(viewsets.ModelViewSet):
    queryset = Newsletter.objects.all().order_by('-created_at')
    serializer_class = NewsletterModelSerializer
    permission_classes = [IsAdminUser]


class WebsiteSettingViewSet(viewsets.ModelViewSet):
    queryset = WebsiteSetting.objects.all()
    serializer_class = WebsiteSettingSerializer
    permission_classes = [IsAdminUser]


@api_view(["GET"])
@permission_classes([IsAdminUser])
def api_admin_summary(request):
    recent_contacts = Contact.objects.all().order_by('-created_at')[:6]
    contact_serializer = ContactSerializer(recent_contacts, many=True)
    return Response({
        "stats": {
            "contacts_total": Contact.objects.count(),
            "newsletters_total": Newsletter.objects.count(),
            "services_total": Service.objects.count(),
            "services_active": Service.objects.filter(is_active=True).count(),
            "solutions_total": EnterpriseSolution.objects.count(),
            "products_total": Product.objects.count(),
            "testimonials_total": CompanyTestimonial.objects.count(),
            "leaders_total": LeaderProfile.objects.count(),
            "settings_total": WebsiteSetting.objects.count(),
        },
        "recent_contacts": contact_serializer.data,
    })
