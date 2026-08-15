from django.urls import path
from . import views

urlpatterns = [
    # Auth & Webhooks
    path('login/', views.login),
    path('webhook/razorpay/', views.razorpay_webhook),
    path('checkout/session/', views.checkout_session),

    # Public CMS & Settings
    path('public/settings/', views.public_settings),

    # Signed Streaming & DRM Access
    path('video/stream/<int:pk>/', views.generate_signed_video_url),
    path('video/stream/<int:pk>/play/', views.play_signed_video_stream),

    # Admin Analytics & Site Settings
    path('admin/analytics/', views.admin_analytics),
    path('admin/settings/', views.admin_settings),

    # Admin Course Builder
    path('admin/courses/', views.admin_courses),
    path('admin/courses/<int:pk>/', views.admin_course_detail),
    path('admin/courses/<int:course_id>/modules/', views.admin_add_module),
    path('admin/modules/<int:module_id>/lessons/', views.admin_add_lesson),
    path('admin/lessons/<int:lesson_id>/assets/', views.admin_add_asset),

    # Admin Student Roster & Controls
    path('admin/students/', views.admin_students),
    path('admin/students/<int:pk>/', views.admin_student_detail),
    path('admin/export/students/', views.export_students_csv),

    # Admin Security Audit Logs
    path('admin/audit-logs/', views.admin_audit_logs),
]
