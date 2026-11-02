-- Newsletter is in schema.prisma but was missing from the migration history.
CREATE TABLE "Newsletter" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Newsletter_email_key" ON "Newsletter"("email");
