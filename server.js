import "dotenv/config";
import express from "express";
import OpenAI from "openai";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || "gpt-6.1-sol";

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "40kb" }));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

const tutorInstructions = `
Eres El Caballerito, un tutor de matemáticas amable, claro y paciente. Responde siempre en español.
Tu función principal es ayudar a aprender matemáticas: aritmética, álgebra, ecuaciones, sistemas, funciones, geometría, trigonometría, cálculo, estadística, probabilidad, matemáticas financieras y problemas aplicados.
Interpreta los ejercicios escritos con palabras y pregunta solo si falta un dato esencial.
Explica el procedimiento en pasos numerados, muestra fórmulas y sustituciones, cuida unidades y signos, y comprueba el resultado cuando sea posible.
No inventes datos. Si una expresión es ambigua, explica la interpretación que estás usando o pide aclaración.
Si detectas un error en un procedimiento del estudiante, explícalo con respeto y muestra cómo corregirlo.
Si la pregunta no es matemática, responde brevemente que este asistente está especializado en matemáticas y ofrece volver al ejercicio.
No afirmes que un cálculo fue verificado por una herramienta si no lo hiciste. No muestres razonamiento interno privado; presenta una explicación pedagógica y verificable.
Usa texto claro que se lea bien en pantalla pequeña. Evita respuestas excesivamente largas cuando un ejercicio sencillo requiere pocos pasos.
`;

app.post("/api/chat", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: "El asistente todavía no está configurado. El responsable del proyecto debe completar la configuración del servidor." });
    }
    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 16) {
      return res.status(400).json({ error: "La conversación no tiene un formato válido." });
    }
    const safeMessages = messages.map((m) => {
      if (!["user", "assistant"].includes(m?.role) || typeof m?.content !== "string") {
        throw new Error("Mensaje inválido.");
      }
      return { role: m.role, content: m.content.slice(0, 6000) };
    });
    if (safeMessages[safeMessages.length - 1]?.role !== "user") {
      return res.status(400).json({ error: "Envía una pregunta para continuar." });
    }

    const response = await openai.responses.create({
      model: MODEL,
      reasoning: { effort: "medium" },
      instructions: tutorInstructions,
      input: safeMessages
    });
    const answer = response.output_text?.trim();
    if (!answer) return res.status(502).json({ error: "El asistente no generó una respuesta. Inténtalo otra vez." });
    res.json({ answer });
  } catch (error) {
    const status = Number(error?.status || error?.statusCode || 500);
    console.error("Error en /api/chat:", {
      status,
      code: error?.code,
      message: error?.message
    });

    // Mensajes útiles sin revelar la clave privada ni datos sensibles.
    if (status === 401 || status === 403) {
      return res.status(502).json({
        error: "La clave de OpenAI no es válida o no tiene permiso. El responsable debe revisar OPENAI_API_KEY en la configuración del servidor."
      });
    }
    if (status === 429) {
      return res.status(429).json({
        error: "Se alcanzó un límite de uso o no hay cuota disponible en la cuenta de API. El responsable debe revisar el uso y la facturación."
      });
    }
    if (status === 404) {
      return res.status(502).json({
        error: `No se encontró el modelo configurado (${MODEL}) o la cuenta no tiene acceso. Revisa OPENAI_MODEL en la configuración del servidor.`
      });
    }
    if (status === 400) {
      return res.status(400).json({
        error: "La solicitud no fue aceptada por el servicio de IA. Revisa el formato de la pregunta y la configuración del modelo."
      });
    }
    return res.status(500).json({
      error: "No se pudo completar la consulta. Revisa que el servidor tenga conexión a internet y que OPENAI_API_KEY esté configurada. Si continúa, consulta el registro del servidor."
    });
  }
});

app.post("/api/contact", (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.slice(0, 80).trim() : "Sin nombre";
  const message = typeof req.body?.message === "string" ? req.body.message.slice(0, 2000).trim() : "";
  if (!message) return res.status(400).json({ error: "Escribe una descripción del problema." });

  // El número se configura en el entorno del servidor, no se publica en el HTML.
  const phone = (process.env.CONTACT_WHATSAPP || "").replace(/\D/g, "");
  if (!phone) {
    return res.status(503).json({ error: "El contacto oficial todavía no está configurado. Informa al responsable del proyecto." });
  }
  const text = `Reporte para El Caballerito\nNombre: ${name || "Sin nombre"}\nProblema: ${message}`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  res.json({ url });
});

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    assistantConfigured: Boolean(openai),
    model: MODEL,
    envLoaded: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => {
  console.log(`El Caballerito está listo en http://localhost:${PORT}`);
  if (!openai) console.warn("Falta configurar OPENAI_API_KEY en las variables de entorno.");
});
