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
                keepalive: true   // garante envio mesmo em redirects
            }).catch(function () {});
        } catch (_) {}
    };
}());
