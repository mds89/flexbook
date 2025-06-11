# 🏋️ FlexBook - Professional Gym Class Booking System

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)

A modern, production-ready gym class booking system built with React, TypeScript, and Tailwind CSS. Perfect for fitness studios, gyms, and wellness centers.

## ✨ Features

### 🔐 **Authentication & User Management**
- Secure JWT-based authentication
- Role-based access control (Admin/User)
- User registration and profile management
- Demo accounts for testing

### 📅 **Class Booking System**
- 14-day advance booking window
- Real-time availability checking
- 24-hour cancellation policy with automatic refunds
- Class capacity management

### 💳 **Concession Management**
- Flexible concession packages (5, 10, 20 classes)
- Credit system (up to -5 concessions)
- Automatic concession deduction and refunds
- Payment tracking and history

### 👥 **Admin Dashboard**
- Complete user management
- Class scheduling and management
- Booking oversight and completion tracking
- Payment processing and notes system

### 📱 **Modern UI/UX**
- Responsive design for all devices
- Dark/light theme support
- Accessible components
- Professional design system

## 🚀 Quick Start

### Option 1: Demo Deployment (Recommended)

Deploy immediately with demo data:

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/flexbook)

1. Click the deploy button above
2. Connect your GitHub account
3. Configure project settings:
   - Build command: `npm run build:demo`
   - Build output directory: `dist`
4. Your demo will be live in minutes!

**Demo Accounts:**
- **Admin:** `admin@gym.com` / `admin123`
- **User:** `user@gym.com` / `user123`

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/flexbook.git
cd flexbook

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173
```

## 🏗️ Deployment

### Cloudflare Pages (Recommended)

#### Method 1: Git Integration
1. Fork this repository
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Connect your repository
4. Configure build settings:
   ```
   Build command: npm run build:demo
   Build output directory: dist
   Node.js version: 18
   ```

#### Method 2: CLI Deployment
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler auth login

# Build and deploy
npm run build:demo
wrangler pages deploy dist --project-name=flexbook
```

See [CLOUDFLARE_PAGES_DEPLOYMENT.md](./CLOUDFLARE_PAGES_DEPLOYMENT.md) for detailed instructions.

### Other Platforms

- **Vercel:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/flexbook)
- **Netlify:** [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/flexbook)

## ⚙️ Configuration

### Environment Variables

Create `.env.local` for local development:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api
VITE_FRONTEND_URL=http://localhost:5173

# Feature Flags
VITE_USE_MOCK_API=true  # Set to false for production API
VITE_DEBUG=true

# App Configuration
VITE_APP_NAME=FlexBook
VITE_APP_VERSION=1.0.0
```

### Production Environment

For production deployments, set these in your hosting platform:

```env
NODE_ENV=production
VITE_API_BASE_URL=https://your-backend-api.com/api
VITE_FRONTEND_URL=https://your-domain.com
VITE_USE_MOCK_API=false
VITE_DEBUG=false
```

### Demo Mode

For demo deployments without a backend:

```env
NODE_ENV=production
VITE_USE_MOCK_API=true
VITE_DEMO_MODE=true
VITE_APP_NAME=FlexBook Demo
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS v4** - Utility-first CSS framework

### UI Components
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **Sonner** - Toast notifications
- **Recharts** - Data visualization

### State Management
- **React Context** - Built-in state management
- **Local Storage** - Persistent demo data

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📦 Project Structure

```
flexbook/
├── public/                 # Static assets
│   └── _redirects         # Cloudflare Pages routing
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   └── ...           # Feature components
│   ├── contexts/         # React Context providers
│   ├── services/         # API and external services
│   ├── config/           # Configuration files
│   └── styles/           # CSS and styling
├── backend/              # Node.js backend (optional)
├── .env.example          # Environment variables template
├── wrangler.toml         # Cloudflare configuration
└── package.json          # Dependencies and scripts
```

## 🎯 Usage Guide

### For Gym Members
1. **Register/Login** - Create account or use demo credentials
2. **Browse Classes** - View available classes and schedules
3. **Book Classes** - Reserve your spot with concessions
4. **Manage Bookings** - View, cancel, or modify bookings
5. **Purchase Concessions** - Buy class packages

### For Gym Administrators
1. **Login as Admin** - Use admin credentials
2. **Manage Classes** - Create, edit, and schedule classes
3. **User Management** - View members and manage concessions
4. **Track Bookings** - Monitor class attendance and capacity
5. **Payment Processing** - Handle payment confirmations

## 📊 Business Features

### Flexible Pricing
- **5 Classes:** $40 NZD
- **10 Classes:** $70 NZD  
- **20 Classes:** $120 NZD
- **Single Class:** $10 NZD

### Smart Booking Rules
- Book up to 14 days in advance
- Cancel up to 24 hours before class
- Credit system allows negative balance (up to -5)
- Automatic refunds for early cancellations

### Class Scheduling
- Morning classes: Monday & Friday 7:00 AM
- Afternoon classes: Monday, Wednesday, Friday 5:30 PM
- Flexible capacity management
- Instructor assignment

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run type-check       # TypeScript checking

# Building
npm run build            # Production build
npm run build:demo       # Demo build with mock API
npm run build:production # Production build with real API

# Deployment
npm run pages:build      # Build for Cloudflare Pages
npm run deploy:pages     # Deploy to Cloudflare Pages
npm run preview          # Preview production build

# Utilities
npm run clean            # Clean build artifacts
npm run lint             # Lint code
```

### Adding New Features

1. **Components** - Add to `/src/components/`
2. **Context** - Add state management to `/src/contexts/`
3. **Services** - Add API calls to `/src/services/`
4. **Types** - Define TypeScript interfaces
5. **Styling** - Use Tailwind CSS classes

### Testing

```bash
# Run type checking
npm run type-check

# Check build
npm run build

# Preview production build
npm run preview
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails:**
   - Check Node.js version (18+ required)
   - Clear node_modules: `rm -rf node_modules && npm install`

2. **404 on Page Refresh:**
   - Ensure `_redirects` file exists in `/public`
   - Check SPA routing configuration

3. **API Connection Issues:**
   - Verify `VITE_API_BASE_URL` in environment
   - Check CORS settings if using external API

4. **Demo Accounts Not Working:**
   - Ensure `VITE_USE_MOCK_API=true`
   - Clear browser cache and local storage

### Performance Optimization

- Bundle analysis: `npm run build -- --analyze`
- Use code splitting for large components
- Optimize images and assets
- Enable compression in hosting platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm run type-check`
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature-name`
7. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful icon library
- [Vite](https://vitejs.dev/) - Fast build tool

## 📞 Support

- 📖 [Documentation](./CLOUDFLARE_PAGES_DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/your-username/flexbook/issues)
- 💬 [Discussions](https://github.com/your-username/flexbook/discussions)

---

**Ready to deploy?** Click the button below to get started:

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/flexbook)

Made with ❤️ for the fitness community