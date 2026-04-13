from django.urls import path
from . import views

app_name = 'django_skynetaccessibility_scanner'

urlpatterns = [
    # ── Dashboard page ──────────────────────────────────────────────────────
    path('scanner/', views.ScannerDashboardView.as_view(), name='dashboard'),

    # ── Live user-info endpoint (browser JS fetches this for admin credentials)
    path('scanner/api/user-info/', views.get_user_info, name='api_user_info'),
]
