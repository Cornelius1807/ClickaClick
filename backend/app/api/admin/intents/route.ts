import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth } from '@/lib/utils/auth';

const prisma = new PrismaClient();

// GET: obtener todas las intenciones
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const intents = await prisma.intent.findMany({
      include: {
        phrases: true,
        videos: true,
        guides: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { intents },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/admin/intents:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: crear nueva intención
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, deviceScope, answerText, phrases, steps } = body;

    if (!name || !deviceScope || !answerText) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, deviceScope, answerText' },
        { status: 400 }
      );
    }

    const intent = await prisma.intent.create({
      data: {
        name,
        deviceScope,
        answerText,
        phrases: {
          create: (phrases || []).map((phrase: string) => ({
            phrase: phrase.toLowerCase(),
          })),
        },
        guides: {
          create: {
            stepsJson: JSON.stringify(steps || []),
          },
        },
      },
      include: {
        phrases: true,
        guides: true,
      },
    });

    // Log cambio
    await prisma.botChangeLog.create({
      data: {
        adminUser: 'admin',
        action: 'create_intent',
        payloadJson: JSON.stringify({ name, deviceScope }),
      },
    });

    return NextResponse.json(
      { intent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/admin/intents:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
