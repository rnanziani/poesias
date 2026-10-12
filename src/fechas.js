const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function fechaLarga(iso) {
  const [anio, mes, dia] = iso.slice(0, 10).split("-").map(Number);
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

export function extracto(cuerpo) {
  const linea = cuerpo
    .split("\n")
    .map((parte) => parte.trim())
    .find(Boolean) ?? "";

  if (linea.length <= 180) {
    return linea;
  }

  const recorte = linea.slice(0, 177).replace(/\s+\S*$/, "");
  return `${recorte}…`;
}
