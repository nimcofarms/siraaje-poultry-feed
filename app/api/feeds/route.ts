import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

import {
  auditUserInclude,
  createAuditData,
  updateAuditData,
} from "@/lib/audit";

export const runtime = "nodejs";

/* =========================================================
   ALLOWED VALUES
========================================================= */

const ALLOWED_FEED_TYPES = ["Starter", "Grower", "Layer"] as const;

const ALLOWED_TRANSACTION_TYPES = ["PURCHASE", "SALE"] as const;

/* =========================================================
   AUTHORIZE
========================================================= */

async function authorize(permission: PermissionKey) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(user, permission)) {
    return {
      user,
      response: NextResponse.json(
        {
          error:
            "Ma lihid oggolaanshaha hawshan. / You do not have permission to perform this action.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

/* =========================================================
   HELPERS
========================================================= */

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeFeedType(value: unknown) {
  return normalizeText(value);
}

function normalizeTransactionType(value: unknown) {
  return normalizeText(value).toUpperCase();
}

function normalizeNumber(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return Number.NaN;
  }

  return Number(value);
}

function normalizeCurrency(value: unknown) {
  const currency = normalizeText(value).toUpperCase();

  return currency || "ETB";
}

function createFeedDate(value: unknown) {
  const date = normalizeText(value);

  if (!date) {
    return null;
  }

  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/* =========================================================
   VALIDATE FEED INPUT
========================================================= */

function validateFeedInput(body: Record<string, unknown>) {
  const date = createFeedDate(body.date);

  const feedType = normalizeFeedType(body.feedType);

  const transactionType = normalizeTransactionType(
    body.transactionType
  );

  const companyName = normalizeText(body.companyName);

  const suppliedBy = normalizeText(body.suppliedBy);

  const location = normalizeText(body.location);

  const quantity = normalizeNumber(body.quantity);

  const price = normalizeNumber(body.price);

  const currency = normalizeCurrency(body.currency);

  /* DATE */

  if (!date) {
    return {
      success: false as const,
      error:
        "Fadlan geli taariikh sax ah. / Please enter a valid date.",
    };
  }

  /* FEED TYPE */

  if (!ALLOWED_FEED_TYPES.includes(feedType as never)) {
    return {
      success: false as const,
      error:
        "Nooca quudinta waa inuu noqdaa Starter, Grower ama Layer. / Feed type must be Starter, Grower or Layer.",
    };
  }

  /* TRANSACTION TYPE */

  if (
    !ALLOWED_TRANSACTION_TYPES.includes(
      transactionType as never
    )
  ) {
    return {
      success: false as const,
      error:
        "Nooca macaamilku waa inuu noqdaa Purchased ama Sold. / Transaction type must be PURCHASE or SALE.",
    };
  }

  /* COMPANY */

  if (!companyName) {
    return {
      success: false as const,
      error:
        "Fadlan geli magaca shirkadda ama macmiilka. / Please enter the company or customer name.",
    };
  }

  /* SUPPLIED BY */

  if (!suppliedBy) {
    return {
      success: false as const,
      error:
        "Fadlan geli cidda quudinta bixisay. / Please enter who supplied the feed.",
    };
  }

  /* QUANTITY */

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      success: false as const,
      error:
        "Fadlan geli quantity sax ah. / Please enter a valid quantity.",
    };
  }

  /* PRICE */

  if (!Number.isFinite(price) || price < 0) {
    return {
      success: false as const,
      error:
        "Fadlan geli qiime sax ah. / Please enter a valid price.",
    };
  }

  /* TOTAL - CALCULATED BY SERVER */

  const total = quantity * price;

  return {
    success: true as const,

    data: {
      date,

      feedType,

      transactionType,

      companyName,

      suppliedBy,

      location: location || null,

      quantity,

      price,

      total,

      currency,
    },
  };
}

/* =========================================================
   GET
   LOAD ALL FEED RECORDS
========================================================= */

export async function GET() {
  try {
    const auth = await authorize("feedsView");

    if (auth.response) {
      return auth.response;
    }

    const feeds = await prisma.feed.findMany({
      include: {
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
    });

    return NextResponse.json(feeds);
  } catch (error) {
    console.error("FEEDS GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta quudinta lama soo qaadi karin. / Feed records could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   CREATE FEED RECORD
========================================================= */

export async function POST(request: Request) {
  try {
    const auth = await authorize("feedsAdd");

    if (auth.response) {
      return auth.response;
    }

    if (!auth.user) {
      return NextResponse.json(
        {
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const validated = validateFeedInput(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: validated.error,
        },
        { status: 400 }
      );
    }

    const feed = await prisma.feed.create({
      data: {
        ...validated.data,

        ...createAuditData(auth.user),
      },

      include: {
        ...auditUserInclude,
      },
    });

    return NextResponse.json(feed, {
      status: 201,
    });
  } catch (error) {
    console.error("FEEDS CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Quudinta lama kaydin karin. / Feed record could not be saved.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   UPDATE FEED RECORD
========================================================= */

export async function PUT(request: Request) {
  try {
    const auth = await authorize("feedsEdit");

    if (auth.response) {
      return auth.response;
    }

    if (!auth.user) {
      return NextResponse.json(
        {
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as Record<
      string,
      unknown
    >;

    const id = normalizeText(body.id);

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID-ga quudinta lama helin. / Feed ID is missing.",
        },
        { status: 400 }
      );
    }

    /* CHECK EXISTING RECORD */

    const existing = await prisma.feed.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Xogtan quudinta lama helin. / Feed record was not found.",
        },
        { status: 404 }
      );
    }

    const validated = validateFeedInput(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: validated.error,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.feed.update({
      where: {
        id,
      },

      data: {
        ...validated.data,

        ...updateAuditData(auth.user),
      },

      include: {
        ...auditUserInclude,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("FEEDS UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta quudinta lama beddeli karin. / Feed record could not be updated.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   DELETE FEED RECORD
========================================================= */

export async function DELETE(request: Request) {
  try {
    const auth = await authorize("feedsDelete");

    if (auth.response) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID-ga quudinta lama helin. / Feed ID is missing.",
        },
        { status: 400 }
      );
    }

    /* CHECK EXISTING RECORD */

    const existing = await prisma.feed.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Xogtan quudinta lama helin. / Feed record was not found.",
        },
        { status: 404 }
      );
    }

    await prisma.feed.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("FEEDS DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta quudinta lama tirtiri karin. / Feed record could not be deleted.",
      },
      { status: 500 }
    );
  }
}