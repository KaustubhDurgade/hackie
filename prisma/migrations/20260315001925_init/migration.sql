-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "share_token" TEXT NOT NULL,
    "user_id" TEXT,
    "guest_token" TEXT,
    "track" TEXT,
    "time_limit_hrs" INTEGER,
    "team_size" INTEGER,
    "expertise" JSONB,
    "tools" JSONB,
    "judges" JSONB,
    "current_phase" INTEGER NOT NULL DEFAULT 1,
    "phase_data" JSONB,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "token_budget" INTEGER NOT NULL DEFAULT 60000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "phase" INTEGER NOT NULL,
    "canvas_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canvas_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "phase" INTEGER,
    "tokens" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_share_token_key" ON "sessions"("share_token");

-- AddForeignKey
ALTER TABLE "canvas_snapshots" ADD CONSTRAINT "canvas_snapshots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
