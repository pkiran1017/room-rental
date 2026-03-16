# Complete Hosting Guide: Vercel + Render + Free Cloud MySQL

This is a beginner-first, click-by-click guide for free trial deployment.

Stack used in this guide:
1. Frontend: Vercel
2. Backend API: Render
3. Database: Free MySQL-compatible cloud database (recommended: TiDB Cloud Serverless)

Current project deployment files:
1. [vercel.json](vercel.json)
2. [render.yaml](render.yaml)
3. [.env.example](.env.example)
4. [backend/.env.example](backend/.env.example)

## 1. Create all required accounts

Create these free accounts first:
1. GitHub: https://github.com/signup
2. Vercel: https://vercel.com/signup
3. Render: https://dashboard.render.com/register
4. TiDB Cloud (recommended free MySQL-compatible): https://tidbcloud.com/
5. Supabase: https://supabase.com/dashboard/sign-up
6. ImgBB (for image API key): https://imgbb.com/

Optional email provider for SMTP:
1. Brevo: https://www.brevo.com/
2. Resend: https://resend.com/
3. Mailgun: https://www.mailgun.com/

## 2. Push your code to GitHub

You must deploy from GitHub to both Vercel and Render.

If repository is not created yet:
1. Create a new repository in GitHub.
2. Push your local code to that repository.
3. Confirm these files are present in GitHub root:
4. [vercel.json](vercel.json)
5. [render.yaml](render.yaml)
6. [DEPLOYMENT_VERCEL_RENDER.md](DEPLOYMENT_VERCEL_RENDER.md)

## 3. Create free cloud MySQL database

Recommended provider: TiDB Cloud Serverless.

### 3.1 Create cluster and database

1. Log in to TiDB Cloud.
2. Create a free Serverless cluster.
3. Create a database named room_rental_db (or your preferred name).
4. Create a database user and password.
5. Copy and store:
6. DB_HOST
7. DB_PORT
8. DB_USER
9. DB_PASSWORD
10. DB_NAME

### 3.2 Import schema

1. Open SQL editor in your DB dashboard.
2. Copy SQL from [backend/database/local.sql](backend/database/local.sql).
3. Run SQL.
4. Confirm key tables are created (users, rooms, expenses, roommates, contact_leads).

### 3.3 SSL setting note

Some free DB providers require SSL.

This backend supports:
1. DB_SSL=true or false
2. DB_SSL_REJECT_UNAUTHORIZED=true or false

