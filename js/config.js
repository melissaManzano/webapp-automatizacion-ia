/**
 * Configuración PÚBLICA de la aplicación.
 * La URL del Webhook es visible para cualquiera que inspeccione la página:
 * no es una contraseña. Aquí NUNCA debe colocarse una API Key.
 */
export const CONFIG = Object.freeze({
  // Production URL del Webhook de n8n Cloud (requiere el workflow publicado).
  WEBHOOK_URL: 'https://melissaml.app.n8n.cloud/webhook/ia-webapp',

  // 'json' (application/json) o 'form' (application/x-www-form-urlencoded).
  // Usar 'form' solo si el navegador bloquea la prevalidación OPTIONS (ver README).
  FORMATO_ENVIO: 'json',

  // Tiempo máximo de espera de la respuesta (ms).
  TIMEOUT_MS: 45000,

  PREGUNTA_MIN: 5,
  PREGUNTA_MAX: 500,

  TEMAS: [
    'Inteligencia artificial',
    'Redes',
    'Programación',
    'Bases de datos e Internet de las cosas (IoT)',
  ],

  NIVELES: ['Básico', 'Intermedio', 'Avanzado'],

  INTEGRACIONES: {
    nativo: 'Nodo OpenAI',
    http: 'HTTP Request / Responses API',
  },
});
