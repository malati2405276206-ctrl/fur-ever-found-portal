# 🐱 Fur Ever Found

A community-driven web platform to reunite lost and found cats, support adoption, and empower shelters and NGOs — built for #hackthekitty 2026.

## What it does

Fur Ever Found combines an AI-assisted lost-and-found matching system, interactive map-based reporting (Leaflet.js), and a full adoption pipeline into one platform for cat owners, finders, shelters, NGOs, and adopters.

**Key features:**
- Lost & Found Portal with map-based location pinning
- Adoption Center for verified shelters/NGOs
- AI-powered matching between lost and found reports
- Community Stories feed for reunions, rescues, and adoptions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Mapping | Leaflet.js + React-Leaflet |
| Backend & Auth | Supabase (PostgreSQL, Auth, Row Level Security) |
| Storage & Media | Supabase Storage, Cloudinary |
| Deployment | Vercel |

## Prerequisites

- Node.js 18.x or later
- npm / yarn / pnpm / bun
- A [Supabase](https://supabase.com) project (URL + anon key)
- A [Cloudinary](https://cloudinary.com) account (optional, for media transforms)

## Getting Started

1. Clone the repo and install dependencies:
```bash
   npm install
```

2. Create a `.env.local` file in the project root with:
```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   CLOUDINARY_URL=your_cloudinary_url   # optional
```

3. Run the development server:
```bash
   npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

- `src/` — application source code
- `documentation/` — project report and supporting docs

## Team / Acknowledgments

Built with support from Kiro IDE, Aikido Security, and the open-source teams behind Next.js, Supabase, Leaflet.js, and Vercel.

## Development Process

During development, we transitioned to Kiro IDE and used it to accelerate feature development, debugging, SQL migration generation, UI improvements, and code refactoring.