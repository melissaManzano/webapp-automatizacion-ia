# 3.4 Web app para automatización IA

Aplicación web académica y estática (HTML5, CSS3, Bootstrap 5 y JavaScript ES Modules) que envía una consulta a un **Webhook de n8n Cloud**. n8n valida los datos, elige una de dos rutas para consultar OpenAI (**Nodo OpenAI** o **HTTP Request / Responses API**) y devuelve un JSON unificado que la página muestra sin recargar.

- **Sitio publicado:** https://melissamanzano.github.io/webapp-automatizacion-ia/
- **Repositorio:** https://github.com/melissaManzano/webapp-automatizacion-ia
- **Webhook de producción (n8n):** https://melissaml.app.n8n.cloud/webhook/ia-webapp

Desarrollado por **Claudia Melissa Manzano Luna** · Ingeniería en Tecnologías de la Información y Comunicaciones · Inteligencia Artificial aplicada a las TIC · TecNM Campus Pachuca.

---

## Estructura del proyecto

```
webapp-automatizacion-ia/
├── index.html            Interfaz semántica (formulario, estado, errores, respuesta, créditos)
├── css/
│   └── styles.css        Estilos propios sobre Bootstrap 5
├── js/
│   ├── config.js         Configuración pública (URL del Webhook, límites, catálogos)
│   ├── validation.js     Normalización y validación de los 4 campos
│   ├── api-client.js     Cliente HTTP: fetch + async/await, timeout y manejo de errores
│   ├── ui.js             Utilidades de interfaz y renderizado seguro de la respuesta
│   └── main.js           Lógica principal: eventos y flujo de la consulta
├── assets/
│   └── favicon.svg       Favicon propio
├── .gitignore
└── README.md
```

Todas las rutas son **relativas** (`css/…`, `js/…`, `assets/…`), por lo que el sitio funciona igual en `http://127.0.0.1:5500/` y en `https://melissamanzano.github.io/webapp-automatizacion-ia/`.

## Arquitectura

```
Navegador (GitHub Pages)
   │  POST JSON { tema, nivel, pregunta, integracion }
   ▼
Webhook Consulta IA (n8n Cloud, Production URL)
   → Edit Fields (normaliza) → Validar datos → ¿Datos válidos?
        ├─ no → Respond 400 { ok:false, mensaje }
        └─ sí → Elegir integración
                 ├─ nativo → Nodo OpenAI (Message a model)
                 ├─ http   → HTTP Request → https://api.openai.com/v1/responses
                 └─ otro   → Respond 400
   → Preparar respuesta → Respond to Webhook 200 { ok, respuesta, tema, nivel, integracion }
   (falla de OpenAI → Respond 502 { ok:false, mensaje })
```

La API Key de OpenAI vive **solo** en *Credentials* de n8n. La página nunca llama a OpenAI directamente.

## Contrato de comunicación

**Solicitud** (`POST`, `application/json`):

| Campo | Valores |
|---|---|
| `tema` | `Inteligencia artificial`, `Redes`, `Programación`, `Bases de datos e Internet de las cosas (IoT)` |
| `nivel` | `Básico`, `Intermedio`, `Avanzado` |
| `pregunta` | Texto de 5 a 500 caracteres |
| `integracion` | `nativo` o `http` |

**Respuesta exitosa (200):**
```json
{ "ok": true, "respuesta": "1) Concepto: ...", "tema": "Redes", "nivel": "Básico", "integracion": "nativo" }
```

**Respuesta de error (400 / 502):**
```json
{ "ok": false, "mensaje": "El nivel debe ser Básico, Intermedio o Avanzado." }
```

## Uso local (VS Code)

1. Abre la carpeta en VS Code.
2. Instala la extensión **Live Server** y haz clic en **Go Live** (abre `http://127.0.0.1:5500/`).
   Los módulos ES no funcionan abriendo `index.html` con doble clic (`file://`); se necesita un servidor local.
3. El workflow de n8n debe estar **publicado** para que responda la Production URL.
4. En el Webhook de n8n, *Allowed Origins (CORS)* incluye `https://melissamanzano.github.io`, `http://127.0.0.1:5500` y `http://localhost:5500`.

### Configurar la URL del Webhook

Edita únicamente `js/config.js` → `WEBHOOK_URL`. Debe ser la **Production URL** (`/webhook/…`), nunca la Test URL (`/webhook-test/…`). Esta URL es pública: no es un secreto ni una contraseña.

### Qué revisar en el navegador (F12)

- **Network:** al enviar verás una solicitud `OPTIONS` (prevalidación CORS, por el `Content-Type: application/json`) seguida del `POST`. Ambas deben responder correctamente.
- **Console:** no debe aparecer `blocked by CORS policy`.
- Si la prevalidación `OPTIONS` falla, cambia en `js/config.js` `FORMATO_ENVIO` a `'form'`: la página enviará `application/x-www-form-urlencoded` (petición simple, sin prevalidación) y n8n normaliza los mismos campos desde `body`. **Nunca** se usa `mode: 'no-cors'`, porque impediría leer la respuesta.

## Publicación en GitHub Pages

```bash
git init
git add .
git commit -m "Web app para automatización IA"
git branch -M main
git remote add origin https://github.com/melissaManzano/webapp-automatizacion-ia.git
git push -u origin main
```

Después, en GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save**. En uno o dos minutos el sitio queda en `https://melissamanzano.github.io/webapp-automatizacion-ia/`.

## Seguridad y costo

- No hay API Key en HTML, CSS, JavaScript, `localStorage`, GitHub ni GitHub Pages.
- **Cualquier persona puede ver la URL del Webhook** inspeccionando la página.
- **CORS no es autenticación:** solo indica al navegador qué sitios pueden leer la respuesta; no impide solicitudes desde Postman o curl.
- n8n valida tema, nivel, integración y longitud de la pregunta (máx. 500 caracteres) antes de llamar a OpenAI.
- La página no guarda preguntas ni respuestas en el navegador y no hace reintentos automáticos (solo reintento manual).
- Revisar el consumo en n8n (*Executions*) y en el panel de OpenAI, y **despublicar el workflow al concluir la evaluación**.

## Pruebas manuales

| # | Prueba | Resultado esperado |
|---|---|---|
| 1 | Enviar sin llenar nada | Mensajes de error junto a cada campo; no se hace petición |
| 2 | Pregunta de 1–4 caracteres o solo símbolos | Error en Pregunta |
| 3 | Redes · Básico · nativo | Spinner «Consultando el asistente...», luego respuesta con badge «Nodo OpenAI» |
| 4 | Misma pregunta con http | Respuesta con badge «HTTP Request / Responses API» |
| 5 | Pregunta con acentos y ñ («¿Qué es la señal analógica?») | Se envía y muestra correctamente |
| 6 | Doble clic rápido en Enviar | Solo una ejecución en n8n |
| 7 | Desconectar Internet y enviar | Mensaje de red + botón Reintentar; datos conservados |
| 8 | Despublicar el workflow y enviar | Mensaje «El Webhook no está disponible…» (404) |
| 9 | Botón Limpiar | Formulario vacío y panel de respuesta oculto |
| 10 | Abrir en celular | Sin desplazamiento horizontal; controles cómodos al tacto |

**Criterios de aceptación:** el sitio abre por HTTPS desde GitHub Pages, funciona en móvil y computadora, consulta ambas rutas de n8n con respuestas nuevas de OpenAI sin recargar, informa errores con claridad y no revela secretos.
