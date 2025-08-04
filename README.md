# CEM-CRM System

سیستم مدیریت ارتباط با مشتری و تجربه مشتری (CEM-CRM)

## پیش‌نیازها

برای اجرای این پروژه نیاز دارید:

- Docker
- Docker Compose

## راه‌اندازی پروژه

### 1. کلون کردن مخزن

```bash
git clone https://github.com/Ahmadreza-Avandi/Rabin-CEM-CRM_system.git
cd Rabin-CEM-CRM_system
```

### 2. راه‌اندازی با Docker

پروژه به صورت خودکار با استفاده از Docker Compose راه‌اندازی می‌شود:

```bash
docker-compose up --build
```

این دستور:
- یک کانتینر MariaDB راه‌اندازی می‌کند
- دیتابیس `crm_system` را ایجاد می‌کند
- به صورت خودکار فایل `crm_system.sql` را برای ایجاد جداول و ساختار دیتابیس اجرا می‌کند
- اپلیکیشن Next.js را در پورت 3000 راه‌اندازی می‌کند

### 3. دسترسی به اپلیکیشن

پس از راه‌اندازی موفق، می‌توانید به اپلیکیشن از طریق آدرس زیر دسترسی داشته باشید:
```
http://localhost:3000
```

## ساختار دیتابیس

دیتابیس شامل جداول زیر است:
- activities: فعالیت‌های مرتبط با مشتریان
- users: کاربران سیستم
- customers: اطلاعات مشتریان
- interactions: تعاملات با مشتریان
- deals: معاملات
- products: محصولات
- tasks: وظایف
- و سایر جداول مرتبط...

## تنظیمات دیتابیس

اطلاعات اتصال به دیتابیس:
- Host: localhost (یا mysql در شبکه داکر)
- Port: 3306
- Database: crm_system
- Username: root
- Password: 1234

## بازسازی دیتابیس

اگر نیاز به بازسازی کامل دیتابیس دارید:

```bash
# حذف و ایجاد مجدد دیتابیس
docker exec -i $(docker ps -qf "name=mysql") mysql -uroot -p1234 -e "DROP DATABASE IF EXISTS crm_system; CREATE DATABASE crm_system;"

# وارد کردن اسکیما و داده‌های اولیه
docker exec -i $(docker ps -qf "name=mysql") mysql -uroot -p1234 crm_system < crm_system.sql
```

## پاکسازی کامل و شروع مجدد

برای پاکسازی کامل و شروع مجدد:

```bash
# توقف و حذف کانتینرها
docker-compose down

# پاکسازی کش و ایمیج‌های داکر
docker system prune -af
docker volume prune -f

# راه‌اندازی مجدد
docker-compose up --build
```