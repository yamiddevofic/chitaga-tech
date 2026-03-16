import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4324;

// Load .env manually (no extra dependency)
const envPath = join(__dirname, '.env');
try {
    const envContent = readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = (match[2] || '').trim();
        }
    }
} catch { /* .env is optional */ }

// Database setup
const db = new Database(join(__dirname, 'chitaga.db'));
db.pragma('journal_mode = WAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )
`);

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

async function sendNotification({ name, email, message }) {
    const mailOptions = {
        from: `"Chitagá Tech" <${process.env.GMAIL_USER}>`,
        replyTo: `"${name}" <${email}>`,
        to: process.env.NOTIFY_EMAIL,
        subject: `Nuevo contacto: ${name} (${email})`,
        html: `
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
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email notification sent for: ${name}`);
    } catch (err) {
        console.error('Error sending email:', err.message);
    }
}

// Express app
const app = express();

app.use(cors({
    origin: ['https://chitaga.tech', 'https://www.chitaga.tech', 'http://localhost:4323'],
    methods: ['GET', 'POST'],
}));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});
app.use(express.json());

// Prepared statements
const insertContact = db.prepare(
    'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)'
);
const findByEmail = db.prepare(
    'SELECT id FROM contacts WHERE email = ?'
);
const findByName = db.prepare(
    'SELECT id FROM contacts WHERE LOWER(name) = LOWER(?)'
);

// GET /api/check-email?email=... (real-time duplicate check)
app.get('/api/check-email', (req, res) => {
    const email = (req.query.email || '').trim().toLowerCase();
    if (!email) return res.json({ exists: false });
    res.json({ exists: !!findByEmail.get(email) });
});

// GET /api/check-name?name=... (real-time duplicate check)
app.get('/api/check-name', (req, res) => {
    const name = (req.query.name || '').trim();
    if (!name) return res.json({ exists: false });
    res.json({ exists: !!findByName.get(name) });
});

// POST /api/contact
app.post('/api/contact', async (req, res) => {
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

// GET /api/contacts (list submissions)
app.get('/api/contacts', (req, res) => {
    try {
        const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();
        res.json(contacts);
    } catch (err) {
        console.error('Error fetching contacts:', err);
        res.status(500).json({ error: 'Error al obtener los mensajes' });
    }
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
