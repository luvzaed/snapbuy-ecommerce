# NovaMart Ecommerce — Walkthrough

## What Was Built

A complete **Next.js 16 + Tailwind CSS 4 + TypeScript** ecommerce website called **NovaMart**, running at `http://localhost:3000`.

## Project Structure

```
my-app/
├── app/
│   ├── globals.css              # Tailwind v4 + custom animations
│   ├── layout.tsx               # Root layout (AuthProvider, Header, Footer)
│   ├── page.tsx                 # Home page
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Register page
│   ├── dashboard/page.tsx       # User dashboard
│   ├── admin/page.tsx           # Admin dashboard
│   ├── cart/page.tsx            # Cart page
│   └── api/products/
│       ├── route.ts             # GET all, POST create
│       └── [id]/route.ts        # GET by id, PUT update, DELETE
├── components/
│   ├── Header.tsx               # Sticky glassmorphism nav
│   ├── Footer.tsx               # Footer with social icons
│   ├── ProductCard.tsx          # Card with hover animations
│   └── FormInput.tsx            # Reusable input with focus ring
└── lib/
    ├── types.ts                 # Shared TypeScript types
    ├── auth-context.tsx         # React Context (auth + cart)
    └── products-store.ts        # In-memory CRUD product store
```

## Screenshots

### Home Page — Hero Section
![Home page hero](home_page_1773009270953.png)

### Login Page (after admin login, header shows Admin link)
![Login page](admin_dashboard_1773009348335.png)

## Pages & Features

| Page | Route | Description |
|---|---|---|
| Home | `/` | Animated hero, glow orbs, features bar, product grid, CTA |
| Login | `/login` | Glassmorphism card, demo credentials hint, loading spinner |
| Register | `/register` | 4-field form with client-side validation |
| User Dashboard | `/dashboard` | Order history cards with status badges, stats |
| Admin Dashboard | `/admin` | Product CRUD grid + modal, stats panel |
| Cart | `/cart` | Item list, sticky order summary, tax calc |

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| User | `user@shop.com` | `user123` |
| Admin | `admin@shop.com` | `admin123` |

## Key Design Decisions

- **Tailwind CSS v4** (CSS-first, no `tailwind.config.js`) — uses `@theme` and direct CSS utilities
- **In-memory product store** — server-side singleton, resets on server restart (no DB needed for demo)
- **Auth via React Context + localStorage** — persists across page refreshes
- **Cart count badge** in header, updates live when products are added
- **Admin auth guard** — non-admin users get redirected away from `/admin`

## Recording

![Walkthrough recording](ecommerce_site_verification_1773009250020.webp)
