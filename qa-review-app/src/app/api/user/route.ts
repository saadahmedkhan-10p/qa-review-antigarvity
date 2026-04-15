import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/apiErrorHandler";

/**
 * Current User Profile API
 */
export const GET = withErrorHandler(async (req, { user }) => {
    // Current user is already provided by withErrorHandler
    return NextResponse.json(user);
});
