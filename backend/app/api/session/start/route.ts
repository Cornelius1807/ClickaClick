import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { device } = body;

    if (!device || !['android', 'ios'].includes(device)) {
      return NextResponse.json(
        { error: 'Device debe ser "android" u "ios"' },
        { status: 400 }
      );
    }

    // Generar ID anónimo único
    const userAnonId = randomUUID();

    // Crear sesión
    const session = await prisma.session.create({
      data: {
        userAnonId,
        device,
      },
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        userAnonId: session.userAnonId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en /api/session/start:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
