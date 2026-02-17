import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { detectIntent, getIntentResponse } from '@/lib/utils/bot-engine';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, device, text } = body;

    if (!sessionId || !device || !text) {
      return NextResponse.json(
        { error: 'sessionId, device y text son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la sesión existe
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session no encontrada' },
        { status: 404 }
      );
    }

    const startTime = Date.now();

    // Preparar variables de respuesta
    let answerText = 'Lo sentimos, no entendemos tu pregunta. Intenta de otra manera.';
    let videoId: string | undefined;
    let steps: any[] | undefined;

    // Mantener el resultado de la detección para guardar más tarde
    let detection: {
      intentId?: string | null;
      intentName?: string | null;
      confidence?: number | null;
    } = { intentId: null, intentName: null, confidence: null };

    // Step 1: Try to detect intent using bot-engine
    const deviceScope = device === 'ios' ? 'ios' : 'android';
    detection = await detectIntent(text, deviceScope);

    // Step 2: Fetch ALL available videos for this device (for Gemini matching)
    const availableVideos = await prisma.video.findMany({
      where: {
        device: deviceScope,
        youtubeId: { not: null },
      },
      include: {
        intent: { select: { name: true } },
      },
    });
    console.log(`[CHAT] Available videos for ${deviceScope}:`, availableVideos.map((v: any) => `${v.title} (${v.intent?.name})`));

    // Step 3: Call Gemini — let IT decide which video matches (if any)
    if (process.env.GEMINI_API_KEY) {
      console.log('[CHAT] LLM branch entered');
      try {
        const { askGemini } = await import('@/lib/utils/gemini');
        const deviceName = device === 'ios' ? 'iPhone' : 'Android';

        // Build video catalog for Gemini
        let videoCatalog = '';
        if (availableVideos.length > 0) {
          const videoList = availableVideos.map((v: any, i: number) =>
            `  ${i + 1}. ID="${v.youtubeId}" | Tema: "${v.intent?.name || 'Sin tema'}" | Titulo: "${v.title}"`
          ).join('\n');
          videoCatalog = `
CATALOGO DE VIDEOS DISPONIBLES para ${deviceName}:
${videoList}

REGLA CRITICA SOBRE VIDEOS:
- Si la pregunta del usuario se relaciona con CUALQUIERA de los videos del catalogo, DEBES responder SOLO recomendando el video.
- NO des pasos escritos si hay un video relacionado.
- Incluye EXACTAMENTE esta etiqueta al FINAL de tu respuesta: [VIDEO:ID_DEL_VIDEO] (reemplaza ID_DEL_VIDEO con el ID real del video que corresponde).
- Tu respuesta debe ser algo como: "¡Abuelito/a! Tengo un video que te muestra exactamente cómo hacerlo. Míralo aquí abajito y si después de verlo todavía tienes dudas, escríbeme y te explico paso a paso."
- Solo da pasos escritos si NINGUN video del catalogo se relaciona con la pregunta.`;
        }

        const prompt = `Eres el Nieto Virtual de ClickaClick, un asistente tecnico amable para adultos mayores en Peru.
Dispositivo: ${deviceName}
Pregunta del usuario: "${text}"
${videoCatalog}

INSTRUCCIONES GENERALES:
1. Usa palabras simples, habla como un nieto/a carinoso
2. En espanol peruano
3. Si no puedes responder, ofrece contactar por WhatsApp
${availableVideos.length > 0 ? '4. PRIORIDAD: Si hay video relacionado, SIEMPRE recomienda el video primero (NO des pasos). Incluye [VIDEO:ID] al final.' : '4. Responde en formato numerado (1, 2, 3...) con maximo 4-5 pasos claros y simples.'}

Respuesta:`;
        console.log('[CHAT] Calling askGemini...');
        const llmAnswer = await askGemini(prompt);
        console.log('[CHAT] Gemini returned len:', llmAnswer?.length);
        console.log('[CHAT] Gemini raw answer:', llmAnswer?.substring(0, 300));

        if (llmAnswer && llmAnswer.trim().length > 0) {
          // Extract [VIDEO:ID] tag if present
          const videoTagMatch = llmAnswer.match(/\[VIDEO:([^\]]+)\]/);
          if (videoTagMatch) {
            const matchedYoutubeId = videoTagMatch[1].trim();
            // Verify this ID exists in our catalog
            const matchedVid = availableVideos.find((v: any) => v.youtubeId === matchedYoutubeId);
            if (matchedVid) {
              videoId = matchedYoutubeId;
              // Also set the intentId from the matched video for metrics
              if (!detection.intentId && matchedVid.intentId) {
                detection.intentId = matchedVid.intentId;
                detection.intentName = matchedVid.intent?.name || null;
                detection.confidence = 0.9;
              }
              console.log(`[CHAT] Gemini matched video: ${matchedVid.title} (${matchedYoutubeId})`);
            }
            // Remove the tag from the displayed answer
            answerText = llmAnswer.replace(/\s*\[VIDEO:[^\]]+\]\s*/g, '').trim();
          } else {
            answerText = llmAnswer;
          }
        }
      } catch (e) {
        console.error('[CHAT] Error calling Gemini:', e);
      }
    }

    // Fallback: si LLM no devolvio respuesta, usar bot tradicional
    if (!answerText || answerText === 'Lo sentimos, no entendemos tu pregunta. Intenta de otra manera.') {
      if (detection.intentId) {
        const response = await getIntentResponse(detection.intentId, device);
        if (response.answerText && response.answerText.trim().length > 0) {
          answerText = response.answerText;
        }
        if (!videoId && response.videoId) {
          videoId = response.videoId;
        }
        if (response.stepsJson) {
          steps = JSON.parse(response.stepsJson);
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    // Guardar mensaje
    const message = await prisma.message.create({
      data: {
        sessionId,
        userText: text,
        botText: answerText,
        intentId: detection.intentId || undefined,
        confidence: detection.confidence || undefined,
        latencyMs,
      },
    });

    return NextResponse.json(
      {
        messageId: message.id,
        answerText,
        videoId,
        steps,
        intentName: detection.intentName,
        confidence: detection.confidence,
        latencyMs,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error en /api/chat:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
