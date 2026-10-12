import express from "express";
import path from "node:path";
import {
  buscarEscrito,
  guardarSenal,
  leerPulso,
  leerSenal,
  listarEscritos,
  registrarLectura,
  vecinos,
} from "./src/consultas.js";
import { asegurarVisitante } from "./src/visitantes.js";
import {
  paginaByron,
  paginaEscritos,
  paginaInicio,
  paginaLectura,
  paginaNoEncontrada,
  paginaPulso,
} from "./src/paginas.js";

const app = express();
const puerto = Number(process.env.PORT || 3000);
const raiz = path.resolve(import.meta.dirname, ".");

app.use(express.static(path.join(raiz, "public")));
app.use(express.urlencoded({ extended: false }));

function slugValido(slug) {
  return /^[a-z0-9-]+$/.test(slug);
}

app.get("/", async (_req, res, next) => {
  try {
    res.type("html").send(paginaInicio(await listarEscritos()));
  } catch (error) {
    next(error);
  }
});

app.get("/escritos", async (_req, res, next) => {
  try {
    res.type("html").send(paginaEscritos(await listarEscritos()));
  } catch (error) {
    next(error);
  }
});

app.get("/escritos/:slug", async (req, res, next) => {
  try {
    if (!slugValido(req.params.slug)) {
      res.status(404).type("html").send(paginaNoEncontrada());
      return;
    }

    const escrito = await buscarEscrito(req.params.slug);
    if (!escrito) {
      res.status(404).type("html").send(paginaNoEncontrada());
      return;
    }

    const visitanteId = await asegurarVisitante(req, res);
    await registrarLectura(escrito.id, visitanteId);
    const senal = await leerSenal(escrito.id, visitanteId);
    const alrededor = await vecinos(escrito.fecha, escrito.slug);
    res.type("html").send(paginaLectura(escrito, alrededor, senal));
  } catch (error) {
    next(error);
  }
});

app.post("/escritos/:slug/reaccion", async (req, res, next) => {
  try {
    if (!slugValido(req.params.slug)) {
      res.status(404).type("html").send(paginaNoEncontrada());
      return;
    }

    const escrito = await buscarEscrito(req.params.slug);
    if (!escrito) {
      res.status(404).type("html").send(paginaNoEncontrada());
      return;
    }

    const visitanteId = await asegurarVisitante(req, res);
    await guardarSenal(escrito.id, visitanteId, String(req.body?.senal ?? ""));
    res.redirect(303, `/escritos/${escrito.slug}#senales`);
  } catch (error) {
    next(error);
  }
});

app.get("/byron", (_req, res) => {
  res.type("html").send(paginaByron());
});

app.get("/pulso", async (_req, res, next) => {
  try {
    res.type("html").send(paginaPulso(await leerPulso()));
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => {
  res.status(404).type("html").send(paginaNoEncontrada());
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).type("html").send(
    paginaNoEncontrada().replace("Esa página no está", "El sitio no pudo leer la base"),
  );
});

app.listen(puerto, () => {
  console.log(`Sitio en http://localhost:${puerto}`);
});
