# FlexBook - Cloudflare Pages Deployment Guide

This guide will help you deploy FlexBook to Cloudflare Pages for production use.

## 🚀 Quick Deploy (Demo Mode)

For a quick demo deployment with mock data:

1. **Fork this repository** to your GitHub account
2. **Connect to Cloudflare Pages:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project" → "Connect to Git"
   - Select your forked repository
3. **Configure build settings:**
   - Framework preset: `None` (we'll configure manually)
   - Build command: `npm run build:demo`
   - Build output directory: `dist`
   - Node.js version: `18`
4. **Deploy!** Your demo will be live in minutes

## 🏗️ Production Deployment

### Prerequisites

- A Cloudflare account
- A backend API (or use mock mode for demo)
- Domain name (optional)

### Step 1: Prepare Your Repository

1. **Clone or fork this repository**
2. **Update environment variables** in `.env.production`:
   ```env
   VITE_API_BASE_URL=https://your-backend-api.com/api
   VITE_FRONTEND_URL=https://your-domain.com
   VITE_USE_MOCK_API=false
   ```

### Step 2: Deploy to Cloudflare Pages

#### Method 1: Git Integration (Recommended)

1. **Connect to Git:**
   - Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
   - Click "Create a project" → "Connect to Git"
   - Select your repository

2. **Configure build settings:**
   ```
   Framework preset: None
   Build command: npm run build:production
   Build output directory: dist
   Root directory: / (leave empty)
   ```

3. **Set environment variables:**
   - Go to Settings → Environment variables
   - Add production environment variables:
     ```
     NODE_ENV=production
     VITE_API_BASE_URL=https://your-api.com/api
     VITE_FRONTEND_URL=https://your-domain.com
     VITE_USE_MOCK_API=false
     ```

4. **Deploy:**
   - Click "Save and Deploy"
   - Your app will build and deploy automatically

#### Method 2: Direct Upload

1. **Build locally:**
   ```bash
   npm install
   npm run build:production
   ```

2. **Upload to Cloudflare Pages:**
   ```bash
   # Install Wrangler CLI
   npm install -g wrangler

   # Login to Cloudflare
   npx wrangler auth login

   # Create and deploy
   npx wrangler pages deploy dist --project-name=flexbook
   ```

### Step 3: Configure Custom Domain (Optional)

1. **Add domain in Cloudflare Pages:**
   - Go to your project → Custom domains
   - Add your domain
   - Follow DNS configuration instructions

2. **Update environment variables:**
   - Update `VITE_FRONTEND_URL` to your custom domain
   - Redeploy if necessary

## ⚙️ Configuration Options

### Build Commands

- `npm run build` - Standard production build
- `npm run build:demo` - Demo build with mock API
- `npm run build:production` - Production build with real API

### Environment Variables

| Variable | Description | Demo Value | Production Value |
|----------|-------------|------------|------------------|
| `NODE_ENV` | Environment | `production` | `production` |
| `VITE_API_BASE_URL` | Backend API URL | `https://demo-api.com` | `https://your-api.com/api` |
| `VITE_FRONTEND_URL` | Frontend URL | `https://demo.pages.dev` | `https://your-domain.com` |
| `VITE_USE_MOCK_API` | Use mock data | `true` | `false` |
| `VITE_DEBUG` | Debug mode | `false` | `false` |

### Deployment Modes

#### Demo Mode
- Uses mock API with sample data
- Perfect for showcasing features
- No backend required
- Demo accounts: `admin@gym.com/admin123`, `user@gym.com/user123`

#### Production Mode
- Requires real backend API
- Full database integration
- User registration and authentication
- Payment processing integration

## 🔧 Advanced Configuration

### Custom Headers

The app includes security headers via `wrangler.toml`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Caching Strategy

- Static assets: 1 year cache
- HTML files: No cache (always fresh)
- API calls: Handled by service worker

### Performance Optimizations

- Code splitting for vendor libraries
- Terser minification
- Modern browser targets (ES2020)
- Optimized bundle sizes

## 🔍 Monitoring & Analytics

### Error Tracking

Add Sentry for error monitoring:
```env
VITE_SENTRY_DSN=your-sentry-dsn
```

### Analytics

Add Google Analytics or other providers:
```env
VITE_ANALYTICS_ID=your-analytics-id
```

## 🔒 Security

### Environment Variables

**Never commit sensitive data to Git!**

Set these in Cloudflare Pages dashboard:
- API keys
- Database credentials
- Third-party service tokens

### HTTPS

Cloudflare Pages provides automatic HTTPS for all deployments.

### Content Security Policy

Consider adding CSP headers for additional security:
```toml
# In wrangler.toml
[[headers]]
for = "/*"
[headers.values]
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'"
```

## 🚨 Troubleshooting

### Build Failures

1. **Node.js version mismatch:**
   - Ensure Node.js 18+ in build settings
   - Check `engines` in package.json

2. **TypeScript errors:**
   ```bash
   npm run type-check
   ```

3. **Environment variables not loading:**
   - Check variable names start with `VITE_`
   - Verify they're set in Cloudflare Pages dashboard

### Runtime Issues

1. **404 errors on refresh:**
   - Ensure `_redirects` file is in `/public`
   - Check SPA routing configuration

2. **API connection failed:**
   - Verify `VITE_API_BASE_URL` is correct
   - Check CORS settings on backend
   - Test API endpoints directly

3. **Demo accounts not working:**
   - Ensure `VITE_USE_MOCK_API=true` for demo mode
   - Check browser console for errors

### Performance Issues

1. **Slow loading:**
   - Enable Cloudflare's optimization features
   - Check bundle sizes with `npm run build -- --analyze`

2. **Memory issues:**
   - Increase build timeout in Cloudflare Pages
   - Optimize images and assets

## 📞 Support

For deployment issues:
1. Check Cloudflare Pages documentation
2. Review build logs in dashboard
3. Test locally with `npm run preview`
4. Check browser developer tools

## 🎯 Success Checklist

After deployment, verify:
- [ ] App loads without errors
- [ ] Login/logout works
- [ ] Routing works on page refresh
- [ ] Mobile responsive design
- [ ] Performance metrics are good
- [ ] Security headers are set
- [ ] Custom domain configured (if applicable)
- [ ] Environment variables are correct
- [ ] Error tracking is working
- [ ] Analytics are collecting data

---

## 🌟 Example Deployment URLs

- **Demo:** `https://flexbook-demo.pages.dev`
- **Production:** `https://flexbook.pages.dev` or your custom domain

Your FlexBook application is now ready for the world! 🚀