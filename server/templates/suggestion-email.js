export function buildSuggestionEmailHtml({ topic, name, message }) {
    return `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #184014; border-bottom: 2px solid #B93A05; padding-bottom: 8px;">
                Nueva sugerencia — ${escapeHtml(topic)}
            </h2>
            ${name ? `<p><strong>De:</strong> ${escapeHtml(name)}</p>` : '<p><em>Anónimo</em></p>'}
            <p><strong>Sugerencia:</strong></p>
            <blockquote style="border-left: 3px solid #B93A05; padding-left: 12px; color: #555;">
                ${escapeHtml(message)}
            </blockquote>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
            <p style="font-size: 12px; color: #999;">Enviado desde el buzón de sugerencias de Chitagá Tech</p>
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
