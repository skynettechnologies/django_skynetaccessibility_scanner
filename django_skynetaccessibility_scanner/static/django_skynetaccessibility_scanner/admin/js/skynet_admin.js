/* Skynet Accessibility Scanner — Django Admin JS */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        // Inject header banner into admin change form
        var form = document.querySelector('#content-main form');
        if (!form) return;

        var header = document.createElement('div');
        header.className = 'skynet-admin-header';
        header.innerHTML = '<h2>Skynet Accessibility Scanner Settings</h2>' +
            '<p>Domain registration and scan data are managed automatically. ' +
            'Most fields below are read-only and synced from the Skynet API.</p>';
        form.insertBefore(header, form.firstChild);

        var note = document.createElement('div');
        note.className = 'skynet-readonly-note';
        note.textContent = 'To view your full dashboard, visit the Scanner page linked in the site navigation.';
        form.insertBefore(note, form.firstChild.nextSibling);
    });
})();
