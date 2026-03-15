import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require a signed-in Clerk account.
// The guest-token flow handles unauthenticated access to API routes
// directly inside each route handler, so we only hard-protect the
// session UI pages here.
const isProtectedRoute = createRouteMatcher([
  '/session(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
