import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const [employees, inbox, sent] = await Promise.all([
      prisma.user.findMany({
        where: {
          id: {
            not: currentUser.id,
          },
        },
        select: userSelect,
        orderBy: {
          name: "asc",
        },
      }),

      prisma.message.findMany({
        where: {
          receiverId: currentUser.id,
        },
        include: {
          sender: {
            select: userSelect,
          },
          receiver: {
            select: userSelect,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.message.findMany({
        where: {
          senderId: currentUser.id,
        },
        include: {
          sender: {
            select: userSelect,
          },
          receiver: {
            select: userSelect,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const unreadCount = inbox.filter(
      (message) => !message.isRead
    ).length;

    return NextResponse.json({
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },
      employees,
      inbox,
      sent,
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/messages error:", error);

    return NextResponse.json(
      { error: "Failed to load messages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const receiverId =
      typeof body.receiverId === "string"
        ? body.receiverId.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!receiverId) {
      return NextResponse.json(
        { error: "Please select an employee." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Please write a message." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Message is too long. Maximum length is 5000 characters.",
        },
        { status: 400 }
      );
    }

    if (receiverId === currentUser.id) {
      return NextResponse.json(
        {
          error: "You cannot send a message to yourself.",
        },
        { status: 400 }
      );
    }

    const receiver = await prisma.user.findUnique({
      where: {
        id: receiverId,
      },
      select: {
        id: true,
      },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    const createdMessage = await prisma.message.create({
      data: {
        message,
        senderId: currentUser.id,
        receiverId,
      },
      include: {
        sender: {
          select: userSelect,
        },
        receiver: {
          select: userSelect,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: createdMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/messages error:", error);

    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const messageId =
      typeof body.messageId === "string"
        ? body.messageId.trim()
        : "";

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required." },
        { status: 400 }
      );
    }

    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        receiverId: currentUser.id,
      },
      select: {
        id: true,
        isRead: true,
      },
    });

    if (!existingMessage) {
      return NextResponse.json(
        { error: "Message not found." },
        { status: 404 }
      );
    }

    if (existingMessage.isRead) {
      return NextResponse.json({
        success: true,
      });
    }

    const updatedMessage = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        isRead: true,
      },
      include: {
        sender: {
          select: userSelect,
        },
        receiver: {
          select: userSelect,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    });
  } catch (error) {
    console.error("PUT /api/messages error:", error);

    return NextResponse.json(
      { error: "Failed to update message." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("id")?.trim();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required." },
        { status: 400 }
      );
    }

    const existingMessage = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: currentUser.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingMessage) {
      return NextResponse.json(
        {
          error:
            "Message not found or you are not allowed to delete it.",
        },
        { status: 404 }
      );
    }

    await prisma.message.delete({
      where: {
        id: messageId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/messages error:", error);

    return NextResponse.json(
      { error: "Failed to delete message." },
      { status: 500 }
    );
  }
}