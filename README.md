# Blog CMS Backend API

Express.js + Prisma + PostgreSQL backend for the Blog CMS.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and configure
cp .env.example .env
# Edit .env with your database URL and JWT secret

# 3. Run database migrations
npm run db:migrate

# 4. Seed initial data
npm run db:seed

# 5. Start development server
npm run dev
```

## Default Credentials
- **Super Admin**: admin@blogcms.com / admin123
- **Editor**: editor@blogcms.com / editor123

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user (auth)
- `PUT /api/auth/profile` — Update profile (auth)
- `PUT /api/auth/change-password` — Change password (auth)

### Blogs
- `GET /api/blogs/public` — Public published blogs (with search, category, tag, sort, pagination)
- `GET /api/blogs/featured` — Featured blogs
- `GET /api/blogs/public/:slug` — Single blog by slug (increments views)
- `GET /api/blogs/related/:slug` — Related blogs
- `GET /api/blogs/` — All blogs (auth, admin)
- `POST /api/blogs/` — Create blog (auth, writer+)
- `PUT /api/blogs/:id` — Update blog (auth, writer+)
- `DELETE /api/blogs/:id` — Delete blog (auth, editor+)
- `POST /api/blogs/bulk` — Bulk actions (auth, editor+)

### Categories
- `GET /api/categories/` — All categories
- `GET /api/categories/:slug` — Category with blogs
- `POST /api/categories/` — Create (auth, editor+)
- `PUT /api/categories/:id` — Update (auth, editor+)
- `DELETE /api/categories/:id` — Delete (auth, admin+)

### Tags
- `GET /api/tags/` — All tags
- `GET /api/tags/:slug` — Tag with blogs
- `POST /api/tags/` — Create (auth, writer+)
- `PUT /api/tags/:id` — Update (auth, editor+)
- `DELETE /api/tags/:id` — Delete (auth, admin+)

### Comments
- `GET /api/comments/` — All comments (auth, editor+)
- `POST /api/comments/` — Create comment (public)
- `PUT /api/comments/:id/approve` — Approve (auth, editor+)
- `PUT /api/comments/:id/reject` — Reject (auth, editor+)
- `DELETE /api/comments/:id` — Delete (auth, editor+)

### Media
- `GET /api/media/` — All media (auth)
- `POST /api/media/upload` — Upload file (auth, multipart)
- `PUT /api/media/:id` — Update alt text (auth)
- `DELETE /api/media/:id` — Delete file (auth)

### Users
- `GET /api/users/` — All users (auth, admin+)
- `POST /api/users/` — Create user (auth, admin+)
- `PUT /api/users/:id` — Update user (auth, admin+)
- `DELETE /api/users/:id` — Delete user (auth, super_admin)

### SEO
- `GET /api/seo/` — Get SEO settings (auth, admin+)
- `PUT /api/seo/` — Update SEO settings (auth, admin+)

### Dashboard
- `GET /api/dashboard/stats` — Dashboard analytics (auth)

### Other
- `GET /api/sitemap.xml` — Auto-generated sitemap
- `GET /api/robots.txt` — Dynamic robots.txt
- `GET /api/health` — Health check

## Deployment (VPS with PM2 + Nginx)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name blog-cms-api

# Nginx reverse proxy config
server {
    listen 80;
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
