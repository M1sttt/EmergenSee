# Deployment Guide

## Overview

This guide covers deploying EmergenSee to various hosting platforms.

## Prerequisites

- Built and tested application
- MongoDB instance (local or cloud)
- Environment variables configured
- Git repository access

## Environment Setup

### Production Environment Variables

#### API (.env.production)
```env
PORT=3001
NODE_ENV=production
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<secure-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<another-secure-random-string>
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-domain.com
```

#### Web (.env.production)
```env
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=https://api.your-domain.com
```

## MongoDB Atlas Setup

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up or log in

2. **Create Cluster**
   - Click "Create Cluster"
   - Choose free tier (M0) or appropriate tier
   - Select cloud provider and region
   - Name your cluster

3. **Configure Security**
   - Create database user with username and password
   - Add IP addresses to whitelist (0.0.0.0/0 for all, or specific IPs)

4. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name

## Deployment Options

### Option 1: Heroku (API) + Vercel (Web)

#### API Deployment on Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
heroku login
```

2. **Create Heroku App**
```bash
cd apps/api
heroku create your-app-name
```

3. **Set Environment Variables**
```bash
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set JWT_REFRESH_SECRET="your-refresh-secret"
heroku config:set CORS_ORIGIN="https://your-web-app.vercel.app"
heroku config:set NODE_ENV="production"
```

4. **Deploy**
```bash
git push heroku main
```

5. **Check Logs**
```bash
heroku logs --tail
```

#### Web Deployment on Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
cd apps/web
vercel
```

3. **Set Environment Variables in Vercel Dashboard**
   - Go to your project settings
   - Navigate to Environment Variables
   - Add `VITE_API_URL` and `VITE_WS_URL`

4. **Redeploy**
```bash
vercel --prod
```

### Option 2: AWS (Elastic Beanstalk + S3)

#### API on Elastic Beanstalk

1. **Install EB CLI**
```bash
pip install awsebcli
```

2. **Initialize EB Application**
```bash
cd apps/api
eb init
```

3. **Create Environment**
```bash
eb create production
```

4. **Set Environment Variables**
```bash
eb setenv MONGODB_URI="your-mongodb-uri" \
  JWT_SECRET="your-jwt-secret" \
  NODE_ENV="production"
```

5. **Deploy**
```bash
eb deploy
```

#### Web on S3 + CloudFront

1. **Build Application**
```bash
cd apps/web
pnpm build
```

2. **Create S3 Bucket**
```bash
aws s3 mb s3://your-bucket-name
```

3. **Upload Build**
```bash
aws s3 sync dist/ s3://your-bucket-name
```

4. **Configure Static Website Hosting**
```bash
aws s3 website s3://your-bucket-name \
  --index-document index.html \
  --error-document index.html
```

5. **Set Up CloudFront** (optional but recommended)
   - Create CloudFront distribution
   - Point to S3 bucket
   - Configure custom domain
   - Set up SSL certificate

### Option 3: DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Create new app from GitHub repository

2. **Configure API Component**
   - Select `apps/api` directory
   - Choose Node.js environment
   - Set build command: `pnpm install && pnpm build`
   - Set run command: `node dist/main.js`
   - Add environment variables

3. **Configure Web Component**
   - Select `apps/web` directory
   - Choose Static Site
   - Set build command: `pnpm install && pnpm build`
   - Set output directory: `dist`
   - Add environment variables

4. **Deploy**
   - Review and deploy
   - App will auto-deploy on git push

### Option 4: Docker Deployment

#### Build Docker Images

**API Dockerfile** (`apps/api/Dockerfile`):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

# Build
WORKDIR /app/apps/api
RUN pnpm build

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

**Web Dockerfile** (`apps/web/Dockerfile`):
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

WORKDIR /app/apps/web
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Build and Push**:
```bash
# Build images
docker build -t your-registry/emergensee-api:latest -f apps/api/Dockerfile .
docker build -t your-registry/emergensee-web:latest -f apps/web/Dockerfile .

# Push to registry
docker push your-registry/emergensee-api:latest
docker push your-registry/emergensee-web:latest
```

#### Deploy with Docker Compose

