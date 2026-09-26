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

type MessageUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type MessageRecord = {
  id: string;
  message: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: Date;
  sender: MessageUser;
  receiver: MessageUser;
};

/* =========================================================
   GET
   LOAD CONVERSATIONS
========================================================= */

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error: "Please log in first.",
        },
        {
          status: 401,
        }
      );
    }

    const [employees, messages] = await Promise.all([
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
          OR: [
            {
              senderId: currentUser.id,
            },
            {
              receiverId: currentUser.id,
            },
          ],
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
          createdAt: "asc",
        },
      }),
    ]);

    /* =====================================================
       GROUP ALL MESSAGES BY THE OTHER USER

       Example:

       Ahmed -> Me
       Me -> Ahmed
       Ahmed -> Me

       All three belong to ONE Ahmed conversation.
    ===================================================== */

    const conversationMap = new Map<
      string,
      {
        user: MessageUser;
        messages: MessageRecord[];
      }
    >();

    for (const message of messages) {
      const otherUser =
        message.senderId === currentUser.id
          ? message.receiver
          : message.sender;

      const existing = conversationMap.get(
        otherUser.id
      );

      if (existing) {
        existing.messages.push(message);
      } else {
        conversationMap.set(otherUser.id, {
          user: otherUser,
          messages: [message],
        });
      }
    }

    /* =====================================================
       BUILD CONVERSATIONS
    ===================================================== */

    const conversations = Array.from(
      conversationMap.values()
    )
      .map((conversation) => {
        const conversationMessages =
          conversation.messages;

        const lastMessage =
          conversationMessages[
            conversationMessages.length - 1
          ];

        const unreadCount =
          conversationMessages.filter(
            (message) =>
              message.receiverId ===
                currentUser.id &&
              message.senderId ===
                conversation.user.id &&
              !message.isRead
          ).length;

        return {
          user: conversation.user,

          messages: conversationMessages,

          lastMessage,

          unreadCount,

          totalMessages:
            conversationMessages.length,
        };
      })
      .sort((a, b) => {
        return (
          new Date(
            b.lastMessage.createdAt
          ).getTime() -
          new Date(
            a.lastMessage.createdAt
          ).getTime()
        );
      });

    /* =====================================================
       TOTAL UNREAD
    ===================================================== */

    const unreadCount = messages.filter(
      (message) =>
        message.receiverId ===
          currentUser.id &&
        !message.isRead
    ).length;

    return NextResponse.json({
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
      },

      employees,

      conversations,

      unreadCount,
    });
  } catch (error) {
    console.error(
      "GET /api/messages error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load messages.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   SEND MESSAGE
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error:
            "Please log in first.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const receiverId =
      typeof body.receiverId ===
      "string"
        ? body.receiverId.trim()
        : "";

    const message =
      typeof body.message ===
      "string"
        ? body.message.trim()
        : "";

    if (!receiverId) {
      return NextResponse.json(
        {
          error:
            "Please select an employee.",
        },
        {
          status: 400,
        }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Please write a message.",
        },
        {
          status: 400,
        }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        {
          error:
            "Message is too long. Maximum length is 5000 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      receiverId === currentUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot send a message to yourself.",
        },
        {
          status: 400,
        }
      );
    }

    const receiver =
      await prisma.user.findUnique({
        where: {
          id: receiverId,
        },

        select: {
          id: true,
        },
      });

    if (!receiver) {
      return NextResponse.json(
        {
          error:
            "Employee not found.",
        },
        {
          status: 404,
        }
      );
    }

    const createdMessage =
      await prisma.message.create({
        data: {
          message,
          senderId:
            currentUser.id,
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
        message:
          createdMessage,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/messages error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to send message.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT
   MARK CONVERSATION AS READ
========================================================= */

export async function PUT(
  request: Request
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error:
            "Please log in first.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const userId =
      typeof body.userId ===
      "string"
        ? body.userId.trim()
        : "";

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Conversation user ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        {
          error:
            "Invalid conversation.",
        },
        {
          status: 400,
        }
      );
    }

    const otherUser =
      await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
        },
      });

    if (!otherUser) {
      return NextResponse.json(
        {
          error:
            "Employee not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       MARK ALL UNREAD MESSAGES FROM THIS USER AS READ
    ===================================================== */

    const result =
      await prisma.message.updateMany({
        where: {
          senderId: userId,
          receiverId:
            currentUser.id,
          isRead: false,
        },

        data: {
          isRead: true,
        },
      });

    return NextResponse.json({
      success: true,
      updatedCount:
        result.count,
    });
  } catch (error) {
    console.error(
      "PUT /api/messages error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update conversation.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
   DELETE ONE MESSAGE SENT BY CURRENT USER
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          error:
            "Please log in first.",
        },
        {
          status: 401,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const messageId =
      searchParams
        .get("id")
        ?.trim();

    if (!messageId) {
      return NextResponse.json(
        {
          error:
            "Message ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       USER CAN ONLY DELETE A MESSAGE THEY SENT
    ===================================================== */

    const existingMessage =
      await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId:
            currentUser.id,
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
        {
          status: 404,
        }
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
    console.error(
      "DELETE /api/messages error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete message.",
      },
      {
        status: 500,
      }
    );
  }
}