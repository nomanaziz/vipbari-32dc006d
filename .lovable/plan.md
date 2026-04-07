

# Fix: Vercel 404 on `/xbd-admin` (SPA Routing)

## Problem
Vercel serves static files by default. When you visit `/xbd-admin`, Vercel looks for a real file at that path. Since it doesn't exist (it's a client-side React Router route), Vercel returns 404.

## Solution
Add a `vercel.json` file in the project root with a rewrite rule that sends all non-file requests to `index.html`, letting React Router handle routing.

## Changes

### Add `vercel.json` (new file, project root)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This single rule fixes ALL routes (`/xbd-admin`, `/login`, `/dashboard`, etc.) — not just the admin page.

### Files
| File | Change |
|------|--------|
| `vercel.json` | New file — SPA rewrite rule |

After deploying with this file, all client-side routes will work correctly on Vercel.

