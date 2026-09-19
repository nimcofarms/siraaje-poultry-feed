import { auditUserInclude } from "@/lib/audit";
import {
  getCurrentUser,
  hasPermission,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// =========================================================
// TYPES
// =========================================================

type AccountCategory =
  | "expenses"
  | "eggs"
  | "feeds"
  | "chicken";

type EntryType =
  | "PURCHASE"
  | "SALE"
  | "EXPENSE";

type TransactionFilter = "ALL" | "PURCHASE" | "SALE" | "EXPENSE";
type FeedTypeFilter = "ALL" | "Starter" | "Grower" | "Layer";

type AuditUserInfo = {
  id: string;
  name: string;
  role: string;
};

type AccountEntry = {
  id: string;
  date: string;
  category: AccountCategory;
  categoryLabel: string;
  type: EntryType;
  source: string;
  description: string;
  location: string | null;
  party: string | null;
  quantity: number | null;
  unitPrice: number | null;
  total: number;
  currency: string;
  createdAt: string;
  createdBy: AuditUserInfo | null;
  feedType?: string | null;
};

type CurrencySummary = {
  currency: string;
  sales: number;
  purchases: number;
  expenses: number;
  outgoing: number;
  netResult: number;
  records: number;
};

type CategorySummary = {
  category: AccountCategory;
  label: string;
  currency: string;
  sales: number;
  purchases: number;
  expenses: number;
  outgoing: number;
  netResult: number;
  records: number;
};

type ProductionEntry = {
  id: string;
  batchId: string;
  itemId: string;
  date: string;
  location: string;
  feedType: string;
  bagSizeKg: number;
  quantity: number;
  totalKg: number;
  createdAt: string;
  createdBy: AuditUserInfo | null;
};

type ProductionFeedSummary = {
  feedType: string;
  batches: number;
  records: number;
  bags: number;
  totalKg: number;
};

// =========================================================
// CONSTANTS
// =========================================================

const ALL_CATEGORIES: AccountCategory[] = [
  "expenses",
  "eggs",
  "feeds",
  "chicken",
];

const CATEGORY_LABELS: Record<AccountCategory, string> = {
  expenses: "Kharashaadka / Expenses",
  eggs: "Ukumaha / Eggs",
  feeds: "Quudinta / Feeds",
  chicken: "Digaag / Chicken",
};

const ALLOWED_TRANSACTION_FILTERS: TransactionFilter[] = [
  "ALL", "PURCHASE", "SALE", "EXPENSE",
];

const ALLOWED_FEED_TYPES: FeedTypeFilter[] = [
  "ALL", "Starter", "Grower", "Layer",
];

// =========================================================
// HELPERS
// =========================================================

function normalizeCurrency(currency: string | null | undefined) {
  const value = String(currency || "ETB")
    .trim()
    .toUpperCase();

  return value || "ETB";
}

function parseCategories(
  value: string | null
): AccountCategory[] {
  if (!value) {
    return [...ALL_CATEGORIES];
  }

  const requested = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const categories = requested.filter(
    (item): item is AccountCategory =>
      ALL_CATEGORIES.includes(item as AccountCategory)
  );

  return [...new Set(categories)];
}

function parseTransactionFilter(value: string | null): TransactionFilter {
  const v = String(value || "ALL").trim().toUpperCase() as TransactionFilter;
  return ALLOWED_TRANSACTION_FILTERS.includes(v) ? v : "ALL";
}

function parseFeedTypeFilter(value: string | null): FeedTypeFilter {
  const raw = String(value || "ALL").trim();
  return ALLOWED_FEED_TYPES.find(
    (item) => item.toLowerCase() === raw.toLowerCase()
  ) || "ALL";
}

function auditUser(
  user: { id: string; name: string; role: string } | null | undefined
): AuditUserInfo | null {
  return user ? { id: user.id, name: user.name, role: user.role } : null;
}

function getMonthRange(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  const [yearText, monthText] = month.split("-");

  const year = Number(yearText);
  const monthNumber = Number(monthText);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(monthNumber) ||
    monthNumber < 1 ||
    monthNumber > 12
  ) {
    return null;
  }

  const start = new Date(
    Date.UTC(year, monthNumber - 1, 1, 0, 0, 0, 0)
  );

  const end = new Date(
    Date.UTC(year, monthNumber, 1, 0, 0, 0, 0)
  );

  return {
    start,
    end,
  };
}

