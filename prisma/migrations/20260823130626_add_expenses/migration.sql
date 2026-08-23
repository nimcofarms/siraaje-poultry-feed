-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "purchasePlace" TEXT,
    "quantity" REAL,
    "unit" TEXT,
    "unitPrice" REAL,
    "workers" INTEGER,
    "workDays" REAL,
    "laborCost" REAL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "paymentMethod" TEXT,
    "supplier" TEXT,
    "receiptNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
