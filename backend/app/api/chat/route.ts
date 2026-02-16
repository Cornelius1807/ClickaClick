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

    // Detectar intención
    const detection = await detectIntent(text, device === 'ios' ? 'ios' : 'android');

    // Obtener respuesta
    let answerText = 'Lo sentimos, no entendemos tu pregunta. Intenta de otra manera.';
    let videoId: string | undefined;
    let steps: any[] | undefined;

    if (detection.intentId) {
      const response = await getIntentResponse(detection.intentId, device);
      answerText = response.answerText;
      videoId = response.videoId;
      if (response.stepsJson) {
        steps = JSON.parse(response.stepsJson);
      }
    }

    const latencyMs = Date.now() - startTime;

    // Guardar mensaje
    const message = await prisma.message.create({
      data: {
        sessionId,
        userText: text,
        botText: answerText,
        intentId: detection.intentId,
        confidence: detection.confidence,
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
