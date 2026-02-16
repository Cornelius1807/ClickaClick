import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const device = searchParams.get('device');

    if (!device || !['android', 'ios'].includes(device)) {
      return NextResponse.json(
        { error: 'device debe ser "android" u "ios"' },
        { status: 400 }
      );
    }

    const videos = await prisma.video.findMany({
      where: {
        device,
        // Excluiremos videos sin youtubeId (por ahora)
        youtubeId: { not: null },
      },
      include: {
        intent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      {
        videos: videos.map((v) => ({
          id: v.id,
          youtubeId: v.youtubeId,
          title: v.title,
          durationSeconds: v.durationSeconds,
          intentId: v.intent.id,
          intentName: v.intent.name,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/videos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
