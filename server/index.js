import './config/env.js';
import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import { transporter } from './config/email.js';
import {
    insertContact, findByEmail, findByName, getAllContacts,
    insertRegistration, findRegistrationByEmail, countRegistrations, getRegistrationsByEvent,
    insertSuggestion, getSuggestionsByTopic, getAllSuggestions,
} from './db/init.js';
import { buildContactEmailHtml } from './templates/contact-email.js';
import { buildRegistrationEmailHtml } from './templates/registration-email.js';
import { buildSuggestionEmailHtml } from './templates/suggestion-email.js';

const PORT = process.env.PORT || 4324;

// ---------- Rate limiter (in-memory, per IP) ----------
const rateLimits = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 10;

function rateLimit(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress;
    const now = Date.now();
    const entry = rateLimits.get(ip);

    if (!entry || now - entry.start > RATE_WINDOW_MS) {
        rateLimits.set(ip, { start: now, count: 1 });
        return next();
    }

    entry.count++;
    if (entry.count > RATE_MAX_REQUESTS) {
        return res.status(429).json({ error: 'Demasiados intentos. Espera un momento.' });
    }
    return next();
}

// Clean up stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimits) {
        if (now - entry.start > RATE_WINDOW_MS) rateLimits.delete(ip);
    }
}, 300_000);

// ---------- Email notifications ----------
async function sendNotification({ name, email, message }) {
    const mailOptions = {
        from: `"Chitagá Tech" <${process.env.GMAIL_USER}>`,
        replyTo: `"${name}" <${email}>`,
        to: process.env.NOTIFY_EMAIL,
        subject: `Nuevo contacto: ${name} (${email})`,
        html: buildContactEmailHtml({ name, email, message }),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email notification sent for: ${name}`);
    } catch (err) {
        console.error('Error sending email:', err.message);
    }
}

async function sendRegistrationNotification({ eventTitle, eventSlug, fields, data }) {
    const mailOptions = {
        from: `"Chitagá Tech" <${process.env.GMAIL_USER}>`,
        replyTo: data.email ? `"${data.name || 'Participante'}" <${data.email}>` : undefined,
        to: process.env.NOTIFY_EMAIL,
        subject: `Nueva inscripción: ${eventTitle} — ${data.name || data.email}`,
        html: buildRegistrationEmailHtml({ eventTitle, fields, data }),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Registration email sent for: ${eventSlug} — ${data.email}`);
    } catch (err) {
        console.error('Error sending registration email:', err.message);
    }
}

// ---------- Allowed events config (loaded from shared data) ----------
// We duplicate the essential config server-side for validation.
// In a larger app this would come from a DB, but for now we keep it simple.
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let eventsConfig = [];
let isValidTopic = () => false;
try {
    const eventsModule = await import(join(__dirname, '..', 'src', 'data', 'events.js'));
    eventsConfig = eventsModule.events || [];
} catch (err) {
    console.error('Could not load events config:', err.message);
}
try {
    const suggestionsModule = await import(join(__dirname, '..', 'src', 'data', 'suggestions.js'));
    isValidTopic = suggestionsModule.isValidTopic;
} catch (err) {
    console.error('Could not load suggestions config:', err.message);
}

function getEventConfig(slug) {
    return eventsConfig.find(e => e.slug === slug);
}

// ---------- Express app ----------
const app = express();

app.use(cors(corsOptions));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});
app.use(express.json({ limit: '16kb' }));

// ==================== Contact routes ====================

app.get('/api/check-email', (req, res) => {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.json({ exists: false });
    res.json({ exists: !!findByEmail.get(email) });
});

app.get('/api/check-name', (req, res) => {
    const name = (req.query.name || '').trim();
    if (!name) return res.json({ exists: false });
    res.json({ exists: !!findByName.get(name) });
});

app.post('/api/contact', rateLimit, async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Correo electrónico no válido' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = (message || '').trim();

    if (trimmedName.length < 3) {
        return res.status(400).json({ error: 'El nombre debe tener al menos 3 caracteres' });
    }

    if (findByName.get(trimmedName)) {
        return res.status(409).json({ error: 'Este nombre ya está registrado' });
    }

    if (findByEmail.get(trimmedEmail)) {
        return res.status(409).json({ error: 'Este correo ya está registrado' });
    }

    if (trimmedMessage.length < 20) {
        return res.status(400).json({ error: 'El mensaje debe tener al menos 20 caracteres' });
    }

    try {
        const result = insertContact.run(trimmedName, trimmedEmail, trimmedMessage);
        sendNotification({ name: trimmedName, email: trimmedEmail, message: trimmedMessage });
        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        console.error('Error saving contact:', err);
        res.status(500).json({ error: 'Error al guardar el mensaje' });
    }
});

app.get('/api/contacts', (req, res) => {
    try {
        const contacts = getAllContacts.all();
        res.json(contacts);
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ error: 'Error al obtener los mensajes' });
    }
});

// ==================== Event registration routes ====================

// GET /api/events/:slug/spots — how many registrations exist
app.get('/api/events/:slug/spots', (req, res) => {
    const { slug } = req.params;
    const event = getEventConfig(slug);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

    const row = countRegistrations.get(slug);
    res.json({ count: row?.count || 0, capacity: event.capacity });
});

// GET /api/events/:slug/check-email?email=... — duplicate check per event
app.get('/api/events/:slug/check-email', (req, res) => {
    const { slug } = req.params;
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.json({ exists: false });
    res.json({ exists: !!findRegistrationByEmail.get(slug, email) });
});

