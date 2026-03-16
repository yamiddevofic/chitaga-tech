(function () {
    var form = document.getElementById('suggestion-form');
    if (!form) return;

    var topic = form.dataset.topic;
    if (!topic) return;

    var API = window.location.hostname === 'localhost' ? '' : 'https://server.chitaga.tech';

    function $(id) { return document.getElementById(id); }

    function setStatus(name, text, type) {
        var el = $('sf-status-' + name);
        var input = $('sf-' + name);
        if (el) { el.textContent = text; el.className = 'sf-status ' + type; }
        if (input) { input.classList.toggle('sf-input-error', type === 'error'); }
    }

    function clearStatus(name) {
        var el = $('sf-status-' + name);
        var input = $('sf-' + name);
        if (el) { el.textContent = ''; el.className = 'sf-status'; }
        if (input) { input.classList.remove('sf-input-error'); }
    }

    // Real-time validation
    form.addEventListener('input', function (e) {
        var t = e.target;
        if (!t || !t.name) return;

        var val = t.value.trim();
        clearStatus(t.name);

        if (t.name === 'message') {
            if (!val) return;
            var remaining = 20 - val.length;
            if (remaining > 0) setStatus('message', 'Faltan ' + remaining + ' caracteres', 'error');
            else setStatus('message', '', 'ok');
        }

        if (t.name === 'name') {
            if (!val) return;
            if (val.length < 2) setStatus('name', 'Mínimo 2 caracteres', 'error');
        }
    });

    // Submit
    var btn = $('sf-submit-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
        var feedback = $('sf-feedback');
        var nameVal = ($('sf-name') ? $('sf-name').value.trim() : '');
        var msgVal = ($('sf-message') ? $('sf-message').value.trim() : '');

        var hasError = false;

        if (nameVal && nameVal.length < 2) {
            setStatus('name', 'Mínimo 2 caracteres', 'error');
            hasError = true;
        }

        if (!msgVal) {
            setStatus('message', 'Escribe tu sugerencia', 'error');
            hasError = true;
        } else if (msgVal.length < 20) {
            setStatus('message', 'Mínimo 20 caracteres', 'error');
            hasError = true;
        }

        if (hasError) {
            if (feedback) { feedback.textContent = 'Corrige los campos marcados'; feedback.className = 'sf-feedback error'; }
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="sf-spinner"></span> Enviando...';
        if (feedback) { feedback.textContent = ''; feedback.className = 'sf-feedback'; }

        fetch(API + '/api/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic: topic, name: nameVal || null, message: msgVal }),
        })
        .then(function (res) { return res.json().then(function (r) { return { ok: res.ok, status: res.status, result: r }; }); })
        .then(function (resp) {
            if (resp.ok) {
                form.reset();
                clearStatus('name');
                clearStatus('message');
                if (feedback) {
                    feedback.textContent = 'Gracias por tu sugerencia. La tendremos en cuenta.';
                    feedback.className = 'sf-feedback success';
                }
            } else {
                var msg = resp.result.error || 'Error al enviar';
                if (resp.status === 429) msg = 'Demasiados intentos. Espera un momento.';
                if (feedback) { feedback.textContent = msg; feedback.className = 'sf-feedback error'; }
            }
            btn.disabled = false;
            btn.textContent = 'Enviar sugerencia';
        })
        .catch(function () {
            if (feedback) { feedback.textContent = 'No se pudo conectar con el servidor'; feedback.className = 'sf-feedback error'; }
            btn.disabled = false;
            btn.textContent = 'Enviar sugerencia';
        });
    });
})();
