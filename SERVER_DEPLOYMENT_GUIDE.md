# 🌐 راهنمای استقرار سیستم ایمیل روی سرور

## ❓ آیا سیستم ایمیل روی سرور کار می‌کند؟

**✅ بله، اما نیاز به تنظیمات اضافی دارد!**

---

## 🔧 تنظیمات مورد نیاز برای سرور

### 1. 🔐 متغیرهای محیطی سرور

در پنل کنترل سرور این متغیرها را تنظیم کنید:

```env
# Gmail API OAuth (ضروری)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here  
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
EMAIL_USER=your_gmail_address@gmail.com

# Node Environment
NODE_ENV=production
```

### 2. 🌍 تنظیمات Google Cloud Console

#### الف) اضافه کردن Domain سرور

1. به [Google Cloud Console](https://console.cloud.google.com/) بروید
2. پروژه خود را انتخاب کنید
3. به **APIs & Services** > **Credentials** بروید
4. OAuth 2.0 Client ID خود را ویرایش کنید
5. در **Authorized JavaScript origins** اضافه کنید:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```

6. در **Authorized redirect URIs** اضافه کنید:
   ```
   https://yourdomain.com/api/auth/callback
   https://yourdomain.com
   ```

#### ب) تأیید Domain

1. به **APIs & Services** > **OAuth consent screen** بروید
2. در **Authorized domains** دامنه سرور را اضافه کنید:
   ```
   yourdomain.com
   ```

---

## 🚀 راهنمای استقرار بر اساس پلتفرم

### 📦 Vercel

1. **متغیرهای محیطی**:
   ```bash
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET  
   vercel env add GOOGLE_REFRESH_TOKEN
   vercel env add EMAIL_USER
   ```

2. **یا از پنل Vercel**:
   - Settings > Environment Variables
   - متغیرهای فوق را اضافه کنید

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### 🌊 Netlify

1. **متغیرهای محیطی**:
   - Site settings > Environment variables
   - متغیرهای مورد نیاز را اضافه کنید

2. **Build Settings**:
   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = ".next"
   
   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

### 🚂 Railway

1. **متغیرهای محیطی**:
   ```bash
   railway variables set GOOGLE_CLIENT_ID=your_value
   railway variables set GOOGLE_CLIENT_SECRET=your_value
   railway variables set GOOGLE_REFRESH_TOKEN=your_value
   railway variables set EMAIL_USER=your_value
   ```

2. **Deploy**:
   ```bash
   railway up
   ```

### 🐳 Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
```

```bash
# Build و Run
docker build -t crm-email .
docker run -p 3000:3000 \
  -e GOOGLE_CLIENT_ID=your_value \
  -e GOOGLE_CLIENT_SECRET=your_value \
  -e GOOGLE_REFRESH_TOKEN=your_value \
  -e EMAIL_USER=your_value \
  crm-email
```

---

## ⚠️ نکات مهم برای Production

### 1. 🔒 امنیت

```javascript
// اضافه کردن CORS headers
// در next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/email/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://yourdomain.com'
          }
        ]
      }
    ]
  }
}
```

### 2. 📊 Rate Limiting

```javascript
// lib/rate-limiter.js
const rateLimit = new Map();

export function checkRateLimit(ip, limit = 10) {
  const now = Date.now();
  const windowStart = now - 60000; // 1 minute window
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, []);
  }
  
  const requests = rateLimit.get(ip);
  const recentRequests = requests.filter(time => time > windowStart);
  
  if (recentRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimit.set(ip, recentRequests);
  return true;
}
```

### 3. 📝 Logging

```javascript
// lib/logger.js
export function logEmailActivity(type, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type,
    data,
    environment: process.env.NODE_ENV
  };
  
  if (process.env.NODE_ENV === 'production') {
    // Send to external logging service
    console.log(JSON.stringify(logEntry));
  } else {
    console.log('📧 Email Activity:', logEntry);
  }
}
```

### 4. 🔄 Error Handling

```javascript
// app/api/email/send/route.ts
export async function POST(request) {
  try {
    // ... email sending logic
  } catch (error) {
    // Log error
    console.error('Email API Error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return user-friendly error
    return NextResponse.json({
      success: false,
      error: 'خطا در ارسال ایمیل. لطفاً دوباره تلاش کنید.'
    }, { status: 500 });
  }
}
```

---

## 🧪 تست روی سرور

### 1. تست API Endpoints

```bash
# تست ارسال ایمیل
curl -X POST https://yourdomain.com/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "message": "This is a test email"
  }'
```

### 2. تست از طریق UI

1. به `https://yourdomain.com/dashboard/email` بروید
2. تمام قابلیت‌ها را تست کنید
3. لاگ‌های سرور را بررسی کنید

### 3. Health Check

```javascript
// app/api/health/email/route.ts
export async function GET() {
  try {
    const gmailService = require('../../../../lib/gmail-api.js');
    const status = gmailService.getStatus();
    
    return NextResponse.json({
      status: 'healthy',
      emailService: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

---

## 🚨 عیب‌یابی مشکلات سرور

### مشکلات رایج:

#### 1. "Environment variables not found"
**راه‌حل**: 
- متغیرهای محیطی را در پنل سرور تنظیم کنید
- سرور را restart کنید

#### 2. "OAuth client not found"
**راه‌حل**:
- Domain سرور را در Google Cloud Console اضافه کنید
- Authorized origins را بررسی کنید

#### 3. "CORS errors"
**راه‌حل**:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' }
        ]
      }
    ]
  }
}
```

#### 4. "Gmail API quota exceeded"
**راه‌حل**:
- Rate limiting پیاده‌سازی کنید
- Batch requests استفاده کنید
- Quota را در Google Cloud Console بررسی کنید

---

## 📈 مانیتورینگ و نظارت

### 1. Email Analytics

```javascript
// lib/analytics.js
export function trackEmailSent(emailData) {
  // Track email metrics
  const metrics = {
    timestamp: new Date(),
    recipient: emailData.to,
    subject: emailData.subject,
    template: emailData.template || 'custom',
    success: true
  };
  
  // Send to analytics service
  console.log('📊 Email Sent:', metrics);
}
```

### 2. Error Monitoring

```javascript
// lib/error-monitoring.js
export function reportError(error, context) {
  const errorReport = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
  
  // Send to error monitoring service (Sentry, etc.)
  console.error('🚨 Error Report:', errorReport);
}
```

---

## ✅ Checklist استقرار

- [ ] متغیرهای محیطی تنظیم شده
- [ ] Domain در Google Cloud Console اضافه شده
- [ ] OAuth redirect URIs به‌روزرسانی شده
- [ ] Rate limiting پیاده‌سازی شده
- [ ] Error handling تست شده
- [ ] Health check endpoint کار می‌کند
- [ ] Email sending تست شده
- [ ] Logging تنظیم شده
- [ ] Security headers اضافه شده
- [ ] Performance monitoring فعال

---

## 🎯 خلاصه

**سیستم ایمیل روی سرور کار می‌کند، اما نیاز به این تنظیمات دارد:**

1. ✅ **متغیرهای محیطی** در سرور
2. ✅ **Domain verification** در Google Cloud
3. ✅ **OAuth redirect URIs** به‌روزرسانی
4. ✅ **Security و Rate limiting**
5. ✅ **Error handling و Logging**

**بعد از این تنظیمات، سیستم ایمیل کاملاً عملیاتی خواهد بود! 🚀**