import { pool } from "./db.js";

const COLUMNAS = `
  titulo,
  slug,
  cuerpo,
  fecha::text AS fecha,
  lamina_ruta
`;

export async function listarEscritos() {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS}
     FROM escritos_publicos
     ORDER BY fecha DESC, titulo`,
  );
  return rows;
}

export async function buscarEscrito(slug) {
  const { rows } = await pool.query(
    `SELECT id, ${COLUMNAS}
     FROM escritos_publicos
     WHERE slug = $1`,
    [slug],
  );
  return rows[0] ?? null;
}

export async function registrarLectura(escritoId, visitanteId) {
  await pool.query(
    `INSERT INTO lecturas (escrito_id, visitante_id, dia)
     VALUES ($1, $2, CURRENT_DATE)
     ON CONFLICT DO NOTHING`,
    [escritoId, visitanteId],
  );
}

const OPINIONES = new Set(["me_detuvo", "releer", "compartiria"]);

export async function leerSenal(escritoId, visitanteId) {
  const personal = await pool.query(
    `SELECT gusto, opinion
     FROM reacciones
     WHERE escrito_id = $1 AND visitante_id = $2`,
    [escritoId, visitanteId],
  );
  const cuentas = await pool.query(
    `SELECT gustos, me_detuvo, releer, compartiria
     FROM pulso
     WHERE id = $1`,
    [escritoId],
  );
  const mia = personal.rows[0];
  const total = cuentas.rows[0] ?? {
    gustos: 0,
    me_detuvo: 0,
    releer: 0,
    compartiria: 0,
  };

  return {
    gusto: Boolean(mia?.gusto),
    opinion: mia?.opinion ?? "",
    gustos: total.gustos,
    me_detuvo: total.me_detuvo,
    releer: total.releer,
    compartiria: total.compartiria,
  };
}

// Una fila por lector y escrito. Pulsar de nuevo actualiza esa fila.
export async function guardarSenal(escritoId, visitanteId, senal) {
  if (senal === "gusto") {
    await pool.query(
      `INSERT INTO reacciones (escrito_id, visitante_id, gusto)
       VALUES ($1, $2, true)
       ON CONFLICT (escrito_id, visitante_id)
       DO UPDATE SET gusto = NOT reacciones.gusto, actualizado_en = now()`,
      [escritoId, visitanteId],
    );
    return;
  }

  if (!OPINIONES.has(senal)) {
    return;
  }

  await pool.query(
    `INSERT INTO reacciones (escrito_id, visitante_id, opinion)
     VALUES ($1, $2, $3)
     ON CONFLICT (escrito_id, visitante_id)
     DO UPDATE SET
       opinion = CASE
         WHEN reacciones.opinion IS NOT DISTINCT FROM EXCLUDED.opinion THEN NULL
         ELSE EXCLUDED.opinion
       END,
       actualizado_en = now()`,
    [escritoId, visitanteId, senal],
  );
}

export async function vecinos(fecha, slug) {
  const anterior = await pool.query(
    `SELECT titulo, slug
     FROM escritos_publicos
     WHERE fecha < $1::date
        OR (fecha = $1::date AND slug < $2)
     ORDER BY fecha DESC, slug DESC
     LIMIT 1`,
    [fecha, slug],
  );

  const siguiente = await pool.query(
    `SELECT titulo, slug
     FROM escritos_publicos
     WHERE fecha > $1::date
        OR (fecha = $1::date AND slug > $2)
     ORDER BY fecha, slug
     LIMIT 1`,
    [fecha, slug],
  );

  return {
    masAntiguo: anterior.rows[0] ?? null,
    masReciente: siguiente.rows[0] ?? null,
  };
}

export async function leerPulso() {
  const { rows } = await pool.query(
    `SELECT titulo, slug, fecha::text AS fecha,
            lecturas, gustos, me_detuvo, releer, compartiria
     FROM pulso
     ORDER BY fecha DESC`,
  );
  return rows;
}
