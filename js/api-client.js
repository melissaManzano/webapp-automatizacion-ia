import { CONFIG } from './config.js';

/** Error controlado que la interfaz puede mostrar sin exponer detalles internos. */
export class ApiError extends Error {
  constructor(tipo, mensaje, estado = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.tipo = tipo;       // 'timeout' | 'red' | 'http' | 'formato' | 'servicio'
    this.estado = estado;   // código HTTP, si existe
  }
}

const MENSAJES_HTTP = {
  400: 'Los datos enviados no son válidos. Revisa el formulario e inténtalo de nuevo.',
  401: 'El Webhook rechazó la autorización. Esto debe corregirse en n8n, no en la página.',
  403: 'El Webhook no permite esta solicitud (origen o permisos). Debe revisarse la configuración en n8n.',
  404: 'El Webhook no está disponible. Verifica que el workflow esté publicado en n8n.',
  429: 'Se alcanzó el límite de consultas. Espera un momento antes de reintentar.',
  500: 'Ocurrió un error interno en el servicio. Intenta de nuevo más tarde.',
  502: 'El servicio de IA no respondió correctamente. Intenta de nuevo más tarde.',
  503: 'El servicio está temporalmente no disponible. Intenta de nuevo más tarde.',
  504: 'El servicio tardó demasiado en responder. Intenta de nuevo más tarde.',
};

function construirPeticion(datos) {
  if (CONFIG.FORMATO_ENVIO === 'form') {
    // Petición "simple": no dispara la prevalidación OPTIONS.
    return {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams(datos).toString(),
    };
  }
  return {
    headers: { 'Content-Type': 'application/json; charset=UTF-8', Accept: 'application/json' },
    body: JSON.stringify(datos),
  };
}

/**
 * Envía la consulta al Webhook de n8n y devuelve el JSON unificado:
 * { ok, respuesta, tema, nivel, integracion }.
 * Lanza ApiError ante cualquier falla.
 */
export async function consultarAsistente(datos) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), CONFIG.TIMEOUT_MS);
  const { headers, body } = construirPeticion(datos);

  let respuestaHttp;
  try {
    respuestaHttp = await fetch(CONFIG.WEBHOOK_URL, {
      method: 'POST',
      headers,
      body,
      signal: controlador.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('timeout', `El asistente no respondió en ${CONFIG.TIMEOUT_MS / 1000} segundos. Intenta de nuevo.`);
    }
    // fetch no distingue entre red caída y bloqueo CORS: ambos llegan como TypeError.
    const sinConexion = typeof navigator !== 'undefined' && navigator.onLine === false;
    throw new ApiError(
      'red',
      sinConexion
        ? 'No hay conexión a Internet. Revisa tu red e inténtalo de nuevo.'
        : 'No se pudo contactar al Webhook. Puede ser un problema de red o de CORS (origen no permitido); este último se corrige en la configuración del Webhook de n8n.'
    );
  } finally {
    clearTimeout(temporizador);
  }

  // Primero el estado HTTP, después el JSON.
  let json = null;
  const texto = await respuestaHttp.text();
  if (texto) {
    try {
      json = JSON.parse(texto);
    } catch {
      json = null;
    }
  }

  if (!respuestaHttp.ok) {
    const mensajeServidor = json && json.ok === false && typeof json.mensaje === 'string' ? json.mensaje : null;
    const mensaje = mensajeServidor || MENSAJES_HTTP[respuestaHttp.status] ||
      `El servicio respondió con un error (${respuestaHttp.status}). Intenta de nuevo más tarde.`;
    throw new ApiError('http', mensaje, respuestaHttp.status);
  }

  if (!json || typeof json !== 'object') {
    throw new ApiError('formato', 'El Webhook respondió, pero no en formato JSON. Revisa el nodo Respond to Webhook en n8n.');
  }

  if (json.ok !== true) {
    throw new ApiError('servicio', typeof json.mensaje === 'string' ? json.mensaje : 'El asistente no pudo generar una respuesta.');
  }

  if (typeof json.respuesta !== 'string' || !json.respuesta.trim()) {
    throw new ApiError('formato', 'La respuesta llegó sin texto. Revisa el contrato JSON del Webhook.');
  }

  return json;
}
