import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth } from '@/lib/utils/auth';

const prisma = new PrismaClient();

// DELETE: eliminar video
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

    await prisma.video.delete({
      where: { id },
    });

    // Log cambio
    await prisma.botChangeLog.create({
      data: {
        adminUser: 'admin',
        action: 'delete_video',
        payloadJson: JSON.stringify({ id }),
      },
    });

    return NextResponse.json(
      { message: 'Video eliminado' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en DELETE /api/admin/videos/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
