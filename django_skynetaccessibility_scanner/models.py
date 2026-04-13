from django.db import models


PLAN_STATE_CHOICES = [
    ('free',      'Free Plan'),
    ('purchased', 'Active Plan'),
    ('expired',   'Expired Plan'),
    ('cancelled', 'Cancelled Plan'),
]

ACTIVE_VIEW_CHOICES = [
    ('main',       'Main'),
    ('violations', 'Violations'),
]


class DjangoSkynetScannerSettings(models.Model):
    """
    Single-row settings table.
    Maps 1-to-1 with the Odoo x_django_skynetaccessibility_scanner custom model.
    All x_ prefixes are dropped; underscores kept.
    """

    # ── Website / Domain ──────────────────────────────────────────────────────
    website_domain   = models.CharField(max_length=255, blank=True, default='',
                                        verbose_name='Website Domain')
    website_id       = models.CharField(max_length=255, blank=True, default='',
                                        verbose_name='Website ID')
    dashboard_link   = models.CharField(max_length=500, blank=True, default='',
                                        verbose_name='Dashboard Link')
    fav_icon         = models.CharField(max_length=500, blank=True, default='',
                                        verbose_name='Favicon URL')

    # ── Plan / Subscription ───────────────────────────────────────────────────
    plan_state       = models.CharField(max_length=20, choices=PLAN_STATE_CHOICES,
                                        blank=True, default='free',
                                        verbose_name='Plan State')
    package_name     = models.CharField(max_length=255, blank=True, default='',
                                        verbose_name='Package Name')
    package_id_ext   = models.CharField(max_length=255, blank=True, default='',
                                        verbose_name='Package ID Ext')
    page_views       = models.CharField(max_length=100, blank=True, default='',
                                        verbose_name='Page Views')
    subscr_interval  = models.CharField(max_length=100, blank=True, default='',
                                        verbose_name='Billing Interval')
    end_date         = models.DateField(null=True, blank=True,
                                        verbose_name='Plan End Date')
    cancel_date      = models.DateField(null=True, blank=True,
                                        verbose_name='Cancel Date')
    paypal_subscr_id = models.CharField(max_length=255, blank=True, default='',
                                        verbose_name='PayPal Subscription ID')
    package_price    = models.CharField(max_length=100, blank=True, default='',
                                        verbose_name='Package Price')
    final_price      = models.FloatField(default=0.0,
                                         verbose_name='Final Price')

    # ── Plan Flags ────────────────────────────────────────────────────────────
    is_trial_period  = models.BooleanField(default=False,
                                           verbose_name='Is Trial Period')
    is_expired       = models.BooleanField(default=False,
                                           verbose_name='Is Expired')
    is_cancelled     = models.BooleanField(default=False,
                                           verbose_name='Is Cancelled')

    # ── Scan Status ───────────────────────────────────────────────────────────
    scan_status           = models.IntegerField(default=0,
                                                verbose_name='Scan Status')
    url_scan_status       = models.IntegerField(default=0,
                                                verbose_name='URL Scan Status')
    total_pages           = models.IntegerField(default=0,
                                                verbose_name='Total Pages')
    total_scan_pages      = models.IntegerField(default=0,
                                                verbose_name='Total Scanned Pages')
    total_selected_pages  = models.IntegerField(default=0,
                                                verbose_name='Total Selected Pages')
    total_last_scan_pages = models.IntegerField(default=0,
                                                verbose_name='Total Last Scan Pages')
    last_url_scan         = models.DateTimeField(null=True, blank=True,
                                                 verbose_name='Last URL Scan')
    last_scan             = models.DateTimeField(null=True, blank=True,
                                                 verbose_name='Last Scan')
    next_scan_date        = models.DateTimeField(null=True, blank=True,
                                                 verbose_name='Next Scan Date')

    # ── Scan Stats ────────────────────────────────────────────────────────────
    success_percentage = models.FloatField(default=0.0,
                                           verbose_name='Success Percentage')
    total_violations   = models.IntegerField(default=0,
                                             verbose_name='Total Violations')
    total_fail         = models.IntegerField(default=0,
                                             verbose_name='Failed Checks')
    total_success      = models.IntegerField(default=0,
                                             verbose_name='Passed Checks')

    # ── UI State ──────────────────────────────────────────────────────────────
    plans_json    = models.TextField(blank=True, default='',
                                     verbose_name='Plans JSON')
    active_view   = models.CharField(max_length=20, choices=ACTIVE_VIEW_CHOICES,
                                     blank=True, default='main',
                                     verbose_name='Active View')
    error_message = models.CharField(max_length=500, blank=True, default='',
                                     verbose_name='Error Message')

    def __str__(self):
        return 'DjangoSkynetAccessibility Scanner Settings'

    class Meta:
        app_label    = 'django_skynetaccessibility_scanner'
        verbose_name = 'SkynetAccessibility Scanner'
        verbose_name_plural = 'SkynetAccessibility Scanner'
