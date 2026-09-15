#!/bin/bash
set -e

echo "=========================================="
echo "  🚀 Smart HR - Deployment Script"
echo "=========================================="

APP_DIR="/var/www/smart-helper"

echo "📥 [1/5] Pulling latest code from Git..."
cd $APP_DIR
git pull

echo "📦 [2/5] Updating Backend (NestJS & Prisma)..."
cd $APP_DIR/server
npm install
npx prisma generate
npx prisma db push
npm run build

echo "🔄 [3/5] Restarting PM2 Process..."
pm2 restart smart-hr-backend || pm2 start $APP_DIR/deploy/ecosystem.config.cjs

echo "🎨 [4/5] Building Frontend (React + Vite)..."
cd $APP_DIR/client
npm install
npm run build

echo "🌐 [5/5] Reloading Nginx..."
sudo systemctl reload nginx

echo "=========================================="
echo "  ✅ Deployment completed successfully!"
echo "=========================================="