// POST /api/events/:slug/register — register for an event
app.post('/api/events/:slug/register', rateLimit, (req, res) => {
    const { slug } = req.params;
    const event = getEventConfig(slug);

    if (!event) {
        return res.status(404).json({ error: 'Evento no encontrado' });
    }

    if (event.status !== 'open') {
        return res.status(400).json({ error: 'Las inscripciones están cerradas' });
    }

    // Check capacity
    const spotsRow = countRegistrations.get(slug);
    const currentCount = spotsRow?.count || 0;
    if (currentCount >= event.capacity) {
        return res.status(400).json({ error: 'No hay cupos disponibles' });
    }

    const data = req.body;

    // Validate required fields server-side
    for (const field of event.fields) {
        const val = typeof data[field.name] === 'string' ? data[field.name].trim() : '';

        if (field.required && !val) {
            return res.status(400).json({ error: `El campo "${field.label}" es obligatorio` });
        }

        if (!val) continue;

        // Length validation
        if ((field.type === 'text' || field.type === 'textarea') && field.min && val.length < field.min) {
            return res.status(400).json({ error: `"${field.label}" debe tener al menos ${field.min} caracteres` });
        }

        // Email format
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            return res.status(400).json({ error: 'Correo electrónico no válido' });
        }

        // Number range
        if (field.type === 'number') {
            const num = parseInt(val, 10);
            if (isNaN(num)) return res.status(400).json({ error: `"${field.label}" debe ser un número` });
            if (field.min !== undefined && num < field.min) return res.status(400).json({ error: `"${field.label}" mínimo: ${field.min}` });
            if (field.max !== undefined && num > field.max) return res.status(400).json({ error: `"${field.label}" máximo: ${field.max}` });
        }

        // Select: must be one of the allowed values
        if (field.type === 'select' && field.options) {
            const allowed = field.options.map(o => o.value).filter(Boolean);
            if (field.required && !allowed.includes(val)) {
                return res.status(400).json({ error: `Valor no válido para "${field.label}"` });
            }
        }
    }

    // Sanitize: only keep known field names
    const sanitized = {};
    for (const field of event.fields) {
        const val = typeof data[field.name] === 'string' ? data[field.name].trim() : '';
        if (val) sanitized[field.name] = val;
    }

    const email = (sanitized.email || '').toLowerCase();

    // Check duplicate
    if (email && findRegistrationByEmail.get(slug, email)) {
        return res.status(409).json({ error: 'Ya estás inscrito con este correo' });
    }

    // Re-check capacity atomically
    const recheck = countRegistrations.get(slug);
    if ((recheck?.count || 0) >= event.capacity) {
        return res.status(400).json({ error: 'No hay cupos disponibles' });
    }

    try {
        const result = insertRegistration.run(slug, email, JSON.stringify(sanitized));

        sendRegistrationNotification({
            eventTitle: event.title,
            eventSlug: slug,
            fields: event.fields,
            data: sanitized,
        });

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        if (err.message?.includes('UNIQUE constraint')) {
            return res.status(409).json({ error: 'Ya estás inscrito con este correo' });
        }
        console.error('Error saving registration:', err);
        res.status(500).json({ error: 'Error al guardar la inscripción' });
    }
});

// GET /api/events/:slug/registrations — list registrations (admin)
app.get('/api/events/:slug/registrations', (req, res) => {
    const { slug } = req.params;
    const event = getEventConfig(slug);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

    try {
        const rows = getRegistrationsByEvent.all(slug);
        const registrations = rows.map(r => ({
            ...r,
            data: JSON.parse(r.data),
        }));
        res.json(registrations);
    } catch (err) {
        console.error('Error fetching registrations:', err);
        res.status(500).json({ error: 'Error al obtener las inscripciones' });
    }
});

// ==================== Suggestion routes ====================

app.post('/api/suggestions', rateLimit, async (req, res) => {
    const { topic, name, message } = req.body;

    if (!topic || !message) {
        return res.status(400).json({ error: 'Tema y mensaje son obligatorios' });
    }

    const trimmedTopic = topic.trim();
    const trimmedName = (name || '').trim() || null;
    const trimmedMessage = message.trim();

    if (!isValidTopic(trimmedTopic)) {
        return res.status(400).json({ error: 'Tema no válido' });
    }

    if (trimmedName && trimmedName.length < 2) {
        return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    if (trimmedMessage.length < 20) {
        return res.status(400).json({ error: 'La sugerencia debe tener al menos 20 caracteres' });
    }

    if (trimmedMessage.length > 2000) {
        return res.status(400).json({ error: 'La sugerencia es demasiado larga (máx. 2000 caracteres)' });
    }

    try {
        const result = insertSuggestion.run(trimmedTopic, trimmedName, trimmedMessage);

        const mailOptions = {
            from: `"Chitagá Tech" <${process.env.GMAIL_USER}>`,
            to: process.env.NOTIFY_EMAIL,
            subject: `Nueva sugerencia — ${trimmedTopic}`,
            html: buildSuggestionEmailHtml({ topic: trimmedTopic, name: trimmedName, message: trimmedMessage }),
        };

        transporter.sendMail(mailOptions).catch(err => {
            console.error('Error sending suggestion email:', err.message);
        });

        res.json({ success: true, id: result.lastInsertRowid });
    } catch (err) {
        console.error('Error saving suggestion:', err);
        res.status(500).json({ error: 'Error al guardar la sugerencia' });
    }
});

app.get('/api/suggestions', (req, res) => {
    try {
        const { topic } = req.query;
        const rows = topic ? getSuggestionsByTopic.all(topic) : getAllSuggestions.all();
        res.json(rows);
    } catch (err) {
        console.error('Error fetching suggestions:', err);
        res.status(500).json({ error: 'Error al obtener las sugerencias' });
    }
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
