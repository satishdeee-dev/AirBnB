# Stayly — Airbnb-style Hotel Rental

A static, role-based rental marketplace built with vanilla HTML, CSS, and JavaScript. No build step, no backend — all data lives in `localStorage`.

## Two roles

**Guests** can:
- Browse listings, filter by category, search destinations
- View property details with image gallery and amenities
- Reserve dates and see booking totals
- Cancel their own trips

**Admins** can:
- See dashboard stats (listings, bookings, revenue, users)
- Create / edit / hide / delete listings
- View and cancel any booking
- Manage user accounts
- Reset the demo data

## Demo credentials

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@stayly.com   | admin123   |
| Guest | guest@stayly.com   | guest123   |

You can also sign up as either role from `/signup`.

## Run locally

Just open `index.html` in a browser, or serve the folder:

```sh
npx serve .
# or
python -m http.server 5173
```

## Deploy to Vercel

### Option A — Vercel CLI

```sh
npm i -g vercel
vercel        # first run: link / create project
vercel --prod # promote to production
```

### Option B — Drag & drop

1. Zip this folder.
2. Go to https://vercel.com/new and drop the zip on "Deploy".

### Option C — GitHub + Vercel

1. Push to a GitHub repo.
2. Import the repo on https://vercel.com/new.
3. Framework: **Other**. No build command. Output directory: `.` (the root).

`vercel.json` is configured for SPA-style hash routing — every path falls back to `index.html`.

## Files

- `index.html` — single-page shell
- `styles.css` — full design system
- `data.js` — seed listings + categories
- `store.js` — localStorage-backed users / listings / bookings
- `app.js` — router and all views (auth, browse, property, trips, admin)
- `vercel.json` — SPA rewrite rules