Implemented in [backend/config/database.js](backend/config/database.js#L4).

## 4. Create Supabase project for realtime chat

1. Create project in Supabase dashboard.
2. Copy Project URL and anon key from Settings -> API.
3. Copy service_role key from Settings -> API.
4. Open SQL Editor and run schema from [backend/database/supabase.sql](backend/database/supabase.sql).

Values needed later:
1. SUPABASE_URL
2. SUPABASE_ANON_KEY
3. SUPABASE_SERVICE_KEY

## 5. Create ImgBB API key for image upload

1. Create/login account at ImgBB.
2. Create API key.
3. Save key for IMAGE_STORAGE_API_KEY.

## 6. Deploy backend on Render

### 6.1 Create Render service

1. Open Render Dashboard.
2. Click New -> Web Service.
3. Connect GitHub and select your repository.
4. Render should detect [render.yaml](render.yaml).

If manual fields appear, use exactly:
1. Root Directory: backend
2. Runtime: Node
3. Build Command: npm install
4. Start Command: npm start
5. Health Check Path: /api/health

### 6.2 Add backend environment variables in Render

Use [backend/.env.example](backend/.env.example) as template.

Set these required values:
1. NODE_ENV=production
2. FRONTEND_URL=https://your-vercel-domain.vercel.app
3. DB_HOST=from cloud DB
4. DB_PORT=from cloud DB
5. DB_USER=from cloud DB
6. DB_PASSWORD=from cloud DB
7. DB_NAME=from cloud DB
8. DB_SSL=false or true
9. DB_SSL_REJECT_UNAUTHORIZED=true
10. JWT_SECRET=long random secret
11. JWT_EXPIRES_IN=7d
12. SUPABASE_URL=from Supabase
13. SUPABASE_ANON_KEY=from Supabase
14. SUPABASE_SERVICE_KEY=from Supabase
15. IMAGE_STORAGE_API_KEY=from ImgBB
16. IMAGE_STORAGE_URL=https://api.imgbb.com/1/upload

Recommended additional values:
1. SITE_URL=https://your-vercel-domain.vercel.app
2. SUPPORT_EMAIL=your support email
3. ADMIN_EMAIL=your admin email
4. NOTIFICATION_EMAIL=your notification email
5. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE

### 6.3 Deploy backend

1. Save env variables.
2. Trigger deploy.
3. Wait until status is Live.
4. Copy backend URL, for example:
5. https://room-rental-backend.onrender.com

### 6.4 Verify backend

Open:
1. https://your-render-service.onrender.com/api/health

Expected:
1. success true
2. database connected

## 7. Deploy frontend on Vercel

### 7.1 Create Vercel project

1. Open Vercel Dashboard.
2. Click Add New -> Project.
3. Import same GitHub repo.
4. Vercel should auto-detect Vite from [vercel.json](vercel.json).

If manual fields are asked:
1. Build Command: npm run build
2. Output Directory: dist

### 7.2 Add frontend env variables in Vercel

Use [.env.example](.env.example) as template.

Required:
1. VITE_API_URL=https://your-render-service.onrender.com/api
2. VITE_SUPABASE_URL=https://your-project-id.supabase.co
3. VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

Recommended:
1. VITE_SITE_URL=https://your-vercel-domain.vercel.app
2. VITE_SITE_BRAND=RoomRental
3. VITE_DEFAULT_CITY=Pune
4. VITE_ANALYTICS_ENDPOINT=

### 7.3 Deploy frontend

1. Save env variables.
2. Deploy.
3. Copy Vercel production URL.

## 8. Cross-link final URLs (critical)

After frontend is live:
1. Put Vercel URL into Render FRONTEND_URL.
2. If multiple domains are used, add comma-separated origins in FRONTEND_URL.
3. Redeploy Render backend.

After backend is final:
1. Confirm VITE_API_URL in Vercel points to final Render URL + /api.
2. Redeploy Vercel.

## 9. Test checklist after deployment

1. Open frontend homepage.
2. Register/login works.
3. Rooms list and room details load.
4. Contact form works.
5. Image upload works.
6. Admin pages load for admin user.
7. Chat/realtime features initialize.

## 10. Common errors and direct fixes

### Error: CORS blocked

Fix:
1. FRONTEND_URL in Render must exactly match Vercel origin with https.
2. Redeploy backend.

### Error: DB connection failed on Render

Fix:
1. Recheck DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.
2. Set DB_SSL=true if provider requires SSL.
3. If certificate issue persists, set DB_SSL_REJECT_UNAUTHORIZED=false only if provider docs allow it.

### Error: Frontend calls localhost in production

Fix:
1. Set VITE_API_URL in Vercel to Render URL.
2. Redeploy frontend.

### Error: First API request is slow

Reason:
1. Render free tier cold start.

Fix:
1. This is normal for free tier.

## 11. Security checklist before sharing publicly

1. Rotate JWT secret.
2. Rotate Supabase service key if exposed.
3. Rotate ImgBB key if exposed.
4. Keep secrets only in Vercel and Render env dashboards.
5. Do not commit real secret values in repository.

## 12. Free hosting summary

Best trial combination for this project:
1. Vercel Free for frontend
2. Render Free Web Service for backend
3. TiDB Cloud Serverless free tier for MySQL-compatible DB

Why:
1. Easiest setup with GitHub-based deploys
2. Works cleanly with your Vite + Node split
3. Good dashboards/logs for debugging during trial
