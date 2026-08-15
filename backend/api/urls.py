from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health_check'),
    path('auth/login/', views.login_view, name='login_view'),
    path('checkout/session/', views.create_checkout_session, name='checkout_session'),
    path('video/manifest/<int:module_id>/', views.get_video_manifest, name='video_manifest'),
]
