#!/bin/bash
# ==============================================================================
# سكربت الإعداد الأولي لسيرفر Hostinger VPS (Ubuntu 22.04 / 24.04 LTS)
# قم بتشغيله كـ root أو مع sudo:
# bash setup-vps.sh
# ==============================================================================

set -e

echo "🔧 [1/7] تحديث الحزم الأساسية..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw software-properties-common build-essential

echo "📦 [2/7] تثبيت Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

echo "🗄️ [3/7] تثبيت وإعداد خادم PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# إنشاء قاعدة البيانات ومستخدم النظام
DB_NAME="smart_helper"
DB_USER="openpg"
DB_PASS="openpgpwd"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "🌐 [4/7] تثبيت Nginx و Certbot (لشهادة SSL المجانية)..."
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl start nginx
sudo systemctl enable nginx

echo "🛡️ [5/7] ضبط الجدار الناري (UFW)..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

echo "📂 [6/7] إعداد مجلد المشروع..."
sudo mkdir -p /var/www/smart-helper
sudo chown -R $USER:$USER /var/www/smart-helper

echo "=============================================================================="
echo "  ✅ تم تثبيت بيئة السيرفر بنجاح (Node 20, PM2, Postgres, Nginx, Certbot)!"
echo "  الخطوات التالية:"
echo "  1. انسخ المشروع إلى: /var/www/smart-helper عبر Git:"
echo "     git clone -b release/v1.0-fixes https://github.com/saad20115/SMART-HELPER.git /var/www/smart-helper"
echo "  2. اضبط ملف /var/www/smart-helper/server/.env"
echo "  3. انسخ إعداد Nginx وعدل السب دومين ثم شغّل certbot"
echo "=============================================================================="
