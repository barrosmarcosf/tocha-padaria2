/* track.js — tracking de eventos silencioso */
(function () {
    function getSessionId() {
        let sid = sessionStorage.getItem('_tsid');
        if (!sid) {
            sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
            sessionStorage.setItem('_tsid', sid);
        }
        return sid;
    }

    window.track = function (event, data) {
        try {
            fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event: event,
                    session_id: getSessionId(),
                    metadata: data || {}
                }),
                keepalive: true
            }).catch(function () {});
        } catch (_) {}
    };

    window.getSessionId = getSessionId;

    // Dispara site_enter uma vez por sessão
    if (!sessionStorage.getItem('_se')) {
        sessionStorage.setItem('_se', '1');
        window.track('site_enter', { referrer: document.referrer || '', path: location.pathname });
    }
}());
