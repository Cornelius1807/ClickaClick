import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth } from '@/lib/utils/auth';

const prisma = new PrismaClient();

// PUT: actualizar intención
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { name, deviceScope, answerText, phrases } = body;

    const intent = await prisma.intent.update({
      where: { id },
      data: {
        name: name || undefined,
        deviceScope: deviceScope || undefined,
        answerText: answerText || undefined,
      },
      include: {
        phrases: true,
        guides: true,
        videos: true,
      },
    });

    // Si hay frases nuevas, actualizar
    if (phrases && Array.isArray(phrases)) {
      await prisma.intentPhrase.deleteMany({ where: { intentId: id } });
      await prisma.intentPhrase.createMany({
        data: phrases.map((phrase: string) => ({
          intentId: id,
          phrase: phrase.toLowerCase(),
        })),
      });
    }

    // Log cambio
    await prisma.botChangeLog.create({
      data: {
        adminUser: 'admin',
        action: 'update_intent',
        payloadJson: JSON.stringify({ id, name, deviceScope }),
      },
    });

    return NextResponse.json(
      { intent },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en PUT /api/admin/intents/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE: eliminar intención
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;

    await prisma.intent.delete({
      where: { id },
    });

    // Log cambio
    await prisma.botChangeLog.create({
      data: {
        adminUser: 'admin',
        action: 'delete_intent',
        payloadJson: JSON.stringify({ id }),
      },
    });

    return NextResponse.json(
      { message: 'Intención eliminada' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en DELETE /api/admin/intents/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
