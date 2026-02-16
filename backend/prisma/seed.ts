import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Comenzando seed de la base de datos...');

  // Limpiar datos anteriores
  await prisma.message.deleteMany();
  await prisma.session.deleteMany();
  await prisma.surveySEQ.deleteMany();
  await prisma.video.deleteMany();
  await prisma.guide.deleteMany();
  await prisma.intentPhrase.deleteMany();
  await prisma.intent.deleteMany();
  await prisma.supportContact.deleteMany();
  await prisma.supportConfig.deleteMany();
  await prisma.botChangeLog.deleteMany();

  // 1. Crear 10 intenciones iniciales
  const intents = [
    {
      name: 'Aumentar brillo de pantalla',
      deviceScope: 'all',
      answerText: 'Para aumentar el brillo de tu pantalla, abre Configuración y busca "Pantalla" o "Brillo".',
      phrases: ['brillo', 'pantalla oscura', 'celu oscuro', 'aumentar brillo', 'pantalla está muy oscura'],
    },
    {
      name: 'Aumentar volumen',
      deviceScope: 'all',
      answerText: 'Usa los botones de volumen en el lado de tu celular. Presiona el botón de arriba para aumentar.',
      phrases: ['volumen', 'no se escucha', 'hacer más fuerte', 'sonido bajo', 'aumentar sonido'],
    },
    {
      name: 'Conectar a WiFi',
      deviceScope: 'all',
      answerText: 'Ve a Configuración > Redes > WiFi. Selecciona la red que deseas y escribe la contraseña.',
      phrases: ['wifi', 'internet', 'conectar red', 'conexión wifi', 'sin internet'],
    },
    {
      name: 'Usar WhatsApp',
      deviceScope: 'all',
      answerText: 'Abre WhatsApp desde la pantalla de inicio. Toca el ícono verde con la burbuja de chat.',
      phrases: ['wasap', 'whatsapp', 'mensaje', 'chat', 'escribir mensaje'],
    },
    {
      name: 'Hacer llamadas',
      deviceScope: 'all',
      answerText: 'Abre la aplicación Teléfono. Escribe el número o busca un contacto. Presiona el botón verde de llamada.',
      phrases: ['llamar', 'llamada', 'teléfono', 'hablar', 'llamada telefónica'],
    },
    {
      name: 'Agregar contactos',
      deviceScope: 'all',
      answerText: 'Abre la aplicación Contactos. Toca el botón "+". Escribe el nombre y número telefónico.',
      phrases: ['contacto', 'contactos', 'agregar persona', 'guardar número', 'nuevo contacto'],
    },
    {
      name: 'Usar cámara',
      deviceScope: 'all',
      answerText: 'Abre la aplicación Cámara. El botón redondo grande es para tomar fotos. Presiona para capturar.',
      phrases: ['cámara', 'foto', 'fotografia', 'fotografiar', 'sacar foto', 'capturar'],
    },
    {
      name: 'Usar datos móviles',
      deviceScope: 'all',
      answerText: 'Ve a Configuración > Datos móviles. Activa el interruptor si está desactivado.',
      phrases: ['datos', 'datos móviles', 'internet móvil', 'datos del provedidor', 'plan de datos'],
    },
    {
      name: 'Activar Bluetooth',
      deviceScope: 'all',
      answerText: 'Ve a Configuración > Bluetooth. Activa el interruptor. Selecciona el dispositivo a conectar.',
      phrases: ['bluetooth', 'conexión inalámbrica', 'auricular wireless', 'conectar auriculares'],
    },
    {
      name: 'Descargar aplicaciones',
      deviceScope: 'all',
      answerText: 'Abre la tienda de apps (Play Store en Android, App Store en iPhone). Busca la app. Toca "Descargar".',
      phrases: ['app', 'aplicación', 'descargar app', 'instalar', 'bajar aplicación', 'play store', 'app store'],
    },
  ];

  const createdIntents = [];

  for (const intentData of intents) {
    const intent = await prisma.intent.create({
      data: {
        name: intentData.name,
        deviceScope: intentData.deviceScope,
        answerText: intentData.answerText,
        phrases: {
          create: intentData.phrases.map((phrase) => ({
            phrase: phrase.toLowerCase(),
          })),
        },
        guides: {
          create: {
            stepsJson: JSON.stringify([
              { step: 1, text: 'Abre Configuración' },
              { step: 2, text: 'Busca la opción relacionada' },
              { step: 3, text: 'Sigue los pasos indicados' },
            ]),
          },
        },
      },
      include: {
        phrases: true,
        guides: true,
      },
    });
    createdIntents.push(intent);
    console.log(`✓ Intención creada: ${intent.name}`);
  }

  // 2. Crear configuración por defecto
  const supportConfig = await prisma.supportConfig.create({
    data: {
      timezone: 'America/Lima',
      hoursJson: JSON.stringify({
        lunes: { inicio: '08:00', fin: '20:00' },
        martes: { inicio: '08:00', fin: '20:00' },
        miércoles: { inicio: '08:00', fin: '20:00' },
        jueves: { inicio: '08:00', fin: '20:00' },
        viernes: { inicio: '08:00', fin: '20:00' },
        sábado: { inicio: '10:00', fin: '18:00' },
        domingo: { inicio: '10:00', fin: '18:00' },
      }),
    },
  });
  console.log('✓ Configuración de soporte creada');

  // 3. Crear contactos de soporte
  const contacts = [
    { name: 'Matías', phoneE164: '+51997624586' },
    { name: 'César', phoneE164: '+51917092142' },
    { name: 'David', phoneE164: '+51948296623' },
    { name: 'Sergio', phoneE164: '+51980980392' },
    { name: 'José', phoneE164: '+51991790402' },
    { name: 'Melissa', phoneE164: '+51947730487' },
  ];

  for (const contact of contacts) {
    await prisma.supportContact.create({
      data: contact,
    });
    console.log(`✓ Contacto creado: ${contact.name}`);
  }

  console.log('✅ Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
