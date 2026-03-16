export function buildRegistrationEmailHtml({ eventTitle, fields, data }) {
    const rows = fields
        .filter(f => data[f.name])
        .map(f => `<p><strong>${f.label}:</strong> ${escapeHtml(String(data[f.name]))}</p>`)
        .join('\n                ');

    return `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #184014; border-bottom: 2px solid #B93A05; padding-bottom: 8px;">
                Nueva inscripción: ${escapeHtml(eventTitle)}
            </h2>
            ${rows}
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
            <p style="font-size: 12px; color: #999;">Inscripción desde el formulario de eventos de Chitagá Tech</p>
        </div>
    `;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