**docker-compose.prod.yml**:
```yaml
version: '3.8'

services:
  api:
    image: your-registry/emergensee-api:latest
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - NODE_ENV=production
    restart: unless-stopped

  web:
    image: your-registry/emergensee-web:latest
    ports:
      - "80:80"
    depends_on:
      - api
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

**Deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 5: Kubernetes

**API Deployment** (`k8s/api-deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: emergensee-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: emergensee-api
  template:
    metadata:
      labels:
        app: emergensee-api
    spec:
      containers:
      - name: api
        image: your-registry/emergensee-api:latest
        ports:
        - containerPort: 3001
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: emergensee-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: emergensee-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: emergensee-api-service
spec:
  selector:
    app: emergensee-api
  ports:
  - port: 3001
    targetPort: 3001
  type: LoadBalancer
```

**Deploy**:
```bash
kubectl apply -f k8s/
```

## Post-Deployment

### Verify Deployment

1. **Check API Health**
```bash
curl https://api.your-domain.com/health
```

2. **Check Web App**
   - Visit https://your-domain.com
   - Test login functionality
   - Verify WebSocket connection

3. **Monitor Logs**
   - Check application logs
   - Monitor error rates
   - Track performance metrics

### Set Up Monitoring

1. **Application Monitoring**
   - Set up New Relic, DataDog, or similar
   - Configure alerts for errors
   - Monitor performance metrics

2. **Uptime Monitoring**
   - Use UptimeRobot, Pingdom, etc.
   - Set up alerts for downtime

3. **Error Tracking**
   - Integrate Sentry or similar
   - Configure error notifications

### Database Backups

1. **MongoDB Atlas Backups**
   - Enable continuous backups
   - Set retention policy
   - Test restore process

2. **Manual Backups**
```bash
mongodump --uri="your-mongodb-uri" --out=/backup/path
```

### SSL/TLS Certificates

1. **Using Let's Encrypt**
```bash
sudo certbot --nginx -d your-domain.com
```

2. **Auto-renewal**
```bash
sudo certbot renew --dry-run
```

## Scaling

### Horizontal Scaling

1. **API Servers**
   - Deploy multiple instances
   - Use load balancer
   - Ensure stateless design

2. **Database**
   - Enable MongoDB replica sets
   - Configure read replicas
   - Implement sharding if needed

### Caching

1. **Redis Setup**
```bash
# Add Redis to docker-compose
redis:
  image: redis:alpine
  ports:
    - "6379:6379"
```

2. **Implement Caching**
   - Cache frequent queries
   - Session storage in Redis
   - Rate limiting with Redis

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI
   - Verify IP whitelist
   - Check credentials

2. **CORS Errors**
   - Verify CORS_ORIGIN setting
   - Check API URL in web app
   - Ensure protocol matches (http/https)

3. **WebSocket Connection Failed**
   - Check WS_URL configuration
   - Verify proxy/load balancer settings
   - Ensure WebSocket protocol is enabled

4. **Build Failures**
   - Check Node version
   - Clear node_modules and reinstall
   - Verify all dependencies are listed

### Rollback Procedure

1. **Heroku**
```bash
heroku rollback
```

2. **Vercel**
```bash
vercel rollback
```

3. **Docker**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set secure environment variables
- [ ] Enable MongoDB authentication
- [ ] Use strong JWT secrets
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Keep dependencies updated
- [ ] Regular security audits
- [ ] Monitor for vulnerabilities
- [ ] Backup regularly

## Performance Optimization

- Enable gzip compression
- Use CDN for static assets
- Optimize database indexes
- Implement caching strategy
- Enable HTTP/2
- Minimize bundle size
- Use lazy loading
- Optimize images

## Maintenance

### Regular Tasks

1. **Weekly**
   - Check error logs
   - Monitor performance
   - Review security alerts

2. **Monthly**
   - Update dependencies
   - Review and optimize queries
   - Check disk space
   - Verify backups

3. **Quarterly**
   - Security audit
   - Performance review
   - Capacity planning
   - Cost optimization

## Support

For deployment issues:
- Check application logs
- Review documentation
- Open GitHub issue
- Contact support team
