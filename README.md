# ClickaClick - Plataforma de Alfabetización Digital

Plataforma web de alfabetización digital para adultos mayores (65+) en Perú. No es un curso: es soporte técnico 24/7 con interfaz accesible, chatbot inteligente y videoteca especializada.

##  Estructura del Proyecto

\\\
ClickaClick/
 frontend/              # Interfaz pública (Next.js + TypeScript + Tailwind)
 backend/               # API + Panel Admin (Next.js + TypeScript + Prisma)
 docs/                  # Documentación y diagramas
 package.json           # Monorepo root
 pnpm-workspace.yaml
 README.md
\\\

##  Características Principales

- **Interfaz Accesible**: Alto contraste, botones grandes, responsive (sin scroll horizontal)
- **Chatbot "El Nieto Virtual"**: Entiende lenguaje coloquial peruano ("celu", "wasap", "face")
- **Videoteca**: Microvideos <2 min separados por Android/iOS
- **Soporte 24/7**: Escalada a WhatsApp con horarios configurables
- **Sin login para usuarios**: Solo admin tiene login
- **Métricas**: SEQ, resolución autónoma, reincidencia, resiliencia del usuario
- **Admin Panel**: CRUD de intenciones, videos, horarios, gráficos

##  Stack Técnico

- **Hosting**: Vercel
- **Framework**: Next.js 14 + TypeScript
- **UI**: TailwindCSS
- **Base de datos**: PostgreSQL (Supabase recomendado)
- **ORM**: Prisma
- **Package Manager**: pnpm

##  Requisitos

- Node.js 18+
- pnpm 8.13.1+
- PostgreSQL 12+ o Supabase

##  Instalación Local

### 1. Clonar el repositorio

\\\ash
git clone https://github.com/Cornelius1807/ClickaClick.git
cd ClickaClick
\\\

### 2. Instalar dependencias

\\\ash
pnpm install
\\\

### 3. Configurar variables de entorno

#### Frontend

\\\ash
cp frontend/.env.example frontend/.env.local
\\\

Editar rontend/.env.local:
\\\
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
\\\

#### Backend

\\\ash
cp backend/.env.example backend/.env.local
\\\

Editar ackend/.env.local:
\\\
# Para desarrollo local con PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/clickaclick"

# Para Supabase
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"

# Admin credentials
ADMIN_USER=admin
ADMIN_PASS=Pass_Forte_123!2024

# Timezone
TIMEZONE=America/Lima
\\\

### 4. Configurar la base de datos

\\\ash
cd backend

# Crear/ejecutar migraciones
pnpm prisma:migrate

# Poblar con datos iniciales (10 intenciones, 6 contactos)
pnpm prisma:seed

# (Opcional) Abrir Prisma Studio
pnpm prisma:studio

cd ..
\\\

### 5. Ejecutar en desarrollo

Terminal 1 - Frontend:
\\\ash
pnpm dev --filter=@clickaclick/frontend
# http://localhost:3000
\\\

Terminal 2 - Backend:
\\\ash
pnpm dev --filter=@clickaclick/backend
# http://localhost:3001
\\\

O ambos en una terminal:
\\\ash
pnpm dev
\\\

##  Usar la Aplicación

### Usuario Final

1. Abre http://localhost:3000
2. Selecciona tu dispositivo (iPhone o Android) - esto es OBLIGATORIO
3. Comienza a hacer preguntas al chatbot
4. A los 5 minutos, aparece una encuesta de facilidad
5. Haz clic en " Ayuda" para contactar con soporte

### Admin

1. Ve a http://localhost:3001/admin/login
2. Credenciales: admin / Pass_Forte_123!2024
3. Acceso a dashboard: http://localhost:3001/admin/dashboard

**Funciones Admin**:
- **Dashboard**: Métricas, alertas, gráficos SEQ
- **Editor Bot**: Crear/editar intenciones y sinónimos
- **Gestión Videos**: Subir YouTube IDs
- **Soporte**: Marcar voluntarios en línea/offline

##  Desplegar en Vercel

### Paso 1: Preparar repositorio

Asegurate de que todo esté committeado en GitHub:
\\\ash
git add .
git commit -m "Deployment inicial"
git push origin main
\\\

### Paso 2: Desplegar Frontend

1. Ve a https://vercel.com/new
2. Selecciona "Git Repository"  Importa ClickaClick
3. Configura:
   - **Project Name**: clickaclick-frontend
   - **Root Directory**: rontend
   - **Build Command**: \pnpm build\
   - **Install Command**: \pnpm install\
4. Agrega env var:
   \\\
   NEXT_PUBLIC_BACKEND_URL=https://clickaclick-backend.vercel.app
   \\\
