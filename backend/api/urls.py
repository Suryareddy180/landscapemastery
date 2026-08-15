from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login),
    path('webhook/razorpay/', views.razorpay_webhook),
    path('checkout/session/', views.checkout_session),
    path('public/settings/', views.public_settings),
    path('admin/analytics/', views.admin_analytics),
    path('admin/settings/', views.admin_settings),
    path('admin/content/', views.admin_content),
    path('admin/content/<int:pk>/', views.admin_content_detail),
    path('admin/students/', views.admin_students),
    path('student/stream/<int:pk>/', views.student_stream),
]
