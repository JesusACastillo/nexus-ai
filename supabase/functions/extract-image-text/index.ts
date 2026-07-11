import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const bucketName = "nexus-documents";
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

function splitTextIntoChunks(text: string, chunkSize = 1000): string[] {
  const cleanText = text.trim();

  if (!cleanText) {
    return [];
  }

  const words = cleanText.split(/\s+/);
  const chunks: string[] = [];

  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(word);
    currentLength += word.length + 1;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

function estimateTokenCount(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
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

function isNoTextFound(text: string): boolean {
  const normalized = text.trim().toUpperCase();

  return (
    !normalized ||
    normalized === "NO_TEXT_FOUND" ||
    normalized.includes("NO_TEXT_FOUND")
  );
}

async function updateDocumentStatus(
  supabase: any,
  documentId: string,
  userId: string,
  status: "uploaded" | "processing" | "ready" | "failed",
  errorMessage: string | null = null
) {
  const { error } = await supabase
    .from("documents")
    .update({
      status,
      error_message: errorMessage,
    })
    .eq("id", documentId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating document status:", error);
  }
}

serve(async (req) => {
  try {
    console.log("extract-image-text: request received");
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
      return jsonResponse({ error: "JSON inválido" }, 400);
    }

    console.log("body:", body);

    const documentId = body.document_id as string;

    if (!documentId) {
      return jsonResponse({ error: "document_id es requerido" }, 400);
    }

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
    console.log("file_mime:", document.file_mime);
    console.log("file_path:", document.file_path);

    if (!document.file_mime || !document.file_mime.startsWith("image/")) {
      return jsonResponse(
        { error: "El documento no es una imagen válida" },
        400
      );
    }

    if (!document.file_path) {
      return jsonResponse(
        { error: "El documento no tiene file_path en Storage" },
        400
      );
    }

    await updateDocumentStatus(
      supabase,
      documentId,
      user.id,
      "processing",
      null
    );

    const { data: fileData, error: fileError } = await supabase.storage
      .from(bucketName)
      .download(document.file_path);

    if (fileError || !fileData) {
      console.error("storage download error:", fileError);

      await updateDocumentStatus(
        supabase,
        documentId,
        user.id,
        "failed",
        "Error descargando imagen desde Storage"
      );

      return jsonResponse(
        {
          error: "Error descargando imagen desde Storage",
          detail: fileError?.message ?? null,
        },
        500
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Image = encodeBase64(arrayBuffer);

    console.log("image size bytes:", arrayBuffer.byteLength);

    const prompt =
      "Extrae todo el texto visible de esta imagen. Devuelve solo el texto extraído, sin explicaciones. Si no hay texto visible, responde exactamente: NO_TEXT_FOUND";

    console.log("calling Gemini OCR...");
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
          input: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              data: base64Image,
              mime_type: document.file_mime,
            },
          ],
          generation_config: {
            temperature: 0.1,
          },
        }),
      }
    );

    console.log("Gemini OCR status:", geminiResponse.status);

    const geminiTextResponse = await geminiResponse.text();

    if (!geminiResponse.ok) {
      console.error("Gemini OCR error response:", geminiTextResponse);

      await updateDocumentStatus(
        supabase,
        documentId,
        user.id,
        "failed",
        "Error llamando a Gemini OCR"
      );

      return jsonResponse(
        {
          error: "Error llamando a Gemini OCR",
          detail: geminiTextResponse,
        },
        502
      );
    }

    let geminiData: any;

    try {
      geminiData = JSON.parse(geminiTextResponse);
    } catch (_error) {
      console.error("Invalid Gemini OCR JSON:", geminiTextResponse);

      await updateDocumentStatus(
        supabase,
        documentId,
        user.id,
        "failed",
        "Respuesta inválida de Gemini OCR"
      );

      return jsonResponse(
        {
          error: "Respuesta inválida de Gemini OCR",
          detail: geminiTextResponse,
        },
        502
      );
    }

    const extractedText = getGeminiText(geminiData);

    console.log("extracted text length:", extractedText.length);

    if (isNoTextFound(extractedText)) {
      await updateDocumentStatus(
        supabase,
        documentId,
        user.id,
        "failed",
        "No se detectó texto en la imagen"
      );

      return jsonResponse(
        {
          error: "No se detectó texto en la imagen",
        },
        400
      );
    }

    const chunks = splitTextIntoChunks(extractedText, 1000);

    console.log("chunks generated:", chunks.length);

    if (chunks.length === 0) {
      await updateDocumentStatus(
        supabase,
        documentId,
        user.id,
        "failed",
        "No se pudo dividir el texto extraído en chunks"
      );

      return jsonResponse(
        {
          error: "No se pudo dividir el texto extraído en chunks",
        },
        400
      );
    }

    const { error: deleteChunksError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId)
      .eq("user_id", user.id);

    if (deleteChunksError) {
      console.error("delete chunks error:", deleteChunksError);

      await updateDocumentStatus(
        supabase,
        documentId,
        user.id,
        "failed",
        "Error limpiando chunks anteriores"
      );

      return jsonResponse(
        {
          error: "Error limpiando chunks anteriores",
          detail: deleteChunksError.message,
        },
        500
      );
    }

    const chunksToInsert = chunks.map((content, index) => ({
      user_id: user.id,
      document_id: documentId,
      chunk_index: index,
      content,
      token_count: estimateTokenCount(content),
    }));

    const { error: insertChunksError } = await supabase
      .from("document_chunks")
      .insert(chunksToInsert);

    if (insertChunksError) {
      console.error("insert chunks error:", insertChunksError);

      await updateDocumentStatus(
        supabase,
        documentId,
        user.id,
        "failed",
        "Error guardando chunks"
      );

      return jsonResponse(
        {
          error: "Error guardando chunks",
          detail: insertChunksError.message,
        },
        500
      );
    }

    await updateDocumentStatus(supabase, documentId, user.id, "ready", null);

    console.log("image OCR completed successfully");

    return jsonResponse({
      success: true,
      document_id: documentId,
      total_chunks: chunks.length,
      extracted_text_length: extractedText.length,
    });
  } catch (error) {
    console.error("extract-image-text unexpected error:", error);

    return jsonResponse(
      {
        error: "Error interno procesando imagen",
        detail: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
});