5. Deploy

### Paso 3: Desplegar Backend

1. Ve a https://vercel.com/new nuevamente
2. Mismo repo, nuevo proyecto:
   - **Project Name**: clickaclick-backend
   - **Root Directory**: \ackend\
   - **Build Command**: \pnpm build\
3. Agrega env vars:
   \\\
   DATABASE_URL=postgresql://...  (Tu Supabase URL)
   ADMIN_USER=admin
   ADMIN_PASS=Pass_Forte_123!2024
   TIMEZONE=America/Lima
   \\\
4. Deploy

### Paso 4: Ejecutar migrations en Supabase

Una vez desplegado:
\\\ash
# Usando la URL de Supabase desde Vercel env
pnpm prisma migrate deploy --skip-generate
pnpm prisma db seed
\\\

O en tu máquina local:
\\\ash
export DATABASE_URL="tu_supabase_url"
pnpm prisma migrate deploy
pnpm prisma db seed
\\\

### Paso 5: Apuntar dominio

Cuando compres clickaclick.com:
- **Frontend**: www.clickaclick.com  CNAME a vercel
- **Backend**: pi.clickaclick.com  CNAME a vercel backend

##  Scripts Disponibles

\\\ash
# Desarrollo
pnpm dev                           # Ambos en paralelo
pnpm dev --filter=@clickaclick/frontend
pnpm dev --filter=@clickaclick/backend

# Build
pnpm build                         # Ambos
pnpm start

# Linting
pnpm lint
pnpm type-check

# Base de datos (en carpeta backend)
cd backend
pnpm prisma:migrate               # Crear/ejecutar migrations
pnpm prisma:seed                  # Poblar datos iniciales
pnpm prisma:studio               # Abrir Prisma Studio UI
\\\

##  APIs Principales

### Públicas (sin auth)

\POST /api/session/start\ - Crear sesión
\POST /api/chat\ - Enviar mensaje
\GET /api/videos?device=android\ - Obtener videoteca
\POST /api/survey/seq\ - Guardar encuesta
\GET /api/support/availability\ - Ver disponibilidad
\GET /api/support/route\ - Obtener contacto WhatsApp

### Admin (require auth)

\POST /api/admin/login\ - Iniciar sesión
\GET /api/admin/metrics\ - Métricas dashboard
\GET /api/admin/intents\ - Listar intenciones
\POST /api/admin/intents\ - Crear intención
\PUT /api/admin/intents/[id]\ - Actualizar intención
\DELETE /api/admin/intents/[id]\ - Eliminar intención
\GET /api/admin/videos\ - Listar videos
\POST /api/admin/videos\ - Crear video
\GET /api/admin/support\ - Ver soporte
\PUT /api/admin/support\ - Actualizar horarios/contactos

##  Métricas Incluidas

- **SEQ** (Single Ease Question): Facilidad a los 5 min
- **Tasa resolución**: (Total - Escaladas) / Total
- **Reincidencia**: Usuarios en múltiples días
- **Resiliencia**: Score que penaliza escaladas

##  Seguridad

- Admin login con cookies httpOnly + CSRF
- Credenciales en .env (no en código)
- Prisma previene SQL injection
- CORS configurado para URLs permitidas

##  Tabla de Géneros y Características

| Característica | Status | Notas |
|---|---|---|
| Selector dispositivo bloqueante |  Implementado | HU5 |
| Chat responsivo sin scroll |  Implementado | HU1 |
| Sinónimos peruanos |  Implementado | HU2 |
| Bot engine sin LLM |  Implementado | - |
| Videoteca accesible |  Implementado | HU4 |
| Soporte WhatsApp 24/7 |  Implementado | HU6 |
| Encuesta SEQ a 5 min |  Implementado | HU10 |
| Admin CRUD |  Implementado | HU3 |
| Voice-to-Text |  Implementado | HU18 |
| Controles +/- texto |  Implementado | HU19 |
| Modo oscuro |  Implementado | HU21 |
| Métricas admin |  Implementado | HU12-HU17 |

##  Próximos Pasos

- [ ] Integrar Gemini API (opcional, no requiere MVP)
- [ ] Agregar idiomas adicionales (Quechua)
- [ ] Implementar notificaciones push
- [ ] Analytics avanzado
- [ ] Pruebas E2E con Cypress

##  Contacto

- **Matías**: +51 997 624 586
- **César**: +51 917 092 142
- **David**: +51 948 296 623
- **Sergio**: +51 980 980 392
- **José**: +51 991 790 402
- **Melissa**: +51 947 730 487

##  Licencia

MIT
