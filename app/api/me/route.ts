import { NextResponse } from "next/server";
import { getCurrentUser, isOwner } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOwner: isOwner(user),
        permissions: user.permissions,
      },
    });
  } catch (error) {
    console.error("GET CURRENT USER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not load the current user.",
      },
      { status: 500 }
    );
  }
}