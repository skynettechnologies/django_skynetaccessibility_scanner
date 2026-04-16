import ipaddress
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render
from django.views import View

from .models import DjangoSkynetScannerSettings

# Domain Validation

INVALID_HOSTS = {
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0',
}

def get_invalid_domain_message(host):
    """
    Returns an error message string if the host is a loopback, private,
    or unspecified address/hostname — otherwise returns None.
    """
    # Shared base message used by both rejection branches
    base = f'"{host}" is not a valid domain. Please use your public domain name.'

    if host.lower() in INVALID_HOSTS:
        return base

    try:
        ip = ipaddress.ip_address(host)
        if ip.is_loopback or ip.is_private or ip.is_unspecified:
            return f'IP addresses and local hosts are not supported. {base}'
    except ValueError:
        pass  # host is a real hostname — fine

    return None

# Dashboard View

class ScannerDashboardView(View):
    template_name = 'django_skynetaccessibility_scanner/admin_dashboard.html'

    def get(self, request, *args, **kwargs):
        scheme = 'https' if request.is_secure() else 'http'
        host   = request.get_host().split(':')[0]
        domain = f'{scheme}://{host}'

        invalid_domain_message = get_invalid_domain_message(host)

        cfg = DjangoSkynetScannerSettings.objects.first()

        context = {
            'cfg':                    cfg,
            'domain':                 domain,
            'website_id':             cfg.website_id if cfg else '',
            'csrf_token':             get_token(request),
            'invalid_domain_message': invalid_domain_message,
        }
        return render(request, self.template_name, context)

# Live user-info endpoint  (browser JS calls this to get admin credentials)

@login_required
def get_user_info(request):
    """
    Returns the currently logged-in Django admin user's credentials as JSON.

    Called from browser JS on every dashboard load — the same pattern as
    Odoo's /web/session/get_session_info + /web/dataset/call_kw flow.

    The JS passes these credentials straight to the Skynet
    /api/register-domain-platform endpoint (no server-side proxy needed).
    """
    user     = request.user
    username = (getattr(user, 'username', '') or '').strip()
    email    = (getattr(user, 'email', '') or '').strip()

    # Fall back to username if it looks like an email
    if not email and '@' in username:
        email = username

    full_name = ''
    if callable(getattr(user, 'get_full_name', None)):
        full_name = (user.get_full_name() or '').strip()

    # Use full name if available, otherwise fall back to username
    name = full_name or username

    return JsonResponse({
        'is_authenticated': True,
        'uid':              user.pk,
        'username':         username,
        'email':            email,
        'name':             name,
    })