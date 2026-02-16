import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth } from '@/lib/utils/auth';

const prisma = new PrismaClient();

// GET: obtener todos los videos
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const videos = await prisma.video.findMany({
      include: {
        intent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      { videos },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/admin/videos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: crear nuevo video
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
    const { intentId, device, youtubeId, title, durationSeconds } = body;

    if (!intentId || !device || !title) {
      return NextResponse.json(
        { error: 'Campos requeridos: intentId, device, title' },
        { status: 400 }
      );
    }

    const video = await prisma.video.create({
      data: {
        intentId,
        device,
        youtubeId: youtubeId || null,
        title,
        durationSeconds: durationSeconds || null,
      },
      include: {
        intent: {
          select: { id: true, name: true },
        },
      },
    });

    // Log cambio
    await prisma.botChangeLog.create({
      data: {
        adminUser: 'admin',
        action: 'create_video',
        payloadJson: JSON.stringify({ intentId, device, title }),
      },
    });

    return NextResponse.json(
      { video },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/admin/videos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
