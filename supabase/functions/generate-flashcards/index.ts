import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const geminiModel = "gemini-3.5-flash";

type Difficulty = "easy" | "medium" | "hard";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function limitText(text: string, maxChars = 28000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars);
}

function normalizeDifficulty(value: unknown): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  return "medium";
}

function normalizeTotalCards(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 10;
  }

  const rounded = Math.round(parsed);

  if (rounded < 1) return 1;
  if (rounded > 30) return 30;

  return rounded;
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

function cleanJsonText(text: string): string {
  let cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

function buildFlashcardsPrompt(
  difficulty: Difficulty,
  totalCards: number,
  documentText: string
) {
  return `
Eres un generador de flashcards académicas.

Genera exactamente ${totalCards} flashcards en español con dificultad "${difficulty}" basadas estrictamente en el texto proporcionado.

Reglas obligatorias:
- Responde únicamente con JSON válido.
- No uses markdown.
- No uses bloques \`\`\`.
- No agregues explicaciones fuera del JSON.
- No inventes información que no aparezca en el texto.
- Cada flashcard debe tener una pregunta clara y una respuesta útil.
- Las respuestas deben ser breves, pero completas.
- category debe ser un tema corto relacionado con la tarjeta.
- difficulty debe ser "easy", "medium" o "hard".

Estructura exacta del JSON:

{
  "cards": [
    {
      "question": "Pregunta o concepto",
      "answer": "Respuesta clara",
      "category": "Tema de la tarjeta",
      "difficulty": "easy | medium | hard"
    }
  ]
}

Texto del documento:
${documentText}
`;
}

function validateFlashcardsData(data: any) {
  if (!data || typeof data !== "object") {
    throw new Error("El JSON generado no es un objeto válido.");
  }

  if (!Array.isArray(data.cards)) {
    throw new Error("El JSON no tiene arreglo cards.");
  }

  if (data.cards.length === 0) {
    throw new Error("No se generaron flashcards.");
  }

  for (const [index, card] of data.cards.entries()) {
    if (!card.question || typeof card.question !== "string") {
      throw new Error(`La flashcard ${index + 1} no tiene question válido.`);
    }

    if (!card.answer || typeof card.answer !== "string") {
      throw new Error(`La flashcard ${index + 1} no tiene answer válido.`);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("generate-flashcards: request received");
    console.log("method:", req.method);

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
      return jsonResponse({ error: "JSON inválido" }, 400);
    }

    console.log("body:", body);

    const documentId = body.document_id as string;
    const difficulty = normalizeDifficulty(body.difficulty);
    const totalCards = normalizeTotalCards(body.total_cards ?? 10);
    const regenerate = Boolean(body.regenerate);

    if (!documentId) {
      return jsonResponse({ error: "document_id es requerido" }, 400);
    }

    console.log("document_id:", documentId);
    console.log("difficulty:", difficulty);
    console.log("total_cards:", totalCards);
    console.log("regenerate:", regenerate);

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

    if (document.status !== "ready") {
      return jsonResponse(
        {
          error:
            "El documento aún no está listo para generar flashcards",
        },
        400
      );
    }

    console.log("document found:", document.title);

    if (!regenerate) {
      const { data: existingCards, error: existingCardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("document_id", documentId)
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

      if (existingCardsError) {
        console.error("existing flashcards error:", existingCardsError);

        return jsonResponse(
          {
            error: "Error consultando flashcards existentes",
            detail: existingCardsError.message,
          },
          500
        );
      }

      if (existingCards && existingCards.length > 0) {
        console.log("reusing existing flashcards");

        return jsonResponse({
          success: true,
          reused: true,
          flashcards: existingCards,
        });
      }
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
          error: "Error obteniendo texto del documento",
          detail: chunksError.message,
        },
        500
      );
    }

    console.log("chunks count:", chunks?.length ?? 0);

    if (!chunks || chunks.length === 0) {
      return jsonResponse(
        { error: "No hay texto procesado para este documento" },
        400
      );
    }

    const documentText = limitText(
      chunks.map((chunk) => chunk.content).join("\n\n")
    );

    if (!documentText.trim()) {
      return jsonResponse(
        { error: "El texto procesado del documento está vacío" },
        400
      );
    }

    console.log("document text length:", documentText.length);

    const prompt = buildFlashcardsPrompt(
      difficulty,
      totalCards,
      documentText
    );

    console.log("calling Gemini flashcards...");
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
            temperature: 0.2,
          },
        }),
      }
    );

    console.log("Gemini status:", geminiResponse.status);

    const geminiTextResponse = await geminiResponse.text();

    if (!geminiResponse.ok) {
      console.error("Gemini error response:", geminiTextResponse);

      return jsonResponse(
        {
          error: "Error llamando a Gemini",
          detail: geminiTextResponse,
        },
        502
      );
    }

    let geminiData: any;

    try {
      geminiData = JSON.parse(geminiTextResponse);
    } catch (_error) {
      return jsonResponse(
        {
          error: "Respuesta inválida de Gemini",
          detail: geminiTextResponse,
        },
        502
      );
    }

    let extractedText = getGeminiText(geminiData);
    extractedText = cleanJsonText(extractedText);

    console.log("Gemini extracted text:", extractedText);

    if (!extractedText) {
      return jsonResponse(
        {
          error: "Gemini no devolvió contenido para flashcards",
          detail: geminiData,
        },
        502
      );
    }

    let flashcardsData: any;

    try {
      flashcardsData = JSON.parse(extractedText);
    } catch (_error) {
      return jsonResponse(
        {
          error: "El modelo no generó un JSON válido",
          detail: extractedText,
        },
        500
      );
    }

    try {
      validateFlashcardsData(flashcardsData);
    } catch (validationError) {
      return jsonResponse(
        {
          error: "Estructura de JSON incorrecta devuelta por el modelo",
          detail:
            validationError instanceof Error
              ? validationError.message
              : String(validationError),
          raw: flashcardsData,
        },
        500
      );
    }

    const cards = flashcardsData.cards.slice(0, totalCards);

    if (regenerate) {
      const { error: deleteError } = await supabase
        .from("flashcards")
        .delete()
        .eq("document_id", documentId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("delete flashcards error:", deleteError);

        return jsonResponse(
          {
            error: "Error eliminando flashcards anteriores",
            detail: deleteError.message,
          },
          500
        );
      }
    }

    const cardsToInsert = cards.map((card: any, index: number) => ({
      user_id: user.id,
      document_id: documentId,

      // Columnas originales de tu tabla
      front: card.question,
      back: card.answer,

      // Columnas nuevas que estamos usando también
      question: card.question,
      answer: card.answer,

      category: card.category ?? "General",
      difficulty: normalizeDifficulty(card.difficulty ?? difficulty),
      order_index: index + 1,
    }));

    const { data: savedCards, error: insertCardsError } = await supabase
      .from("flashcards")
      .insert(cardsToInsert)
      .select();

    if (insertCardsError) {
      console.error("insert flashcards error:", insertCardsError);

      return jsonResponse(
        {
          error: "Error guardando flashcards",
          detail: insertCardsError.message,
        },
        500
      );
    }

    console.log("flashcards saved:", savedCards?.length ?? 0);

    return jsonResponse({
      success: true,
      reused: false,
      flashcards: savedCards ?? cardsToInsert,
    });
  } catch (error) {
    console.error("generate-flashcards unexpected error:", error);

    return jsonResponse(
      {
        error: "Error interno generando flashcards",
        detail: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});