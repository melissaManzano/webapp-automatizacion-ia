import { CONFIG } from './config.js';

const $ = (id) => document.getElementById(id);

const el = {
  form: $('form-consulta'),
  btnEnviar: $('btn-enviar'),
  btnSpinner: $('btn-spinner'),
  btnTexto: $('btn-texto'),
  contador: $('contador'),
  anuncios: $('anuncios'),
  cargando: $('estado-cargando'),
  error: $('estado-error'),
  errorMensaje: $('error-mensaje'),
  vacio: $('estado-vacio'),
  tarjeta: $('tarjeta-respuesta'),
  badgeTema: $('badge-tema'),
  badgeNivel: $('badge-nivel'),
  badgeIntegracion: $('badge-integracion'),
  pregunta: $('respuesta-pregunta'),
  texto: $('respuesta-texto'),
  meta: $('respuesta-meta'),
};

const mostrar = (nodo, visible) => nodo.classList.toggle('d-none', !visible);

export function anunciar(mensaje) {
  el.anuncios.textContent = '';
  // Pequeña pausa para que los lectores de pantalla detecten el cambio.
  setTimeout(() => { el.anuncios.textContent = mensaje; }, 50);
}

export function leerFormulario() {
  const fd = new FormData(el.form);
  return {
    tema: fd.get('tema') ?? '',
    nivel: fd.get('nivel') ?? '',
    pregunta: fd.get('pregunta') ?? '',
    integracion: fd.get('integracion') ?? '',
  };
}

export function actualizarContador() {
  const largo = el.form.pregunta.value.length;
  el.contador.textContent = `${largo}/${CONFIG.PREGUNTA_MAX}`;
}

export function limpiarErroresCampos() {
  ['tema', 'nivel', 'pregunta', 'integracion'].forEach((campo) => {
    $(`${campo}-error`).textContent = '';
  });
  el.form.querySelectorAll('.is-invalid').forEach((n) => n.classList.remove('is-invalid'));
  el.form.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid'));
}

export function mostrarErroresCampos(errores) {
  limpiarErroresCampos();
  let primero = null;
  for (const [campo, mensaje] of Object.entries(errores)) {
    $(`${campo}-error`).textContent = mensaje;
    if (campo === 'integracion') {
      const fieldset = $('integracion-error').closest('fieldset');
      fieldset.classList.add('is-invalid');
      el.form.querySelectorAll('input[name="integracion"]').forEach((r) => {
        r.classList.add('is-invalid');
        r.setAttribute('aria-invalid', 'true');
      });
      primero ??= el.form.querySelector('input[name="integracion"]');
    } else {
      const control = $(campo);
      control.classList.add('is-invalid');
      control.setAttribute('aria-invalid', 'true');
      primero ??= control;
    }
  }
  primero?.focus();
  anunciar('Revisa los campos marcados en el formulario.');
}

export function setCargando(activo) {
  el.btnEnviar.disabled = activo;
  el.btnEnviar.setAttribute('aria-busy', String(activo));
  mostrar(el.btnSpinner, activo);
  el.btnTexto.textContent = activo ? 'Consultando…' : 'Enviar consulta';
  mostrar(el.cargando, activo);
  if (activo) {
    mostrar(el.error, false);
    anunciar('Consultando el asistente...');
  }
}

export function mostrarError(mensaje) {
  el.errorMensaje.textContent = mensaje;
  mostrar(el.error, true);
  anunciar(`Error: ${mensaje}`);
}

export function ocultarError() {
  mostrar(el.error, false);
}

/**
 * Inserta el texto de la IA de forma segura (solo nodos de texto).
 * Convierte **negritas** y `código` de Markdown en <strong>/<code>
 * creados con textContent; nunca se usa innerHTML.
 */
function renderizarTextoSeguro(contenedor, texto) {
  contenedor.replaceChildren();
  const patron = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  for (const parte of String(texto).split(patron)) {
    if (!parte) continue;
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      const strong = document.createElement('strong');
      strong.textContent = parte.slice(2, -2);
      contenedor.append(strong);
    } else if (parte.startsWith('`') && parte.endsWith('`') && parte.length > 2) {
      const code = document.createElement('code');
      code.textContent = parte.slice(1, -1);
      contenedor.append(code);
    } else {
      contenedor.append(document.createTextNode(parte.replace(/^#{1,6}\s+/gm, '')));
    }
  }
}

export function mostrarResultado(datos, preguntaEnviada) {
  el.badgeTema.textContent = `Tema: ${datos.tema ?? '—'}`;
  el.badgeNivel.textContent = `Nivel: ${datos.nivel ?? '—'}`;
  const nombreIntegracion = CONFIG.INTEGRACIONES[datos.integracion] ?? datos.integracion ?? '—';
  el.badgeIntegracion.textContent = `Integración: ${nombreIntegracion}`;
  el.pregunta.textContent = preguntaEnviada;
  renderizarTextoSeguro(el.texto, datos.respuesta);

  const hora = datos.timestamp ? new Date(datos.timestamp) : new Date();
  el.meta.textContent = `Ruta utilizada en n8n: ${datos.integracion} · ${hora.toLocaleString('es-MX')}`;

  mostrar(el.vacio, false);
  mostrar(el.tarjeta, true);
  el.tarjeta.focus({ preventScroll: true });
  el.tarjeta.scrollIntoView({ behavior: 'smooth', block: 'start' });
  anunciar(`Respuesta recibida mediante ${nombreIntegracion}.`);
}

export function reiniciarVista() {
  el.form.reset();
  limpiarErroresCampos();
  actualizarContador();
  ocultarError();
  mostrar(el.tarjeta, false);
  mostrar(el.vacio, true);
  el.texto.replaceChildren();
  el.form.tema.focus();
  anunciar('Formulario limpio.');
}

export { el as elementos };
