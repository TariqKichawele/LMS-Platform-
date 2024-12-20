import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

const isStudentRoute = createRouteMatcher(["/user/(.*)"]);
const isTeacherRoute = createRouteMatcher(["/teacher/(.*)"]);

export default clerkMiddleware( async (auth, req) => {
    const { userId } = await auth();
    const client = await clerkClient();

    const user = await client.users.getUser(userId!); // Use userId to retrieve user data
    const userRole = user.publicMetadata.userType; 

    if(isStudentRoute(req)) {
        if(userRole !== "student") {
            const url = new URL("/teacher/courses", req.url);
            return NextResponse.redirect(url);
        }
    }

    if(isTeacherRoute(req)) {
        if(userRole !== "teacher") {
            const url = new URL("/user/courses", req.url);
            return NextResponse.redirect(url);
        }
    }
})

export const config = {
    matcher: [
      // Skip Next.js internals and all static files, unless found in search params
      "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
      // Always run for API routes
      "/(api|trpc)(.*)",
    ],
};