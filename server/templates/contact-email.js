export function buildContactEmailHtml({ name, email, message }) {
    return `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #184014; border-bottom: 2px solid #B93A05; padding-bottom: 8px;">
                Nuevo mensaje desde chitaga.tech
            </h2>
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Correo:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Mensaje:</strong></p>
            <blockquote style="border-left: 3px solid #B93A05; padding-left: 12px; color: #555;">
                ${message || '<em>Sin mensaje</em>'}
            </blockquote>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 24px;" />
            <p style="font-size: 12px; color: #999;">Enviado desde el formulario de contacto de Chitagá Tech</p>
        </div>
    `;
}
