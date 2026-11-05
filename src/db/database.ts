import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel ? '/tmp' : path.join(process.cwd(), 'data');

if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}

const dbPath = path.join(dataDir, 'crecisano.db');

// In Vercel serverless environment, the filesystem outside /tmp is read-only.
// If /tmp/crecisano.db doesn't exist yet, copy the pre-seeded SQLite DB from project bundle if present.
if (isVercel && !fs.existsSync(dbPath)) {
  const bundledDb = path.join(process.cwd(), 'data', 'crecisano.db');
  if (fs.existsSync(bundledDb)) {
    try {
      fs.copyFileSync(bundledDb, dbPath);
    } catch (err) {
      console.warn('Could not copy pre-seeded database to /tmp:', err);
    }
  }
}

const db = new Database(dbPath);

try {
  db.pragma('journal_mode = WAL');
} catch {
  try {
    db.pragma('journal_mode = DELETE');
  } catch {
    // Ignore pragma error if unsupported
  }
}

try {
  db.pragma('foreign_keys = ON');
} catch {
  // Ignore
}

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'usuaria' CHECK (rol IN ('usuaria', 'admin')),
      foto_perfil TEXT,
      reset_token TEXT,
      reset_expires TEXT,
      fecha_registro TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS recetas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      fotografia TEXT,
      categoria TEXT NOT NULL,
      tipo_acceso TEXT NOT NULL CHECK (tipo_acceso IN ('Gratis', 'Premium')),
      tiempo INTEGER NOT NULL,
      porciones INTEGER NOT NULL,
      dificultad TEXT NOT NULL CHECK (dificultad IN ('Fácil', 'Media', 'Elaborada')),
      consejos TEXT NOT NULL,
      apto_ninos TEXT,
      destacada INTEGER NOT NULL DEFAULT 0,
      popular INTEGER NOT NULL DEFAULT 0,
      estado_publicacion TEXT NOT NULL DEFAULT 'publicada' CHECK (estado_publicacion IN ('publicada', 'borrador')),
      fecha_creacion TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ingredientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      cantidad TEXT NOT NULL,
      unidad TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS preparaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
      numero_paso INTEGER NOT NULL,
      instruccion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receta_id INTEGER NOT NULL UNIQUE REFERENCES recetas(id) ON DELETE CASCADE,
      archivo_multimedia TEXT NOT NULL,
      estado_publicacion TEXT NOT NULL DEFAULT 'publicado' CHECK (estado_publicacion IN ('publicado', 'oculto')),
      fecha_subida TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS planes_suscripcion (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT NOT NULL UNIQUE,
      nombre TEXT NOT NULL,
      precio_soles REAL NOT NULL,
      duracion_dias INTEGER NOT NULL,
      condiciones_renovacion TEXT NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS suscripciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuaria_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      plan TEXT NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('activa', 'cancelada', 'vencida')),
      fecha_inicio TEXT NOT NULL,
      fecha_vencimiento TEXT NOT NULL,
      identificador_transaccion TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuaria_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      proveedor TEXT NOT NULL,
      identificador_transaccion TEXT NOT NULL UNIQUE,
      importe_soles REAL NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('completado', 'pendiente', 'fallido')),
      fecha TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS configuracion_pasarela (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      proveedor_activo TEXT NOT NULL DEFAULT 'ninguno' CHECK (proveedor_activo IN ('ninguno', 'culqi', 'mercadopago')),
      culqi_public_key TEXT DEFAULT '',
      culqi_secret_key TEXT DEFAULT '',
      culqi_webhook_secret TEXT DEFAULT '',
      mp_public_key TEXT DEFAULT '',
      mp_access_token TEXT DEFAULT '',
      mp_webhook_secret TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS favoritos (
      usuaria_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
      PRIMARY KEY (usuaria_id, receta_id)
    );

    CREATE TABLE IF NOT EXISTS recetas_preparadas (
      usuaria_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
      fecha_preparada TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (usuaria_id, receta_id)
    );

    CREATE TABLE IF NOT EXISTS lista_compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuaria_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      ingrediente TEXT NOT NULL,
      cantidad TEXT NOT NULL,
      categoria TEXT NOT NULL DEFAULT 'Otros',
      comprado INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_recetas_categoria ON recetas(categoria);
    CREATE INDEX IF NOT EXISTS idx_recetas_tipo_acceso ON recetas(tipo_acceso);
    CREATE INDEX IF NOT EXISTS idx_ingredientes_receta ON ingredientes(receta_id);
    CREATE INDEX IF NOT EXISTS idx_ingredientes_nombre ON ingredientes(nombre);
    CREATE INDEX IF NOT EXISTS idx_suscripciones_usuaria ON suscripciones(usuaria_id);
  `);
}

export default db;
