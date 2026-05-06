import { NextResponse } from "next/server";
import { UserService } from "@/services/userService";
import { withErrorHandler } from "@/lib/apiErrorHandler";
import { z } from "zod";

const bulkUpdateSchema = z.object({
    userIds: z.array(z.string()),
    roles: z.array(z.string()),
});

export const PATCH = withErrorHandler(async (req, { user }) => {
    // Check if user is admin or QA head
    if (!user.roles.includes("ADMIN") && !user.roles.includes("QA_HEAD")) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const validated = bulkUpdateSchema.parse(body);

    const result = await UserService.bulkUpdateRoles(
        validated.userIds,
        validated.roles,
        user
    );

    return NextResponse.json({ success: true, ...result });
});
