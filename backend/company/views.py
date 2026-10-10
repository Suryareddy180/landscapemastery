import logging
from datetime import datetime, timezone
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.permissions import IsAdminUser, AllowAny, BasePermission
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Usr

class IsPortalAdminOrStaff(BasePermission):
    """
    Allows access to superusers, staff, or users with administrative roles
    (SUPER_ADMIN, CONTENT_MANAGER, SUPPORT_ADMIN, ADMIN).
    """
    def has_permission(self, request, view):
        usr = request.user
        if not usr or not usr.is_authenticated:
            return False
        if usr.is_superuser or usr.is_staff or getattr(usr, 'role', '') in ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN', 'ADMIN']:
            return True
        return False

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


@api_view(["GET", "POST", "PUT"])
def api_brand_config(request):
    default_config = getattr(settings, "BRAND_CONFIG", {
        "name": "3CAPSTECH",
        "email": "md.3capstech@gmail.com",
        "phone": "+91 94409 99908",
        "address": "Phase 2, Shanthi Nilayam, 15-25/648, Kukatpally Housing Board Colony, KPHB Phase 2, Kukatpally, Hyderabad, Telangana 500072",
        "primary_color": "#11A831",
        "secondary_color": "#0549B1",
        "text_primary_light": "#1E293B",
        "text_secondary_light": "#64748B",
        "accent_glow": "rgba(17, 168, 49, 0.25)",
        "theme_mode": "dark-hybrid",
    })

    if request.method in ["POST", "PUT"]:
        usr = request.user
        is_admin = usr and usr.is_authenticated and (usr.is_superuser or usr.is_staff or getattr(usr, 'role', '') in ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN'])
        if not is_admin:
            return Response({"error": "Administrative permissions required to update brand configuration."}, status=status.HTTP_403_FORBIDDEN)
        
        for k, v in request.data.items():
            if v is not None:
                WebsiteSetting.objects.update_or_create(
                    key=f"brand_{k}",
                    defaults={"value": str(v), "description": f"Brand configuration parameter: {k}"}
                )

    stored_config = dict(default_config)
    for setting_obj in WebsiteSetting.objects.filter(key__startswith="brand_"):
        key_name = setting_obj.key.replace("brand_", "", 1)
        stored_config[key_name] = setting_obj.value

    return Response(stored_config)


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
            f"Address: Phase 2, Shanthi Nilayam, 15-25/648, Kukatpally Housing Board Colony, KPHB Phase 2, Kukatpally, Hyderabad, Telangana 500072\n"
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
    if Service.objects.count() == 0:
        default_services = [
            {"service_id": "software", "title": "Custom Software Development", "desc": "High-velocity custom web and enterprise application engineering built with robust architectures.", "icon": "Code2", "tags": ["React", "Django", "PostgreSQL"], "items": ["SaaS Platforms", "Custom Portals", "API Engineering"]},
            {"service_id": "enterprise", "title": "Enterprise Solutions", "desc": "Mission-critical architectures and distributed systems built for scale and operational resilience.", "icon": "Building", "tags": ["Microservices", "Cloud", "Security"], "items": ["ERP Systems", "Workflow Automation", "High-Load Infrastructure"]},
            {"service_id": "web", "title": "Website & Web App Development", "desc": "Ultra-responsive, visually stunning web applications with modern design aesthetics and high conversion rates.", "icon": "Globe", "tags": ["Next.js", "TailwindCSS", "TypeScript"], "items": ["Corporate Sites", "E-Commerce", "Admin Dashboards"]},
            {"service_id": "mobile", "title": "Mobile App Development", "desc": "Cross-platform and native Android/iOS mobile experiences engineered for maximum user engagement.", "icon": "Smartphone", "tags": ["React Native", "Flutter", "iOS", "Android"], "items": ["Native Apps", "Offline-First", "Push Notifications"]},
            {"service_id": "cloud", "title": "Cloud & Hosting Services", "desc": "Enterprise cloud migrations, Docker container orchestration, and multi-region deployment architectures.", "icon": "Cloud", "tags": ["AWS", "Hostinger VPS", "Docker"], "items": ["VPS Deployments", "CI/CD Pipelines", "SSL & CDN"]},
            {"service_id": "uiux", "title": "UI / UX Design", "desc": "Human-centric interface design, design systems, and interactive prototypes that wow users.", "icon": "Sparkles", "tags": ["Figma", "Design Systems", "Prototyping"], "items": ["Wireframes", "Design Tokens", "Usability Testing"]},
            {"service_id": "consulting", "title": "IT Consulting", "desc": "Strategic technology guidance, code audits, architecture reviews, and technical roadmaps.", "icon": "Brain", "tags": ["Strategy", "Architecture", "Audits"], "items": ["Tech Audits", "Stack Selection", "Scalability Roadmaps"]},
            {"service_id": "support", "title": "Software Maintenance & Support", "desc": "24/7 proactive monitoring, vulnerability patching, database optimization, and SLA-backed support.", "icon": "Shield", "tags": ["SLA", "Backups", "Maintenance"], "items": ["Server Monitoring", "Security Patches", "Database Tuning"]},
        ]
        for s in default_services:
            Service.objects.create(
                service_id=s["service_id"],
                title=s["title"],
                desc=s["desc"],
                icon=s["icon"],
                tags=s["tags"],
                items=s["items"],
                is_active=True
            )
    services = Service.objects.filter(is_active=True)
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
    permission_classes = [IsPortalAdminOrStaff]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsPortalAdminOrStaff]


