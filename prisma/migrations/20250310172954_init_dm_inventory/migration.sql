-- CreateTable
CREATE TABLE "dm_inventory" (
    "id" SERIAL NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "oemNumber" TEXT,
    "sellUOM" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "availability" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dm_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dm_inventory_referenceNumber_key" ON "dm_inventory"("referenceNumber");
