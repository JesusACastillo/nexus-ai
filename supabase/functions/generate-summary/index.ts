import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SummaryType = "short" | "general" | "detailed" | "exam_guide";

const geminiModel = "gemini-3.5-flash";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function buildPrompt(summaryType: SummaryType, documentText: string) {
  const typeInstruction: Record<SummaryType, string> = {
    short: "Genera un resumen corto, directo y fácil de entender.",
    general: "Genera un resumen general bien estructurado.",
    detailed: "Genera un resumen detallado con secciones y explicaciones claras.",
    exam_guide:
      "Genera una guía de examen con conceptos clave, definiciones y posibles preguntas.",
  };

  return `
Eres un asistente académico experto.

Tu tarea:
${typeInstruction[summaryType]}

Reglas:
- Responde en español.
- Usa formato claro.
- Incluye una sección llamada "Resumen".
- Incluye una sección llamada "Puntos clave".
- Incluye una sección llamada "Conceptos importantes".
- No inventes información que no venga en el documento.
- Si el texto está incompleto, resume solo lo disponible.

Texto del documento:
${documentText}
`;
}

function limitText(text: string, maxChars = 28000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

function extractKeyPoints(summary: string): string[] {
  const lines = summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines.filter(
    (line) =>
      line.startsWith("-") ||
      line.startsWith("•") ||
      /^\d+\./.test(line)
  );

  return bulletLines.slice(0, 10);
}

function getGeminiText(responseData: any): string {
  if (typeof responseData.output_text === "string") {
    return responseData.output_text.trim();
  }

  if (typeof responseData.outputText === "string") {
    return responseData.outputText.trim();
  }

  if (Array.isArray(responseData.steps)) {
    const texts: string[] = [];

    for (const step of responseData.steps) {
      if (step.type === "model_output" && Array.isArray(step.content)) {
        for (const item of step.content) {
          if (typeof item.text === "string") {
            texts.push(item.text);
          }
        }
      }
    }

    return texts.join("\n").trim();
  }

  return "";
}

serve(async (req) => {
  try {
    console.log("generate-summary: request received");
    console.log("method:", req.method);

    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Método no permitido" }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    console.log("has auth header:", Boolean(authHeader));

    if (!authHeader) {
      return jsonResponse(
        { error: "No se recibió Authorization header" },
        401
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    console.log("has GEMINI_API_KEY:", Boolean(geminiApiKey));

    if (!geminiApiKey) {
      return jsonResponse(
        { error: "GEMINI_API_KEY no está configurada en Supabase Secrets" },
        500
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    console.log("has SUPABASE_URL:", Boolean(supabaseUrl));
    console.log("has SUPABASE_ANON_KEY:", Boolean(supabaseAnonKey));

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse(
        { error: "Variables de Supabase no configuradas" },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("user error:", userError);
      return jsonResponse({ error: "Usuario no autenticado" }, 401);
    }

    console.log("user id:", user.id);

    let body: any;

    try {
      body = await req.json();
    } catch (_error) {
      return jsonResponse({ error: "Body JSON inválido" }, 400);
    }

    console.log("body:", body);

    const documentId = body.document_id as string;
    const summaryType = (body.summary_type ?? "general") as SummaryType;
    const regenerate = Boolean(body.regenerate);

    const validSummaryTypes: SummaryType[] = [
      "short",
      "general",
      "detailed",
      "exam_guide",
    ];

    if (!documentId) {
      return jsonResponse({ error: "document_id es requerido" }, 400);
    }

    if (!validSummaryTypes.includes(summaryType)) {
      return jsonResponse({ error: "summary_type inválido" }, 400);
    }

    console.log("document_id:", documentId);
    console.log("summary_type:", summaryType);

    const { data: document, error: documentError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (documentError) {
      console.error("document error:", documentError);

      return jsonResponse(
        {
          error: "Error consultando documento",
          detail: documentError.message,
        },
        500
      );
    }

    if (!document) {
      return jsonResponse({ error: "Documento no encontrado" }, 404);
    }

    console.log("document found:", document.title);

    const { data: existingSummary, error: existingSummaryError } =
      await supabase
        .from("summaries")
        .select("*")
        .eq("document_id", documentId)
        .eq("user_id", user.id)
        .eq("summary_type", summaryType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingSummaryError) {
      console.error("existing summary error:", existingSummaryError);

      return jsonResponse(
        {
          error: "Error consultando resumen existente",
          detail: existingSummaryError.message,
        },
        500
      );
    }

    if (existingSummary && !regenerate) {
      console.log("reusing existing summary");

      return jsonResponse({
        summary: existingSummary,
        reused: true,
      });
    }

    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("chunk_index, content")
      .eq("document_id", documentId)
      .eq("user_id", user.id)
      .order("chunk_index", { ascending: true });

    if (chunksError) {
      console.error("chunks error:", chunksError);

      return jsonResponse(
        {
          error: "Error consultando chunks",
          detail: chunksError.message,
        },
        500
      );
    }

    console.log("chunks count:", chunks?.length ?? 0);

    if (!chunks || chunks.length === 0) {
      return jsonResponse(
        {
          error: "Este documento no tiene texto procesado en document_chunks",
        },
        400
      );
    }

    const fullText = chunks.map((chunk) => chunk.content).join("\n\n");
    const documentText = limitText(fullText);

    console.log("document text length:", documentText.length);

    if (!documentText.trim()) {
      return jsonResponse(
        { error: "El texto procesado del documento está vacío" },
        400
      );
    }

    const prompt = buildPrompt(summaryType, documentText);

    console.log("calling Gemini...");
    console.log("Gemini model:", geminiModel);

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": geminiApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: geminiModel,
          input: prompt,
          generation_config: {
            temperature: 0.4,
          },
        }),
      }
    );

    console.log("Gemini status:", geminiResponse.status);

    const geminiText = await geminiResponse.text();

    if (!geminiResponse.ok) {
      console.error("Gemini error response:", geminiText);

      return jsonResponse(
        {
          error: "Error llamando a Gemini",
          detail: geminiText,
        },
        502
      );
    }

    let geminiData: any;

    try {
      geminiData = JSON.parse(geminiText);
    } catch (_error) {
      return jsonResponse(
        {
          error: "Gemini devolvió una respuesta no válida",
          detail: geminiText,
        },
        502
      );
    }

    const summaryContent = getGeminiText(geminiData);

    console.log("summary length:", summaryContent.length);

    if (!summaryContent.trim()) {
      console.error("Gemini raw data:", geminiData);

      return jsonResponse(
        {
          error: "Gemini no devolvió contenido de resumen",
          detail: geminiData,
        },
        502
      );
    }

    const keyPoints = extractKeyPoints(summaryContent);

    const { data: savedSummary, error: insertError } = await supabase
      .from("summaries")
      .insert({
        user_id: user.id,
        document_id: documentId,
        summary_type: summaryType,
        title: `Resumen de ${document.title}`,
        content: summaryContent,
        key_points: keyPoints,
        generated_by_model: geminiModel,
      })
      .select()
      .single();

    if (insertError) {
      console.error("insert summary error:", insertError);

      return jsonResponse(
        {
          error: "Error guardando resumen en Supabase",
          detail: insertError.message,
        },
        500
      );
    }

    console.log("summary saved:", savedSummary.id);

    return jsonResponse({
      summary: savedSummary,
      reused: false,
    });
  } catch (error) {
    console.error("generate-summary unexpected error:", error);

    return jsonResponse(
      {
        error: "Error interno generando resumen",
        detail: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});