class TestimonialViewSet(viewsets.ModelViewSet):
    queryset = CompanyTestimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [IsPortalAdminOrStaff]


class LeaderProfileViewSet(viewsets.ModelViewSet):
    queryset = LeaderProfile.objects.all()
    serializer_class = LeaderProfileSerializer
    permission_classes = [IsPortalAdminOrStaff]


class EnterpriseSolutionViewSet(viewsets.ModelViewSet):
    queryset = EnterpriseSolution.objects.all()
    serializer_class = EnterpriseSolutionSerializer
    permission_classes = [IsPortalAdminOrStaff]


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all().order_by('-created_at')
    serializer_class = ContactSerializer
    permission_classes = [IsPortalAdminOrStaff]


class NewsletterViewSet(viewsets.ModelViewSet):
    queryset = Newsletter.objects.all().order_by('-created_at')
    serializer_class = NewsletterModelSerializer
    permission_classes = [IsPortalAdminOrStaff]


class WebsiteSettingViewSet(viewsets.ModelViewSet):
    queryset = WebsiteSetting.objects.all()
    serializer_class = WebsiteSettingSerializer
    permission_classes = [IsPortalAdminOrStaff]


@api_view(["GET"])
@permission_classes([IsPortalAdminOrStaff])
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


@api_view(["POST"])
@permission_classes([AllowAny])
def api_admin_login(request):
    """
    Super Admin Authentication endpoint for 3CAPSTECH web management console.
    Accepts email or username + password. Validates administrative role.
    Returns SimpleJWT access & refresh tokens plus custom tokens.
    """
    from api.views import log_admin_action, get_tokens_for_user

    raw_identifier = request.data.get("username") or request.data.get("email") or ""
    raw_identifier = str(raw_identifier).strip()
    password = request.data.get("password") or ""

    if not raw_identifier or not password:
        return Response(
            {"detail": "Username/Email and password are required.", "error": "Missing credentials."},
            status=status.HTTP_400_BAD_REQUEST
        )

    usr = None
    if "@" in raw_identifier:
        usr = Usr.objects.filter(email__iexact=raw_identifier).first()
    else:
        usr = (
            Usr.objects.filter(email__iexact=f"{raw_identifier}@3capstech.com").first()
            or Usr.objects.filter(email__iexact=f"{raw_identifier}@gmail.com").first()
            or Usr.objects.filter(email__iexact=f"{raw_identifier}@landscapemastery.com").first()
            or Usr.objects.filter(email__istartswith=raw_identifier).first()
        )
        if not usr and raw_identifier.lower() in ["admin", "superadmin", "administrator", "md", "director"]:
            usr = Usr.objects.filter(email__iexact="md.3capstech@gmail.com").first() or Usr.objects.filter(role="SUPER_ADMIN").first()

    if not usr:
        # Check if fallback admin exists or create 3capstech admin
        if raw_identifier.lower() in ["admin", "admin@3capstech.com", "md", "md.3capstech@gmail.com"]:
            usr = Usr.objects.filter(email__iexact="md.3capstech@gmail.com").first() or Usr.objects.filter(role="SUPER_ADMIN").first()

    if not usr:
        return Response(
            {"detail": "No administrative account matching the provided credentials.", "error": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not usr.is_active:
        return Response(
            {"detail": "This administrative account is disabled.", "error": "Account disabled."},
            status=status.HTTP_403_FORBIDDEN
        )

    if not usr.check_password(password):
        return Response(
            {"detail": "Invalid password entered.", "error": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    is_admin = usr.is_staff or usr.is_superuser or usr.role in ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'SUPPORT_ADMIN']
    if not is_admin:
        return Response(
            {"detail": "Access restricted: Administrative privileges required.", "error": "Forbidden."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Ensure is_staff is True so DRF ViewSets with IsAdminUser permit access
    if not usr.is_staff:
        usr.is_staff = True
        usr.save(update_fields=['is_staff'])

    refresh = RefreshToken.for_user(usr)
    access_token = str(refresh.access_token)
    custom_token = get_tokens_for_user(usr)

    try:
        log_admin_action(usr, "ADMIN_PORTAL_LOGIN", target="3CAPSTECH Console", ip=request.META.get('REMOTE_ADDR'))
    except Exception:
        pass

    return Response({
        "access": access_token,
        "refresh": str(refresh),
        "token": custom_token,
        "user": {
            "id": usr.id,
            "email": usr.email,
            "name": usr.full_name or "Super Admin",
            "role": usr.role,
            "is_staff": usr.is_staff,
            "is_superuser": usr.is_superuser,
        }
    })

