# MediFlow Deployment Guide

## Prerequisites
- Your code is pushed to GitHub: https://github.com/ahirelalit200-lgtm/MediFlow1
- Environment variables are configured in `.env` file
- MongoDB Atlas database is set up

---

## Method 1: Render (Recommended for Beginners)

### Step 1: Prepare Your Repository
✅ Already done - Your code is on GitHub

### Step 2: Sign up for Render
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Verify your email

### Step 3: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account
3. Select the **MediFlow1** repository
4. Keep the branch as **main**
5. Configure the service:

**Service Configuration:**
- **Name**: `mediflow-api` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 4: Add Environment Variables
1. Scroll down to **"Environment Variables"**
2. Add these variables from your `.env` file:

```
MONGO_URI=mongodb+srv://ahirelalit200_db_user:iamthebest@cluster0.wfwnljt.mongodb.net/prescriptionDB?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
APP_TIMEZONE=Asia/Kolkata
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=lalitahire2025@gmail.com
SMTP_PASS=ecrpvsganibnvxru
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Your app will be available at: `https://mediflow-api.onrender.com`

---

## Method 2: Netlify (Frontend Only)

### Step 1: Create Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub

### Step 2: Create New Site
1. Click **"Add new site"** → **"Import an existing project"**
2. Connect to GitHub
3. Select **MediFlow1** repository
4. Configure build settings:

**Build Settings:**
- **Base directory**: `prescription-system/frontend/html-css`
- **Build command**: Leave empty (static site)
- **Publish directory**: `.`

### Step 3: Deploy
1. Click **"Deploy site"**
2. Your frontend will be live at: `https://your-site-name.netlify.app`

---

## Method 3: Vercel (Full Stack)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy from Project Directory
```bash
cd prescription-system
vercel
```

### Step 4: Configure Project
- **Project Name**: `mediflow`
- **Framework**: `Other`
- **Root Directory**: `.`
- **Build Command**: `npm install`
- **Output Directory**: `.`
- **Install Command**: `npm install`

### Step 5: Add Environment Variables
```bash
vercel env add
```
Add all variables from your `.env` file

---

## Method 4: Railway

### Step 1: Sign Up
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: New Project
1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select **MediFlow1** repository
3. Railway will auto-detect Node.js

### Step 3: Configure
1. Go to **"Variables"** tab
2. Add all environment variables from `.env`
3. Click **"Deploy"**

---

## Method 5: Traditional VPS (DigitalOcean, AWS)

### Step 1: Server Setup
```bash
# Update server
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

### Step 2: Clone Repository
```bash
git clone https://github.com/ahirelalit200-lgtm/MediFlow1.git
cd MediFlow1/prescription-system
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Setup Environment
```bash
# Create .env file
nano .env
# Add your environment variables
```

### Step 5: Start with PM2
```bash
pm2 start server.js --name "mediflow"
pm2 save
pm2 startup
```

### Step 6: Setup Nginx (Optional)
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/mediflow
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Method 6: Docker Deployment

### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Step 2: Create .dockerignore
```
node_modules
.git
.env
```

### Step 3: Build and Run
```bash
docker build -t mediflow .
docker run -p 5000:5000 --env-file .env mediflow
```

---

## Environment Variables Checklist

Make sure these are set in your deployment platform:

**Required:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `PORT` - Server port (usually 5000)

**Optional (for email features):**
- `SMTP_HOST` - SMTP server
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - Email username
- `SMTP_PASS` - Email password

---

## Troubleshooting

### Common Issues:

1. **Build Failed**
   - Check if `package.json` has correct `main` field
   - Verify all dependencies are in `package.json`

2. **Database Connection Failed**
   - Verify MongoDB URI is correct
   - Check if IP is whitelisted in MongoDB Atlas

3. **Environment Variables Not Working**
   - Ensure variables are added in deployment platform
   - Check variable names match exactly

4. **Port Issues**
   - Make sure PORT environment variable is set
   - Check if platform uses specific port

### Debug Commands:
```bash
# Check logs (Render/Vercel)
# View deployment logs in dashboard

# Check PM2 logs (VPS)
pm2 logs mediflow

# Check Docker logs
docker logs container-name
```

---

## Post-Deployment Checklist

1. ✅ Test all API endpoints
2. ✅ Verify database connection
3. ✅ Check frontend loads properly
4. ✅ Test authentication
5. ✅ Verify email functionality (if used)
6. ✅ Set up custom domain (if needed)
7. ✅ Configure SSL/HTTPS
8. ✅ Set up monitoring/alerts

---

## Recommended Choice

**For beginners:** Use **Render** - it's the easiest and most straightforward.

**For production:** Use **VPS with PM2** - more control and better performance.

**For static frontend:** Use **Netlify** - excellent for static sites.

Your current setup is optimized for Render deployment!
