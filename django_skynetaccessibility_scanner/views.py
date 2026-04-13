"""
views.py - DjangoSkynetAccessibility Scanner Django views.

Responsibilities:
  1. ScannerDashboardView  - renders the main scanner HTML page.
  2. get_user_info         - returns the currently logged-in Django admin
                             user's data as JSON so the browser JS can call
                             the Skynet API directly with real credentials.
                             (mirrors Odoo's /web/session/get_session_info)

NOTE: All Skynet API calls are made DIRECTLY from the browser JS.
      There are NO server-side proxy views in this module.
"""

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render
from django.views import View

from .models import DjangoSkynetScannerSettings


# ---------------------------------------------------------------------------
# Dashboard View
# ---------------------------------------------------------------------------

class ScannerDashboardView(View):
    template_name = 'django_skynetaccessibility_scanner/admin_dashboard.html'
    def get(self, request, *args, **kwargs):
        scheme = 'https' if request.is_secure() else 'http'
        host   = request.get_host().split(':')[0]
        domain = f'{scheme}://{host}'

        cfg = DjangoSkynetScannerSettings.objects.first()

        context = {
            'cfg':        cfg,
            'domain':     domain,
            'website_id': cfg.website_id if cfg else '',
            'csrf_token': get_token(request),
        }
        return render(request, self.template_name, context)


# ---------------------------------------------------------------------------
# Live user-info endpoint  (browser JS calls this to get admin credentials)
# ---------------------------------------------------------------------------

@login_required
def get_user_info(request):
    """
    Returns the currently logged-in Django admin user's credentials as JSON.

    Called from browser JS on every dashboard load — the same pattern as
    Odoo's /web/session/get_session_info + /web/dataset/call_kw flow.

    The JS passes these credentials straight to the Skynet
    /api/register-domain-platform endpoint (no server-side proxy needed).
    """
    user = request.user

    email = (getattr(user, 'email', '') or '').strip()

    if not email:
        username = (getattr(user, 'username', '') or '').strip()
        if '@' in username:
            email = username

    full_name = ''
    if callable(getattr(user, 'get_full_name', None)):
        full_name = (user.get_full_name() or '').strip()

    name = full_name or (getattr(user, 'username', '') or '').strip()

    return JsonResponse({
        'is_authenticated': True,
        'uid':              user.pk,
        'username':         getattr(user, 'username', '') or '',
        'email':            email,
        'name':             name,
    })
