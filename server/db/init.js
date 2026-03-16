import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new Database(join(__dirname, '..', 'chitaga.db'));
db.pragma('journal_mode = WAL');

// Contacts table
db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT,
        created_at TEXT DEFAULT (datetime('now'))
    )
`);

// Event registrations table
db.exec(`
    CREATE TABLE IF NOT EXISTS event_registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_slug TEXT NOT NULL,
        email TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        UNIQUE(event_slug, email)
    )
`);

// Contacts
export const insertContact = db.prepare(
    'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)'
);

export const findByEmail = db.prepare(
    'SELECT id FROM contacts WHERE email = ?'
);

export const findByName = db.prepare(
    'SELECT id FROM contacts WHERE LOWER(name) = LOWER(?)'
);

export const getAllContacts = db.prepare(
    'SELECT * FROM contacts ORDER BY created_at DESC'
);

// Event registrations
export const insertRegistration = db.prepare(
    'INSERT INTO event_registrations (event_slug, email, data) VALUES (?, ?, ?)'
);

export const findRegistrationByEmail = db.prepare(
    'SELECT id FROM event_registrations WHERE event_slug = ? AND email = ?'
);

export const countRegistrations = db.prepare(
    'SELECT COUNT(*) as count FROM event_registrations WHERE event_slug = ?'
);

export const getRegistrationsByEvent = db.prepare(
    'SELECT * FROM event_registrations WHERE event_slug = ? ORDER BY created_at DESC'
);

// Suggestions table
db.exec(`
    CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        topic TEXT NOT NULL,
        name TEXT,
        message TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    )
`);

export const insertSuggestion = db.prepare(
    'INSERT INTO suggestions (topic, name, message) VALUES (?, ?, ?)'
);

export const getSuggestionsByTopic = db.prepare(
    'SELECT * FROM suggestions WHERE topic = ? ORDER BY created_at DESC'
);

export const getAllSuggestions = db.prepare(
    'SELECT * FROM suggestions ORDER BY created_at DESC'
);

export default db;
