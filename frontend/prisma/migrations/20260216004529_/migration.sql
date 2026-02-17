-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userAnonId" VARCHAR(50) NOT NULL,
    "device" VARCHAR(20) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "seqAnswered" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userText" TEXT NOT NULL,
    "botText" TEXT NOT NULL,
    "intentId" TEXT,
    "confidence" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "escalatedToWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intent" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "deviceScope" VARCHAR(20) NOT NULL,
    "answerText" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Intent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentPhrase" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "phrase" VARCHAR(255) NOT NULL,

    CONSTRAINT "IntentPhrase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "stepsJson" TEXT NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "intentId" TEXT NOT NULL,
    "device" VARCHAR(20) NOT NULL,
    "youtubeId" VARCHAR(50),
    "title" VARCHAR(255) NOT NULL,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveySEQ" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveySEQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportConfig" (
    "id" TEXT NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Lima',
    "hoursJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportContact" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phoneE164" VARCHAR(20) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotChangeLog" (
    "id" TEXT NOT NULL,
    "adminUser" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_userAnonId_idx" ON "Session"("userAnonId");

-- CreateIndex
CREATE INDEX "Session_startedAt_idx" ON "Session"("startedAt");

-- CreateIndex
CREATE INDEX "Message_sessionId_idx" ON "Message"("sessionId");

-- CreateIndex
CREATE INDEX "Message_intentId_idx" ON "Message"("intentId");

-- CreateIndex
CREATE INDEX "Message_escalatedToWhatsapp_idx" ON "Message"("escalatedToWhatsapp");

-- CreateIndex
CREATE INDEX "Intent_deviceScope_idx" ON "Intent"("deviceScope");

-- CreateIndex
CREATE INDEX "IntentPhrase_intentId_idx" ON "IntentPhrase"("intentId");

-- CreateIndex
CREATE UNIQUE INDEX "IntentPhrase_intentId_phrase_key" ON "IntentPhrase"("intentId", "phrase");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_intentId_key" ON "Guide"("intentId");

-- CreateIndex
CREATE INDEX "Guide_intentId_idx" ON "Guide"("intentId");

-- CreateIndex
CREATE INDEX "Video_intentId_idx" ON "Video"("intentId");

-- CreateIndex
CREATE INDEX "Video_device_idx" ON "Video"("device");

-- CreateIndex
CREATE UNIQUE INDEX "Video_intentId_device_key" ON "Video"("intentId", "device");

-- CreateIndex
CREATE INDEX "SurveySEQ_sessionId_idx" ON "SurveySEQ"("sessionId");

-- CreateIndex
CREATE INDEX "SurveySEQ_createdAt_idx" ON "SurveySEQ"("createdAt");

-- CreateIndex
CREATE INDEX "SupportContact_isActive_idx" ON "SupportContact"("isActive");

-- CreateIndex
CREATE INDEX "SupportContact_isOnline_idx" ON "SupportContact"("isOnline");

-- CreateIndex
CREATE INDEX "BotChangeLog_adminUser_idx" ON "BotChangeLog"("adminUser");

-- CreateIndex
CREATE INDEX "BotChangeLog_createdAt_idx" ON "BotChangeLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "Intent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentPhrase" ADD CONSTRAINT "IntentPhrase_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "Intent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "Intent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_intentId_fkey" FOREIGN KEY ("intentId") REFERENCES "Intent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveySEQ" ADD CONSTRAINT "SurveySEQ_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
