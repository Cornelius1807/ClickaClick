import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    // 1. PRIORIDAD: Verificar si hay voluntarios en línea en la BD
    //    Si un admin marcó a alguien como "online", eso tiene prioridad
    //    sobre cualquier configuración de horarios.
    const onlineContacts = await prisma.supportContact.findMany({
      where: {
        isActive: true,
        isOnline: true,
      },
    });

    if (onlineContacts.length > 0) {
      // Seleccionar contacto aleatorio (HU17: enrutamiento aleatorio)
      const selectedContact =
        onlineContacts[Math.floor(Math.random() * onlineContacts.length)];

      // Registrar escalada si hay sesión
      if (sessionId) {
        try {
          // Marcar el último mensaje de la sesión como escalado
          const lastMessage = await prisma.message.findFirst({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
          });
          if (lastMessage) {
            await prisma.message.update({
              where: { id: lastMessage.id },
              data: { escalatedToWhatsapp: true },
            });
          }
        } catch (e) {
          console.error('[SUPPORT] Error registering escalation:', e);
        }
      }

      const messageBody = encodeURIComponent(
        '¡Hola! Necesito ayuda de ClickaClick.'
      );

      return NextResponse.json(
        {
          isOpen: true,
          phone: selectedContact.phoneE164,
          name: selectedContact.name,
          waLink: `https://wa.me/${selectedContact.phoneE164.replace('+', '')}?text=${messageBody}`,
          message: `Conectando con ${selectedContact.name}...`,
        },
        { status: 200 }
      );
    }

    // 2. Si no hay nadie online, verificar horario de soporte (si existe config)
    const config = await prisma.supportConfig.findFirst();

    if (config) {
      const now = new Date();
      const peruTime = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/Lima' })
      );
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[peruTime.getDay()];

      const hoursPerDay: any = JSON.parse(config.hoursJson);
      const dayHours = hoursPerDay[dayName];

      if (dayHours) {
        const currentTime = `${String(peruTime.getHours()).padStart(2, '0')}:${String(peruTime.getMinutes()).padStart(2, '0')}`;
        const isWithinHours =
          currentTime >= dayHours.inicio && currentTime <= dayHours.fin;

        if (isWithinHours) {
          return NextResponse.json(
            {
              isOpen: false,
              message:
                'Estamos en horario de atención pero no hay voluntarios disponibles ahora. Intenta en unos minutos.',
            },
            { status: 200 }
          );
        } else {
          return NextResponse.json(
            {
              isOpen: false,
              message: `Soporte cerrado ahora. Nuestro horario hoy es de ${dayHours.inicio} a ${dayHours.fin} (hora Perú).`,
            },
            { status: 200 }
          );
        }
      }
    }

    // 3. Sin config y sin nadie online → mensaje genérico
    // Verificar si hay algún contacto activo (aunque offline) para dar esperanza
    const activeContacts = await prisma.supportContact.count({
      where: { isActive: true },
    });

    return NextResponse.json(
      {
        isOpen: false,
        message:
          activeContacts > 0
            ? 'No hay voluntarios disponibles en este momento. Intenta más tarde.'
            : 'El soporte no está disponible por ahora.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en /api/support/route:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
