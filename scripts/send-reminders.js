import process from 'node:process';

const slug = process.argv[2] || process.env.EVENT_SLUG;
const adminKey = process.env.ADM_KEY;
const baseUrl = process.env.REMINDER_API_URL || 'http://localhost:4324';

if (!slug) {
    console.error('Especifica el slug del evento como argumento o en EVENT_SLUG.');
    process.exit(1);
}

if (!adminKey) {
    console.error('Necesitas ADM_KEY en el entorno para autenticar la llamada.');
    process.exit(1);
}

const url = `${baseUrl}/api/events/${encodeURIComponent(slug)}/send-reminders`;

const headers = {
    'Content-Type': 'application/json',
    'x-admin-key': adminKey,
};

async function main() {
    try {
        console.log(`Ejecutando POST ${url}`);
        const res = await fetch(url, { method: 'POST', headers });
        const payload = await res.json().catch(() => null);
        if (!res.ok) {
            console.error('Error desde la API:', res.status, payload);
            process.exit(1);
        }

        console.log('Recordatorios enviados:', payload);
    } catch (err) {
        console.error('No se pudo conectar con la API:', err.message);
        process.exit(1);
    }
}

main();
