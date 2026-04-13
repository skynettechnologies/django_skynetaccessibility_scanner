from django.apps import AppConfig


class DjangoSkynetScannerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'django_skynetaccessibility_scanner'
    verbose_name = 'Skynet Accessibility Scanner'

    def ready(self):
        """
        Fires on every Django startup.
        Creates the default settings row via post_migrate signal.

        NOTE: Domain registration is handled entirely from browser JS via
        /scanner/api/user-info/ + direct calls to the Skynet API.
        No server-side registration is performed here.
        """
        from django.db.models.signals import post_migrate
        post_migrate.connect(_create_default_settings, sender=self)


def _create_default_settings(sender, **kwargs):
    """
    Creates the default DjangoSkynetScannerSettings row after migrations if none exists.
    """
    try:
        from .models import DjangoSkynetScannerSettings
        if not DjangoSkynetScannerSettings.objects.exists():
            DjangoSkynetScannerSettings.objects.create()
            print('[DjangoSkynetScanner] Default settings record created.')
    except Exception as e:
        print(f'[DjangoSkynetScanner] Could not create default settings: {e}')