function safeNumber(value: number | null | undefined) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
}

function nullableNumber(
  value: number | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function addCurrencySummary(
  summaries: Map<string, CurrencySummary>,
  entry: AccountEntry
) {
  const currency = normalizeCurrency(entry.currency);

  const current =
    summaries.get(currency) || {
      currency,
      sales: 0,
      purchases: 0,
      expenses: 0,
      outgoing: 0,
      netResult: 0,
      records: 0,
    };

  if (entry.type === "SALE") {
    current.sales += entry.total;
  }

  if (entry.type === "PURCHASE") {
    current.purchases += entry.total;
  }

  if (entry.type === "EXPENSE") {
    current.expenses += entry.total;
  }

  current.outgoing =
    current.purchases + current.expenses;

  current.netResult =
    current.sales - current.outgoing;

  current.records += 1;

  summaries.set(currency, current);
}

function addCategorySummary(
  summaries: Map<string, CategorySummary>,
  entry: AccountEntry
) {
  const currency = normalizeCurrency(entry.currency);

  const key = `${entry.category}:${currency}`;

  const current =
    summaries.get(key) || {
      category: entry.category,
      label: CATEGORY_LABELS[entry.category],
      currency,
      sales: 0,
      purchases: 0,
      expenses: 0,
      outgoing: 0,
      netResult: 0,
      records: 0,
    };

  if (entry.type === "SALE") {
    current.sales += entry.total;
  }

  if (entry.type === "PURCHASE") {
    current.purchases += entry.total;
  }

  if (entry.type === "EXPENSE") {
    current.expenses += entry.total;
  }

  current.outgoing =
    current.purchases + current.expenses;

  current.netResult =
    current.sales - current.outgoing;

  current.records += 1;

  summaries.set(key, current);
}

// =========================================================
// GET MONTHLY ACCOUNTS
// =========================================================

export async function GET(request: Request) {
  try {
    // =====================================================
    // AUTHORIZATION
    // =====================================================

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error: "You are not logged in.",
        },
        {
          status: 401,
        }
      );
    }

    if (!hasPermission(currentUser, "accountsView")) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to view monthly accounts.",
        },
        {
          status: 403,
        }
      );
    }

    // =====================================================
    // QUERY PARAMETERS
    // =====================================================

    const url = new URL(request.url);

    const month = url.searchParams.get("month");

    if (!month) {
      return NextResponse.json(
        {
          error:
            "Month is required. Use the format YYYY-MM.",
        },
        {
          status: 400,
        }
      );
    }

    const monthRange = getMonthRange(month);

    if (!monthRange) {
      return NextResponse.json(
        {
          error:
            "Invalid month. Use the format YYYY-MM.",
        },
        {
          status: 400,
        }
      );
    }

    const categories = parseCategories(
      url.searchParams.get("categories")
    );

    if (categories.length === 0) {
      return NextResponse.json(
        {
          error:
            "Select at least one valid account category.",
        },
        {
          status: 400,
        }
      );
    }

    const transaction = parseTransactionFilter(
      url.searchParams.get("transaction")
    );
    const company = String(url.searchParams.get("company") || "").trim();
    const feedType = parseFeedTypeFilter(
      url.searchParams.get("feedType")
    );

    const dateFilter = {
      gte: monthRange.start,
      lt: monthRange.end,
    };

    const rawEntries: AccountEntry[] = [];

    // =====================================================
    // EXPENSES
    // =====================================================

    if (categories.includes("expenses")) {
      const [
        generalExpenses,
        constructionExpenses,
        productExpenses,
      ] = await Promise.all([
        prisma.expense.findMany({
          include: auditUserInclude,
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.constructionExpense.findMany({
          include: auditUserInclude,
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.productExpense.findMany({
          include: auditUserInclude,
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      for (const item of generalExpenses) {
        rawEntries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "expenses",
          categoryLabel:
            CATEGORY_LABELS.expenses,
          type: "EXPENSE",
          source: "General Expense",
          description:
            item.name ||
            item.category ||
            "General Expense",
          location: item.purchasePlace || null,
          party: item.supplier || null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.unitPrice),
          total: safeNumber(item.amount),
          currency: normalizeCurrency(item.currency),
          createdAt: item.createdAt.toISOString(),
          createdBy: item.createdBy
            ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
                role: item.createdBy.role,
              }
            : null,
        });
      }

      for (const item of constructionExpenses) {
        rawEntries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "expenses",
          categoryLabel:
            CATEGORY_LABELS.expenses,
          type: "EXPENSE",
          source: "Construction Expense",
          description: `${item.name} - ${item.type}`,
          location: item.location || null,
          party: null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
          createdAt: item.createdAt.toISOString(),
          createdBy: item.createdBy
            ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
                role: item.createdBy.role,
              }
            : null,
        });
      }

      for (const item of productExpenses) {
        rawEntries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "expenses",
          categoryLabel:
            CATEGORY_LABELS.expenses,
          type: "EXPENSE",
          source: "Product Expense",
          description: `${item.name} - ${item.type}`,
          location: item.location || null,
          party: null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
          createdAt: item.createdAt.toISOString(),
          createdBy: item.createdBy
            ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
                role: item.createdBy.role,
              }
            : null,
        });
      }
    }

    // =====================================================
    // EGGS
    // =====================================================

    if (categories.includes("eggs")) {
      const [
        purchasedEggs,
        eggSales,
      ] = await Promise.all([
        prisma.purchasedEgg.findMany({
          include: auditUserInclude,
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.eggSale.findMany({
          include: auditUserInclude,
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      for (const item of purchasedEggs) {
        rawEntries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "eggs",
          categoryLabel: CATEGORY_LABELS.eggs,
          type: "PURCHASE",
          source: "Egg Purchase",
          description: "Purchased Eggs",
          location: item.location || null,
          party: item.companyName || null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
          createdAt: item.createdAt.toISOString(),
          createdBy: item.createdBy
            ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
                role: item.createdBy.role,
              }
            : null,
        });
      }

      for (const item of eggSales) {
        rawEntries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "eggs",
          categoryLabel: CATEGORY_LABELS.eggs,
          type: "SALE",
          source: "Egg Sale",
          description:
            item.customerType
              ? `Egg Sale - ${item.customerType}`
              : "Egg Sale",
          location: item.location || null,
          party: item.companyName || null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
          createdAt: item.createdAt.toISOString(),
          createdBy: item.createdBy
            ? {
                id: item.createdBy.id,
                name: item.createdBy.name,
                role: item.createdBy.role,
              }
            : null,
        });
      }
    }

    // =====================================================
    // FEEDS - PURCHASE + SALE
    // =====================================================

    if (categories.includes("feeds")) {
      const feeds = await prisma.feed.findMany({
        include: auditUserInclude,
        where: { date: dateFilter },
        orderBy: { date: "asc" },
      });

      for (const item of feeds) {
        const feedTransaction: "PURCHASE" | "SALE" =
          item.transactionType === "SALE" ? "SALE" : "PURCHASE";

        rawEntries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "feeds",
          categoryLabel: CATEGORY_LABELS.feeds,
          type: feedTransaction,
          source: feedTransaction === "SALE" ? "Feed Sale" : "Feed Purchase",
          description: item.feedType,
          feedType: item.feedType,
          location: item.location || null,
          party: item.companyName || item.suppliedBy || null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
          createdAt: item.createdAt.toISOString(),
          createdBy: auditUser(item.createdBy),
        });
      }
    }

