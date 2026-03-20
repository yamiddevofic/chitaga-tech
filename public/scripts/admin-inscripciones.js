(function () {
    var API = window.location.hostname === 'localhost' ? '' : 'https://server.chitaga.tech';
    var pageRoot = document.querySelector('.admin-main');
    var form = document.getElementById('admin-auth-form');
    var passwordInput = document.getElementById('admin-password');
    var eventSelect = document.getElementById('admin-event-slug');
    var loadBtn = document.getElementById('admin-load-btn');
    var feedback = document.getElementById('admin-feedback');
    var results = document.getElementById('admin-results');
    var summary = document.getElementById('admin-summary');
    var list = document.getElementById('admin-list');

    if (!pageRoot || !form || !passwordInput || !eventSelect || !loadBtn || !feedback || !results || !summary || !list) {
        return;
    }

    var eventsMeta = [];
    try {
        eventsMeta = JSON.parse(pageRoot.dataset.events || '[]');
    } catch (err) {
        eventsMeta = [];
    }

    var storedKey = sessionStorage.getItem('chitaga_admin_key');
    if (storedKey) {
        passwordInput.value = storedKey;
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        var adminKey = (passwordInput.value || '').trim();
        var slug = eventSelect.value;

        if (!adminKey) {
            setFeedback('Ingresa la contraseña para continuar.');
            return;
        }

        if (!slug) {
            setFeedback('Selecciona un evento.');
            return;
        }

        sessionStorage.setItem('chitaga_admin_key', adminKey);

        loadBtn.disabled = true;
        loadBtn.textContent = 'Cargando...';
        setFeedback('');

        fetch(API + '/api/events/' + encodeURIComponent(slug) + '/registrations', {
            method: 'GET',
            headers: {
                'x-admin-key': adminKey,
            },
        })
            .then(function (res) {
                return res.json().catch(function () { return null; }).then(function (payload) {
                    return { ok: res.ok, status: res.status, payload: payload };
                });
            })
            .then(function (resp) {
                if (!resp.ok) {
                    if (resp.status === 401) {
                        sessionStorage.removeItem('chitaga_admin_key');
                        setFeedback('Contraseña incorrecta. Verifica la clave de administrador.');
                        hideResults();
                        return;
                    }

                    var message = resp.payload && resp.payload.error ? resp.payload.error : 'No se pudo obtener la información del evento.';
                    setFeedback(message);
                    hideResults();
                    return;
                }

                var registrations = Array.isArray(resp.payload) ? resp.payload : [];
                renderResults(slug, registrations);
                setFeedback('Consulta cargada correctamente.', true);
            })
            .catch(function () {
                setFeedback('Error de conexión con la API.');
                hideResults();
            })
            .finally(function () {
                loadBtn.disabled = false;
                loadBtn.textContent = 'Ver inscritos';
            });
    });

    function renderResults(slug, rows) {
        var eventMeta = eventsMeta.find(function (evt) { return evt.slug === slug; }) || null;
        var title = eventMeta ? eventMeta.title : slug;
        var eventDate = eventMeta ? formatDate(eventMeta.date) : 'Sin fecha';
        var eventTime = eventMeta && eventMeta.time ? eventMeta.time : 'Hora por confirmar';
        var capacity = eventMeta && eventMeta.capacity ? eventMeta.capacity : '-';

        summary.innerHTML = [
            '<h2 class="admin-summary-title">' + escapeHtml(title) + '</h2>',
            '<p class="admin-summary-meta">Fecha: ' + escapeHtml(eventDate) + '</p>',
            '<p class="admin-summary-meta">Horario: ' + escapeHtml(eventTime) + '</p>',
            '<p class="admin-summary-meta">Inscritos: <strong>' + rows.length + '</strong> / ' + capacity + '</p>',
        ].join('');

        if (!rows.length) {
            list.innerHTML = '<article class="admin-item"><div class="admin-item-body"><p class="admin-value">Aún no hay registros para este evento.</p></div></article>';
            results.hidden = false;
            return;
        }

        list.innerHTML = rows.map(function (row) {
            var details = [];
            var data = row && row.data && typeof row.data === 'object' ? row.data : {};

            details.push(makeRow('Registrado', formatDateTime(row.created_at)));
            details.push(makeRow('ID', String(row.id || '')));

            Object.keys(data).forEach(function (key) {
                details.push(makeRow(humanizeKey(key), String(data[key] || '')));
            });

            details.push(makeRow('IP', row.ip || 'No disponible'));

            return [
                '<article class="admin-item">',
                '  <header class="admin-item-head">',
                '    <h3 class="admin-item-name">' + escapeHtml(data.name || 'Participante sin nombre') + '</h3>',
                '    <p class="admin-item-email">' + escapeHtml(data.email || row.email || 'Sin correo') + '</p>',
                '  </header>',
                '  <div class="admin-item-body">' + details.join('') + '</div>',
                '</article>',
            ].join('');
        }).join('');

        results.hidden = false;
    }

    function makeRow(label, value) {
        return '<div class="admin-row"><span class="admin-key">' + escapeHtml(label) + '</span><p class="admin-value">' + escapeHtml(value || '-') + '</p></div>';
    }

    function hideResults() {
        results.hidden = true;
        summary.innerHTML = '';
        list.innerHTML = '';
    }

    function setFeedback(message, ok) {
        feedback.textContent = message;
        feedback.className = ok ? 'admin-feedback ok' : 'admin-feedback';
    }

    function formatDate(isoDate) {
        if (!isoDate) return 'Sin fecha';

        var normalized = isoDate.indexOf('T') > -1 ? isoDate : isoDate + 'T12:00:00';
        var date = new Date(normalized);
        if (Number.isNaN(date.getTime())) return isoDate;

        return date.toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }

    function formatDateTime(sqlDate) {
        if (!sqlDate) return 'Sin fecha';

        var date = new Date(sqlDate.replace(' ', 'T') + 'Z');
        if (Number.isNaN(date.getTime())) return sqlDate;

        return date.toLocaleString('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    }

    function humanizeKey(key) {
        return String(key || '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, function (match) { return match.toUpperCase(); });
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
