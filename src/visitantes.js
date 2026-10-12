import { pool } from "./db.js";

const COOKIE = "visitante";
const UN_ANO = 60 * 60 * 24 * 365;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function leerCookie(req, nombre) {
  const encabezado = req.headers.cookie ?? "";
  for (const parte of encabezado.split(";")) {
    const [clave, ...resto] = parte.trim().split("=");
    if (clave === nombre) {
      return decodeURIComponent(resto.join("="));
    }
  }
  return "";
}

function escribirCookie(res, id) {
  const partes = [
    `${COOKIE}=${id}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${UN_ANO}`,
  ];
  if (process.env.NODE_ENV === "production") {
    partes.push("Secure");
  }
  res.append("Set-Cookie", partes.join("; "));
}

// Solo vale una cookie que este sitio haya guardado en visitantes.
// Un identificador inventado no cuenta como otro voto.
export async function asegurarVisitante(req, res) {
  const actual = leerCookie(req, COOKIE);
  if (UUID.test(actual)) {
    const { rows } = await pool.query(
      "SELECT id FROM visitantes WHERE id = $1",
      [actual],
    );
    if (rows[0]) {
      return rows[0].id;
    }
  }

  const { rows } = await pool.query(
    "INSERT INTO visitantes (id) VALUES (gen_random_uuid()) RETURNING id",
  );
  const id = rows[0].id;
  escribirCookie(res, id);
  return id;
}
