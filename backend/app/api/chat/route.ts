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

    if (process.env.GEMINI_API_KEY) {
      console.log('[CHAT] LLM branch entered');
      try {
        const { askGemini } = await import('@/lib/utils/gemini');
        const deviceName = device === 'ios' ? 'iPhone' : 'Android';
        const prompt = `Eres el Nieto Virtual de ClickaClick, un asistente tecnico amable para adultos mayores en Peru.
Dispositivo: ${deviceName}
Pregunta: "${text}"

INSTRUCCIONES: SIEMPRE responde en formato numerado (1, 2, 3...)
Maximo 4-5 pasos, cada uno MUY claro y simple.
1. Usa palabras simples
2. Habla como nieto/a
3. En espanol peruano
4. Si no puedes, ofrece WhatsApp

Respuesta:`;
        console.log('[CHAT] Calling askGemini...');
        const llmAnswer = await askGemini(prompt);
        console.log('[CHAT] Gemini returned len:', llmAnswer?.length);
        if (llmAnswer && llmAnswer.trim().length > 0) {
          answerText = llmAnswer;
        }
      } catch (e) {
        console.error('[CHAT] Error calling Gemini:', e);
      }
    }

    // Fallback: si LLM no devolvio respuesta, usar bot tradicional
    if (!answerText || answerText.trim().length === 0) {
      detection = await detectIntent(text, device === 'ios' ? 'ios' : 'android');
      if (detection.intentId) {
        const response = await getIntentResponse(detection.intentId, device);
        answerText = response.answerText;
        videoId = response.videoId;
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
