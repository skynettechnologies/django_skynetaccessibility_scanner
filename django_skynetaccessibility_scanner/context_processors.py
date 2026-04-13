"""
context_processors.py
---------------------
Injects Skynet Scanner domain URL into every Django template context.
Add 'django_skynetaccessibility_scanner.context_processors.skynet_scanner'
to TEMPLATES[0]['OPTIONS']['context_processors'] in settings.py.
"""


def skynet_scanner(request):
    """
    Injects SKYNET_DOMAIN_URL (the current origin) into template context.
    The browser JS handles all registration and API calls directly.
    """
    scheme = 'https' if request.is_secure() else 'http'
    host   = request.get_host().split(':')[0]

    return {
        'SKYNET_DOMAIN_URL': f'{scheme}://{host}',
    }
