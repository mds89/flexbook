# FlexBook Railway Deployment Guide

This guide covers deploying FlexBook (both frontend and backend) to Railway for production use.

## Overview

FlexBook consists of two components:
- **Backend API**: Node.js/Express server with PostgreSQL database
- **Frontend**: React application built with Vite

## Prerequisites

1. Railway account (https://railway.app)
2. GitHub repository with your FlexBook code
3. Basic understanding of environment variables

## Backend Deployment

### Step 1: Create Backend Service

1. Go to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your FlexBook repository
5. Railway will detect the backend Dockerfile

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will provision a PostgreSQL instance
4. Copy the database connection details

### Step 3: Configure Backend Environment Variables

Add these environment variables to your backend service:

```bash
# Database (automatically provided by Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h

# Server Configuration
NODE_ENV=production
PORT=3001

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.railway.app
ALLOWED_ORIGINS=https://your-frontend-domain.railway.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 4: Deploy Backend

1. Railway will automatically deploy after environment variables are set
2. Wait for deployment to complete
3. Test the API at `https://your-backend-domain.railway.app/health`

## Frontend Deployment

### Step 1: Create Frontend Service

1. In the same Railway project, click "New Service"
2. Select "GitHub Repo" → Choose the same repository
3. Railway will detect the root Dockerfile

### Step 2: Configure Frontend Environment Variables

Add these environment variables to your frontend service:

```bash
# Production Configuration
NODE_ENV=production
VITE_USE_MOCK_API=false

# API Configuration
VITE_API_BASE_URL=https://your-backend-domain.railway.app/api
VITE_FRONTEND_URL=https://your-frontend-domain.railway.app
```

### Step 3: Deploy Frontend

1. Railway will automatically build and deploy
2. Wait for deployment to complete
3. Access your application at `https://your-frontend-domain.railway.app`

## Post-Deployment Setup

### 1. Database Initialization

The backend automatically runs migrations and seeding on startup. This creates:
- Database tables
- Admin user: `admin@gym.com` / `admin123`
- Test user: `user@gym.com` / `user123`
- Sample classes

### 2. Custom Domain (Optional)

1. In Railway, go to your frontend service
2. Click "Settings" → "Domain"
3. Add your custom domain
4. Update DNS records as instructed
5. Update `VITE_FRONTEND_URL` and `FRONTEND_URL` environment variables

### 3. Production Checklist

- [ ] Change default admin password
- [ ] Update JWT secret to a secure random string
- [ ] Configure custom domain (recommended)
- [ ] Test all functionality (login, booking, admin features)
- [ ] Monitor application logs for errors
- [ ] Set up backup strategy for PostgreSQL database

## Environment Variables Reference

### Backend Required Variables
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=minimum-32-character-secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain
```

### Frontend Required Variables
```bash
VITE_API_BASE_URL=https://your-backend-domain/api
NODE_ENV=production
VITE_USE_MOCK_API=false
```

## Troubleshooting

### Backend Issues
- Check Railway logs for errors
- Verify DATABASE_URL is correctly set
- Ensure all required environment variables are present
- Test database connection at `/health` endpoint

### Frontend Issues
- Verify API URL is correct and accessible
- Check browser console for CORS errors
- Ensure environment variables are set correctly
- Test API connectivity from browser network tab

### Database Issues
- Check PostgreSQL service is running
- Verify connection string format
- Review migration logs in Railway console
- Ensure database has proper permissions

## Security Considerations

1. **JWT Secret**: Use a strong, random secret (minimum 32 characters)
2. **CORS**: Restrict allowed origins to your frontend domain only
3. **Rate Limiting**: Monitor and adjust based on usage patterns
4. **Database**: Railway PostgreSQL includes SSL by default
5. **Environment Variables**: Never commit secrets to version control

## Monitoring and Maintenance

1. **Logs**: Monitor Railway logs for errors and performance issues
2. **Database**: Set up automated backups in Railway dashboard
3. **Updates**: Regularly update dependencies for security patches
4. **Performance**: Monitor response times and optimize queries as needed

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month per service (suitable for small deployments)
- **Pro Plan**: $20/month per service (recommended for production)
- **PostgreSQL**: Included in service cost

Total estimated cost: $20-40/month depending on plan and usage.

## Support

- Railway Documentation: https://docs.railway.app
- FlexBook Issues: Check your GitHub repository issues
- PostgreSQL: Railway includes managed PostgreSQL support

## Next Steps

After successful deployment:
1. Change default passwords
2. Add your gym's classes and schedules
3. Invite users to register
4. Configure payment processing (if needed)
5. Set up monitoring and backups

Your FlexBook application is now ready for production use! 🚀