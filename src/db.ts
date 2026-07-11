import Database from 'better-sqlite3';
import path from 'node:path';
import 'dotenv/config';

const DB_PATH = process.env.DB_PATH || './kutandisa.db';

export const db = new Database(path.resolve(DB_PATH));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL CHECK (role IN ('client','operator','admin')),
      status        TEXT NOT NULL DEFAULT 'active',
      joined        TEXT NOT NULL,
      avatar        TEXT
    );

    CREATE TABLE IF NOT EXISTS destinations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      province    TEXT NOT NULL,
      category    TEXT NOT NULL,
      rating      REAL NOT NULL DEFAULT 0,
      reviews     INTEGER NOT NULL DEFAULT 0,
      price       TEXT NOT NULL,
      image       TEXT NOT NULL,
      images      TEXT NOT NULL DEFAULT '[]',
      lat         REAL,
      lng         REAL,
      description TEXT NOT NULL,
      highlights  TEXT NOT NULL DEFAULT '[]',
      bestTime    TEXT NOT NULL,
      duration    TEXT NOT NULL,
      difficulty  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS operators (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id  INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      name     TEXT NOT NULL,
      email    TEXT NOT NULL,
      category TEXT NOT NULL,
      status   TEXT NOT NULL DEFAULT 'active',
      services INTEGER NOT NULL DEFAULT 0,
      rating   REAL NOT NULL DEFAULT 0,
      joined   TEXT NOT NULL,
      revenue  REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE RESTRICT,
      operator_id    INTEGER REFERENCES operators(id) ON DELETE SET NULL,
      date           TEXT NOT NULL,
      status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
      amount         REAL NOT NULL,
      people         INTEGER NOT NULL DEFAULT 1,
      created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      amount     REAL NOT NULL,
      method     TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pending',
      date       TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favourites (
      user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, destination_id)
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      subject    TEXT NOT NULL,
      message    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
