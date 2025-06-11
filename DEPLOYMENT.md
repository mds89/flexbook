# 🚀 FlexBook Deployment Guide

Complete deployment guide for FlexBook - a modern gym booking system with multiple hosting options.

## 🎯 **Deployment Options**

### **Option 1: Railway (Recommended)**
- **All-in-one platform** with built-in PostgreSQL
- **$5/month credit** covers small applications
- **Automatic HTTPS** and domain management
- **Git-based deployments**

### **Option 2: Docker + VPS**
- **Full control** over infrastructure
- **Docker Compose** for easy management
- **Custom domain** and SSL setup
- **Scalable** and production-ready

### **Option 3: Cloud Platforms**
- **Render + Supabase** for free hosting
- **Vercel + Supabase** for frontend focus
- **DigitalOcean App Platform**

---

## 🚄 **Railway Deployment** (Recommended)

Railway provides the easiest deployment experience with built-in database support.

### **Prerequisites**
- Railway account ([railway.app](https://railway.app))
- Git repository with FlexBook code
- Railway CLI installed

### **Step 1: Frontend Deployment**

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy frontend:**
   ```bash
   # From project root
   railway up
   ```

3. **Configure environment variables:**
   ```bash
   # In Railway dashboard
   NODE_ENV=production
   REACT_APP_API_URL=https://your-backend-url.railway.app/api
   ```

### **Step 2: Backend Deployment**

1. **Deploy backend:**
   ```bash
   cd backend
   railway up
   ```

2. **Add PostgreSQL database:**
   - Railway dashboard → New → Database → PostgreSQL
   - Automatically configures `DATABASE_URL`

3. **Configure backend environment:**
   ```bash
   NODE_ENV=production
   DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
   JWT_SECRET=your-super-secret-jwt-key-here
   PORT=${{PORT}}
   ```

4. **Database setup:**
   ```bash
   # Automatic via package.json scripts
   # Or manually: railway run npm run migrate && npm run seed
   ```

### **Step 3: Domain Configuration**
- Railway auto-generates domains
- Optional: Add custom domain in dashboard
- HTTPS automatically enabled

---

## 🐳 **Docker Deployment**

### **Single Command Deployment**
```bash
# Production deployment with all services
docker-compose -f docker-compose.production.yml up -d
```

### **Environment Setup**
1. **Copy environment files:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

2. **Configure environment variables:**
   ```bash
   # .env (Frontend)
   REACT_APP_API_URL=http://localhost:5000/api
   
   # backend/.env (Backend)
   DATABASE_URL=postgresql://flexbook:password@postgres:5432/flexbook_db
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
   NODE_ENV=production
   ```

### **Services Included**
- **Frontend:** Nginx serving built React app
- **Backend:** Node.js API server
- **Database:** PostgreSQL with persistent data
- **Reverse Proxy:** Nginx with SSL support

### **Custom Domain & SSL**
1. **Update nginx.conf:**
   ```nginx
   server_name your-domain.com www.your-domain.com;
   ```

2. **Get SSL certificate:**
   ```bash
   # Using Certbot
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

---

## ☁️ **Cloud Platform Deployments**

### **Render + Supabase**

#### **Database Setup (Supabase)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy database URL from Settings → Database
4. Run schema:
   ```sql
   -- Copy from backend/src/db/schema.sql
   -- Run in Supabase SQL Editor
   ```

#### **Backend Deployment (Render)**
1. Create account at [render.com](https://render.com)
2. New Web Service → Connect repository
3. Configure:
   ```yaml
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   Environment: Node
   ```
4. Environment variables:
   ```bash
   DATABASE_URL=your-supabase-url
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   ```

#### **Frontend Deployment (Render)**
1. New Static Site → Connect repository
2. Configure:
   ```yaml
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
3. Environment variables:
   ```bash
   REACT_APP_API_URL=https://your-backend.onrender.com/api
   ```

### **Vercel + Supabase**

#### **Backend Deployment**
```bash
cd backend
npm install -g vercel
vercel --prod
```

#### **Frontend Deployment**
```bash
npm install -g vercel
vercel --prod
```

#### **Environment Configuration**
```bash
# Set via Vercel dashboard or CLI
vercel env add REACT_APP_API_URL
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

---

## 🔧 **Production Configuration**

### **Security Checklist**
- ✅ Strong JWT secret (32+ characters)
- ✅ HTTPS enforced
- ✅ CORS properly configured
- ✅ Database credentials secured
- ✅ Environment variables set
- ✅ Regular security updates

### **Performance Optimization**
- ✅ Gzip compression enabled
- ✅ Static asset caching
- ✅ Database connection pooling
- ✅ CDN for static files
- ✅ Resource monitoring

### **Environment Variables**

#### **Frontend**
```bash
NODE_ENV=production
REACT_APP_API_URL=https://api.your-domain.com
```

#### **Backend**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/flexbook_db
JWT_SECRET=super-secret-key-minimum-32-characters
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
```

---

## 📊 **Monitoring & Maintenance**

### **Application Monitoring**
- **Logs:** Monitor application and error logs
- **Performance:** Track response times and throughput
- **Database:** Monitor connection pools and query performance
- **Uptime:** Setup health checks and alerts

### **Database Backup**
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Automated backups (crontab)
0 2 * * * pg_dump $DATABASE_URL > /backup/flexbook-$(date +\%Y\%m\%d).sql
```

### **SSL Certificate Renewal**
```bash
# Certbot auto-renewal
sudo certbot renew --dry-run
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Build Failures**
```bash
# Check Node.js version
node --version  # Should be 18+

# Clear cache and reinstall
npm clean-install
```

#### **Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check migrations
npm run migrate
```

#### **API Connection Problems**
- Verify `REACT_APP_API_URL` is correct
- Check CORS configuration
- Ensure backend is accessible
- Validate SSL certificates

### **Performance Issues**
- Monitor database query performance
- Check server resource usage
- Optimize frontend bundle size
- Enable CDN for static assets

---

## 🎉 **Post-Deployment**

### **Verification Steps**
1. ✅ **Frontend loads** correctly
2. ✅ **API endpoints** respond
3. ✅ **Database connection** works
4. ✅ **Authentication** functions
5. ✅ **Booking system** operates
6. ✅ **Admin features** accessible

### **Demo Account Testing**
```bash
# Test with provided demo accounts
Admin: admin@gym.com / admin123
User:  user@gym.com / user123
```

### **Scaling Considerations**
- **Horizontal scaling:** Load balancers and multiple instances
- **Database scaling:** Read replicas and connection pooling
- **CDN setup:** CloudFlare or AWS CloudFront
- **Monitoring:** Application performance monitoring (APM)

---

## 📞 **Support**

### **Documentation**
- **Railway:** [docs.railway.app](https://docs.railway.app)
- **Docker:** [docs.docker.com](https://docs.docker.com)
- **Render:** [render.com/docs](https://render.com/docs)

### **Community**
- **GitHub Issues:** Report bugs and feature requests
- **Discord Communities:** Platform-specific support
- **Stack Overflow:** Technical questions

---

**FlexBook** - Successfully deployed and ready for production! 🚀💪