from django.urls import path
from . import views
from . import profile_views
from . import community_views

urlpatterns = [
    # Health Check (Load balancers & uptime monitoring)
    path('health/', views.health_check),

    # Auth & Webhooks
    path('login', views.login),
    path('login/', views.login),
    path('auth/register', profile_views.register),
    path('auth/register/', profile_views.register),
    path('register', profile_views.register),
    path('register/', profile_views.register),
    path('auth/forgot-password', views.forgot_password),
    path('auth/forgot-password/', views.forgot_password),
    path('auth/reset-password', views.reset_password),
    path('auth/reset-password/', views.reset_password),

    # Universal Profile Management System Endpoints
    path('profile', profile_views.user_profile),
    path('profile/', profile_views.user_profile),
    path('profile/upload-picture', profile_views.upload_profile_picture),
    path('profile/upload-picture/', profile_views.upload_profile_picture),
    path('profile/picture', profile_views.delete_profile_picture),
    path('profile/picture/', profile_views.delete_profile_picture),
    path('profile/change-password', profile_views.change_password),
    path('profile/change-password/', profile_views.change_password),
    path('profile/delete-account', profile_views.delete_account),
    path('profile/delete-account/', profile_views.delete_account),

    path('webhook/razorpay', views.razorpay_webhook),
    path('webhook/razorpay/', views.razorpay_webhook),
    path('checkout/session', views.checkout_session),
    path('checkout/session/', views.checkout_session),
    path('checkout/verify', views.checkout_verify),
    path('checkout/verify/', views.checkout_verify),
    path('checkout/order/<str:order_id>/status', views.order_status),
    path('checkout/order/<str:order_id>/status/', views.order_status),
    path('orders/<str:order_id>/status', views.order_status),
    path('orders/<str:order_id>/status/', views.order_status),

    # Public CMS & Settings
    path('public/settings/', views.public_settings),
    path('public/courses/', views.public_courses),
    path('public/courses/<slug:slug>/', views.public_course_detail),
    path('public/courses/<slug:slug>/promo/', views.public_course_promo),
    path('public/courses/<slug:slug>/promo', views.public_course_promo),
    path('public/courses/<slug:slug>/qr.png', views.public_course_qr),
    path('public/courses/<slug:slug>/qr/', views.public_course_qr),
    path('public/courses/<slug:slug>/qr', views.public_course_qr),

    # Student Enrollments
    path('my/enrollments/', views.my_enrollments),

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

    # Student Video Playback & Course Curriculum
    path('courses/<int:course_id>/curriculum/', views.course_curriculum),
    path('courses/<int:course_id>/curriculum', views.course_curriculum),
    path('courses/<int:course_id>/lessons/<int:lesson_id>/playback/', views.lesson_playback),
    path('courses/<int:course_id>/lessons/<int:lesson_id>/playback', views.lesson_playback),

    # Admin Course Builder
    path('admin/courses/', views.admin_courses),
    path('admin/courses/<int:pk>/', views.admin_course_detail),
    path('admin/courses/<int:pk>/upload-cover/', views.admin_upload_course_cover),
    path('admin/courses/<int:course_id>/modules/', views.admin_add_module),
    path('admin/courses/<int:course_id>/lessons/', views.admin_course_lessons),
    path('admin/modules/<int:module_id>/lessons/', views.admin_add_lesson),
    path('admin/lessons/<int:pk>/', views.admin_lesson_detail),
    path('admin/lessons/<int:pk>/publish/', views.admin_lesson_publish),
    path('admin/lessons/<int:lesson_id>/assets/', views.admin_add_asset),
    path('admin/veed/validate/', views.admin_validate_veed),
    path('admin/veed/validate', views.admin_validate_veed),

    # Admin Student Roster & Controls
    path('admin/students/', views.admin_students),
    path('admin/students/<int:pk>/', views.admin_student_detail),
    path('admin/export/students/', views.export_students_csv),

    # Portal Admin User & Staff Governance
    path('admin/users/', views.admin_users),
    path('admin/users/<int:pk>/', views.admin_user_detail),

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

    # Community Discussions (Students & Faculty)
    path('community/channels/', community_views.get_community_channels),
    path('community/channels/<slug:slug>/messages/', community_views.get_channel_messages),
    path('community/channels/<slug:slug>/messages', community_views.get_channel_messages),
    path('community/channels/<slug:slug>/post/', community_views.post_channel_message),
    path('community/messages/<int:message_id>/react/', community_views.react_message),
    path('community/messages/<int:message_id>/flag/', community_views.flag_message),

    # Community Management (Content Manager & Super Admin)
    path('admin/community/overview/', community_views.admin_community_overview),
    path('admin/community/channels/', community_views.admin_channels_list_create),
    path('admin/community/channels/<slug:slug>/', community_views.admin_channel_detail),
    path('admin/community/messages/', community_views.admin_messages_list),
    path('admin/community/messages/<int:message_id>/moderate/', community_views.admin_moderate_message),
    path('admin/community/members/', community_views.admin_members_list),
    path('admin/community/members/<int:user_id>/moderate/', community_views.admin_moderate_member),
]

