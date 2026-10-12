import pg from "pg";

const { Pool } = pg;

// La fecha de PostgreSQL llega como texto (2020-08-22).
// Si se convirtiera a Date de JavaScript, en Chile podría mostrarse el día anterior.
pg.types.setTypeParser(1082, (valor) => valor);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
