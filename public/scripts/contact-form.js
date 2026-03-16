(function () {
    var API = window.location.hostname === 'localhost' ? '' : 'https://server.chitaga.tech';
    var nameExists = false;
    var emailExists = false;
    var nameTimeout, emailTimeout;

    function $(id) { return document.getElementById(id); }

    function setStatus(el, input, text, type) {
        if (!el) return;
        el.textContent = text;
        el.className = 'field-status ' + type;
        if (input) {
            input.classList.toggle('input-error', type === 'taken' || type === 'error');
        }
    }

    function clearStatus(el, input) {
        if (el) { el.textContent = ''; el.className = 'field-status'; }
        if (input) { input.classList.remove('input-error'); }
    }

    // Show popup if redirected after successful registration
    var params = new URLSearchParams(window.location.search);
    if (params.get('registered') === 'true') {
        var popup = $('success-popup');
        if (popup) popup.classList.add('is-visible');
        history.replaceState(null, '', window.location.pathname + window.location.hash);
    }

    // Event delegation on the section - survives React hydration
    var section = document.getElementById('contacto');
    if (!section) return;

    section.addEventListener('input', function (e) {
        var target = e.target;
        if (!target || !target.id) return;

        if (target.id === 'contact-name') {
            clearTimeout(nameTimeout);
            var name = target.value.trim();
            clearStatus($('name-status'), target);
            nameExists = false;
            if (!name) return;
            if (name.length < 3) {
                setStatus($('name-status'), target, 'Mínimo 3 caracteres', 'error');
                return;
            }
            nameTimeout = setTimeout(function () {
                fetch(API + '/api/check-name?name=' + encodeURIComponent(name))
                    .then(function (r) { return r.json(); })
                    .then(function (d) {
                        nameExists = d.exists;
                        setStatus($('name-status'), $('contact-name'),
                            d.exists ? 'Este nombre ya está registrado' : 'Nombre disponible',
                            d.exists ? 'taken' : 'available');
                    })
                    .catch(function () { nameExists = false; });
            }, 500);
        }

        if (target.id === 'contact-email') {
            clearTimeout(emailTimeout);
            var email = target.value.trim();
            clearStatus($('email-status'), target);
            emailExists = false;
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
            emailTimeout = setTimeout(function () {
                fetch(API + '/api/check-email?email=' + encodeURIComponent(email))
                    .then(function (r) { return r.json(); })
                    .then(function (d) {
                        emailExists = d.exists;
                        setStatus($('email-status'), $('contact-email'),
                            d.exists ? 'Este correo ya está registrado' : 'Correo disponible',
                            d.exists ? 'taken' : 'available');
                    })
                    .catch(function () { emailExists = false; });
            }, 500);
        }

        if (target.id === 'contact-message') {
            var msg = target.value.trim();
            var remaining = 20 - msg.length;
            if (!msg) clearStatus($('message-status'), target);
            else if (remaining > 0) setStatus($('message-status'), target, 'Faltan ' + remaining + ' caracteres', 'error');
            else setStatus($('message-status'), target, 'Mensaje válido', 'available');
        }
    });

    // Submit via button click (type="button" avoids native form submit entirely)
    document.addEventListener('click', function (e) {
        if (e.target.id !== 'contact-submit-btn') return;

        var feedback = $('form-feedback');
        var btn = $('contact-submit-btn');

        var nameVal = $('contact-name') ? $('contact-name').value.trim() : '';
        var emailVal = $('contact-email') ? $('contact-email').value.trim() : '';
        var msgVal = $('contact-message') ? $('contact-message').value.trim() : '';

        if (!nameVal || !emailVal) {
            if (feedback) { feedback.textContent = 'Nombre y correo son obligatorios'; feedback.className = 'form-feedback error'; }
            return;
        }
        if (nameExists || emailExists) {
            if (feedback) { feedback.textContent = 'Corrige los campos marcados'; feedback.className = 'form-feedback error'; }
            return;
        }
        if (msgVal.length < 20) {
            if (feedback) { feedback.textContent = 'El mensaje debe tener al menos 20 caracteres'; feedback.className = 'form-feedback error'; }
            return;
        }

        if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Enviando...'; }
        if (feedback) { feedback.textContent = ''; feedback.className = 'form-feedback'; }

        fetch(API + '/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: nameVal, email: emailVal, message: msgVal }),
        })
        .then(function (res) { return res.json().then(function (r) { return { ok: res.ok, result: r }; }); })
        .then(function (resp) {
            if (resp.ok) {
                window.location.href = '/?registered=true#contacto';
            } else if (feedback) {
                feedback.textContent = resp.result.error || 'Error al enviar';
                feedback.className = 'form-feedback error';
                if (btn) { btn.disabled = false; btn.textContent = 'Quiero ser parte'; }
            }
        })
        .catch(function () {
            if (feedback) { feedback.textContent = 'No se pudo conectar con el servidor'; feedback.className = 'form-feedback error'; }
            if (btn) { btn.disabled = false; btn.textContent = 'Quiero ser parte'; }
        });
    });

    // Popup close
    document.addEventListener('click', function (e) {
        var popup = $('success-popup');
        if (!popup) return;
        if (e.target.id === 'popup-close' || e.target === popup) {
            popup.classList.remove('is-visible');
        }
    });
})();
