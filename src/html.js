export function escapar(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function documento({ titulo, descripcion, seccion, cuerpo }) {
  const tituloCompleto = titulo
    ? `${titulo} — Byron Nuñez González`
    : "Byron Nuñez González";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapar(tituloCompleto)}</title>
  <meta name="description" content="${escapar(descripcion)}">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <a class="skip-link" href="#contenido">Saltar al contenido</a>
  <header class="site-header">
    <div class="site-header-inner">
      <a class="site-title" href="/">
        <img class="site-mark" src="/marca.png" alt="" width="92" height="60">
        <span>Byron Nuñez González</span>
      </a>
      <nav class="site-nav" aria-label="Secciones">
        <a href="/escritos" ${seccion === "escritos" ? 'aria-current="page"' : ""}>Escritos</a>
        <a href="/byron" ${seccion === "byron" ? 'aria-current="page"' : ""}>Byron</a>
        <a href="/pulso" ${seccion === "pulso" ? 'aria-current="page"' : ""}>Pulso</a>
      </nav>
    </div>
  </header>
  <main id="contenido" class="site-main">
    ${cuerpo}
  </main>
  <footer class="site-footer">
    <p>Byron Nuñez González. Escribe lo que siente.</p>
  </footer>
</body>
</html>`;
}
