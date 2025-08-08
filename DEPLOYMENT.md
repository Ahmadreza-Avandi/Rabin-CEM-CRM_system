# 🚀 راهنمای دیپلوی سیستم CRM

## پیش‌نیازها

- Docker و Docker Compose نصب باشد
- Git نصب باشد
- دسترسی به سرور

## مراحل دیپلوی

### 1. کلون کردن پروژه

```bash
git clone <repository-url>
cd CEM-CRM-main
```

### 2. تنظیم Environment Variables

فایل `.env.production` آماده است و شامل تمام تنظیمات لازم می‌باشد.

### 3. اجرای پروژه

#### روش آسان (استفاده از اسکریپت):
```bash
./deploy.sh
```

#### روش دستی:
```bash
# ساخت و اجرای کانتینرها
docker-compose up --build -d

# بررسی وضعیت سرویس‌ها
docker-compose ps

# مشاهده لاگ‌ها
docker-compose logs -f
```

### 4. بررسی عملکرد

- **وب‌سایت اصلی**: http://localhost یا https://ahmadreza-avandi.ir
- **Health Check**: http://localhost/api/health
- **PhpMyAdmin**: http://localhost/phpmyadmin

## ساختار سرویس‌ها

### 🗄️ MySQL Database
- **پورت**: 3306 (داخلی)
- **نام دیتابیس**: crm_system
- **یوزر**: root
- **پسورد**: 1234

### 🌐 Next.js Application
- **پورت**: 3000 (داخلی)
- **محیط**: production
- **Health Check**: `/api/health`

### 🔄 Nginx Proxy
- **پورت**: 80, 443
- **SSL**: Let's Encrypt
- **Domain**: ahmadreza-avandi.ir

### 📊 PhpMyAdmin
- **دسترسی**: http://localhost/phpmyadmin
- **یوزر**: root
- **پسورد**: 1234

## دستورات مفید

### مشاهده لاگ‌ها
```bash
# تمام سرویس‌ها
docker-compose logs -f

# فقط Next.js
docker-compose logs -f nextjs

# فقط MySQL
docker-compose logs -f mysql
```

### ری‌استارت سرویس‌ها
```bash
# تمام سرویس‌ها
docker-compose restart

# فقط Next.js
docker-compose restart nextjs
```

### آپدیت کردن پروژه
```bash
git pull origin main
docker-compose down
docker-compose up --build -d
```

### پاک کردن کامل
```bash
docker-compose down -v
docker system prune -a
```

## امنیت

- ✅ فایل `.env.local` در گیت‌هاب کامیت نمی‌شود
- ✅ فایل `.env.production` برای دیپلوی در گیت‌هاب موجود است
- ✅ SSL Certificate برای HTTPS فعال است
- ✅ Non-root user در Docker استفاده می‌شود

## عیب‌یابی

### اگر سرویس‌ها اجرا نشدند:
```bash
# بررسی وضعیت
docker-compose ps

# مشاهده خطاها
docker-compose logs

# ری‌بیلد کردن
docker-compose up --build --force-recreate
```

### اگر دیتابیس متصل نشد:
```bash
# بررسی MySQL
docker-compose exec mysql mysql -u root -p1234 -e "SHOW DATABASES;"

# ری‌استارت MySQL
docker-compose restart mysql
```

### اگر SSL کار نکرد:
```bash
# بررسی certificate ها
ls -la /etc/letsencrypt/live/ahmadreza-avandi.ir/

# تست nginx config
docker-compose exec nginx nginx -t
```

## پشتیبان‌گیری

سیستم پشتیبان‌گیری خودکار فعال است و هر روز از دیتابیس backup می‌گیرد.

## پورت‌ها

- **80**: HTTP (Nginx)
- **443**: HTTPS (Nginx)
- **3306**: MySQL (داخلی)
- **3000**: Next.js (داخلی)

## حجم‌های Docker

- `mysql_data`: داده‌های دیتابیس
- `backup_data`: فایل‌های پشتیبان
- `./public/uploads`: فایل‌های آپلود شده

---

**نکته**: این پروژه آماده برای اجرا در محیط production است و تمام تنظیمات امنیتی و بهینه‌سازی‌های لازم انجام شده است.