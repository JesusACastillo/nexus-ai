import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return jsonResponse({ error: "Método no permitido" }, 405);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "No se recibió Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) return jsonResponse({ error: "Variables de Supabase no configuradas" }, 500);

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return jsonResponse({ error: "Usuario no autenticado" }, 401);

    let body;
    try { body = await req.json(); } catch { return jsonResponse({ error: "JSON inválido" }, 400); }

    const quizId = body.quiz_id;
    const userAnswers = body.answers; // Array of { question_id, selected_answer }

    if (!quizId || !Array.isArray(userAnswers)) {
      return jsonResponse({ error: "quiz_id y answers (array) son requeridos" }, 400);
    }

    // 1. Obtener el quiz
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .eq("user_id", user.id)
      .single();

    if (quizError || !quiz) {
      return jsonResponse({ error: "Quiz no encontrado" }, 404);
    }

    // 2. Obtener las preguntas reales de la base de datos
    const { data: questions, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("question_order", { ascending: true });

    if (questionsError || !questions || questions.length === 0) {
      return jsonResponse({ error: "Error obteniendo preguntas del quiz" }, 500);
    }

    let correctCount = 0;
    let incorrectCount = 0;
    const totalQuestions = questions.length;

    // 3. Calificar
    const gradedAnswers = questions.map((q) => {
      const userAnswerObj = userAnswers.find(ua => ua.question_id === q.id);
      const selected = userAnswerObj ? userAnswerObj.selected_answer : null;
      const isCorrect = selected === q.correct_answer;

      if (isCorrect) correctCount++;
      else incorrectCount++;

      return {
        question_id: q.id,
        selected_answer: selected,
        is_correct: isCorrect,
        correct_answer: q.correct_answer, // we return this so the frontend can show it
        explanation: q.explanation
      };
    });

    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // 4. Guardar intento
    const { data: attempt, error: attemptError } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        score: scorePercentage,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        total_questions: totalQuestions
      })
      .select()
      .single();

    if (attemptError || !attempt) {
      return jsonResponse({ error: "Error al guardar el intento", detail: attemptError?.message }, 500);
    }

    // 5. Guardar respuestas
    const answersToInsert = gradedAnswers.map(ans => ({
      user_id: user.id,
      attempt_id: attempt.id,
      quiz_id: quizId,
      question_id: ans.question_id,
      selected_answer: ans.selected_answer,
      is_correct: ans.is_correct
    }));

    const { error: insertAnswersError } = await supabase
      .from("quiz_answers")
      .insert(answersToInsert);

    if (insertAnswersError) {
      return jsonResponse({ error: "Error al guardar las respuestas", detail: insertAnswersError.message }, 500);
    }

    return jsonResponse({
      success: true,
      result: {
        attempt_id: attempt.id,
        score: scorePercentage,
        correct_answers: correctCount,
        total_questions: totalQuestions
      },
      graded_answers: gradedAnswers
    });

  } catch (error) {
    console.error("unexpected error:", error);
    return jsonResponse({ error: "Error interno", detail: String(error) }, 500);
  }
});