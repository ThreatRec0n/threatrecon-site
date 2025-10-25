# 🚀 ThreatRecon Deployment Guide

## **Production-Ready Deployment**

This guide will help you deploy the ThreatRecon Breach Drill Automation Stack to production.

---

## **Prerequisites**

### **System Requirements**
- **Docker** 20.10+ with Docker Compose
- **Node.js** 18+ (for local development)
- **Git** (for version control)
- **4GB RAM** minimum (8GB recommended)
- **10GB disk space** for containers and data

### **Network Requirements**
- **Ports 80, 443** (HTTP/HTTPS)
- **Port 3000** (Frontend)
- **Port 3001** (Backend API)
- **Port 5432** (PostgreSQL)
- **Port 6379** (Redis)

---

## **Quick Deployment**

### **Option 1: Automated Deployment (Recommended)**

**Windows:**
```bash
deploy.bat
```

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh
```

### **Option 2: Manual Deployment**

1. **Clone the repository:**
   ```bash
   git clone https://github.com/threatrecon/drill-platform.git
   cd drill-platform
   ```

2. **Create environment file:**
   ```bash
   cp env.template .env
   # Edit .env with your production values
   ```

3. **Deploy with Docker Compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

4. **Verify deployment:**
   ```bash
   curl http://localhost:3001/health
   curl http://localhost:3000
   ```

---

## **Production Configuration**

### **Environment Variables**

Create a `.env` file with the following variables:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://threatrecon:your_secure_password@postgres:5432/threatrecon

# Redis
REDIS_URL=redis://:your_redis_password@redis:6379

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
SIGNING_KEY_ID=tr-production-v1
SIGNING_SECRET=your-signing-secret-minimum-32-characters

# Data Retention
SESSION_RETENTION_DAYS=30

# URLs
FRONTEND_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-domain.com
```

### **SSL Configuration**

1. **Obtain SSL certificates** (Let's Encrypt recommended)
2. **Place certificates** in `./ssl/` directory:
   ```
   ssl/
   ├── cert.pem
   ├── key.pem
   └── chain.pem
   ```
3. **Update nginx.conf** to enable HTTPS

### **Security Hardening**

1. **Change default passwords** in `.env`
2. **Use strong JWT secrets** (minimum 32 characters)
3. **Enable firewall** rules
4. **Configure rate limiting** in nginx.conf
5. **Set up monitoring** and logging

---

## **Service Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│   Frontend     │────│   Backend API   │
│   (Port 80/443) │    │   (Port 3000)  │    │   (Port 3001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         └───────────────│   PostgreSQL    │────│     Redis      │
                        │   (Port 5432)   │    │   (Port 6379)  │
                        └─────────────────┘    └─────────────────┘
```

---

## **Management Commands**

### **Container Management**
```bash
# View all containers
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update and restart
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up --build -d
```

### **Database Management**
```bash
# Access PostgreSQL
docker-compose -f docker-compose.prod.yml exec postgres psql -U threatrecon -d threatrecon

# Backup database
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U threatrecon threatrecon > backup.sql

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U threatrecon -d threatrecon < backup.sql
```

### **Redis Management**
```bash
# Access Redis CLI
docker-compose -f docker-compose.prod.yml exec redis redis-cli

# Clear Redis cache
docker-compose -f docker-compose.prod.yml exec redis redis-cli FLUSHALL
```

---

## **Monitoring & Maintenance**

### **Health Checks**
- **Backend:** `http://localhost:3001/health`
- **Frontend:** `http://localhost:3000`
- **Database:** `docker-compose exec postgres pg_isready`
- **Redis:** `docker-compose exec redis redis-cli ping`

### **Log Monitoring**
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### **Performance Monitoring**
- **Vercel Speed Insights** integrated in frontend
- **Docker stats:** `docker stats`
- **Resource usage:** `docker-compose -f docker-compose.prod.yml top`

---

## **Scaling & High Availability**

### **Horizontal Scaling**
```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up --scale backend=3 -d

# Scale frontend services
docker-compose -f docker-compose.prod.yml up --scale frontend=2 -d
```

### **Load Balancing**
Update `nginx.conf` to include multiple backend instances:
```nginx
upstream backend {
    server backend_1:3001;
    server backend_2:3001;
    server backend_3:3001;
}
```

---

## **Backup & Recovery**

### **Automated Backups**
Create a backup script:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U threatrecon threatrecon > "backup_${DATE}.sql"
```

### **Disaster Recovery**
1. **Stop services:** `docker-compose -f docker-compose.prod.yml down`
2. **Restore database:** `docker-compose -f docker-compose.prod.yml exec -T postgres psql -U threatrecon -d threatrecon < backup.sql`
3. **Start services:** `docker-compose -f docker-compose.prod.yml up -d`

---

## **Troubleshooting**

### **Common Issues**

**Port conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001

# Change ports in docker-compose.prod.yml
```

**Memory issues:**
```bash
# Check memory usage
docker stats

# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory
```

**Database connection issues:**
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U threatrecon
```

### **Debug Mode**
```bash
# Run in debug mode
NODE_ENV=development docker-compose -f docker-compose.prod.yml up
```

---

## **Security Checklist**

- [ ] **Change default passwords** in `.env`
- [ ] **Use strong JWT secrets** (32+ characters)
- [ ] **Enable SSL/TLS** with valid certificates
- [ ] **Configure firewall** rules
- [ ] **Set up rate limiting** in nginx
- [ ] **Enable audit logging**
- [ ] **Regular security updates**
- [ ] **Monitor access logs**
- [ ] **Backup encryption**
- [ ] **Network segmentation**

---

## **Support**

### **Documentation**
- **README.md** - Project overview
- **SECURITY.md** - Security guidelines
- **API Documentation** - Backend API reference

### **Community**
- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Community support
- **Email** - security@threatrecon.io

---

## **Next Steps**

1. **Deploy** using the automated script
2. **Configure** environment variables
3. **Set up SSL** certificates
4. **Test** all functionality
5. **Monitor** system health
6. **Schedule** regular backups

**🎉 Your ThreatRecon platform is ready for production breach drills!**
