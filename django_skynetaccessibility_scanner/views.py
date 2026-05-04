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

