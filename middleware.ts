import { authMiddleware } from "@clerk/nextjs";

// Make api routes publicly available
export default authMiddleware({
  publicRoutes: ["/api/:path*"]
});

// Protexct routes
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
