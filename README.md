# El Caballerito — Tutor matemático con OpenAI

Este proyecto convierte a El Caballerito en un asistente matemático conversacional. La página no ofrece selectores de otras IA: el usuario conversa directamente con El Caballerito.

## Requisitos

- Node.js 20 o posterior.
- Una clave de API de OpenAI y un proyecto con facturación/uso habilitado, gestionados por una persona adulta responsable.
- Un servicio de alojamiento para publicar el servidor.

La API es un servicio separado de ChatGPT y puede generar cargos según el uso. Consulta la documentación oficial y los precios antes de habilitarla.

## Ejecutar en computadora

1. Descomprime el proyecto.
2. Abre una terminal dentro de la carpeta del proyecto.
3. Instala dependencias:

   ```bash
   npm install
   ```

4. Copia `.env.example` a un archivo llamado `.env` en la carpeta raíz del proyecto.
5. Completa `OPENAI_API_KEY` en `.env`. El servidor ahora carga este archivo automáticamente gracias a `dotenv`. Nunca pegues la clave en `index.html`, en un repositorio público ni en un chat.
6. Opcionalmente, configura `CONTACT_WHATSAPP` con un número institucional/de contacto autorizado en formato internacional, solo dígitos.
7. Inicia:

   ```bash
   npm start
   ```

8. Abre `http://localhost:3000`.

## Variables de entorno

- `OPENAI_API_KEY`: clave privada de API, solo en el servidor.
- `OPENAI_MODEL`: opcional; por defecto `gpt-6.1-sol`.
- `CONTACT_WHATSAPP`: opcional; teléfono oficial para abrir un reporte de WhatsApp.
- `PORT`: opcional; puerto del servidor.

En plataformas de alojamiento, configura estas variables en el panel de secretos/Environment Variables. No subas el archivo `.env`.

## Publicación

No basta con subir solamente `index.html`: la aplicación necesita ejecutar `server.js` para proteger la clave y atender `/api/chat`. Publica el proyecto completo en un servicio que soporte Node.js y configura las variables secretas allí.

## Contacto

La pestaña Contacto prepara un reporte y abre WhatsApp para que la persona lo revise y lo envíe manualmente. No se incluye ningún número personal en el código. Usa un número institucional o autorizado por la persona responsable.

## Seguridad y límites

- La clave de OpenAI se lee desde el entorno del servidor.
- Se limita el tamaño de las solicitudes y la frecuencia de llamadas.
- El historial se mantiene en la sesión del navegador y se envían hasta los últimos 16 mensajes al modelo.
- Las respuestas pueden contener errores; revisa los resultados importantes.
- La API no es gratuita por defecto. Configura límites de gasto y supervisión antes de compartir el enlace.


## Diagnóstico si aparece un error

- Abre `http://localhost:3000/api/health`. Debe mostrar `assistantConfigured: true` y `envLoaded: true`.
- Si aparece `false`, comprueba que `.env` esté en la misma carpeta que `server.js`, que la variable se llame exactamente `OPENAI_API_KEY` y que reiniciaste el servidor después de editarla.
- Si aparece un error de clave/permisos, la persona responsable debe revisar la clave en la plataforma de OpenAI.
- Si aparece un error de límite/cuota, debe revisar el uso y la facturación de la API.
- Si aparece un error de modelo, revisa `OPENAI_MODEL` y que el proyecto de API tenga acceso a ese modelo.
- No compartas la clave ni capturas que la muestren. El navegador no necesita conocerla.
