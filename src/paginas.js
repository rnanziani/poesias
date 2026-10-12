import { fechaLarga, extracto } from "./fechas.js";
import { documento, escapar } from "./html.js";

const DESCRIPCION =
  "Versos escritos entre ecuaciones. Byron Nuñez González, ingeniero físico, escribe lo que las fórmulas no alcanzan a decir. Lectura libre.";

function lamina(escrito) {
  if (!escrito.lamina_ruta) {
    return "";
  }

  return `<figure class="lamina">
    <img src="${escapar(escrito.lamina_ruta)}" alt="Lámina de ${escapar(escrito.titulo)}">
  </figure>`;
}

function ficha(escrito) {
  return `<article class="work-card">
    <time datetime="${escapar(escrito.fecha)}">${escapar(fechaLarga(escrito.fecha))}</time>
    <h2><a href="/escritos/${escapar(escrito.slug)}">${escapar(escrito.titulo)}</a></h2>
    <p>${escapar(extracto(escrito.cuerpo))}</p>
  </article>`;
}

export function paginaInicio(escritos) {
  const reciente = escritos[0];
  const destacado = reciente
    ? `<section class="featured" aria-labelledby="reciente">
        <p class="eyebrow" id="reciente">Lo más reciente</p>
        ${ficha(reciente)}
      </section>`
    : `<p>Todavía no hay escritos publicados.</p>`;

  return documento({
    titulo: "",
    descripcion: DESCRIPCION,
    seccion: "inicio",
    cuerpo: `<figure class="home-hero">
        <img src="/portada-titulo.png?v=8" alt="Palabras Inmortales del Alma. Libro abierto, rosas y una pluma de oro." width="645" height="396">
      </figure>
      <h1 class="motto">Escribe lo que siente.</h1>
      <p class="lede">Versos escritos entre ecuaciones. El ingeniero físico, cuando se inspira, encuentra en las palabras lo que las fórmulas no alcanzan a decir y escribe: un poema, una alegoría o una reflexión. La forma la pone el momento. Lectura libre, para quien quiera detenerse un momento.</p>
      ${destacado}`,
  });
}

export function paginaEscritos(escritos) {
  const lista = escritos.length
    ? `<ol class="work-list">${escritos.map((escrito) => `<li>${ficha(escrito)}</li>`).join("")}</ol>`
    : `<p>Todavía no hay escritos publicados.</p>`;

  return documento({
    titulo: "Escritos",
    descripcion: "Archivo de los escritos de Byron Nuñez González, del más reciente al más antiguo.",
    seccion: "escritos",
    cuerpo: `<h1>Escritos</h1>
      <p class="lede">Del más reciente al más antiguo. Cada texto conserva la forma en que llegó.</p>
      ${lista}`,
  });
}

function botonSenal(valor, etiqueta, cuenta, activo) {
  return `<button class="signal" type="submit" name="senal" value="${valor}" aria-pressed="${activo ? "true" : "false"}">${etiqueta} <span class="signal-count">${escapar(cuenta)}</span></button>`;
}

