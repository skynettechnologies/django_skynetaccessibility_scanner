/**
 * skynet_scanner.js  — Django edition
 *
 * All Skynet API calls are made DIRECTLY from the browser.
 * No Django proxy server is used.
 *
 * User credentials are fetched from /scanner/api/user-info/
 * (the Django @login_required endpoint) — mirroring Odoo's
 * /web/session/get_session_info pattern.
 */
(function () {
    if (typeof window.__skynetScannerLoaded !== 'undefined') {
        if (typeof window.waitAndInit === 'function') window.waitAndInit();
        return;
    }
    window.__skynetScannerLoaded = true;

    /* ── API endpoints (direct, no proxy) ───────────────────────────── */
    const SKYNET_BASE_URL   = 'https://skynetaccessibilityscan.com';
    const REGISTER_API      = `${SKYNET_BASE_URL}/api/register-domain-platform`;
    const SCAN_DETAIL_API   = `${SKYNET_BASE_URL}/api/get-scan-detail`;
    const SCAN_COUNT_API    = `${SKYNET_BASE_URL}/api/get-scan-count`;
    const PACKAGES_LIST_API = `${SKYNET_BASE_URL}/api/packages-list`;
    const ACTION_LINK_API   = `${SKYNET_BASE_URL}/api/generate-plan-action-link`;
    const PLATFORM          = 'django';

    /* ── Static asset paths ──────────────────────────────────────────── */
    const STATIC_PREFIX = '/static/django_skynetaccessibility_scanner/img/assets';
    const PLAN_ICONS = [
        `${STATIC_PREFIX}/diamond.svg`,
        `${STATIC_PREFIX}/pentagon.svg`,
        `${STATIC_PREFIX}/hexagon.svg`,
        `${STATIC_PREFIX}/hexagon.svg`,
    ];

    /* ── App state ───────────────────────────────────────────────────── */
    const appData = {
        domain:              '',
        websiteUrl:          '',
        websiteId:           '',
        dashboardLink:       '',
        favIcon:             '',
        urlScanStatus:       0,
        scanStatus:          0,
        totalPages:          0,
        totalScanPages:      0,
        totalSelectedPages:  0,
        totalLastScanPages:  0,
        lastUrlScan:         0,
        lastScan:            null,
        nextScanDate:        null,
        scanViolationTotal:  '0',
        successPercentage:   '0',
        totalViolations:     0,
        totalFailSum:        '',
        packageId:           '',
        packageName:         '',
        pageViews:           '',
        packagePrice:        '',
        subscrInterval:      '',
        endDate:             '',
        cancelDate:          '',
        paypalSubscrId:      '',
        isTrialPeriod:       '',
        isExpired:           '',
        finalPrice:          0,
        scanDetails:         {},
        violationLink:       '#',
        plans:               [],
    };

    /* ── Utility helpers ─────────────────────────────────────────────── */
    function b64EncodeUrl(url) {
        try { return btoa(unescape(encodeURIComponent(url))); }
        catch (e) { return btoa(url); }
    }

    function fmtDate(val) {
        if (!val || val === 'undefined' || val === 'null') return '—';
        const d = new Date(val);
        if (isNaN(d)) return '—';
        const months = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
        return `${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
    }

    function getTodayStr() {
        return new Date().toISOString().slice(0, 10);
    }

    /* ── Fetch Django admin user info from /scanner/api/user-info/ ───── */
    async function getDjangoUserInfo(fallbackDomain) {
        try {
            const r = await fetch('/scanner/api/user-info/', {
                method:      'GET',
                credentials: 'same-origin',
            });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const info = await r.json();
            return {
                name:  info.name  || fallbackDomain,
                email: info.email || `no-reply@${fallbackDomain}`,
            };
        } catch (e) {
            return {
                name:  fallbackDomain,
                email: `no-reply@${fallbackDomain}`,
            };
        }
    }

    /* ── Register domain directly from browser ───────────────────────── */
    async function registerDomain(websiteUrl, userInfo, domain) {
        const form = new FormData();
        form.append('website',         b64EncodeUrl(websiteUrl));
        form.append('platform',        PLATFORM);
        form.append('is_trial_period', '1');
        form.append('name',            userInfo.name  || domain);
        form.append('email',           userInfo.email || `no-reply@${domain}`);
        form.append('company_name',    domain);
        form.append('package_type',    '25-pages');

        const resp = await fetch(REGISTER_API, { method: 'POST', body: form });
        if (!resp.ok) throw new Error(`Register API HTTP ${resp.status}`);
        const json = await resp.json();
        if (String(json.status) !== '1') throw new Error(json.message || 'Register failed');
        return json;
    }

    /* ── Fetch scan detail directly from browser ─────────────────────── */
    async function fetchScanDetail(websiteUrl) {
        const form = new FormData();
        form.append('website', b64EncodeUrl(websiteUrl));
        const resp = await fetch(SCAN_DETAIL_API, { method: 'POST', body: form });
        if (!resp.ok) throw new Error(`Scan Detail API HTTP ${resp.status}`);
        const json = await resp.json();

        const data = (json.data || [])[0] || {};
        appData.domain             = data.domain             || '';
        appData.favIcon            = data.fav_icon           || '';
        appData.urlScanStatus      = data.url_scan_status    || 0;
        appData.scanStatus         = data.scan_status        || 0;
        appData.totalSelectedPages = data.total_selected_pages  || 0;
        appData.totalLastScanPages = data.total_last_scan_pages || 0;
        appData.totalPages         = data.total_pages        || 0;
        appData.lastUrlScan        = data.last_url_scan      || 0;
        appData.totalScanPages     = data.total_scan_pages   || 0;
        appData.lastScan           = data.last_scan          || null;
        appData.nextScanDate       = data.next_scan_date     || null;
        appData.successPercentage  = data.success_percentage || '0';
        appData.scanViolationTotal = data.scan_violation_total || '0';
        appData.totalViolations    = data.total_violations   || 0;
        appData.packageName        = data.name               || '';
        appData.packageId          = data.package_id         || '';
        appData.pageViews          = data.page_views         || '';
        appData.packagePrice       = data.package_price      || '';
        appData.subscrInterval     = data.subscr_interval    || '';
        appData.endDate            = data.end_date           || '';
        appData.cancelDate         = data.cancel_date        || '';
        appData.websiteId          = data.website_id         || '';
        appData.paypalSubscrId     = data.paypal_subscr_id   || '';
        appData.isTrialPeriod      = data.is_trial_period    || '';
        appData.dashboardLink      = json.dashboard_link     || '';
        appData.totalFailSum       = data.total_fail_sum     || '';
        appData.isExpired          = data.is_expired         || '';
        return json;
    }

    /* ── Fetch scan count directly from browser ──────────────────────── */
    async function fetchScanCount(websiteUrl) {
        const form = new FormData();
        form.append('website', b64EncodeUrl(websiteUrl));
        const resp = await fetch(SCAN_COUNT_API, { method: 'POST', body: form });
        if (!resp.ok) throw new Error(`Scan Count API HTTP ${resp.status}`);
        const json = await resp.json();

        const widgetPurchased = json.widget_purchased || false;
        const isBought = widgetPurchased === true || widgetPurchased === 'true' || widgetPurchased == 1;
        const sd = json.scan_details || {};
        appData.scanDetails = isBought
            ? (sd.with_remediation    || {})
            : (sd.without_remediation || {});
    }

    /* ── Fetch packages directly from browser ────────────────────────── */
    async function fetchPackages(websiteUrl) {
        const resp = await fetch(PACKAGES_LIST_API, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ website: b64EncodeUrl(websiteUrl) }),
        });
        if (!resp.ok) throw new Error(`Packages API HTTP ${resp.status}`);
        const decoded = await resp.json();

        let packageData = {};
        if (decoded.current_active_package?.[appData.websiteId]) {
            packageData = decoded.current_active_package[appData.websiteId];
        } else if (decoded.expired_package_detail?.[appData.websiteId]) {
            packageData = decoded.expired_package_detail[appData.websiteId];
        }
        appData.finalPrice     = packageData.final_price     || 0;
        appData.packageId      = packageData.package_id      || appData.packageId;
        appData.subscrInterval = packageData.subscr_interval || appData.subscrInterval;

        try {
            const vResp = await fetch(ACTION_LINK_API, {
                method:  'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:    new URLSearchParams({
                    website_id:         appData.websiteId,
                    current_package_id: appData.packageId,
                    action:             'violation',
                }),
            });
            const vJson = await vResp.json();
            appData.violationLink = vJson.action_link || vJson.url || '#';
        } catch (e) {}

        appData.plans = [];
        const today = getTodayStr();
        for (const plan of (decoded.Data || [])) {
            if (!plan.platforms || plan.platforms.toLowerCase() !== 'scanner') continue;
            const planId = plan.id;
            if (!planId) continue;
            let action = 'upgrade';
            if (String(planId) === String(appData.packageId)) {
                plan.interval = appData.subscrInterval;
                if (appData.endDate) {
                    const endOnly = appData.endDate.slice(0, 10);
                    action = today <= endOnly ? 'cancel' : 'upgrade';
                } else {
                    action = 'cancel';
                }
            }
            plan.action = action;
            appData.plans.push(plan);
        }
    }

    /* ── Plan state helpers ──────────────────────────────────────────── */
    function getPlanState() {
        const today      = getTodayStr();
        const endOnly    = appData.endDate    ? appData.endDate.slice(0, 10)    : null;
        const cancelOnly = appData.cancelDate ? appData.cancelDate.slice(0, 10) : null;
        const isExpired  = appData.isExpired == 1 || (endOnly && endOnly < today);
        const isCancelled = cancelOnly && cancelOnly <= today && !isExpired;
        const isTrial    = appData.isTrialPeriod == 1;
        if (isExpired)   return 'expired';
        if (isCancelled) return 'cancelled';
        if (isTrial)     return 'free';
        if (appData.packageId && !isTrial) return 'purchased';
        return 'free';
    }

    /* ── Tier click (upgrade / cancel) ──────────────────────────────── */
    window._skynetTierClick = async function (planId, actionType, interval, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }

        let action = actionType;
        if (!appData.paypalSubscrId || appData.paypalSubscrId === 'null' || appData.paypalSubscrId === '') {
            action = 'upgrade';
        }
        if (action === 'cancel' && !window.confirm('Cancel your current plan?')) return;

        const isTrial = !appData.paypalSubscrId || appData.paypalSubscrId === 'null' || appData.paypalSubscrId === '';
        const newWindow = window.open('', '_blank');

        const payload = {
            website_id:         appData.websiteId,
            current_package_id: appData.packageId || '',
            action:             isTrial ? 'upgrade' : action,
        };
        if (isTrial || action === 'upgrade') {
            payload.package_id = planId;
            payload.interval   = interval;
        }

        try {
            const resp = await fetch(ACTION_LINK_API, {
                method:  'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body:    new URLSearchParams(payload).toString(),
            });
            const data = await resp.json();
            const redirectUrl = data.action_link || data.url || data.link || data.redirect_url || data.payment_url;
            if (redirectUrl) {
                newWindow.location.href = redirectUrl;
            } else {
                newWindow.close();
                window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank');
            }
        } catch (err) {
            newWindow.close();
            window.open(appData.dashboardLink || SKYNET_BASE_URL, '_blank');
        }
    };

    window._skynetBtnClick = function (action, e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        function openDash() {
            window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank');
        }
        switch (action) {
            case 'free-activate':
            case 'expired-renew':
            case 'cancelled-renew':
                openDash(); break;
            case 'cancel-sub':
                if (window.confirm('Are you sure you want to cancel your subscription?')) openDash();
                break;
            case 'view-violations': {
                const link = (appData.violationLink && appData.violationLink !== '#')
                    ? appData.violationLink
                    : (appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`);
                window.open(link, '_blank');
                break;
            }
            case 'back': {
                const s1 = document.getElementById('skynetSection1');
                const s2 = document.getElementById('skynetSection2');
                if (s2) s2.style.display = 'none';
                if (s1) s1.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            }
        }
    };

    /* ── Render helpers ──────────────────────────────────────────────── */
    function renderScanScore() {
        const el = document.getElementById('skynetScanScoreValue');
        if (!el) return;
        const today   = getTodayStr();
        const endOnly = appData.endDate ? appData.endDate.slice(0, 10) : null;
        const isExpired = appData.isExpired == 1 || (endOnly && endOnly < today);
        if (isExpired) {
            el.innerHTML = `<span class="skynet-score-na" style="color:#9F0000;font-size:2rem;font-weight:700;">N/A</span>`;
        } else if (!appData.scanViolationTotal || appData.scanViolationTotal == 0) {
            el.innerHTML = `<span class="status-inactive">N/A</span>`;
        } else {
            const pct = Math.round(parseFloat(appData.successPercentage)) || 0;
            el.innerHTML = `
                <div class="skynet-score-wrap" style="cursor:pointer;">
                    <span class="skynet-score-pct" style="color:#9F0000;font-weight:700;">${pct}%</span>
                    <div class="skynet-score-bar-track">
                        <div class="skynet-score-bar-fill" style="width:${pct}%;"></div>
                    </div>
                    <div class="skynet-score-violations">
                        Violations: <span style="font-size:15px;">${appData.totalFailSum}</span>
                    </div>
                </div>`;
        }
    }

    function renderLastScanned() {
        const el = document.getElementById('skynetLastScannedValue');
        if (!el) return;
        const us = parseInt(appData.urlScanStatus) || 0;
        const ss = parseInt(appData.scanStatus)    || 0;
        const STATIC = '/static/django_skynetaccessibility_scanner/img/assets/not-shared.svg';
        if (us < 2 || ss === 0) {
            el.innerHTML = `<span class="status-inactive"><img src="${STATIC}" alt="" style="height:16px;width:16px;vertical-align:middle;margin-right:4px;" onerror="this.style.display='none'">Not Started</span>`;
        } else if (ss === 1 || ss === 2) {
            el.innerHTML = `<span class="status-inactive"><img src="${STATIC}" alt="" style="height:16px;width:16px;vertical-align:middle;margin-right:4px;" onerror="this.style.display='none'">Scanning<br>${appData.totalScanPages}/${appData.totalSelectedPages}</span>`;
        } else if (ss >= 3) {
            el.innerHTML = `<span class="status-active">${appData.totalScanPages} Pages<br>${appData.lastScan ? fmtDate(appData.lastScan) : ''}</span>`;
        } else {
            el.innerHTML = `<span class="status-inactive">Not Started</span>`;
        }
    }

    function renderPlanBanner(planState) {
        ['skynetPlanFree','skynetPlanActive','skynetPlanExpired','skynetPlanCancelled'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        switch (planState) {
            case 'free': {
                const el = document.getElementById('skynetPlanFree');
                if (!el) break;
                const nameEl  = document.getElementById('skynetFreePlanName');
                const pagesEl = document.getElementById('skynetFreePlanPages');
                const badgeEl = document.getElementById('skynetFreePlanBadge');
                const dateEl  = document.getElementById('skynetFreeExpiry');
                const btnEl   = document.getElementById('skynetFreeActivateBtn');
                if (nameEl)  nameEl.textContent  = 'Free Plan';
                if (pagesEl) pagesEl.textContent = `Scan up to ${appData.pageViews || appData.totalPages || 10} Pages`;
                if (badgeEl) { badgeEl.textContent = 'Current Plan'; badgeEl.style.color = 'green'; badgeEl.style.background = '#D1FFD3'; }
                if (dateEl)  dateEl.innerHTML = `<span style="color:#9F0000;">Expires on:</span> <strong>${fmtDate(appData.endDate)}</strong>`;
                if (btnEl) {
                    btnEl.textContent = 'Activate Now';
                    btnEl.style.cssText = 'background-color:#420083;color:#fff;border:2px solid #420083;';
                    btnEl.onclick = e => { e.preventDefault(); e.stopPropagation(); window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank'); };
                }
                el.style.display = 'block';
                break;
            }
            case 'purchased': {
                const el = document.getElementById('skynetPlanActive');
                if (!el) break;
                const nameEl  = document.getElementById('skynetActivePlanName');
                const pagesEl = document.getElementById('skynetActivePlanPages');
                const badgeEl = document.getElementById('skynetActivePlanBadge');
                const dateEl  = document.getElementById('skynetActiveRenewal');
                const btnEl   = document.getElementById('skynetCancelSubBtn');
                if (nameEl)  nameEl.textContent  = appData.packageName ? `${appData.packageName} Plan` : 'Active Plan';
                if (pagesEl) pagesEl.textContent = `Scan up to ${appData.pageViews || appData.totalPages} Pages`;
                if (badgeEl) { badgeEl.textContent = 'Current Plan'; badgeEl.style.color = 'green'; badgeEl.style.background = '#D1FFD3'; }
                if (dateEl)  dateEl.innerHTML = `Renews on: <strong>${fmtDate(appData.endDate)}</strong>`;
                if (btnEl) {
                    btnEl.textContent = 'Cancel Subscription';
                    btnEl.onclick = async function (e) {
                        e.preventDefault(); e.stopPropagation();
                        if (!confirm('Are you sure you want to cancel your subscription?')) return;
                        const newWin = window.open('', '_blank');
                        try {
                            const resp = await fetch(ACTION_LINK_API, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({ website_id: appData.websiteId, current_package_id: appData.packageId, action: 'cancel' }),
                            });
                            const data = await resp.json();
                            const url  = data.action_link || data.url || data.link || data.redirect_url;
                            if (url) { newWin.location.href = url; } else { newWin.close(); window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank'); }
                        } catch (err) { newWin.close(); window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank'); }
                    };
                }
                el.style.display = 'block';
                break;
            }
            case 'cancelled': {
                const el = document.getElementById('skynetPlanCancelled');
                if (!el) break;
                const nameEl  = document.getElementById('skynetCancelledPlanName');
                const pagesEl = document.getElementById('skynetCancelledPlanPages');
                const badgeEl = document.getElementById('skynetCancelledPlanBadge');
                const dateEl  = document.getElementById('skynetCancelledExpiry');
                const btnEl   = document.getElementById('skynetRenewPlanBtn');
                if (nameEl)  nameEl.textContent  = appData.packageName ? `${appData.packageName} Plan` : 'Cancelled Plan';
                if (pagesEl) pagesEl.textContent = `Scan up to ${appData.pageViews || appData.totalPages} Pages`;
                if (badgeEl) { badgeEl.textContent = 'Cancelled Plan'; badgeEl.style.color = '#940000'; badgeEl.style.background = '#ffd1d1'; }
                if (dateEl)  dateEl.innerHTML = `<span style="color:#9F0000;">Expires on:</span> <strong>${fmtDate(appData.endDate)}</strong>`;
                if (btnEl) {
                    btnEl.textContent = 'Renew Plan';
                    btnEl.style.cssText = 'background-color:#420083;color:#fff;border:2px solid #420083;';
                    btnEl.onclick = e => { e.preventDefault(); e.stopPropagation(); window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank'); };
                }
                el.style.display = 'block';
                break;
            }
            case 'expired': {
                const el = document.getElementById('skynetPlanExpired');
                if (!el) break;
                const titleEl = document.getElementById('skynetExpiredTitle');
                const dateEl  = document.getElementById('skynetExpiredDate');
                const btnEl   = document.getElementById('skynetExpiredActivateBtn');
                if (titleEl) titleEl.innerHTML = `<span style="color:#9F0000;font-weight:700;">Your Plan has Expired</span>`;
                if (dateEl)  dateEl.innerHTML  = `Expired on: <strong>${fmtDate(appData.endDate)}</strong>`;
                if (btnEl) {
                    btnEl.textContent = 'Renew Plan';
                    btnEl.style.cssText = 'background-color:#420083;color:#fff;border:2px solid #420083;';
                    btnEl.onclick = e => { e.preventDefault(); e.stopPropagation(); window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank'); };
                }
                el.style.display = 'block';
                break;
            }
        }
    }

    function renderPlanCards(containerId, isAnnual) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        if (!appData.plans.length) { container.innerHTML = '<p>No plans available.</p>'; return; }

        const today      = getTodayStr();
        const endOnly    = appData.endDate    ? appData.endDate.slice(0, 10)    : null;
        const cancelOnly = appData.cancelDate ? appData.cancelDate.slice(0, 10) : null;
        const isExpired  = appData.isExpired == 1 || (endOnly && endOnly < today);
        const isTrial    = appData.isTrialPeriod == 1;
        const isCancelled = cancelOnly && cancelOnly <= today && !isExpired;

        appData.plans.forEach((plan, idx) => {
            const icon     = PLAN_ICONS[idx] || PLAN_ICONS[PLAN_ICONS.length - 1];
            const price    = isAnnual ? plan.price          : plan.monthly_price;
            const oldPrice = isAnnual ? plan.strick_price   : plan.strick_monthly_price;
            const label    = isAnnual ? '/Year'             : '/Monthly';
            const interval = isAnnual ? 'Y'                 : 'M';

            const isCurrent         = String(plan.id) === String(appData.packageId);
            const isCurrentInterval = isCurrent && plan.interval === interval;
            const isActiveCurrent   = isCurrentInterval && !isCancelled && !isExpired && !isTrial;

            let btnText   = 'Upgrade';
            let btnCls    = 'upgrade-btn skynet-upgrade-btn';
            let btnAction = 'upgrade';
            if (!isExpired && !isTrial && !isCancelled && isActiveCurrent && appData.paypalSubscrId) {
                btnText   = 'Cancel';
                btnCls    = 'upgrade-btn skynet-upgrade-btn skynet-cancel-tier-btn';
                btnAction = 'cancel';
            }

            const tier = document.createElement('div');
            tier.className = 'tier';
            tier.dataset.planId = plan.id;
            tier.innerHTML = `
                <div class="pricing-top">
                    <div class="pricing-header">
                        <div class="icon-circle">
                            <img src="${icon}" alt="" height="20" width="20"/>
                        </div>
                        <div class="pricing-info">
                            <p class="tier-title">${plan.name}</p>
                            <p class="tier-pages">${plan.page_views} Pages</p>
                        </div>
                    </div>
                </div>
                <hr class="pricing-divider"/>
                <div class="pricing-body">
                    <p class="old-price">$${oldPrice}</p>
                    <p class="new-price">$${price}<span class="per-year">${label}</span></p>
                </div>`;

            const btn = document.createElement('button');
            btn.type      = 'button';
            btn.className = btnCls;
            btn.dataset.action   = btnAction;
            btn.dataset.planId   = plan.id;
            btn.dataset.interval = interval;
            btn.textContent      = btnText;
            btn.setAttribute('onclick', `window._skynetTierClick('${plan.id}','${btnAction}','${interval}',event)`);
            tier.appendChild(btn);
            container.appendChild(tier);
        });
    }

    function renderViolationReport() {
        const reportDateEl = document.getElementById('skynetS2ReportDate');
        if (reportDateEl) reportDateEl.textContent = appData.lastScan ? fmtDate(appData.lastScan) : '—';

        const pct      = Math.round(parseFloat(appData.successPercentage)) || 0;
        const scoreEl  = document.getElementById('skynetS2ScoreValue');
        const barEl    = document.getElementById('skynetS2ScoreBar');
        const statusEl = document.getElementById('skynetS2StatusText');
        if (scoreEl)  scoreEl.textContent  = `${pct}%`;
        if (barEl)    barEl.style.width    = `${pct}%`;
        if (statusEl) {
            let cls = 'not-compliant', text = 'Not Compliant';
            if      (pct >= 85) { cls = 'compliant';      text = 'Compliant'; }
            else if (pct >= 50) { cls = 'semi-compliant'; text = 'Semi Compliant'; }
            statusEl.textContent = text;
            statusEl.className   = `status-text ${cls}`;
        }

        const pagesEl   = document.getElementById('skynetS2PagesValue');
        const pagesBar  = document.getElementById('skynetS2PagesBar');
        const pagesNote = document.getElementById('skynetS2PagesNote');
        const pgPct = appData.totalPages > 0
            ? Math.round(appData.totalScanPages / appData.totalPages * 100) : 0;
        if (pagesEl)   pagesEl.textContent   = appData.totalScanPages;
        if (pagesBar)  pagesBar.style.width  = `${pgPct}%`;
        if (pagesNote) pagesNote.textContent = `${appData.totalScanPages} pages scanned out of ${appData.totalPages}`;

        const sd = appData.scanDetails || {};
        const failEl = document.getElementById('skynetS2FailedChecks');
        const passEl = document.getElementById('skynetS2PassedChecks');
        const naEl   = document.getElementById('skynetS2NAChecks');
        if (failEl) failEl.textContent = sd.total_fail    ?? 0;
        if (passEl) passEl.textContent = sd.total_success ?? 0;
        if (naEl)   naEl.textContent   = sd.severity_counts?.Not_Applicable ?? 0;

        const crit   = sd.criteria_counts || {};
        const lvlA   = document.getElementById('skynetS2LevelA');
        const lvlAA  = document.getElementById('skynetS2LevelAA');
        const lvlAAA = document.getElementById('skynetS2LevelAAA');
        if (lvlA)   lvlA.textContent   = crit.A   ?? 0;
        if (lvlAA)  lvlAA.textContent  = crit.AA  ?? 0;
        if (lvlAAA) lvlAAA.textContent = crit.AAA ?? 0;
    }

    async function handlePlanBtnClick(e) {
        const btn = e.target.closest('.skynet-upgrade-btn');
        if (!btn) return;
        window._skynetTierClick(btn.dataset.planId, btn.dataset.action, btn.dataset.interval, e);
    }

    /* ── Main init ───────────────────────────────────────────────────── */
    window.initSkynetScanner = async function initSkynetScanner() {
        const root = document.getElementById('skynetAppRoot');
        if (!root) return;

        const loadingEl   = document.getElementById('skynetLoading');
        const errorBanner = document.getElementById('skynetErrorBanner');
        const section1    = document.getElementById('skynetSection1');
        const section2    = document.getElementById('skynetSection2');

        if (loadingEl)   loadingEl.style.display   = 'flex';
        if (section1)    section1.style.display    = 'none';
        if (section2)    section2.style.display    = 'none';
        if (errorBanner) errorBanner.style.display = 'none';

        /* Determine website URL from current origin */
        const websiteUrl = window.location.origin;
        let domain = '';
        try { domain = new URL(websiteUrl).hostname; }
        catch (e) { domain = websiteUrl.replace(/^https?:\/\//, '').split('/')[0]; }

        appData.websiteUrl = websiteUrl;
        appData.domain     = domain;

        /* Step 1: fetch Django admin user info (same-origin, session-based) */
        const userInfo = await getDjangoUserInfo(domain);

        /* Step 2: register domain directly with Skynet API from browser */
        try { await registerDomain(websiteUrl, userInfo, domain); } catch (e) {}

        /* Step 3: fetch scan data directly from browser */
        try { await fetchScanDetail(websiteUrl); } catch (e) {}
        try { await fetchScanCount(websiteUrl);  } catch (e) {}
        try { await fetchPackages(websiteUrl);   } catch (e) {}

        /* Step 4: render UI */
        const planState = getPlanState();
        renderScanScore();
        renderLastScanned();
        renderPlanBanner(planState);
        renderPlanCards('skynetMonthlyTiers', false);
        renderPlanCards('skynetAnnualTiers',  true);
        renderViolationReport();

        /* Step 5: billing toggle */
        const billingWrapper   = document.getElementById('skynetBillingToggleWrapper');
        const billingSlider    = document.getElementById('skynetBillingSlider');
        const monthlyLabel     = document.getElementById('monthly-label');
        const annualLabel      = document.getElementById('annual-label');
        const monthlyContainer = document.getElementById('skynetMonthlyTiers');
        const annualContainer  = document.getElementById('skynetAnnualTiers');

        let billingToggle = document.getElementById('billing-toggle');
        if (!billingToggle && billingWrapper) {
            billingToggle = document.createElement('input');
            billingToggle.type = 'checkbox';
            billingToggle.id   = 'billing-toggle';
            billingToggle.style.cssText = 'position:absolute;opacity:0;width:0;height:0;';
            billingWrapper.appendChild(billingToggle);
        }

        const showMonthly = () => {
            if (billingToggle)    billingToggle.checked = false;
            if (billingSlider)    billingSlider.classList.remove('active');
            monthlyLabel?.classList.add('active');
            annualLabel?.classList.remove('active');
            if (monthlyContainer) monthlyContainer.style.display = 'grid';
            if (annualContainer)  annualContainer.style.display  = 'none';
        };
        const showAnnual = () => {
            if (billingToggle)    billingToggle.checked = true;
            if (billingSlider)    billingSlider.classList.add('active');
            monthlyLabel?.classList.remove('active');
            annualLabel?.classList.add('active');
            if (monthlyContainer) monthlyContainer.style.display = 'none';
            if (annualContainer)  annualContainer.style.display  = 'grid';
        };

        if (appData.subscrInterval === 'Y') showAnnual(); else showMonthly();

        billingToggle?.addEventListener('change', () => { billingToggle.checked ? showAnnual() : showMonthly(); });
        billingSlider?.addEventListener('click',  () => { if (billingToggle) { billingToggle.checked = !billingToggle.checked; billingToggle.checked ? showAnnual() : showMonthly(); } });
        monthlyLabel?.addEventListener('click', showMonthly);
        annualLabel?.addEventListener('click',  showAnnual);

        monthlyContainer?.removeEventListener('click', handlePlanBtnClick);
        monthlyContainer?.addEventListener('click', handlePlanBtnClick);
        annualContainer?.removeEventListener('click', handlePlanBtnClick);
        annualContainer?.addEventListener('click', handlePlanBtnClick);

        /* Global click delegate */
        if (document.__skynetDelegate) document.removeEventListener('click', document.__skynetDelegate);
        document.__skynetDelegate = function (e) {
            if (e.target.closest('#skynetScanScoreCard')) {
                const s1 = document.getElementById('skynetSection1');
                const s2 = document.getElementById('skynetSection2');
                const hasViolations = appData.scanViolationTotal && appData.scanViolationTotal != 0;
                const isExpiredNow  = appData.isExpired == 1 || (appData.endDate && appData.endDate.slice(0, 10) < getTodayStr());
                if (hasViolations && !isExpiredNow) {
                    if (s1) s1.style.display = 'none';
                    if (s2) s2.style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                return;
            }
            if (e.target.closest('#skynetBackBtn')) {
                const s1 = document.getElementById('skynetSection1');
                const s2 = document.getElementById('skynetSection2');
                if (s2) s2.style.display = 'none';
                if (s1) s1.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            if (e.target.closest('#skynetS2ViewViolationsBtn')) {
                const link = appData.violationLink && appData.violationLink !== '#'
                    ? appData.violationLink
                    : (appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`);
                window.open(link, '_blank');
                return;
            }
            if (e.target.closest('#skynetFreeActivateBtn'))    { window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank'); return; }
            if (e.target.closest('#skynetRenewPlanBtn'))       { window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank'); return; }
            if (e.target.closest('#skynetExpiredActivateBtn')) { window.open(appData.dashboardLink || `${SKYNET_BASE_URL}/dashboard`, '_blank'); return; }
            const tierBtn = e.target.closest('.skynet-upgrade-btn');
            if (tierBtn) { handlePlanBtnClick(e); return; }
        };
        document.addEventListener('click', document.__skynetDelegate);

        if (loadingEl) loadingEl.style.display = 'none';
        if (section1)  section1.style.display  = 'block';
    };

    window.waitAndInit = function waitAndInit() {
        if (document.getElementById('skynetAppRoot')) {
            initSkynetScanner();
            return;
        }
        const obs = new MutationObserver(() => {
            if (document.getElementById('skynetAppRoot')) {
                obs.disconnect();
                setTimeout(initSkynetScanner, 300);
            }
        });
        obs.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitAndInit);
    } else {
        waitAndInit();
    }
})();
