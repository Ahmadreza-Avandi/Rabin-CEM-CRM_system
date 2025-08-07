# 📧 راهنمای کامل تنظیم سیستم ایمیل CRM

## 📋 فهرست مطالب
1. [پیش‌نیازها](#پیش-نیازها)
2. [تنظیم Gmail API](#تنظیم-gmail-api)
3. [تنظیم متغیرهای محیطی](#تنظیم-متغیرهای-محیطی)
4. [نصب وابستگی‌ها](#نصب-وابستگی-ها)
5. [ساختار فایل‌ها](#ساختار-فایل-ها)
6. [تست سیستم](#تست-سیستم)
7. [استقرار روی سرور](#استقرار-روی-سرور)
8. [عیب‌یابی](#عیب-یابی)

---

## 🔧 پیش‌نیازها

- حساب Gmail فعال
- دسترسی به Google Cloud Console
- Node.js نسخه 18 یا بالاتر
- Next.js 13+ (App Router)

---

## 🚀 تنظیم Gmail API

### مرحله 1: ایجاد پروژه در Google Cloud Console

1. به [Google Cloud Console](https://console.cloud.google.com/) بروید
2. پروژه جدید بسازید یا پروژه موجود را انتخاب کنید
3. به بخش **APIs & Services** > **Library** بروید
4. **Gmail API** را جستجو و فعال کنید

### مرحله 2: ایجاد OAuth 2.0 Credentials

1. به **APIs & Services** > **Credentials** بروید
2. روی **Create Credentials** > **OAuth 2.0 Client IDs** کلیک کنید
3. نوع Application را **Web application** انتخاب کنید
4. نام دلخواه وارد کنید
5. در **Authorized redirect URIs** این آدرس را اضافه کنید:
   ```
   http://localhost:8080
   ```
6. **Create** کلیک کنید
7. **Client ID** و **Client Secret** را کپی کنید

### مرحله 3: دریافت Refresh Token

یکی از روش‌های زیر را انتخاب کنید:

#### روش A: استفاده از OAuth 2.0 Playground

1. به [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) بروید
2. روی تنظیمات (⚙️) کلیک کنید
3. **Use your own OAuth credentials** را تیک بزنید
4. **Client ID** و **Client Secret** خود را وارد کنید
5. در لیست APIs، **Gmail API v1** را انتخاب کنید:
   - `https://www.googleapis.com/auth/gmail.send`
6. **Authorize APIs** کلیک کنید
7. حساب Gmail خود را انتخاب کنید
8. **Exchange authorization code for tokens** کلیک کنید
9. **Refresh token** را کپی کنید

#### روش B: استفاده از کد Node.js

```javascript
const { google } = require('googleapis');

const oAuth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'http://localhost:8080'
);

// Generate URL
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});

console.log('Visit this URL:', authUrl);
// بعد از authorize کردن، code را از URL دریافت کنید

// Exchange code for tokens
const { tokens } = await oAuth2Client.getToken('AUTHORIZATION_CODE');
console.log('Refresh Token:', tokens.refresh_token);
```

---

## 🔐 تنظیم متغیرهای محیطی

فایل `.env.local` را در root پروژه ایجاد کنید:

```env
# Gmail API OAuth Settings
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
EMAIL_USER=your_gmail_address@gmail.com

# Alternative SMTP Settings (اختیاری)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_PASS=your_app_password_here
```

### 🔒 نکات امنیتی

- هرگز این اطلاعات را در Git commit نکنید
- از `.env.local` در `.gitignore` استفاده کنید
- در production از environment variables سرور استفاده کنید

---

## 📦 نصب وابستگی‌ها

```bash
npm install googleapis nodemailer
```

یا

```bash
yarn add googleapis nodemailer
```

---

## 📁 ساختار فایل‌ها

```
project-root/
├── lib/
│   ├── email.js              # سرویس اصلی ایمیل (SMTP)
│   └── gmail-api.js          # سرویس Gmail API
├── app/
│   ├── api/
│   │   └── email/
│   │       ├── send/route.ts      # API ارسال ایمیل
│   │       ├── bulk/route.ts      # API ارسال گروهی
│   │       └── templates/route.ts # API قالب‌ها
│   └── dashboard/
│       └── email/
│           └── page.tsx           # صفحه مدیریت ایمیل
├── pages/
│   └── api/
│       └── email/
│           ├── send.js            # API ارسال ایمیل (Pages Router)
│           ├── bulk.js            # API ارسال گروهی (Pages Router)
│           └── templates.js       # API قالب‌ها (Pages Router)
├── components/
│   └── layout/
│       └── sidebar.tsx            # منوی کناری (شامل لینک ایمیل)
├── test-crm-email.js             # فایل تست اولیه
├── test-final-email.js           # فایل تست نهایی
└── .env.local                    # متغیرهای محیطی
```

---

## 🧪 تست سیستم

### تست محلی

```bash
# تست اولیه
node test-crm-email.js

# تست کامل
node test-final-email.js
```

### تست از طریق UI

1. سرور Next.js را اجرا کنید:
   ```bash
   npm run dev
   ```

2. به آدرس زیر بروید:
   ```
   http://localhost:3000/dashboard/email
   ```

3. قابلیت‌های مختلف را تست کنید:
   - ارسال ایمیل ساده
   - ارسال با قالب
   - ارسال گروهی

---

## 🌐 استقرار روی سرور

### متغیرهای محیطی سرور

در پنل کنترل سرور (Vercel, Netlify, Railway, etc.) این متغیرها را تنظیم کنید:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
EMAIL_USER=your_gmail@gmail.com
```

### نکات مهم برای Production

1. **Domain Verification**: در Google Cloud Console، domain سرور را به authorized domains اضافه کنید

2. **Redirect URI**: در OAuth settings، redirect URI سرور را اضافه کنید:
   ```
   https://yourdomain.com/api/auth/callback
   ```

3. **Rate Limiting**: Gmail API محدودیت‌های زیر دارد:
   - 1 میلیارد quota unit در روز
   - 250 quota unit در کاربر در ثانیه
   - هر ایمیل ≈ 100 quota unit

4. **Error Handling**: سیستم خطایابی مناسب پیاده‌سازی کنید

5. **Monitoring**: لاگ‌های ارسال ایمیل را نظارت کنید

---

## 🔧 عیب‌یابی

### خطاهای رایج

#### 1. "Invalid login: 535-5.7.8 Username and Password not accepted"
**راه‌حل**: از Gmail API به جای SMTP استفاده کنید یا App Password تنظیم کنید

#### 2. "Request had insufficient authentication scopes"
**راه‌حل**: scope صحیح را در OAuth تنظیم کنید:
```
https://www.googleapis.com/auth/gmail.send
```

#### 3. "The OAuth client was not found"
**راه‌حل**: Client ID و Client Secret را بررسی کنید

#### 4. "Invalid grant: account not found"
**راه‌حل**: Refresh Token را دوباره generate کنید

### بررسی وضعیت

```javascript
// بررسی وضعیت سرویس
const gmailService = require('./lib/gmail-api.js');
console.log(gmailService.getStatus());
```

### تست اتصال

```javascript
// تست اتصال Gmail API
const gmailService = require('./lib/gmail-api.js');
gmailService.testConnection().then(result => {
  console.log('Connection test:', result);
});
```

---

## 📊 قابلیت‌های سیستم

### ✅ قابلیت‌های پیاده‌سازی شده

- **Gmail API OAuth Integration**: اتصال امن به Gmail
- **Single Email Sending**: ارسال ایمیل‌های تکی
- **Template Email System**: سیستم قالب‌های آماده
- **Bulk Email Sending**: ارسال گروهی با delay
- **Persian Language Support**: پشتیبانی کامل از فارسی
- **Next.js API Routes**: API های RESTful
- **React UI Components**: رابط کاربری مدرن
- **Professional Email Templates**: قالب‌های حرفه‌ای

### 📧 قالب‌های آماده

1. **خوش‌آمدگویی** - برای مشتریان جدید
2. **پیگیری** - برای پیگیری درخواست‌ها
3. **دعوت به جلسه** - برای تنظیم ملاقات‌ها
4. **ارسال پیشنهاد** - برای پیشنهادات تجاری
5. **یادآوری** - برای یادآوری‌های مهم
6. **خبرنامه** - برای اطلاع‌رسانی‌های دوره‌ای

### 🔄 API Endpoints

```
POST /api/email/send          # ارسال ایمیل تکی
POST /api/email/bulk          # ارسال گروهی
GET  /api/email/templates     # دریافت قالب‌ها
POST /api/email/templates     # پردازش قالب با متغیرها
```

---

## 🚀 مراحل بعدی (پیشنهادی)

1. **Email Analytics**: آمار ارسال و باز کردن ایمیل‌ها
2. **Email Scheduling**: زمان‌بندی ارسال ایمیل‌ها
3. **Contact Management**: مدیریت لیست مخاطبین
4. **Email Campaigns**: کمپین‌های ایمیل مارکتینگ
5. **A/B Testing**: تست A/B برای موضوع و محتوا
6. **Unsubscribe Management**: مدیریت لغو اشتراک
7. **Email Verification**: تأیید صحت آدرس‌های ایمیل

---

## 📞 پشتیبانی

در صورت بروز مشکل:

1. لاگ‌های سیستم را بررسی کنید
2. متغیرهای محیطی را تأیید کنید
3. اتصال اینترنت و دسترسی به Gmail API را بررسی کنید
4. از فایل‌های تست برای عیب‌یابی استفاده کنید

---

**✨ سیستم ایمیل CRM آماده و کاملاً عملیاتی است!**