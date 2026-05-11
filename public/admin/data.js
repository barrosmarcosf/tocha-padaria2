// Camada de acesso a dados do admin — conectada ao Supabase via API do servidor

window.apiGet = function(path) {
  const token = localStorage.getItem('tocha_admin_token');
  return fetch(path, {
    headers: token ? { 'Authorization': 'Bearer ' + token } : {}
  }).then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
};

// CSRF token (vinculado ao cookie session_id + user-agent)
window._csrfToken = null;
window._csrfFetching = null;

window._loadCsrf = function() {
  if (window._csrfToken) return Promise.resolve(window._csrfToken);
  if (window._csrfFetching) return window._csrfFetching;
  window._csrfFetching = fetch('/api/admin/csrf-token')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      window._csrfToken = d.token || null;
      window._csrfFetching = null;
      return window._csrfToken;
    })
    .catch(function() {
      window._csrfFetching = null;
      return null;
    });
  return window._csrfFetching;
};

window.apiPost = function(path, body, _isRetry) {
  return window._loadCsrf().then(function(csrf) {
    const authToken = localStorage.getItem('tocha_admin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
    if (csrf) headers['X-CSRF-Token'] = csrf;
    return fetch(path, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    }).then(function(r) {
      if (r.status === 403 && !_isRetry) {
        window._csrfToken = null;
        window._csrfFetching = null;
        return window.apiPost(path, body, true);
      }
      if (!r.ok) return r.json().then(function(e) { throw new Error(e.error || 'HTTP ' + r.status); });
      return r.json();
    });
  });
};
