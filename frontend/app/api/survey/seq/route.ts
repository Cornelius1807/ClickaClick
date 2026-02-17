import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, score } = body;

    if (!sessionId || !score) {
      return NextResponse.json(
        { error: 'sessionId y score son requeridos' },
        { status: 400 }
      );
    }

    if (![1, 2, 3, 4, 5].includes(score)) {
      return NextResponse.json(
        { error: 'score debe ser entre 1 y 5' },
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

    // Guardar encuesta
    const survey = await prisma.surveySEQ.create({
      data: {
        sessionId,
        score,
      },
    });

    // Marcar que la encuesta fue respondida en esta sesión
    await prisma.session.update({
      where: { id: sessionId },
      data: { seqAnswered: true },
    });

    return NextResponse.json(
      {
        surveyId: survey.id,
        message: 'Encuesta guardada correctamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/survey/seq:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