/* =====================================================
       CHICKEN
    ===================================================== */

    if (
      categories.includes(
        "chicken"
      )
    ) {
      const [
        livePurchases,
        liveSales,
        meatPurchases,
        meatSales,
      ] = await Promise.all([
        prisma.liveChickenPurchase.findMany(
          {
            include:
              auditUserInclude,
            where: {
              date: dateFilter,
            },
            orderBy: {
              date: "asc",
            },
          }
        ),

        prisma.liveChickenSale.findMany(
          {
            include:
              auditUserInclude,
            where: {
              date: dateFilter,
            },
            orderBy: {
              date: "asc",
            },
          }
        ),

        prisma.chickenMeatPurchase.findMany(
          {
            include:
              auditUserInclude,
            where: {
              date: dateFilter,
            },
            orderBy: {
              date: "asc",
            },
          }
        ),

        prisma.chickenMeatSale.findMany(
          {
            include:
              auditUserInclude,
            where: {
              date: dateFilter,
            },
            orderBy: {
              date: "asc",
            },
          }
        ),
      ]);

      /* LIVE CHICKEN PURCHASES */

      for (
        const item of
        livePurchases
      ) {
        rawEntries.push({
          id: item.id,
          date:
            item.date.toISOString(),

          category: "chicken",

          categoryLabel:
            CATEGORY_LABELS.chicken,

          type: "PURCHASE",

          source:
            "Live Chicken Purchase",

          description:
            `${item.chickenType} - ` +
            `${item.ageNumber} ${item.ageUnit}`,

          location:
            item.location || null,

          party: null,

          quantity:
            nullableNumber(
              item.quantity
            ),

          unitPrice:
            nullableNumber(
              item.price
            ),

          total:
            safeNumber(
              item.total
            ),

          currency:
            normalizeCurrency(
              item.currency
            ),

          createdAt:
            item.createdAt.toISOString(),

          createdBy:
            auditUser(
              item.createdBy
            ),
        });
      }

      /* LIVE CHICKEN SALES */

      for (
        const item of liveSales
      ) {
        rawEntries.push({
          id: item.id,

          date:
            item.date.toISOString(),

          category: "chicken",

          categoryLabel:
            CATEGORY_LABELS.chicken,

          type: "SALE",

          source:
            "Live Chicken Sale",

          description:
            `${item.chickenType} - ` +
            `${item.ageNumber} ${item.ageUnit}`,

          location:
            item.location || null,

          party: null,

          quantity:
            nullableNumber(
              item.quantity
            ),

          unitPrice:
            nullableNumber(
              item.price
            ),

          total:
            safeNumber(
              item.total
            ),

          currency:
            normalizeCurrency(
              item.currency
            ),

          createdAt:
            item.createdAt.toISOString(),

          createdBy:
            auditUser(
              item.createdBy
            ),
        });
      }

      /* CHICKEN MEAT PURCHASES */

      for (
        const item of
        meatPurchases
      ) {
        rawEntries.push({
          id: item.id,

          date:
            item.date.toISOString(),

          category: "chicken",

          categoryLabel:
            CATEGORY_LABELS.chicken,

          type: "PURCHASE",

          source:
            "Chicken Meat Purchase",

          description:
            "Chicken Meat",

          location:
            item.location || null,

          party:
            item.companyName ||
            null,

          quantity:
            nullableNumber(
              item.quantity
            ),

          unitPrice:
            nullableNumber(
              item.price
            ),

          total:
            safeNumber(
              item.total
            ),

          currency:
            normalizeCurrency(
              item.currency
            ),

          createdAt:
            item.createdAt.toISOString(),

          createdBy:
            auditUser(
              item.createdBy
            ),
        });
      }

      /* CHICKEN MEAT SALES */

      for (
        const item of
        meatSales
      ) {
        rawEntries.push({
          id: item.id,

          date:
            item.date.toISOString(),

          category: "chicken",

          categoryLabel:
            CATEGORY_LABELS.chicken,

          type: "SALE",

          source:
            "Chicken Meat Sale",

          description:
            `Chicken Meat - ${item.customerType}`,

          location:
            item.location || null,

          party:
            item.branch || null,

          quantity:
            nullableNumber(
              item.quantity
            ),

          unitPrice:
            nullableNumber(
              item.price
            ),

          total:
            safeNumber(
              item.total
            ),

          currency:
            normalizeCurrency(
              item.currency
            ),

          createdAt:
            item.createdAt.toISOString(),

          createdBy:
            auditUser(
              item.createdBy
            ),
        });
      }
    }

    /* =====================================================
       AVAILABLE COMPANIES / PARTIES

       This is calculated BEFORE company filtering.

       That means the frontend can show the complete
       dropdown for the selected month/categories.
    ===================================================== */

    const availableParties =
      Array.from(
        new Set(
          rawEntries
            .map((entry) =>
              String(
                entry.party || ""
              ).trim()
            )
            .filter(Boolean)
        )
      ).sort((a, b) =>
        a.localeCompare(b)
      );

    /* =====================================================
       APPLY TRANSACTION FILTER
    ===================================================== */

    let entries = [
      ...rawEntries,
    ];

    if (
      transaction !== "ALL"
    ) {
      entries = entries.filter(
        (entry) =>
          entry.type === transaction
      );
    }

    /* =====================================================
       APPLY COMPANY / PARTY FILTER
    ===================================================== */

    if (company) {
      const normalizedCompany =
        company.toLowerCase();

      entries = entries.filter(
        (entry) =>
          String(
            entry.party || ""
          )
            .trim()
            .toLowerCase() ===
          normalizedCompany
      );
    }

    /* =====================================================
       APPLY FEED TYPE FILTER

       Feed Type applies ONLY to Feed records.

       Non-feed categories remain available when
       Category = All.
    ===================================================== */

    if (feedType !== "ALL") {
      entries = entries.filter(
        (entry) => {
          if (
            entry.category !==
            "feeds"
          ) {
            return true;
          }

          return (
            entry.feedType ===
            feedType
          );
        }
      );
    }

    /* =====================================================
       SORT FILTERED MONETARY RECORDS
    ===================================================== */

    entries.sort(
      (a, b) =>
        new Date(
          b.date
        ).getTime() -
        new Date(
          a.date
        ).getTime()
    );

    /* =====================================================
       FINANCIAL SUMMARIES

       IMPORTANT:
       Production is NOT included here.

       Production has KG/Bags but no price.
       Therefore production must never be
       subtracted as money.
    ===================================================== */

    const currencySummaryMap =
      new Map<
        string,
        CurrencySummary
      >();

    const categorySummaryMap =
      new Map<
        string,
        CategorySummary
      >();

    for (const entry of entries) {
      addCurrencySummary(
        currencySummaryMap,
        entry
      );

      addCategorySummary(
        categorySummaryMap,
        entry
      );
    }

    const currencySummaries =
      Array.from(
        currencySummaryMap.values()
      ).sort((a, b) =>
        a.currency.localeCompare(
          b.currency
        )
      );

    const categorySummaries =
      Array.from(
        categorySummaryMap.values()
      ).sort((a, b) => {
        const categoryCompare =
          a.label.localeCompare(
            b.label
          );

        if (
          categoryCompare !== 0
        ) {
          return categoryCompare;
        }

        return a.currency.localeCompare(
          b.currency
        );
      });

    /* =====================================================
       FEED PRODUCTION

       Production is loaded separately because it is
       operational data, NOT monetary accounting data.

       It has:
       - Starter / Grower / Layer
       - Location
       - Bag size
       - Number of bags
       - Total KG
       - Entered by
       - Entered at

       It does NOT affect:
       - Sales
       - Purchases
       - Expenses
       - Net Result
    ===================================================== */

    const productionEntries:
      ProductionEntry[] = [];

    if (
      categories.includes("feeds")
    ) {
      const productionBatches =
        await prisma.productionBatch.findMany(
          {
            where: {
              date: dateFilter,
            },

            include: {
              items: {
                orderBy: {
                  createdAt: "asc",
                },
              },

              ...auditUserInclude,
            },

            orderBy: [
              {
                date: "desc",
              },
              {
                createdAt: "desc",
              },
            ],
          }
        );

      for (
        const batch of
        productionBatches
      ) {
        for (
          const item of
          batch.items
        ) {
          /*
           * Feed Type filter also applies
           * to Production.
           */

          if (
            feedType !== "ALL" &&
            item.feedType !==
              feedType
          ) {
            continue;
          }

          productionEntries.push(
            {
              id:
                `${batch.id}:${item.id}`,

              batchId:
                batch.id,

              itemId:
                item.id,

              date:
                batch.date.toISOString(),

              location:
                batch.location,

              feedType:
                item.feedType,

              bagSizeKg:
                safeNumber(
                  item.bagSizeKg
                ),

              quantity:
                safeNumber(
                  item.quantity
                ),

              totalKg:
                safeNumber(
                  item.totalKg
                ),

              createdAt:
                batch.createdAt.toISOString(),

              createdBy:
                auditUser(
                  batch.createdBy
                ),
            }
          );
        }
      }
    }

    /* =====================================================
       PRODUCTION TOTALS
    ===================================================== */

    const productionFeedMap =
      new Map<
        string,
        ProductionFeedSummary
      >();

    const productionBatchIds =
      new Set<string>();

    let totalProductionBags = 0;
    let totalProductionKg = 0;

    for (
      const item of
      productionEntries
    ) {
      productionBatchIds.add(
        item.batchId
      );

      totalProductionBags +=
        safeNumber(
          item.quantity
        );

      totalProductionKg +=
        safeNumber(
          item.totalKg
        );

      const current =
        productionFeedMap.get(
          item.feedType
        ) || {
          feedType:
            item.feedType,
          batches: 0,
          records: 0,
          bags: 0,
          totalKg: 0,
        };

      current.records += 1;

      current.bags +=
        safeNumber(
          item.quantity
        );

      current.totalKg +=
        safeNumber(
          item.totalKg
        );

      productionFeedMap.set(
        item.feedType,
        current
      );
    }

    /*
     * Count unique batches for each
     * Feed Type.
     */

    for (
      const summary of
      productionFeedMap.values()
    ) {
      const batchIds =
        new Set(
          productionEntries
            .filter(
              (item) =>
                item.feedType ===
                summary.feedType
            )
            .map(
              (item) =>
                item.batchId
            )
        );

      summary.batches =
        batchIds.size;
    }

    const productionByFeedType =
      Array.from(
        productionFeedMap.values()
      ).sort((a, b) => {
        const order = [
          "Starter",
          "Grower",
          "Layer",
        ];

        return (
          order.indexOf(
            a.feedType
          ) -
          order.indexOf(
            b.feedType
          )
        );
      });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      month,

      period: {
        start:
          monthRange.start.toISOString(),

        endExclusive:
          monthRange.end.toISOString(),
      },

      /* FILTERS CURRENTLY APPLIED */

      filters: {
        categories,
        transaction,
        company:
          company || "ALL",
        feedType,
      },

      selectedCategories:
        categories,

      /* AVAILABLE FILTER OPTIONS */

      availableCategories:
        ALL_CATEGORIES.map(
          (category) => ({
            value: category,
            label:
              CATEGORY_LABELS[
                category
              ],
          })
        ),

      availableTransactions: [
        {
          value: "ALL",
          label:
            "All Transactions / Dhammaan",
        },
        {
          value: "SALE",
          label:
            "Sold / La iibiyay",
        },
        {
          value: "PURCHASE",
          label:
            "Purchased / La iibsaday",
        },
        {
          value: "EXPENSE",
          label:
            "Expenses / Kharashaadka",
        },
      ],

      availableParties,

      availableFeedTypes: [
        {
          value: "ALL",
          label:
            "All Feed Types / Dhammaan",
        },
        {
          value: "Starter",
          label: "Starter Feed",
        },
        {
          value: "Grower",
          label: "Grower Feed",
        },
        {
          value: "Layer",
          label: "Layer Feed",
        },
      ],

      /* FINANCIAL ACCOUNTING */

      summary: {
        totalRecords:
          entries.length,

        currencies:
          currencySummaries,

        categories:
          categorySummaries,
      },

      entries,

      /* FEED PRODUCTION - NON-MONETARY */

      production: {
        totalBatches:
          productionBatchIds.size,

        totalRecords:
          productionEntries.length,

        totalBags:
          totalProductionBags,

        totalKg:
          totalProductionKg,

        byFeedType:
          productionByFeedType,

        entries:
          productionEntries,
      },
    });
  } catch (error) {
    console.error(
      "MONTHLY ACCOUNTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Monthly accounts could not be loaded.",
      },
      {
        status: 500,
      }
    );
  }
}