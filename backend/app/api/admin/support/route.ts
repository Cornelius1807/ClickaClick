import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAdminAuth } from '@/lib/utils/auth';

const prisma = new PrismaClient();

// GET: obtener configuración de horarios y contactos
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const config = await prisma.supportConfig.findFirst();
    const contacts = await prisma.supportContact.findMany();

    return NextResponse.json(
      { config, contacts },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en GET /api/admin/support:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT: actualizar horarios
export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    if (action === 'update_hours') {
      const config = await prisma.supportConfig.updateMany({
        data: {
          hoursJson: JSON.stringify(data.hours),
        },
      });

      // Log cambio
      await prisma.botChangeLog.create({
        data: {
          adminUser: 'admin',
          action: 'update_support_hours',
          payloadJson: JSON.stringify(data.hours),
        },
      });

      return NextResponse.json(
        { message: 'Horarios actualizados' },
        { status: 200 }
      );
    }

    if (action === 'toggle_contact') {
      const { contactId, isOnline } = data;
      await prisma.supportContact.update({
        where: { id: contactId },
        data: { isOnline },
      });

      // Log cambio
      await prisma.botChangeLog.create({
        data: {
          adminUser: 'admin',
          action: 'update_contact_status',
          payloadJson: JSON.stringify({ contactId, isOnline }),
        },
      });

      return NextResponse.json(
        { message: 'Estado del contacto actualizado' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error en PUT /api/admin/support:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
