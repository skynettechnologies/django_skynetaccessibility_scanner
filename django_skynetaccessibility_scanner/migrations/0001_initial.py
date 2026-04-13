from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='DjangoSkynetScannerSettings',
            fields=[
                ('id',                    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                # Domain / Identity
                ('website_domain',        models.CharField(blank=True, default='', max_length=255, verbose_name='Website Domain')),
                ('website_id',            models.CharField(blank=True, default='', max_length=255, verbose_name='Website ID')),
                ('dashboard_link',        models.CharField(blank=True, default='', max_length=500, verbose_name='Dashboard Link')),
                ('fav_icon',              models.CharField(blank=True, default='', max_length=500, verbose_name='Favicon URL')),
                # Plan
                ('plan_state',            models.CharField(blank=True, choices=[('free', 'Free Plan'), ('purchased', 'Active Plan'), ('expired', 'Expired Plan'), ('cancelled', 'Cancelled Plan')], default='free', max_length=20, verbose_name='Plan State')),
                ('package_name',          models.CharField(blank=True, default='', max_length=255, verbose_name='Package Name')),
                ('package_id_ext',        models.CharField(blank=True, default='', max_length=255, verbose_name='Package ID Ext')),
                ('page_views',            models.CharField(blank=True, default='', max_length=100, verbose_name='Page Views')),
                ('subscr_interval',       models.CharField(blank=True, default='', max_length=100, verbose_name='Billing Interval')),
                ('end_date',              models.DateField(blank=True, null=True, verbose_name='Plan End Date')),
                ('cancel_date',           models.DateField(blank=True, null=True, verbose_name='Cancel Date')),
                ('paypal_subscr_id',      models.CharField(blank=True, default='', max_length=255, verbose_name='PayPal Subscription ID')),
                ('package_price',         models.CharField(blank=True, default='', max_length=100, verbose_name='Package Price')),
                ('final_price',           models.FloatField(default=0.0, verbose_name='Final Price')),
                # Flags
                ('is_trial_period',       models.BooleanField(default=False, verbose_name='Is Trial Period')),
                ('is_expired',            models.BooleanField(default=False, verbose_name='Is Expired')),
                ('is_cancelled',          models.BooleanField(default=False, verbose_name='Is Cancelled')),
                # Scan Status
                ('scan_status',           models.IntegerField(default=0, verbose_name='Scan Status')),
                ('url_scan_status',       models.IntegerField(default=0, verbose_name='URL Scan Status')),
                ('total_pages',           models.IntegerField(default=0, verbose_name='Total Pages')),
                ('total_scan_pages',      models.IntegerField(default=0, verbose_name='Total Scanned Pages')),
                ('total_selected_pages',  models.IntegerField(default=0, verbose_name='Total Selected Pages')),
                ('total_last_scan_pages', models.IntegerField(default=0, verbose_name='Total Last Scan Pages')),
                ('last_url_scan',         models.DateTimeField(blank=True, null=True, verbose_name='Last URL Scan')),
                ('last_scan',             models.DateTimeField(blank=True, null=True, verbose_name='Last Scan')),
                ('next_scan_date',        models.DateTimeField(blank=True, null=True, verbose_name='Next Scan Date')),
                # Scan Stats
                ('success_percentage',    models.FloatField(default=0.0, verbose_name='Success Percentage')),
                ('total_violations',      models.IntegerField(default=0, verbose_name='Total Violations')),
                ('total_fail',            models.IntegerField(default=0, verbose_name='Failed Checks')),
                ('total_success',         models.IntegerField(default=0, verbose_name='Passed Checks')),
                # UI State
                ('plans_json',            models.TextField(blank=True, default='', verbose_name='Plans JSON')),
                ('active_view',           models.CharField(blank=True, choices=[('main', 'Main'), ('violations', 'Violations')], default='main', max_length=20, verbose_name='Active View')),
                ('error_message',         models.CharField(blank=True, default='', max_length=500, verbose_name='Error Message')),
            ],
            options={
                'verbose_name':        'SkynetAccessibility Scanner',
                'verbose_name_plural': 'SkynetAccessibility Scanner',
                'app_label':           'django_skynetaccessibility_scanner',
            },
        ),
    ]
