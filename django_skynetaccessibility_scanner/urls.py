from django.urls import path
from . import views

app_name = 'django_skynetaccessibility_scanner'

urlpatterns = [
    # ── Dashboard page ──────────────────────────────────────────────────────
    path('scanner/', views.ScannerDashboardView.as_view(), name='dashboard'),
]
