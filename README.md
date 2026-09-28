# PesaWeave

A premium Kenya-focused multi-tenant Money Flow Management SaaS application.

## Concept

**One user. Multiple money flows. Complete financial separation, visibility and control.**

PesaWeave lets a user manage Personal Money, Business, Farm, Rental Property, Family, Chama and Projects in independent **Money Spaces**, while still seeing a consolidated master dashboard.

## Design decision

The product uses **Manrope** as the primary font because it feels modern, premium and highly readable for dense financial dashboards. The selected color system is deep navy, cobalt blue and emerald green: deep navy for trust and security, cobalt for primary actions, and emerald for positive financial movement.

## What is included

- Premium responsive React + TypeScript frontend.
- Marketing landing page.
- Executive master dashboard that starts empty for a new user.
- Persistent browser workspace for creating transactions, transfers, accounts and Money Spaces in the preview environment.
- Money Spaces, transactions, accounts, transfers, M-Pesa module, budgets, bills, goals, invoices, Chama, debts, reports, admin and settings screens.
- Smart categorization engine.
- Kenya-first starter templates and KES/Ksh formatting for M-Pesa, bank, cash and wallet workflows.
- Supabase/PostgreSQL migration with tenant isolation, RLS policies, audit triggers and financial SaaS tables.
- Architecture documentation and secure environment variable template.

## Run locally

```bash
npm install
npm run dev
```

The app runs on Vite and binds to `0.0.0.0` for Arena live preview compatibility.

## Build

```bash
npm run build
```

## Key files

- `src/App.tsx` — interactive SaaS product UI and production workflow shell.
- `src/state/workspaceStore.tsx` — typed persisted workspace store used by the preview environment.
- `src/lib/supabaseClient.ts` — Supabase client configured from environment variables.
- `src/services/workspaceRepository.ts` — tenant-scoped repository contract for hosted data.
- `src/data/subscriptionPlans.ts` — configurable SaaS plan records.
- `src/utils/financial.ts` — formatting, financial totals and categorization helpers.
- `src/styles.css` — design system and responsive UI.
- `supabase/migrations/001_initial_schema.sql` — production-oriented PostgreSQL/Supabase schema.
- `docs/ARCHITECTURE.md` — architecture, security and integration notes.
- `docs/API.md` — API-first module and endpoint contract sketch.

## Security note

Payment provider credentials, M-Pesa/Daraja secrets, service-role database keys and AI provider keys must remain server-side only. The frontend should only receive tenant-safe, authorized data from server APIs.
