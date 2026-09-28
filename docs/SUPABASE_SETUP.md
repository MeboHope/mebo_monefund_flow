# Supabase Setup for PesaWeave

This is the production authentication and tenant-isolation setup path.

## 1. Create Supabase project

Create a Supabase project and copy these public frontend values into your deployment environment:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_REQUIRE_SUPABASE_AUTH=true
```

Do not put the service-role key in the frontend.

## 2. Apply database migrations

Apply the migrations in order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_auth_onboarding_and_secure_functions.sql
```

The second migration adds:

- automatic profile creation from Supabase Auth users
- secure tenant onboarding RPC
- secure Money Space creation RPC
- secure account creation with opening-balance transaction
- secure transaction creation with balance update
- secure internal transfer function

## 3. Enable authentication settings

In Supabase Auth settings:

- Enable email/password sign in.
- Enable email confirmation for production.
- Configure password recovery redirect URL to your app domain.
- Add your production domain to allowed redirect URLs.

## 4. Frontend behavior

When Supabase variables are configured, PesaWeave shows a protected sign-in/sign-up screen before the workspace.

When they are missing in local development, PesaWeave shows a setup screen and allows local UI testing only. Production should set:

```bash
VITE_REQUIRE_SUPABASE_AUTH=true
```

## 5. Security model

- Supabase Auth manages identity and sessions.
- `app.tenants` isolates every workspace.
- `app.memberships` defines who belongs to which tenant.
- `app.space_memberships` controls Money Space access.
- RLS policies prevent tenant data leakage.
- Security-definer RPC functions perform important financial writes transactionally.
- M-Pesa/Daraja secrets remain server-side only.

## 6. Next production step

The UI currently includes the protected authentication flow and secure Supabase repository contract. For full hosted persistence, route workspace actions through `src/services/workspaceRepository.ts` and the RPC functions in migration 002.
