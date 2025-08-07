#!/bin/bash

# CRM Database Backup Script
# تاریخ: $(date)

set -e  # Exit on any error

# تنظیمات
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
MYSQL_HOST="mysql"
MYSQL_USER="root"
MYSQL_PASSWORD="1234"
MYSQL_DATABASE="crm_system"
GDRIVE_FOLDER="crm-backups"

# لاگ شروع
echo "=== CRM Backup Started at $(date) ==="

# ساخت دایرکتوری بک‌آپ
mkdir -p $BACKUP_DIR

# تست اتصال به دیتابیس
echo "Testing database connection..."
if ! mysql -h $MYSQL_HOST -u$MYSQL_USER -p$MYSQL_PASSWORD -e "USE $MYSQL_DATABASE;" 2>/dev/null; then
    echo "ERROR: Cannot connect to database!"
    exit 1
fi
echo "Database connection successful"

# گرفتن بک‌آپ از دیتابیس
echo "Creating database backup..."
BACKUP_FILE="$BACKUP_DIR/crm_backup_$TIMESTAMP.sql"

mysqldump -h $MYSQL_HOST \
          -u$MYSQL_USER \
          -p$MYSQL_PASSWORD \
          --single-transaction \
          --routines \
          --triggers \
          --events \
          --add-drop-database \
          --databases $MYSQL_DATABASE > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Database backup created successfully"
else
    echo "ERROR: Database backup failed!"
    exit 1
fi

# فشرده‌سازی فایل بک‌آپ
echo "Compressing backup file..."
gzip "$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

if [ -f "$COMPRESSED_FILE" ]; then
    BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    echo "Backup compressed successfully - Size: $BACKUP_SIZE"
else
    echo "ERROR: Compression failed!"
    exit 1
fi

# آپلود به گوگل درایو
echo "Uploading backup to Google Drive..."
if rclone copy "$COMPRESSED_FILE" "gdrive:$GDRIVE_FOLDER/" --progress; then
    echo "Upload to Google Drive completed successfully"
    
    # تست فایل آپلود شده
    REMOTE_FILE="gdrive:$GDRIVE_FOLDER/$(basename $COMPRESSED_FILE)"
    if rclone lsf "$REMOTE_FILE" >/dev/null 2>&1; then
        echo "Backup verified on Google Drive"
    else
        echo "WARNING: Backup file not found on Google Drive!"
    fi
else
    echo "ERROR: Upload to Google Drive failed!"
    exit 1
fi

# پاک کردن بک‌آپ‌های محلی قدیمی‌تر از 7 روز
echo "Cleaning up old local backups..."
find $BACKUP_DIR -name "crm_backup_*.sql.gz" -type f -mtime +7 -delete
echo "Local cleanup completed"

# پاک کردن بک‌آپ‌های قدیمی از گوگل درایو (بیشتر از 30 روز)
echo "Cleaning up old Google Drive backups..."
rclone delete "gdrive:$GDRIVE_FOLDER/" --min-age 30d --dry-run
rclone delete "gdrive:$GDRIVE_FOLDER/" --min-age 30d

# آمار نهایی
FINAL_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
echo "=== Backup Summary ==="
echo "Backup File: $(basename $COMPRESSED_FILE)"
echo "Size: $FINAL_SIZE"
echo "Location: Google Drive/$GDRIVE_FOLDER/"
echo "Completed at: $(date)"
echo "=== Backup Completed Successfully ==="
