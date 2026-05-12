/* track.js — event tracking pipeline */
(function () {
    var IDLE_MS = 30 * 60 * 1000; // 30 min idle → nova sessão

    function getSessionId() {
        var now = Date.now();
        var sid = localStorage.getItem('_tsid');
        var la  = parseInt(localStorage.getItem('_tsla') || '0', 10);

        if (!sid || (now - la) > IDLE_MS) {
            sid = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : now.toString(36) + Math.random().toString(36).slice(2);
            localStorage.setItem('_tsid', sid);
            // reset flags de eventos únicos ao criar nova sessão
            localStorage.removeItem('_tsse');
            localStorage.removeItem('_tscc');
        }
        localStorage.setItem('_tsla', String(now));
        return sid;
    }

    window.getSessionId = getSessionId;

    window.track = function (event, data) {
        var sid = getSessionId();
        try {
            fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event: event, session_id: sid, metadata: data || {} }),
                keepalive: true
            }).catch(function () {});
        } catch (_) {}
    };

    // site_enter: dispara uma vez por session_id
    var sid = getSessionId();
    if (localStorage.getItem('_tsse') !== sid) {
        localStorage.setItem('_tsse', sid);
        window.track('site_enter', { referrer: document.referrer || '', path: location.pathname });
    }
}());
