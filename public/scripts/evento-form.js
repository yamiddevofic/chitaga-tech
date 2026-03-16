(function () {
    var API = window.location.hostname === 'localhost' ? '' : 'https://server.chitaga.tech';
    var form = document.getElementById('evento-form');
    if (!form) return;

    var slug = form.dataset.slug;
    var fieldsJson = form.dataset.fields;
    if (!slug || !fieldsJson) return;

    var fields;
    try { fields = JSON.parse(fieldsJson); } catch (e) { return; }

    var debounceTimers = {};
    var emailExists = false;

    function $(id) { return document.getElementById(id); }

    function setStatus(fieldName, text, type) {
        var el = $('ef-status-' + fieldName);
        var input = $('ef-' + fieldName);
        if (el) { el.textContent = text; el.className = 'ef-status ' + type; }
        if (input) { input.classList.toggle('ef-input-error', type === 'error'); }
    }

    function clearStatus(fieldName) {
        var el = $('ef-status-' + fieldName);
        var input = $('ef-' + fieldName);
        if (el) { el.textContent = ''; el.className = 'ef-status'; }
        if (input) { input.classList.remove('ef-input-error'); }
    }

    // Real-time validation
    form.addEventListener('input', function (e) {
        var target = e.target;
        if (!target || !target.name) return;

        var field = fields.find(function (f) { return f.name === target.name; });
        if (!field) return;

        var val = target.value.trim();
        clearStatus(field.name);

        if (!val) return;

        // Text min length
        if ((field.type === 'text' || field.type === 'textarea') && field.min && val.length < field.min) {
            var remaining = field.min - val.length;
            setStatus(field.name, 'Faltan ' + remaining + ' caracteres', 'error');
            return;
        }

        // Number min/max
        if (field.type === 'number') {
            var num = parseInt(val, 10);
            if (isNaN(num)) { setStatus(field.name, 'Debe ser un número', 'error'); return; }
            if (field.min !== undefined && num < field.min) { setStatus(field.name, 'Mínimo: ' + field.min, 'error'); return; }
            if (field.max !== undefined && num > field.max) { setStatus(field.name, 'Máximo: ' + field.max, 'error'); return; }
        }

        // Email format + duplicate check
        if (field.type === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                setStatus(field.name, 'Correo no válido', 'error');
                return;
            }
            clearTimeout(debounceTimers.email);
            debounceTimers.email = setTimeout(function () {
                fetch(API + '/api/events/' + slug + '/check-email?email=' + encodeURIComponent(val))
                    .then(function (r) { return r.json(); })
                    .then(function (d) {
                        emailExists = d.exists;
                        setStatus(field.name,
                            d.exists ? 'Ya estás inscrito con este correo' : 'Correo disponible',
                            d.exists ? 'error' : 'ok');
                    })
                    .catch(function () { emailExists = false; });
            }, 500);
            return;
        }

        // Valid indicator for fields that pass
        if (field.type === 'text' && val.length >= (field.min || 1)) {
            setStatus(field.name, '', 'ok');
        }
        if (field.type === 'textarea' && val.length >= (field.min || 1)) {
            setStatus(field.name, 'Mensaje válido', 'ok');
        }
    });

    // Submit
    var btn = $('ef-submit-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
        var feedback = $('ef-feedback');
        var data = {};
        var hasError = false;

        // Validate all fields
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            var input = $('ef-' + field.name);
            if (!input) continue;

            var val = input.value.trim();
            data[field.name] = val;

            if (field.required && !val) {
                setStatus(field.name, 'Este campo es obligatorio', 'error');
                hasError = true;
                continue;
            }

            if (!val) continue;

            if ((field.type === 'text' || field.type === 'textarea') && field.min && val.length < field.min) {
                setStatus(field.name, 'Mínimo ' + field.min + ' caracteres', 'error');
                hasError = true;
            }

            if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                setStatus(field.name, 'Correo no válido', 'error');
                hasError = true;
            }

            if (field.type === 'number') {
                var num = parseInt(val, 10);
                if (isNaN(num)) { setStatus(field.name, 'Debe ser un número', 'error'); hasError = true; }
                else if (field.min !== undefined && num < field.min) { setStatus(field.name, 'Mínimo: ' + field.min, 'error'); hasError = true; }
                else if (field.max !== undefined && num > field.max) { setStatus(field.name, 'Máximo: ' + field.max, 'error'); hasError = true; }
            }

            if (field.type === 'select' && field.required && !val) {
                setStatus(field.name, 'Selecciona una opción', 'error');
                hasError = true;
            }
        }

        if (emailExists) {
            if (feedback) { feedback.textContent = 'Ya estás inscrito con ese correo'; feedback.className = 'ef-feedback error'; }
            return;
        }

        if (hasError) {
            if (feedback) { feedback.textContent = 'Corrige los campos marcados'; feedback.className = 'ef-feedback error'; }
            return;
        }

        // Send
        btn.disabled = true;
        btn.innerHTML = '<span class="ef-spinner"></span> Enviando...';
        if (feedback) { feedback.textContent = ''; feedback.className = 'ef-feedback'; }

        fetch(API + '/api/events/' + slug + '/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        .then(function (res) { return res.json().then(function (r) { return { ok: res.ok, status: res.status, result: r }; }); })
        .then(function (resp) {
            if (resp.ok) {
                var popup = $('evento-success-popup');
                if (popup) popup.classList.add('is-visible');
                form.reset();
                // Clear all statuses
                fields.forEach(function (f) { clearStatus(f.name); });
            } else {
                var msg = resp.result.error || 'Error al enviar';
                if (resp.status === 429) msg = 'Demasiados intentos. Espera un momento.';
                if (feedback) { feedback.textContent = msg; feedback.className = 'ef-feedback error'; }
            }
            btn.disabled = false;
            btn.textContent = 'Inscribirme';
        })
        .catch(function () {
            if (feedback) { feedback.textContent = 'No se pudo conectar con el servidor'; feedback.className = 'ef-feedback error'; }
            btn.disabled = false;
            btn.textContent = 'Inscribirme';
        });
    });

    // Popup close
    document.addEventListener('click', function (e) {
        var popup = $('evento-success-popup');
        if (!popup) return;
        if (e.target.id === 'evento-popup-close' || e.target === popup) {
            popup.classList.remove('is-visible');
        }
    });
})();
