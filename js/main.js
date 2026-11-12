import { validarConsulta } from './validation.js';
import { consultarAsistente } from './api-client.js';
import {
  elementos,
  leerFormulario,
  actualizarContador,
  limpiarErroresCampos,
  mostrarErroresCampos,
  setCargando,
  mostrarError,
  ocultarError,
  mostrarResultado,
  reiniciarVista,
} from './ui.js';

let solicitudActiva = false;

async function enviarConsulta() {
  if (solicitudActiva) return; // Evita envíos duplicados.

  const { valido, errores, datos } = validarConsulta(leerFormulario());
  if (!valido) {
    mostrarErroresCampos(errores);
    return;
  }
  limpiarErroresCampos();

  solicitudActiva = true;
  setCargando(true);
  try {
    const resultado = await consultarAsistente(datos);
    ocultarError();
    mostrarResultado(resultado, datos.pregunta);
  } catch (error) {
    // Solo se muestran mensajes controlados; nunca el objeto de error completo.
    const mensaje = error?.name === 'ApiError'
      ? error.message
      : 'Ocurrió un problema inesperado. Intenta de nuevo.';
    mostrarError(mensaje);
    if (error?.name !== 'ApiError') console.error(error);
  } finally {
    solicitudActiva = false;
    setCargando(false);
  }
}

elementos.form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  enviarConsulta();
});

// Reintento manual (sin reintentos automáticos para no aumentar costos).
document.getElementById('btn-reintentar').addEventListener('click', enviarConsulta);

document.getElementById('btn-limpiar').addEventListener('click', () => {
  if (!solicitudActiva) reiniciarVista();
});

elementos.form.pregunta.addEventListener('input', actualizarContador);

// Quita el error de un campo en cuanto el usuario lo corrige.
// Se usa 'input' (no 'change') para que el aviso desaparezca mientras se escribe
// y no al perder el foco, lo que desplazaría la página justo durante un clic.
elementos.form.addEventListener('input', (evento) => {
  const campo = evento.target.name;
  const contenedorError = document.getElementById(`${campo}-error`);
  if (!contenedorError) return;
  contenedorError.textContent = '';
  if (campo === 'integracion') {
    contenedorError.closest('fieldset').classList.remove('is-invalid');
    elementos.form.querySelectorAll('input[name="integracion"]').forEach((r) => {
      r.classList.remove('is-invalid');
      r.removeAttribute('aria-invalid');
    });
  } else {
    evento.target.classList.remove('is-invalid');
    evento.target.removeAttribute('aria-invalid');
  }
});

actualizarContador();
