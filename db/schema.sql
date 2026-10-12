-- Base local del sitio de Byron Nuñez González.
-- El taller (usuarios y sesiones) y el pulso (visitantes, lecturas, reacciones)
-- viven aquí. Quien lee no tiene cuenta.

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL UNIQUE,
  clave_hash text NOT NULL,
  rol text NOT NULL CHECK (rol IN ('admin', 'editor')),
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sesiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expira_en timestamptz NOT NULL,
  creada_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS escritos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  slug text NOT NULL UNIQUE,
  cuerpo text NOT NULL,
  fecha date NOT NULL,
  lamina_ruta text,
  nota_origen text,
  visible boolean NOT NULL DEFAULT false,
  creado_por uuid NOT NULL REFERENCES usuarios (id),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS escritos_fecha_idx ON escritos (fecha DESC);

CREATE TABLE IF NOT EXISTS visitantes (
  id uuid PRIMARY KEY,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Una lectura por visitante, por escrito y por día.
CREATE TABLE IF NOT EXISTS lecturas (
  escrito_id uuid NOT NULL REFERENCES escritos (id) ON DELETE CASCADE,
  visitante_id uuid NOT NULL REFERENCES visitantes (id) ON DELETE CASCADE,
  dia date NOT NULL DEFAULT CURRENT_DATE,
  PRIMARY KEY (escrito_id, visitante_id, dia)
);

-- Un like y una opinión por visitante y por escrito.
CREATE TABLE IF NOT EXISTS reacciones (
  escrito_id uuid NOT NULL REFERENCES escritos (id) ON DELETE CASCADE,
  visitante_id uuid NOT NULL REFERENCES visitantes (id) ON DELETE CASCADE,
  gusto boolean NOT NULL DEFAULT false,
  opinion text CHECK (
    opinion IN ('me_detuvo', 'releer', 'compartiria')
  ),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (escrito_id, visitante_id)
);

-- Lo que ve la web abierta. La nota de origen se queda fuera.
CREATE OR REPLACE VIEW escritos_publicos AS
SELECT id, titulo, slug, cuerpo, fecha, lamina_ruta
FROM escritos
WHERE visible;

-- Lecturas y reacciones se cuentan aparte para que las filas no se multipliquen.
CREATE OR REPLACE VIEW pulso AS
SELECT
  e.id,
  e.titulo,
  e.slug,
  e.fecha,
  coalesce(l.lecturas, 0) AS lecturas,
  coalesce(r.gustos, 0) AS gustos,
  coalesce(r.me_detuvo, 0) AS me_detuvo,
  coalesce(r.releer, 0) AS releer,
  coalesce(r.compartiria, 0) AS compartiria
FROM escritos_publicos e
LEFT JOIN (
  SELECT escrito_id, count(*) AS lecturas
  FROM lecturas
  GROUP BY escrito_id
) l ON l.escrito_id = e.id
LEFT JOIN (
  SELECT
    escrito_id,
    count(*) FILTER (WHERE gusto) AS gustos,
    count(*) FILTER (WHERE opinion = 'me_detuvo') AS me_detuvo,
    count(*) FILTER (WHERE opinion = 'releer') AS releer,
    count(*) FILTER (WHERE opinion = 'compartiria') AS compartiria
  FROM reacciones
  GROUP BY escrito_id
) r ON r.escrito_id = e.id;
