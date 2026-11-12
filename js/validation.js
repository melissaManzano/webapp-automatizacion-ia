import { CONFIG } from './config.js';

/** Quita espacios al inicio/fin y colapsa espacios repetidos dentro de cada línea. */
export function normalizarTexto(valor) {
  return String(valor ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((linea) => linea.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Valida y normaliza los cuatro campos del contrato.
 * @returns {{ valido: boolean, errores: Record<string,string>, datos: {tema,nivel,pregunta,integracion} }}
 */
export function validarConsulta(entrada) {
  const datos = {
    tema: normalizarTexto(entrada.tema),
    nivel: normalizarTexto(entrada.nivel),
    pregunta: normalizarTexto(entrada.pregunta),
    integracion: normalizarTexto(entrada.integracion).toLowerCase(),
  };
  const errores = {};

  if (!datos.tema) {
    errores.tema = 'Selecciona un tema.';
  } else if (!CONFIG.TEMAS.includes(datos.tema)) {
    errores.tema = 'El tema seleccionado no es válido.';
  }

  if (!datos.nivel) {
    errores.nivel = 'Selecciona un nivel.';
  } else if (!CONFIG.NIVELES.includes(datos.nivel)) {
    errores.nivel = 'El nivel debe ser Básico, Intermedio o Avanzado.';
  }

  const letras = (datos.pregunta.match(/[\p{L}\p{N}]/gu) || []).length;
  if (!datos.pregunta) {
    errores.pregunta = 'Escribe tu pregunta.';
  } else if (datos.pregunta.length < CONFIG.PREGUNTA_MIN || letras < 3) {
    errores.pregunta = `La pregunta debe tener al menos ${CONFIG.PREGUNTA_MIN} caracteres con contenido real.`;
  } else if (datos.pregunta.length > CONFIG.PREGUNTA_MAX) {
    errores.pregunta = `La pregunta no debe superar ${CONFIG.PREGUNTA_MAX} caracteres.`;
  }

  if (!datos.integracion) {
    errores.integracion = 'Elige una integración.';
  } else if (!Object.hasOwn(CONFIG.INTEGRACIONES, datos.integracion)) {
    errores.integracion = 'La integración debe ser nativo o http.';
  }

  return { valido: Object.keys(errores).length === 0, errores, datos };
}
