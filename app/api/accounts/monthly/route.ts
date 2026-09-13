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

    const dateFilter = {
      gte: monthRange.start,
      lt: monthRange.end,
    };

    const entries: AccountEntry[] = [];

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
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.constructionExpense.findMany({
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.productExpense.findMany({
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      for (const item of generalExpenses) {
        entries.push({
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
        });
      }

      for (const item of constructionExpenses) {
        entries.push({
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
        });
      }

      for (const item of productExpenses) {
        entries.push({
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
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.eggSale.findMany({
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      for (const item of purchasedEggs) {
        entries.push({
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
        });
      }

      for (const item of eggSales) {
        entries.push({
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
          location: null,
          party: item.companyName || null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
        });
      }
    }

    // =====================================================
    // FEEDS
    // =====================================================

    if (categories.includes("feeds")) {
      const feeds = await prisma.feed.findMany({
        where: {
          date: dateFilter,
        },
        orderBy: {
          date: "asc",
        },
      });

      for (const item of feeds) {
        entries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "feeds",
          categoryLabel: CATEGORY_LABELS.feeds,
          type: "PURCHASE",
          source: "Feed Purchase",
          description: item.feedType,
          location: null,
          party:
            item.companyName ||
            item.suppliedBy ||
            null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
        });
      }
    }

    // =====================================================
    // CHICKEN
    // =====================================================

    if (categories.includes("chicken")) {
      const [
        livePurchases,
        liveSales,
        meatPurchases,
        meatSales,
      ] = await Promise.all([
        prisma.liveChickenPurchase.findMany({
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.liveChickenSale.findMany({
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.chickenMeatPurchase.findMany({
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),

        prisma.chickenMeatSale.findMany({
          where: {
            date: dateFilter,
          },
          orderBy: {
            date: "asc",
          },
        }),
      ]);

      for (const item of livePurchases) {
        entries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "chicken",
          categoryLabel:
            CATEGORY_LABELS.chicken,
          type: "PURCHASE",
          source: "Live Chicken Purchase",
          description:
            `${item.chickenType} - ` +
            `${item.ageNumber} ${item.ageUnit}`,
          location: item.location || null,
          party: null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
        });
      }

      for (const item of liveSales) {
        entries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "chicken",
          categoryLabel:
            CATEGORY_LABELS.chicken,
          type: "SALE",
          source: "Live Chicken Sale",
          description:
            `${item.chickenType} - ` +
            `${item.ageNumber} ${item.ageUnit}`,
          location: item.location || null,
          party: null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
        });
      }

      for (const item of meatPurchases) {
        entries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "chicken",
          categoryLabel:
            CATEGORY_LABELS.chicken,
          type: "PURCHASE",
          source: "Chicken Meat Purchase",
          description: "Chicken Meat",
          location: item.location || null,
          party: item.companyName || null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
        });
      }

      for (const item of meatSales) {
        entries.push({
          id: item.id,
          date: item.date.toISOString(),
          category: "chicken",
          categoryLabel:
            CATEGORY_LABELS.chicken,
          type: "SALE",
          source: "Chicken Meat Sale",
          description:
            `Chicken Meat - ${item.customerType}`,
          location: item.location || null,
          party: item.branch || null,
          quantity: nullableNumber(item.quantity),
          unitPrice: nullableNumber(item.price),
          total: safeNumber(item.total),
          currency: normalizeCurrency(item.currency),
        });
      }
    }

    // =====================================================
    // SORT ALL RECORDS
    // =====================================================

    entries.sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );

    // =====================================================
    // CALCULATE SUMMARIES
    // =====================================================

    const currencySummaryMap =
      new Map<string, CurrencySummary>();

    const categorySummaryMap =
      new Map<string, CategorySummary>();

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

    const currencySummaries = Array.from(
      currencySummaryMap.values()
    ).sort((a, b) =>
      a.currency.localeCompare(b.currency)
    );

    const categorySummaries = Array.from(
      categorySummaryMap.values()
    ).sort((a, b) => {
      const categoryCompare =
        a.label.localeCompare(b.label);

      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return a.currency.localeCompare(b.currency);
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      month,

      period: {
        start: monthRange.start.toISOString(),
        endExclusive: monthRange.end.toISOString(),
      },

      selectedCategories: categories,

      availableCategories: ALL_CATEGORIES.map(
        (category) => ({
          value: category,
          label: CATEGORY_LABELS[category],
        })
      ),

      summary: {
        totalRecords: entries.length,
        currencies: currencySummaries,
        categories: categorySummaries,
      },

      entries,
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