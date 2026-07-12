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

function normalizeDifficulty(value: unknown): Difficulty {
  if (value === "easy" || value === "medium" || value === "hard") {
    return value;
  }

  return "medium";
}

function normalizeDays(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 7;
  }

  const rounded = Math.round(parsed);

  if (rounded < 1) return 1;
  if (rounded > 30) return 30;

  return rounded;
}

function limitText(text: string, maxChars = 32000) {
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

function safeText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

function extractSummaryText(summary: any): string {
  return (
    summary.summary_text ??
    summary.content ??
    summary.text ??
    summary.summary ??
    ""
  );
}

function buildStudyPlanPrompt(params: {
  days: number;
  goal: string;
  difficulty: Difficulty;
  sourceName: string;
  documentText: string;
  summariesText: string;
  quizStatsText: string;
  flashcardsText: string;
}) {
  return `
Eres Nexus AI, un asistente académico experto en crear planes de estudio personalizados.

Genera un plan de estudio en español de ${params.days} días.

Objetivo del usuario:
${params.goal}

Dificultad:
${params.difficulty}

Fuente de estudio:
${params.sourceName}

Reglas obligatorias:
- Responde únicamente con JSON válido.
- No uses markdown.
- No uses bloques \`\`\`.
- No agregues texto fuera del JSON.
- No inventes temas fuera del contenido del usuario.
- El plan debe ser realista y útil.
- Cada día debe tener al menos una actividad.
- Usa actividades variadas cuando tenga sentido:
  read, review, quiz, flashcards, chat, practice.
- estimated_minutes debe ser un número entero entre 10 y 120.
- Genera exactamente ${params.days} elementos, uno por cada día.
- El campo day debe ir desde 1 hasta ${params.days}.

Estructura exacta del JSON:

{
  "title": "Plan de estudio para ...",
  "description": "Descripción breve del plan",
  "items": [
    {
      "day": 1,
      "title": "Tema o actividad",
      "description": "Qué debe estudiar el usuario",
      "estimated_minutes": 30,
      "activity_type": "read"
    }
  ]
}

Contenido de documentos:
${params.documentText}

Resúmenes existentes:
${params.summariesText}

Información de quizzes e intentos:
${params.quizStatsText}

Flashcards existentes:
${params.flashcardsText}
`;
}

function validateStudyPlanData(data: any, expectedDays: number) {
  if (!data || typeof data !== "object") {
    throw new Error("El JSON generado no es un objeto válido.");
  }

  if (!data.title || typeof data.title !== "string") {
    throw new Error("El plan no tiene title válido.");
  }

  if (!data.description || typeof data.description !== "string") {
    throw new Error("El plan no tiene description válida.");
  }

  if (!Array.isArray(data.items)) {
    throw new Error("El plan no tiene arreglo items.");
  }

  if (data.items.length === 0) {
    throw new Error("El plan no contiene actividades.");
  }

  for (const [index, item] of data.items.entries()) {
    if (!item.title || typeof item.title !== "string") {
      throw new Error(`La actividad ${index + 1} no tiene title válido.`);
    }

    if (!item.description || typeof item.description !== "string") {
      throw new Error(`La actividad ${index + 1} no tiene description válida.`);
    }

    const day = Number(item.day);

    if (!Number.isFinite(day) || day < 1 || day > expectedDays) {
      throw new Error(`La actividad ${index + 1} tiene day inválido.`);
    }
  }
}

serve(async (req) => {
  // MUY IMPORTANTE:
  // OPTIONS debe ir antes de auth, req.json(), Supabase y Gemini.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("generate-study-plan: request received");
    console.log("method:", req.method);

    if (req.method !== "POST") {
      return jsonResponse({ error: "Método no permitido" }, 405);
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        { error: "No se recibió Authorization header" },
        401
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return jsonResponse(
        { error: "GEMINI_API_KEY no está configurada en Supabase Secrets" },
        500
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

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

    let body: any;

    try {
      body = await req.json();
    } catch (_error) {
      return jsonResponse({ error: "JSON inválido" }, 400);
    }

    const documentId = body.document_id as string | undefined;
    const subjectId = body.subject_id as string | undefined;
    const days = normalizeDays(body.days ?? 7);
    const goal = safeText(body.goal || "Prepararme para estudiar mejor");
    const difficulty = normalizeDifficulty(body.difficulty);

    if (!documentId && !subjectId) {
      return jsonResponse(
        { error: "Debes enviar document_id o subject_id" },
        400
      );
    }

    if (documentId && subjectId) {
      return jsonResponse(
        { error: "Envía solo document_id o subject_id, no ambos" },
        400
      );
    }

    console.log("user id:", user.id);
    console.log("document_id:", documentId ?? null);
    console.log("subject_id:", subjectId ?? null);
    console.log("days:", days);
    console.log("goal:", goal);
    console.log("difficulty:", difficulty);

    let selectedSubject: any = null;
    let selectedDocuments: any[] = [];
    let sourceName = "Contenido seleccionado";

    if (documentId) {
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
          { error: "El documento aún no está listo para generar plan" },
          400
        );
      }

      selectedDocuments = [document];
      sourceName = document.title ?? "Documento";
    }

    if (subjectId) {
      const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .select("*")
        .eq("id", subjectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (subjectError) {
        console.error("subject error:", subjectError);

        return jsonResponse(
          {
            error: "Error consultando materia",
            detail: subjectError.message,
          },
          500
        );
      }

      if (!subject) {
        return jsonResponse({ error: "Materia no encontrada" }, 404);
      }

      selectedSubject = subject;
      sourceName = subject.name ?? "Materia";

      const { data: documents, error: documentsError } = await supabase
        .from("documents")
        .select("*")
        .eq("subject_id", subjectId)
        .eq("user_id", user.id)
        .eq("status", "ready");

      if (documentsError) {
        console.error("documents by subject error:", documentsError);

        return jsonResponse(
          {
            error: "Error consultando documentos de la materia",
            detail: documentsError.message,
          },
          500
        );
      }

      selectedDocuments = documents ?? [];
    }

    if (selectedDocuments.length === 0) {
      return jsonResponse(
        { error: "No hay documentos listos para generar el plan" },
        400
      );
    }

    const documentIds = selectedDocuments.map((doc) => doc.id);

    const { data: chunks, error: chunksError } = await supabase
      .from("document_chunks")
      .select("document_id, chunk_index, content")
      .eq("user_id", user.id)
      .in("document_id", documentIds)
      .order("document_id", { ascending: true })
      .order("chunk_index", { ascending: true });

    if (chunksError) {
      console.error("chunks error:", chunksError);

      return jsonResponse(
        {
          error: "Error obteniendo texto de documentos",
          detail: chunksError.message,
        },
        500
      );
    }

    if (!chunks || chunks.length === 0) {
      return jsonResponse(
        { error: "No hay texto procesado en document_chunks" },
        400
      );
    }

    const documentTitleById = new Map<string, string>();

    for (const doc of selectedDocuments) {
      documentTitleById.set(doc.id, doc.title ?? "Documento");
    }

    const documentTextRaw = chunks
      .map((chunk) => {
        const title = documentTitleById.get(chunk.document_id) ?? "Documento";
        return `Documento: ${title}\n${chunk.content}`;
      })
      .join("\n\n");

    const documentText = limitText(documentTextRaw, 28000);

    const { data: summaries } = await supabase
      .from("summaries")
      .select("*")
      .eq("user_id", user.id)
      .in("document_id", documentIds);

    const summariesText = limitText(
      (summaries ?? [])
        .map((summary: any, index: number) => {
          const content = extractSummaryText(summary);
          return `Resumen ${index + 1}: ${content}`;
        })
        .filter((text) => text.trim().length > 0)
        .join("\n\n") || "No hay resúmenes guardados.",
      6000
    );

    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("*")
      .eq("user_id", user.id)
      .in("document_id", documentIds);

    const quizIds = (quizzes ?? []).map((quiz: any) => quiz.id);

    let attempts: any[] = [];

    if (quizIds.length > 0) {
      const { data: attemptsData } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("user_id", user.id)
        .in("quiz_id", quizIds);

      attempts = attemptsData ?? [];
    }

    const quizStatsText = limitText(
      [
        `Quizzes creados: ${(quizzes ?? []).length}`,
        `Intentos realizados: ${attempts.length}`,
        attempts.length > 0
          ? `Calificaciones: ${attempts
              .map((attempt: any) => {
                const score = attempt.score ?? "N/A";
                const correct = attempt.correct_answers ?? "N/A";
                const total = attempt.total_questions ?? "N/A";
                return `${score}% (${correct}/${total})`;
              })
              .join(", ")}`
          : "No hay intentos registrados.",
      ].join("\n"),
      4000
    );

    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .in("document_id", documentIds);

    const flashcardsText = limitText(
      (flashcards ?? [])
        .slice(0, 30)
        .map((card: any, index: number) => {
          const front = card.front ?? card.question ?? "";
          const back = card.back ?? card.answer ?? "";
          return `Flashcard ${index + 1}: ${front} -> ${back}`;
        })
        .filter((text) => text.trim().length > 0)
        .join("\n") || "No hay flashcards guardadas.",
      6000
    );

    const prompt = buildStudyPlanPrompt({
      days,
      goal,
      difficulty,
      sourceName,
      documentText,
      summariesText,
      quizStatsText,
      flashcardsText,
    });

    console.log("calling Gemini study plan...");
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
            temperature: 0.25,
          },
        }),
      }
    );

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

    if (!extractedText) {
      return jsonResponse(
        {
          error: "Gemini no devolvió contenido para el plan",
          detail: geminiData,
        },
        502
      );
    }

    let studyPlanData: any;

    try {
      studyPlanData = JSON.parse(extractedText);
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
      validateStudyPlanData(studyPlanData, days);
    } catch (validationError) {
      return jsonResponse(
        {
          error: "Estructura de JSON incorrecta devuelta por el modelo",
          detail:
            validationError instanceof Error
              ? validationError.message
              : String(validationError),
          raw: studyPlanData,
        },
        500
      );
    }

    const firstDocument = selectedDocuments[0];

    const planInsert = {
      user_id: user.id,
      workspace_id:
        selectedSubject?.workspace_id ?? firstDocument?.workspace_id ?? null,
      subject_id: selectedSubject?.id ?? firstDocument?.subject_id ?? null,
      document_id: documentId ?? null,
      title: studyPlanData.title,
      description: studyPlanData.description,
      goal,
      days,
      difficulty,
      status: "active",
      updated_at: new Date().toISOString(),
    };

    const { data: newPlan, error: insertPlanError } = await supabase
      .from("study_plans")
      .insert(planInsert)
      .select()
      .single();

    if (insertPlanError || !newPlan) {
      console.error("insert plan error:", insertPlanError);

      return jsonResponse(
        {
          error: "Error guardando plan de estudio",
          detail: insertPlanError?.message ?? null,
        },
        500
      );
    }

    const items = studyPlanData.items.slice(0, days);

    const itemsToInsert = items.map((item: any, index: number) => ({
      user_id: user.id,
      study_plan_id: newPlan.id,
      day_number: Number(item.day) || index + 1,
      title: item.title,
      description: item.description,
      estimated_minutes: Math.min(
        120,
        Math.max(10, Number(item.estimated_minutes) || 30)
      ),
      activity_type: item.activity_type ?? "review",
      is_completed: false,
      order_index: index + 1,
    }));

    const { data: savedItems, error: insertItemsError } = await supabase
      .from("study_plan_items")
      .insert(itemsToInsert)
      .select();

    if (insertItemsError) {
      console.error("insert plan items error:", insertItemsError);

      await supabase
        .from("study_plans")
        .delete()
        .eq("id", newPlan.id)
        .eq("user_id", user.id);

      return jsonResponse(
        {
          error: "Error guardando actividades del plan",
          detail: insertItemsError.message,
        },
        500
      );
    }

    if (savedItems && savedItems.length > 0) {
      const now = new Date();
      const tasksToInsert = savedItems.map((item: any) => {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + (item.day_number - 1));
        
        return {
          user_id: user.id,
          workspace_id: newPlan.workspace_id,
          subject_id: newPlan.subject_id,
          document_id: newPlan.document_id,
          study_plan_id: newPlan.id,
          study_plan_item_id: item.id,
          title: item.title,
          description: item.description,
          due_date: dueDate.toISOString(),
          priority: "medium",
          status: "pending",
          is_completed: false
        };
      });

      const { error: insertTasksError } = await supabase.from("tasks").insert(tasksToInsert);
      if (insertTasksError) {
        console.error("insert tasks error (non-fatal):", insertTasksError);
      }
    }

    return jsonResponse({
      success: true,
      study_plan: newPlan,
      items: savedItems ?? itemsToInsert,
    });
  } catch (error) {
    console.error("generate-study-plan unexpected error:", error);

    return jsonResponse(
      {
        error: "Error interno generando plan de estudio",
        detail: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});