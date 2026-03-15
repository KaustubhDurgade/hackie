---
name: hackie project context
description: Framework, stack, auth setup, and conventions for the hackie Next.js project
type: project
---

Framework: Next.js (package.json shows `"next": "16.1.6"`) with App Router, React 19, TypeScript.
Package manager: npm (package-lock.json present, no pnpm-lock or yarn.lock).

Auth setup (Clerk):
- `@clerk/nextjs` v7.0.4 installed.
- `middleware.ts` at project root uses `clerkMiddleware` + `createRouteMatcher` protecting `/session(.*)` only. API routes and `/` are public — guest-token logic lives inside each API route handler.
- `app/layout.tsx` wraps the tree with `<ClerkProvider>` (no publishableKey prop needed; reads from env).
- Sign-in page: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`
- Sign-up page: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`
- `UserButton` added to sidebar of `app/(app)/session/[id]/page.tsx`.
- `.env.local` has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` as empty placeholders, plus sign-in/sign-up URL vars.

UI aesthetic: pure black/white, no rounded corners (borderRadius: '0px'), Inter (var(--font-inter)) for body, Syne (font-display class, var(--font-syne)) for headings/brand. Both fonts loaded in root layout via next/font/google.

Guest mode: `localStorage.getItem('hackie_guest_token')` key `hackie_guest_token`. API routes accept either Clerk userId OR guestToken. This flow remains intact — middleware does not touch API routes.

**Why:** Clerk is the auth provider. Guest mode exists so unauthenticated users can still use the app without signing in.
**How to apply:** When modifying auth logic, preserve both the Clerk path and the guest-token fallback in API routes. Never block `/api/*` in middleware.
