export function buildInvitationEmail({ name, eventTitle, groupLabel, calendarLink }) {
    const safeName = escapeHtml(name);
    const safeTitle = escapeHtml(eventTitle);
    const safeGroup = escapeHtml(groupLabel);
    const safeLink = escapeHtml(calendarLink);

    const html = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; color: #222;">
    <h2 style="color: #184014; border-bottom: 2px solid #B93A05; padding-bottom: 8px;">
        Hola, ${safeName}
    </h2>
    <p>Ya estas inscrito en <strong>${safeTitle}</strong></p>
    <p>Tu horario es: <strong>${safeGroup}</strong></p>
    <p>Agrega la reunion a tu calendario para que no se te olvide:</p>
    <p style="text-align: center; margin: 28px 0;">
        <a href="${safeLink}"
           style="background-color: #B93A05; color: #ffffff; padding: 14px 28px; border-radius: 8px;
                  text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
            Agregar a Google Calendar
        </a>
    </p>
    <p style="font-size: 14px; color: #555;">
        Si tienes alguna pregunta, responde este correo o escribenos por WhatsApp.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
    <p style="font-size: 12px; color: #999;">Chitaga Tech</p>
</div>`;

    const text = `Hola ${name},

Ya estas inscrito en: ${eventTitle}

Tu horario es: ${groupLabel}

Agrega la reunion a tu calendario: ${calendarLink}

Si tienes alguna pregunta, responde este correo o escribenos por WhatsApp.

-- Chitaga Tech`;

    return { html, text };
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
