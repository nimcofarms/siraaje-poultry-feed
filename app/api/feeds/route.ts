import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

const ALLOWED_FEED_TYPES = ["Starter", "Grower", "Layer"];

async function authorize(permission: PermissionKey) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "Fadlan marka hore gal. / Please log in first.",
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

export async function GET() {
  try {
    const auth = await authorize("feedsView");

    if (auth.response) {
      return auth.response;
    }

    const feeds = await prisma.feed.findMany({
      orderBy: {
        date: "desc",
      },
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

export async function POST(request: Request) {
  try {
    const auth = await authorize("feedsAdd");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const feedType = String(body.feedType || "").trim();
    const companyName = String(body.companyName || "").trim();
    const suppliedBy = String(body.suppliedBy || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!body.date || !feedType || !companyName || !suppliedBy) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_FEED_TYPES.includes(feedType)) {
      return NextResponse.json(
        {
          error:
            "Nooca quudinta waa inuu noqdaa Starter, Grower ama Layer. / Feed type must be Starter, Grower or Layer.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tirada iyo qiimaha si sax ah u geli. / Enter a valid quantity and price.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price;

    const feed = await prisma.feed.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        feedType,
        companyName,
        suppliedBy,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(feed, { status: 201 });
  } catch (error) {
    console.error("FEEDS CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta quudinta lama kaydin karin. / Feed record could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorize("feedsEdit");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const id = String(body.id || "").trim();
    const feedType = String(body.feedType || "").trim();
    const companyName = String(body.companyName || "").trim();
    const suppliedBy = String(body.suppliedBy || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!id) {
      return NextResponse.json(
        {
          error: "ID-ga lama helin. / Record ID is missing.",
        },
        { status: 400 }
      );
    }

    if (!body.date || !feedType || !companyName || !suppliedBy) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_FEED_TYPES.includes(feedType)) {
      return NextResponse.json(
        {
          error:
            "Nooca quudinta waa inuu noqdaa Starter, Grower ama Layer. / Feed type must be Starter, Grower or Layer.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tirada iyo qiimaha si sax ah u geli. / Enter a valid quantity and price.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price;

    const feed = await prisma.feed.update({
      where: {
        id,
      },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        feedType,
        companyName,
        suppliedBy,
        quantity,
        price,
        total,
      },
    });

    return NextResponse.json(feed);
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
          error: "ID-ga lama helin. / Record ID is missing.",
        },
        { status: 400 }
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