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
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function buildQuizPrompt(
  difficulty: Difficulty,
  totalQuestions: number,
  documentText: string
) {
  return `
Eres un generador de quizzes académicos.

Genera un quiz en español de dificultad "${difficulty}" con exactamente ${totalQuestions} preguntas basadas estrictamente en el texto proporcionado.

Reglas obligatorias:
- Responde únicamente con JSON válido.
- No uses markdown.
- No uses bloques \`\`\`.
- No agregues explicaciones fuera del JSON.
- Todas las preguntas deben ser de opción múltiple.
- Cada pregunta debe tener exactamente 4 opciones.
- correct_answer debe ser exactamente igual a una de las opciones.
- No inventes información que no aparezca en el texto.

Estructura exacta del JSON:

{
  "title": "Título corto del quiz",
  "questions": [
    {
      "question": "Texto de la pregunta",
      "type": "multiple_choice",
      "options": ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      "correct_answer": "Opción correcta",
      "explanation": "Explicación breve"
    }
  ]
}

Texto del documento:
${documentText}
`;
}

function normalizeDifficulty(value: unknown): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  return "medium";
}

function normalizeTotalQuestions(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 5;
  }

  const rounded = Math.round(parsed);

  if (rounded < 1) return 1;
  if (rounded > 15) return 15;

  return rounded;
}

function validateQuizData(quizData: any) {
  if (!quizData || typeof quizData !== "object") {
    throw new Error("El JSON generado no es un objeto válido.");
  }

  if (!quizData.title || typeof quizData.title !== "string") {
    throw new Error("El quiz no tiene title válido.");
  }

  if (!Array.isArray(quizData.questions)) {
    throw new Error("El quiz no tiene arreglo questions válido.");
  }

  if (quizData.questions.length === 0) {
    throw new Error("El quiz no contiene preguntas.");
  }

  for (const [index, question] of quizData.questions.entries()) {
    if (!question.question || typeof question.question !== "string") {
      throw new Error(`La pregunta ${index + 1} no tiene texto válido.`);
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(`La pregunta ${index + 1} no tiene 4 opciones.`);
    }

    if (
      !question.correct_answer ||
      typeof question.correct_answer !== "string"
    ) {
      throw new Error(
        `La pregunta ${index + 1} no tiene correct_answer válido.`
      );
    }

    if (!question.options.includes(question.correct_answer)) {
      throw new Error(
        `La respuesta correcta de la pregunta ${
          index + 1
        } no coincide con una opción.`
      );
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
    console.log("generate-quiz: request received");
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
    const totalQuestions = normalizeTotalQuestions(body.total_questions ?? 5);

    if (!documentId) {
      return jsonResponse({ error: "document_id es requerido" }, 400);
    }

    console.log("document_id:", documentId);
    console.log("difficulty:", difficulty);
    console.log("total_questions:", totalQuestions);

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
        { error: "El documento aún no está listo para generar un quiz" },
        400
      );
    }

    console.log("document found:", document.title);

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

    const prompt = buildQuizPrompt(difficulty, totalQuestions, documentText);

    console.log("calling Gemini quiz...");
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
          error: "Gemini no devolvió contenido para el quiz",
          detail: geminiData,
        },
        502
      );
    }

    let quizData: any;

    try {
      quizData = JSON.parse(extractedText);
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
      validateQuizData(quizData);
    } catch (validationError) {
      return jsonResponse(
        {
          error: "Estructura de JSON incorrecta devuelta por el modelo",
          detail:
            validationError instanceof Error
              ? validationError.message
              : String(validationError),
          raw: quizData,
        },
        500
      );
    }

    const questions = quizData.questions.slice(0, totalQuestions);

    const { data: newQuiz, error: insertQuizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        document_id: documentId,
        title: quizData.title,
        difficulty,
        total_questions: questions.length,
      })
      .select()
      .single();

    if (insertQuizError || !newQuiz) {
      console.error("insert quiz error:", insertQuizError);

      return jsonResponse(
        {
          error: "Error al guardar el quiz",
          detail: insertQuizError?.message ?? null,
        },
        500
      );
    }

    console.log("quiz saved:", newQuiz.id);

    const questionsToInsert = questions.map((question: any, index: number) => ({
      user_id: user.id,
      quiz_id: newQuiz.id,
      question_text: question.question,
      question_type: question.type || "multiple_choice",
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation ?? "",
      question_order: index + 1,
      order_index: index + 1,
    }));

    const { data: savedQuestions, error: insertQuestionsError } =
      await supabase
        .from("quiz_questions")
        .insert(questionsToInsert)
        .select();

    if (insertQuestionsError) {
      console.error("insert questions error:", insertQuestionsError);

      await supabase
        .from("quizzes")
        .delete()
        .eq("id", newQuiz.id)
        .eq("user_id", user.id);

      return jsonResponse(
        {
          error: "Error al guardar las preguntas",
          detail: insertQuestionsError.message,
        },
        500
      );
    }

    console.log("questions saved:", savedQuestions?.length ?? 0);

    return jsonResponse({
      success: true,
      quiz: newQuiz,
      questions: savedQuestions ?? questionsToInsert,
    });
  } catch (error) {
    console.error("generate-quiz unexpected error:", error);

    return jsonResponse(
      {
        error: "Error interno generando quiz",
        detail: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});