export function paginaLectura(escrito, alrededor, senal) {
  const enlace = (pieza, etiqueta) => {
    if (!pieza) {
      return `<span class="neighbor-empty">${etiqueta}</span>`;
    }

    return `<a class="neighbor" href="/escritos/${escapar(pieza.slug)}">
      <span>${etiqueta}</span>
      <strong>${escapar(pieza.titulo)}</strong>
    </a>`;
  };

  return documento({
    titulo: escrito.titulo,
    descripcion: extracto(escrito.cuerpo),
    seccion: "escritos",
    cuerpo: `<article class="reading">
      <header class="reading-header">
        <p class="eyebrow">Escrito</p>
        <h1>${escapar(escrito.titulo)}</h1>
        <time datetime="${escapar(escrito.fecha)}">${escapar(fechaLarga(escrito.fecha))}</time>
      </header>
      ${lamina(escrito)}
      <div class="poem">${escapar(escrito.cuerpo)}</div>
      <section class="signals" id="senales" aria-labelledby="senales-titulo">
        <h2 id="senales-titulo">Tu señal</h2>
        <p class="signals-note">Un me gusta y una opinión por lector y por escrito. Si cambias de opinión, sigue contando como un solo voto.</p>
        <form class="signal-form" method="post" action="/escritos/${escapar(escrito.slug)}/reaccion">
          ${botonSenal("gusto", "Me gusta", senal.gustos, senal.gusto)}
          <fieldset class="signal-choices">
            <legend>Una opinión</legend>
            ${botonSenal("me_detuvo", "Me detuvo", senal.me_detuvo, senal.opinion === "me_detuvo")}
            ${botonSenal("releer", "Quiero releerlo", senal.releer, senal.opinion === "releer")}
            ${botonSenal("compartiria", "Lo compartiría", senal.compartiria, senal.opinion === "compartiria")}
          </fieldset>
        </form>
      </section>
      <nav class="neighbors" aria-label="Escritos cercanos en el tiempo">
        ${enlace(alrededor.masAntiguo, "Más antiguo")}
        ${enlace(alrededor.masReciente, "Más reciente")}
      </nav>
    </article>`,
  });
}

export function paginaByron() {
  return documento({
    titulo: "Byron",
    descripcion: "Byron Nuñez González, ingeniero físico. Escribe cuando se inspira, lo que siente.",
    seccion: "byron",
    cuerpo: `<h1>Byron</h1>
      <div class="prose">
        <p>Byron Nuñez González es ingeniero físico. Escribe cuando se inspira, y escribe lo que siente.</p>
        <p>Un texto puede llegar como poema breve, como alegoría o como reflexión. El sitio no le pide que elija una escuela: guarda la fecha, el texto y, cuando existe, la lámina de esa pieza.</p>
        <p><a href="/escritos">Leer los escritos</a></p>
      </div>`,
  });
}

export function paginaPulso(filas) {
  const cuerpo = filas
    .map(
      (fila) => `<tr>
        <td><a href="/escritos/${escapar(fila.slug)}">${escapar(fila.titulo)}</a></td>
        <td>${escapar(fechaLarga(fila.fecha))}</td>
        <td>${fila.lecturas}</td>
        <td>${fila.gustos}</td>
        <td>${fila.me_detuvo}</td>
        <td>${fila.releer}</td>
        <td>${fila.compartiria}</td>
      </tr>`,
    )
    .join("");

  return documento({
    titulo: "Pulso",
    descripcion: "Lecturas y señales de los escritos de Byron Nuñez González.",
    seccion: "pulso",
    cuerpo: `<h1>Pulso</h1>
      <p class="lede">Cada lector suma una lectura por escrito y por día, un me gusta y una opinión. Cambiar la opinión no suma otro voto.</p>
      <div class="table-wrap">
        <table>
          <caption>Señales por escrito, de lo más reciente a lo más antiguo</caption>
          <thead>
            <tr>
              <th scope="col">Escrito</th>
              <th scope="col">Fecha</th>
              <th scope="col">Lecturas</th>
              <th scope="col">Me gusta</th>
              <th scope="col">Me detuvo</th>
              <th scope="col">Quiero releerlo</th>
              <th scope="col">Lo compartiría</th>
            </tr>
          </thead>
          <tbody>${cuerpo}</tbody>
        </table>
      </div>`,
  });
}

export function paginaNoEncontrada() {
  return documento({
    titulo: "No encontrado",
    descripcion: "Esa página no está en el sitio de Byron Nuñez González.",
    seccion: "",
    cuerpo: `<h1>Esa página no está</h1>
      <p class="lede">El escrito o la dirección no existen.</p>
      <p><a href="/escritos">Volver a los escritos</a></p>`,
  });
}
