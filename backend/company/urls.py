from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter(trailing_slash=False)
router.register(r'admin/company/products', views.ProductViewSet, basename='company-admin-products')
router.register(r'admin/company/services', views.ServiceViewSet, basename='company-admin-services')
router.register(r'admin/company/testimonials', views.TestimonialViewSet, basename='company-admin-testimonials')
router.register(r'admin/company/leaders', views.LeaderProfileViewSet, basename='company-admin-leaders')
router.register(r'admin/company/solutions', views.EnterpriseSolutionViewSet, basename='company-admin-solutions')
router.register(r'admin/company/contacts', views.ContactViewSet, basename='company-admin-contacts')
router.register(r'admin/company/newsletters', views.NewsletterViewSet, basename='company-admin-newsletters')
router.register(r'admin/company/settings', views.WebsiteSettingViewSet, basename='company-admin-settings')

# Legacy non-prefixed admin routes for 3CAPSTECH
router.register(r'admin/products', views.ProductViewSet, basename='legacy-admin-products')
router.register(r'admin/services', views.ServiceViewSet, basename='legacy-admin-services')
router.register(r'admin/leaders', views.LeaderProfileViewSet, basename='legacy-admin-leaders')
router.register(r'admin/solutions', views.EnterpriseSolutionViewSet, basename='legacy-admin-solutions')
router.register(r'admin/contacts', views.ContactViewSet, basename='legacy-admin-contacts')
router.register(r'admin/newsletters', views.NewsletterViewSet, basename='legacy-admin-newsletters')

urlpatterns = [
    # Public Company Endpoints
    path("config", views.api_brand_config),
    path("config/", views.api_brand_config),
    path("stats", views.api_stats),
    path("stats/", views.api_stats),
    path("contact", views.api_contact),
    path("contact/", views.api_contact),
    path("newsletter", views.api_newsletter),
    path("newsletter/", views.api_newsletter),
    path("enroll", views.api_enroll),
    path("enroll/", views.api_enroll),
    path("services", views.api_services),
    path("services/", views.api_services),
    path("products", views.api_products),
    path("products/", views.api_products),
    path("testimonials", views.api_testimonials),
    path("testimonials/", views.api_testimonials),
    path("engagement", views.api_engagement),
    path("engagement/", views.api_engagement),
    path("guidance", views.api_guidance),
    path("guidance/", views.api_guidance),
    path("leaders", views.api_leaders),
    path("leaders/", views.api_leaders),
    path("solutions", views.api_solutions),
    path("solutions/", views.api_solutions),

    # SimpleJWT Authentication for Company Admin
    path("admin/login", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("admin/login/", TokenObtainPairView.as_view(), name="token_obtain_pair_slash"),
    path("admin/refresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("admin/refresh/", TokenRefreshView.as_view(), name="token_refresh_slash"),
    path("admin/summary", views.api_admin_summary, name="admin_summary"),
    path("admin/summary/", views.api_admin_summary, name="admin_summary_slash"),

    # Router ViewSets
    path("", include(router.urls)),
]
