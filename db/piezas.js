import fs from "node:fs";
import path from "node:path";

// El texto canónico sale de los .txt. El comentario que viene después
// de la firma no entra en la base.
const PIEZAS = [
  {
    archivo: "poesias/01-chalequito-de-lana.txt",
    titulo: "Chalequito de lana",
    slug: "chalequito-de-lana",
    fecha: "2020-08-22",
    lamina: "/laminas/chalequito-de-lana.png",
  },
  {
    archivo: "poesias/02-la-oficina-de-los-colores-la-felicidad.txt",
    titulo: "La Oficina de los Colores y la Felicidad",
    slug: "la-oficina-de-los-colores-y-la-felicidad",
    fecha: "2024-10-20",
    lamina: "/laminas/la-oficina-de-los-colores-y-la-felicidad.png",
  },
  {
    archivo: "poesias/03-hoy-te-vi.txt",
    titulo: "Hoy te vi",
    slug: "hoy-te-vi",
    fecha: "2025-11-28",
    lamina: "/laminas/hoy-te-vi.png",
  },
  {
    archivo: "poesias/04-volver-a-creer.txt",
    titulo: "Volver a creer",
    slug: "volver-a-creer",
    fecha: "2026-01-13",
    lamina: "/laminas/volver-a-creer.png",
  },
];

function textoAntesDeLaFirma(texto) {
  const marca = texto.search(/\r?\nAutor:/);
  const previo = marca === -1 ? texto : texto.slice(0, marca);
  return previo.replace(/^\uFEFF/, "").trim();
}

function separarNotaYCuerpo(previo, titulo) {
  const lineas = previo.split(/\r?\n/);
  const indice = lineas.findIndex((linea) => linea.trim() === titulo);

  if (indice === -1) {
    throw new Error(`No encontré el título «${titulo}» en el archivo de texto.`);
  }

  const nota = lineas.slice(0, indice).join("\n").trim();
  const cuerpo = lineas.slice(indice + 1).join("\n").trim();

  if (!cuerpo) {
    throw new Error(`«${titulo}» quedó sin cuerpo. Revisa el archivo de texto.`);
  }

  return {
    notaOrigen: nota || null,
    cuerpo,
  };
}

export function leerPiezas(raiz) {
  return PIEZAS.map((pieza) => {
    const ruta = path.join(raiz, pieza.archivo);
    const crudo = fs.readFileSync(ruta, "utf8");
    const { notaOrigen, cuerpo } = separarNotaYCuerpo(
      textoAntesDeLaFirma(crudo),
      pieza.titulo,
    );

    return {
      titulo: pieza.titulo,
      slug: pieza.slug,
      fecha: pieza.fecha,
      laminaRuta: pieza.lamina,
      notaOrigen,
      cuerpo,
    };
  });
}
