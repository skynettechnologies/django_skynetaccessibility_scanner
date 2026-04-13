from urllib.parse import urlparse

from django.contrib import admin
from django.shortcuts import redirect, render
from django.urls import path, reverse

from .models import DjangoSkynetScannerSettings


@admin.register(DjangoSkynetScannerSettings)
class SkynetScannerAdmin(admin.ModelAdmin):
    """
    Django Admin panel for Skynet Scanner settings.
    - Singleton: redirects changelist to the single object's change page.
    - The change page renders the full scanner dashboard UI.
    - All Skynet API calls are made directly from browser JS.
    """

    fields = ('website_domain',)

    class Media:
        css = {'all': ('django_skynetaccessibility_scanner/admin/css/skynet_admin.css',)}
        js  = ('django_skynetaccessibility_scanner/admin/js/skynet_admin.js',)

    # ── Singleton behaviour ────────────────────────────────────────────────────

    def has_add_permission(self, request):
        return not DjangoSkynetScannerSettings.objects.exists()

    def changelist_view(self, request, extra_context=None):
        obj = DjangoSkynetScannerSettings.objects.first()
        if obj:
            return redirect(
                reverse(
                    'admin:django_skynetaccessibility_scanner_djangoskynetscannersettings_change',
                    args=(obj.pk,)
                )
            )
        return super().changelist_view(request, extra_context)

    # ── Custom URL: domain-save endpoint ──────────────────────────────────────

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                '<path:object_id>/save-domain/',
                self.admin_site.admin_view(self.save_domain_view),
                name='skynet_save_domain',
            ),
        ]
        return custom + urls

    def save_domain_view(self, request, object_id):
        """Handle domain save form POST from the dashboard admin view."""
        if request.method == 'POST':
            obj = DjangoSkynetScannerSettings.objects.filter(pk=object_id).first()
            if obj:
                domain = request.POST.get('website_domain', '').strip()
                obj.website_domain = domain
                obj.save()

        return redirect(
            reverse(
                'admin:django_skynetaccessibility_scanner_djangoskynetscannersettings_change',
                args=(object_id,)
            )
        )

    # ── Override change_view to render the scanner dashboard ──────────────────

    def change_view(self, request, object_id, form_url='', extra_context=None):
        obj = self.get_object(request, object_id)
        if obj is None:
            return self._get_obj_does_not_exist_redirect(request, self.model._meta, object_id)

        context = {
            **self.admin_site.each_context(request),
            'title':                 'SkynetAccessibility Scanner',
            'opts':                  self.model._meta,
            'app_label':             self.model._meta.app_label,
            'original':              obj,
            'has_change_permission': self.has_change_permission(request, obj),
            'settings':              obj,
            'website_id':            obj.website_id,
            'domain':                obj.website_domain,
            'save_domain_url':       reverse('admin:skynet_save_domain', args=(object_id,)),
            **(extra_context or {}),
        }
        return render(request, 'django_skynetaccessibility_scanner/admin_dashboard.html', context)

    def save_model(self, request, obj, form, change):
        obj.save()
