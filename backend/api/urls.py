from django.urls import path
from . import views

urlpatterns = [
    # Auth & Webhooks
    path('login/', views.login),
    path('auth/forgot-password/', views.forgot_password),
    path('auth/reset-password/', views.reset_password),
    path('webhook/razorpay/', views.razorpay_webhook),
    path('checkout/session/', views.checkout_session),
    path('checkout/verify/', views.checkout_verify),

    # Public CMS & Settings
    path('public/settings/', views.public_settings),

    # Signed Streaming & DRM Access
    path('video/stream/<int:pk>/', views.generate_signed_video_url),
    path('video/stream/<int:pk>/play/', views.play_signed_video_stream),

    # Student Progress Tracking
    path('video/progress/', views.save_video_progress),
    path('video/progress/<int:asset_id>/', views.get_video_progress),
    path('lesson/complete/', views.complete_lesson),

    # Admin Analytics & Site Settings
    path('admin/analytics/', views.admin_analytics),
    path('admin/settings/', views.admin_settings),
    path('admin/upload-logo/', views.admin_upload_logo),
    path('admin/upload-syllabus-pdf/', views.admin_upload_syllabus_pdf),

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

    # Admin Media Asset Library
    path('admin/media/', views.admin_media_list_create),
    path('admin/media/<int:pk>/', views.admin_media_detail),

    # Admin Testimonials & FAQs CMS
    path('admin/testimonials/', views.admin_testimonials),
    path('admin/testimonials/<int:pk>/', views.admin_testimonial_detail),
    path('admin/faqs/', views.admin_faqs),
    path('admin/faqs/<int:pk>/', views.admin_faq_detail),

    # Admin Coupons & Offers
    path('admin/coupons/', views.admin_coupons),
    path('admin/coupons/<int:pk>/', views.admin_coupon_detail),
    path('checkout/coupon/', views.apply_coupon),
]
