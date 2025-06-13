# Taskmaster Production Deployment Guide

This document provides step-by-step instructions for deploying Taskmaster to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Options](#deployment-options)
- [Health Checks](#health-checks)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Node.js**: Version 16.x or higher
- **npm**: Version 8.x or higher
- **Memory**: Minimum 2GB RAM for build process
- **Storage**: Minimum 1GB disk space

### Required Services

- **Web Server**: Nginx, Apache, or similar
- **SSL Certificate**: For HTTPS support
- **CDN**: Optional but recommended for static assets
- **Error Reporting Service**: For production error monitoring

## Environment Configuration

### 1. Create Production Environment File

Create `.env.production` in the `ui` directory:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.taskmaster.com
VITE_APP_TITLE=Taskmaster - Task Management Platform
VITE_APP_DESCRIPTION=Professional task and project management application

# Performance Monitoring
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ERROR_REPORTING_ENDPOINT=/api/errors

# Security Settings
VITE_ENABLE_CSP=true
VITE_SECURE_COOKIES=true

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ACCESSIBILITY_FEATURES=true
VITE_ENABLE_PWA=true

# Logging Configuration
VITE_LOG_LEVEL=error

# Build Configuration
GENERATE_SOURCEMAP=false
INLINE_RUNTIME_CHUNK=false
IMAGE_INLINE_SIZE_LIMIT=8192
```

### 2. Validate Configuration

Run the configuration validator:

```bash
cd ui
npm run validate-config
```

## Build Process

### 1. Install Dependencies

```bash
cd ui
npm ci --production
```

### 2. Run Tests

```bash
# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e:headless

# Accessibility tests
npm run test:a11y
```

### 3. Build Application

```bash
# Production build
npm run build

# Analyze bundle (optional)
npm run build:analyze
```

### 4. Verify Build

```bash
# Preview production build locally
npm run preview
```

## Deployment Options

### Option 1: Static Hosting (Recommended)

#### Netlify

1. **Connect Repository**
   ```bash
   # Build command:
   cd ui && npm run build
   
   # Publish directory:
   ui/dist
   ```

2. **Environment Variables**
   - Set all `VITE_*` variables in Netlify dashboard
   - Enable branch deploys for testing

3. **Redirects Configuration**
   Create `ui/public/_redirects`:
   ```
   /*    /index.html   200
   ```

#### Vercel

1. **Deploy Command**
   ```bash
   npx vercel --prod
   ```

2. **Configuration**
   Create `vercel.json`:
   ```json
   {
     "buildCommand": "cd ui && npm run build",
     "outputDirectory": "ui/dist",
     "framework": "vite"
   }
   ```

### Option 2: Container Deployment

#### Docker

1. **Create Dockerfile**
   ```dockerfile
   # Build stage
   FROM node:16-alpine as build
   WORKDIR /app
   COPY ui/package*.json ./
   RUN npm ci --production
   COPY ui/ .
   RUN npm run build

   # Production stage
   FROM nginx:alpine
   COPY --from=build /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build and Deploy**
   ```bash
   docker build -t taskmaster:latest .
   docker run -p 80:80 taskmaster:latest
   ```

### Option 3: Traditional Server

#### Nginx Configuration

Create `/etc/nginx/sites-available/taskmaster`:

```nginx
server {
    listen 443 ssl http2;
    server_name taskmaster.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    root /var/www/taskmaster;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name taskmaster.com;
    return 301 https://$server_name$request_uri;
}
```

## Health Checks

### Application Health Check

Create a health check endpoint that verifies:

1. **Application Loading**: Main app renders successfully
2. **API Connectivity**: Backend services are reachable
3. **Performance Metrics**: Core Web Vitals are within acceptable ranges

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

URL="https://taskmaster.com"
EXPECTED_STATUS=200

# Check if site loads
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$STATUS" -eq "$EXPECTED_STATUS" ]; then
    echo "✅ Site is healthy (Status: $STATUS)"
    exit 0
else
    echo "❌ Site is unhealthy (Status: $STATUS)"
    exit 1
fi
```

## Monitoring

### 1. Performance Monitoring

The application includes built-in performance monitoring:

- **Core Web Vitals**: LCP, FID, CLS tracking
- **Custom Metrics**: Route transition times, API response times
- **User Experience**: Error rates, session duration

### 2. Error Reporting

Production errors are automatically captured and reported:

- **Error Boundary**: Catches React component errors
- **Unhandled Promises**: Global error handlers
- **Network Errors**: API request failures

### 3. Analytics Integration

Configure analytics in production environment:

```bash
VITE_ANALYTICS_ID=your-analytics-id
VITE_ENABLE_ANALYTICS=true
```

## Security Considerations

### 1. Content Security Policy (CSP)

The application includes CSP headers in production:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### 2. Environment Variables

- Never commit `.env.production` to version control
- Use secure secret management in CI/CD
- Rotate API keys regularly

### 3. HTTPS Enforcement

- Always use HTTPS in production
- Implement HSTS headers
- Configure secure cookie settings

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf ui/dist ui/.vite
```

#### Environment Variable Issues

```bash
# Verify environment variables are loaded
npm run build -- --debug

# Check configuration
npm run validate-config
```

#### Performance Issues

```bash
# Analyze bundle size
npm run build:analyze

# Check for unused dependencies
npm run audit
```

### Performance Optimization

1. **Bundle Analysis**: Use `npm run build:analyze` to identify large dependencies
2. **Code Splitting**: Ensure lazy loading is working for all routes
3. **Asset Optimization**: Compress images and use appropriate formats
4. **CDN Configuration**: Serve static assets from CDN

### Rollback Procedure

1. **Immediate Rollback**: Revert to previous deployment
2. **Database Rollback**: If schema changes were made
3. **Cache Invalidation**: Clear CDN and browser caches
4. **Monitoring**: Verify rollback success

## Support

For deployment support:
- **Email**: support@taskmaster.com
- **Documentation**: [https://docs.taskmaster.com](https://docs.taskmaster.com)
- **Status Page**: [https://status.taskmaster.com](https://status.taskmaster.com)

---

**Last Updated**: January 2025  
**Version**: 1.0.0 