import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
   ALLOWED FEED TYPES
========================================================= */

const ALLOWED_FEED_TYPES = [
  "Starter",
  "Grower",
  "Layer",
] as const;

/* =========================================================
   TYPES
========================================================= */

type ProductionItemInput = {
  feedType?: unknown;
  bagSizeKg?: unknown;
  quantity?: unknown;
};

/* =========================================================
   AUTHORIZE
   Same security structure used by existing Feeds API
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
        {
          status: 401,
        }
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
        {
          status: 403,
        }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

/* =========================================================
   PARSE DATE
========================================================= */

function parseDate(value: unknown) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  const date = new Date(
    `${value.trim()}T12:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* =========================================================
   NORMALIZE PRODUCTION ITEMS
========================================================= */

function normalizeItems(items: unknown) {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return {
      success: false as const,
      error:
        "Ugu yaraan hal wax-soo-saar geli. / Add at least one production item.",
    };
  }

  const normalized: {
    feedType: string;
    bagSizeKg: number;
    quantity: number;
    totalKg: number;
  }[] = [];

  for (
    let index = 0;
    index < items.length;
    index++
  ) {
    const item =
      items[index] as ProductionItemInput;

    const feedType =
      typeof item?.feedType === "string"
        ? item.feedType.trim()
        : "";

    const bagSizeKg = Number(
      item?.bagSizeKg
    );

    const quantity = Number(
      item?.quantity
    );

    /* =====================================================
       FEED TYPE VALIDATION
    ===================================================== */

    if (
      !ALLOWED_FEED_TYPES.includes(
        feedType as
          (typeof ALLOWED_FEED_TYPES)[number]
      )
    ) {
      return {
        success: false as const,
        error:
          `Safka ${index + 1}: Nooca cuntada waa inuu noqdaa Starter, Grower ama Layer. / Row ${index + 1}: Feed type must be Starter, Grower or Layer.`,
      };
    }

    /* =====================================================
       BAG SIZE VALIDATION
    ===================================================== */

    if (
      !Number.isFinite(bagSizeKg) ||
      bagSizeKg <= 0
    ) {
      return {
        success: false as const,
        error:
          `Safka ${index + 1}: Miisaanka joorka waa inuu ka weyn yahay 0 kg. / Row ${index + 1}: Bag size must be greater than 0 kg.`,
      };
    }

    /* =====================================================
       QUANTITY VALIDATION

       Quantity = number of bags
    ===================================================== */

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isInteger(quantity)
    ) {
      return {
        success: false as const,
        error:
          `Safka ${index + 1}: Tirada joorradu waa inay noqotaa tiro dhan oo ka weyn 0. / Row ${index + 1}: Quantity must be a whole number greater than 0.`,
      };
    }

    /* =====================================================
       SERVER CALCULATION

       Example:
       50 kg × 100 bags = 5,000 kg
    ===================================================== */

    normalized.push({
      feedType,
      bagSizeKg,
      quantity,
      totalKg:
        bagSizeKg * quantity,
    });
  }

  return {
    success: true as const,
    items: normalized,
  };
}

/* =========================================================
   GET
   GET ALL PRODUCTION BATCHES
========================================================= */

export async function GET() {
  try {
    const auth = await authorize(
      "feedsView"
    );

    if (auth.response) {
      return auth.response;
    }

    const batches =
      await prisma.productionBatch.findMany({
        orderBy: [
          {
            date: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        include: {
          items: {
            orderBy: {
              createdAt: "asc",
            },
          },

          ...auditUserInclude,
        },
      });

    return NextResponse.json(
      batches
    );
  } catch (error) {
    console.error(
      "GET /api/feed-production error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Wax-soo-saarka lama soo qaadi karin. / Could not load production.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   CREATE NEW PRODUCTION BATCH
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const auth = await authorize(
      "feedsAdd"
    );

    if (auth.response) {
      return auth.response;
    }

    if (!auth.user) {
      return NextResponse.json(
        {
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    /* =====================================================
       DATE
    ===================================================== */

    const date =
      parseDate(body?.date);

    if (!date) {
      return NextResponse.json(
        {
          error:
            "Taariikh sax ah geli. / Enter a valid date.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       LOCATION
    ===================================================== */

    const location =
      typeof body?.location === "string"
        ? body.location.trim()
        : "";

    if (!location) {
      return NextResponse.json(
        {
          error:
            "Goobta geli. / Enter the location.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ITEMS
    ===================================================== */

    const normalized =
      normalizeItems(body?.items);

    if (!normalized.success) {
      return NextResponse.json(
        {
          error:
            normalized.error,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       CREATE BATCH

       Date and location are stored once.

       Starter/Grower/Layer rows are stored as
       ProductionItem records under the same batch.
    ===================================================== */

    const created =
      await prisma.productionBatch.create({
        data: {
          date,

          location,

          /*
           * Same audit structure as existing
           * Feed API.
           */
          ...createAuditData(
            auth.user
          ),

          items: {
            create:
              normalized.items,
          },
        },

        include: {
          items: {
            orderBy: {
              createdAt:
                "asc",
            },
          },

          ...auditUserInclude,
        },
      });

    return NextResponse.json(
      created,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/feed-production error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Wax-soo-saarka lama kaydin karin. / Could not save production.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT
   EDIT EXISTING PRODUCTION BATCH
========================================================= */

export async function PUT(
  request: NextRequest
) {
  try {
    const auth = await authorize(
      "feedsEdit"
    );

    if (auth.response) {
      return auth.response;
    }

    if (!auth.user) {
      return NextResponse.json(
        {
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    /* =====================================================
       ID
    ===================================================== */

    const id =
      typeof body?.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Production ID lama helin. / Production ID is missing.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       CHECK EXISTING RECORD
    ===================================================== */

    const existing =
      await prisma.productionBatch.findUnique({
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
            "Wax-soo-saarkan lama helin. / Production not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       DATE
    ===================================================== */

    const date =
      parseDate(body?.date);

    if (!date) {
      return NextResponse.json(
        {
          error:
            "Taariikh sax ah geli. / Enter a valid date.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       LOCATION
    ===================================================== */

    const location =
      typeof body?.location === "string"
        ? body.location.trim()
        : "";

    if (!location) {
      return NextResponse.json(
        {
          error:
            "Goobta geli. / Enter the location.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       ITEMS
    ===================================================== */

    const normalized =
      normalizeItems(body?.items);

    if (!normalized.success) {
      return NextResponse.json(
        {
          error:
            normalized.error,
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       UPDATE TRANSACTION

       1. Delete old ProductionItem rows
       2. Update ProductionBatch
       3. Create new ProductionItem rows

       If one step fails, Prisma rolls back
       the whole operation.
    ===================================================== */

    const updated =
      await prisma.$transaction(
        async (tx) => {
          await tx.productionItem.deleteMany({
            where: {
              batchId: id,
            },
          });

          return tx.productionBatch.update({
            where: {
              id,
            },

            data: {
              date,

              location,

              /*
               * createdBy remains unchanged.
               * updatedBy becomes current user.
               */
              ...updateAuditData(
                auth.user
              ),

              items: {
                create:
                  normalized.items,
              },
            },

            include: {
              items: {
                orderBy: {
                  createdAt:
                    "asc",
                },
              },

              ...auditUserInclude,
            },
          });
        }
      );

    return NextResponse.json(
      updated
    );
  } catch (error) {
    console.error(
      "PUT /api/feed-production error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Wax-soo-saarka lama beddeli karin. / Could not update production.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
   DELETE PRODUCTION BATCH
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth = await authorize(
      "feedsDelete"
    );

    if (auth.response) {
      return auth.response;
    }

    /* =====================================================
       GET ID FROM URL
    ===================================================== */

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams
        .get("id")
        ?.trim() || "";

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Production ID lama helin. / Production ID is missing.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       CHECK EXISTING RECORD
    ===================================================== */

    const existing =
      await prisma.productionBatch.findUnique({
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
            "Wax-soo-saarkan lama helin. / Production not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       DELETE BATCH

       ProductionItem uses onDelete: Cascade,
       therefore all rows belonging to this
       batch are automatically deleted.
    ===================================================== */

    await prisma.productionBatch.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Wax-soo-saarka waa la tirtiray. / Production deleted.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/feed-production error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Wax-soo-saarka lama tirtiri karin. / Could not delete production.",
      },
      {
        status: 500,
      }
    );
  }
}