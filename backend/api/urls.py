from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login),
    path('webhook/razorpay/', views.razorpay_webhook),
    path('checkout/session/', views.checkout_session),
    path('admin/videos/', views.admin_videos),
    path('admin/videos/<int:pk>/', views.admin_video_detail),
    path('admin/students/', views.admin_students),
    path('student/stream/<int:pk>/', views.student_stream),
]
