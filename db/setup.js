import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";
import bcrypt from "bcryptjs";
import { leerPiezas } from "./piezas.js";

const raiz = path.resolve(import.meta.dirname, "..");
const rutaEnv = path.join(raiz, ".env");

const host = process.env.PGHOST || "localhost";
const port = Number(process.env.PGPORT || 5432);
const adminUser = process.env.PGUSER || "postgres";
const adminPassword = process.env.PGPASSWORD || "";
const database = process.env.PGDATABASE || "poesia";
const tallerEmail = process.env.TALLER_EMAIL || "taller@local.test";

function exigirClaveDePostgres() {
  if (adminPassword.trim()) {
    return;
  }

  console.error(
    [
      "Falta la contraseña local de PostgreSQL.",
      "Ábrela en el archivo .env, en la línea PGPASSWORD.",
      "Es la clave del usuario postgres que elegiste al instalar PostgreSQL 18.",
      "Después vuelve a ejecutar: npm run db:setup",
    ].join("\n"),
  );
  process.exit(1);
}

function escribirEnv(clave, valor) {
  const linea = `${clave}=${valor}`;
  const actual = fs.existsSync(rutaEnv) ? fs.readFileSync(rutaEnv, "utf8") : "";
  const expresion = new RegExp(`^${clave}=.*$`, "m");

  const siguiente = expresion.test(actual)
    ? actual.replace(expresion, linea)
    : `${actual.trimEnd()}\n${linea}\n`;

  fs.writeFileSync(rutaEnv, siguiente);
  process.env[clave] = valor;
}

function claveAplicacion() {
  if (process.env.POESIA_APP_PASSWORD) {
    return process.env.POESIA_APP_PASSWORD;
  }

  const nueva = crypto.randomBytes(18).toString("base64url");
  escribirEnv("POESIA_APP_PASSWORD", nueva);
  return nueva;
}

function cliente(databaseName, user, password) {
  return new pg.Client({
    host,
    port,
    user,
    password,
    database: databaseName,
  });
}

async function asegurarRolYBase(appPassword) {
  const admin = cliente("postgres", adminUser, adminPassword);
  await admin.connect();

  const rol = await admin.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [
    "poesia_app",
  ]);

  if (rol.rowCount === 0) {
    await admin.query(
      `CREATE ROLE poesia_app LOGIN PASSWORD '${appPassword.replaceAll("'", "''")}'`,
    );
    console.log("Rol creado: poesia_app");
  } else {
    console.log("El rol poesia_app ya existía.");
  }

  const base = await admin.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [database],
  );

  if (base.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${database} OWNER poesia_app`);
    console.log(`Base creada: ${database}`);
  } else {
    console.log(`La base ${database} ya existía.`);
  }

  await admin.end();

  const duena = cliente(database, adminUser, adminPassword);
  await duena.connect();
  await duena.query("ALTER SCHEMA public OWNER TO poesia_app");
  await duena.end();
}

async function aplicarEsquema(appPassword) {
  const app = cliente(database, "poesia_app", appPassword);
  await app.connect();
  const sql = fs.readFileSync(path.join(raiz, "db", "schema.sql"), "utf8");
  await app.query(sql);
  await app.end();
  console.log("Tablas y vistas listas.");
}

async function asegurarTaller(appPassword) {
  const app = cliente(database, "poesia_app", appPassword);
  await app.connect();

  const existente = await app.query(
    "SELECT id FROM usuarios WHERE email = $1",
    [tallerEmail],
  );

  if (existente.rowCount > 0) {
    console.log(`El usuario del taller ya existía: ${tallerEmail}`);
    await app.end();
    return existente.rows[0].id;
  }

  const clavePlano = process.env.TALLER_PASSWORD || crypto.randomBytes(12).toString("base64url");
  const claveHash = await bcrypt.hash(clavePlano, 10);

  const insertado = await app.query(
    `INSERT INTO usuarios (nombre, email, clave_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     RETURNING id`,
    ["Taller", tallerEmail, claveHash],
  );

  escribirEnv("TALLER_EMAIL", tallerEmail);
  escribirEnv("TALLER_PASSWORD", clavePlano);
  console.log("Usuario del taller creado.");
  await app.end();
  return insertado.rows[0].id;
}

async function cargarEscritos(appPassword, creadoPor) {
  const piezas = leerPiezas(raiz);
  const app = cliente(database, "poesia_app", appPassword);
  await app.connect();

  for (const pieza of piezas) {
    const resultado = await app.query(
      `INSERT INTO escritos
        (titulo, slug, cuerpo, fecha, lamina_ruta, nota_origen, visible, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)
       ON CONFLICT (slug) DO NOTHING`,
      [
        pieza.titulo,
        pieza.slug,
        pieza.cuerpo,
        pieza.fecha,
        pieza.laminaRuta,
        pieza.notaOrigen,
        creadoPor,
      ],
    );

    const verbo = resultado.rowCount === 1 ? "cargado" : "ya estaba";
    console.log(`- ${pieza.titulo}: ${verbo}`);
  }

  const resumen = await app.query(
    `SELECT titulo, to_char(fecha, 'DD-MM-YYYY') AS fecha_texto,
            (nota_origen IS NOT NULL) AS tiene_nota
     FROM escritos
     ORDER BY fecha`,
  );

  await app.end();
  return resumen.rows;
}

async function main() {
  exigirClaveDePostgres();
  const appPassword = claveAplicacion();
  escribirEnv(
    "DATABASE_URL",
    `postgres://poesia_app:${appPassword}@${host}:${port}/${database}`,
  );

  await asegurarRolYBase(appPassword);
  await aplicarEsquema(appPassword);
  const creadoPor = await asegurarTaller(appPassword);
  const filas = await cargarEscritos(appPassword, creadoPor);

  console.log("\nEscritos en la base:");
  for (const fila of filas) {
    const nota = fila.tiene_nota ? "con nota de origen en el taller" : "sin nota privada";
    console.log(`- ${fila.fecha_texto}  ${fila.titulo}  (${nota})`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
