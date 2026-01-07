# Deploying Ryan CRM to Vercel

## 1. Create Project on Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import the repository (GitHub/GitLab/Bitbucket) or upload via CLI.

## 2. Configure Environment Variables
In the "Configure Project" screen, expand **"Environment Variables"**:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres.puldocfkpdnvqvthhwwa:Prodigy2024%40Pakistan@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://postgres.puldocfkpdnvqvthhwwa:Prodigy2024%40Pakistan@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres` |
| `NEXTAUTH_SECRET` | (Generate a random string, e.g. `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | (Leave empty, Vercel sets this automatically. Or set to your domain ex: `https://your-project.vercel.app`) |

## 3. Deployment
-   Click **"Deploy"**.
-   Vercel will:
    1.  Install dependencies.
    2.  Run `npx prisma generate`.
    3.  Build the Next.js app.
    4.  Deploy.

## 4. Admin Access
-   Login with:
    -   Email: `admin@ryancrm.com`
    -   Password: `admin123`
