import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

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
    const auth = await authorize("eggsView");

    if (auth.response) {
      return auth.response;
    }

    const eggs = await prisma.purchasedEgg.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(eggs);
  } catch (error) {
    console.error("PURCHASED EGGS GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ukumaha la soo gatay lama soo qaadi karin. / Purchased eggs could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorize("eggsAdd");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const location = String(body.location || "").trim();
    const companyName = String(body.companyName || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!body.date || !location || !companyName) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, goobta iyo magaca shirkadda. / Please enter date, location and company name.",
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

    const egg = await prisma.purchasedEgg.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        location,
        companyName,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(egg, { status: 201 });
  } catch (error) {
    console.error("PURCHASED EGGS CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ukumaha lama kaydin karin. / Purchased eggs could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorize("eggsEdit");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const id = String(body.id || "").trim();
    const location = String(body.location || "").trim();
    const companyName = String(body.companyName || "").trim();
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

    if (!body.date || !location || !companyName) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, goobta iyo magaca shirkadda. / Please enter date, location and company name.",
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

    const egg = await prisma.purchasedEgg.update({
      where: {
        id,
      },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        location,
        companyName,
        quantity,
        price,
        total,
      },
    });

    return NextResponse.json(egg);
  } catch (error) {
    console.error("PURCHASED EGGS UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta lama beddeli karin. / Purchased egg record could not be updated.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorize("eggsDelete");

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

    await prisma.purchasedEgg.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PURCHASED EGGS DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta lama tirtiri karin. / Purchased egg record could not be deleted.",
      },
      { status: 500 }
    );
  }
}