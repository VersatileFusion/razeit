# RaZeit Gaming Platform Backend | بک‌اند پلتفرم گیمینگ رازیت

<div dir="ltr">

A comprehensive gaming platform backend built with Express.js and MongoDB, featuring marketplace, services, gem currency system, wheel of luck, Steam integration, AI chatbot, and community forums.

</div>

<div dir="rtl">

بک‌اند جامع پلتفرم گیمینگ ساخته شده با Express.js و MongoDB، شامل مارکت‌پلیس، سرویس‌ها، سیستم ارز جم، گردونه شانس، یکپارچه‌سازی استیم، چت‌بات هوش مصنوعی و انجمن‌های جامعه.

</div>

---

## 🌟 Features | ویژگی‌ها

<div dir="ltr">

### Phase 1 - Core Platform | فاز 1 - پلتفرم اصلی

- **Authentication System**: Email/phone registration, login, password reset
- **User Dashboard**: Profile management, statistics, avatar upload
- **Admin Panel**: User management, platform settings, content moderation
- **Gem Currency System**: Digital currency with admin-configurable exchange rates
- **Wheel of Luck**: Special token-based spinning system with customizable prizes

</div>

<div dir="rtl">

- **سیستم احراز هویت**: ثبت‌نام ایمیل/تلفن، ورود، بازنشانی رمز عبور
- **داشبورد کاربر**: مدیریت پروفایل، آمار، آپلود آواتار
- **پنل ادمین**: مدیریت کاربران، تنظیمات پلتفرم، نظارت بر محتوا
- **سیستم ارز جم**: ارز دیجیتال با نرخ‌های تبدیل قابل تنظیم توسط ادمین
- **گردونه شانس**: سیستم چرخش مبتنی بر توکن با جوایز قابل تنظیم

</div>

<div dir="ltr">

### Phase 2 - Marketplace & Community | فاز 2 - مارکت‌پلیس و جامعه

- **Marketplace**: Buy/sell game items (CS:GO, Dota 2, TF2, Rust, etc.)
- **Forums System**: Community discussions with categories and moderation
- **Services Backend**: Offer and purchase gaming services (boosting, coaching, etc.)

</div>

<div dir="rtl">

- **مارکت‌پلیس**: خرید/فروش آیتم‌های بازی (CS:GO، Dota 2، TF2، Rust و غیره)
- **سیستم انجمن‌ها**: بحث‌های جامعه با دسته‌بندی‌ها و نظارت
- **بک‌اند سرویس‌ها**: ارائه و خرید سرویس‌های گیمینگ (بوست، مربیگری و غیره)

</div>

<div dir="ltr">

### Phase 3 - Advanced Features | فاز 3 - ویژگی‌های پیشرفته

- **Payment Gateway**: Stripe integration for USD, Iranian Rial support
- **Steam Integration**: Automatic item delivery, inventory sync
- **AI Chatbot**: OpenAI-powered customer support assistant

</div>

<div dir="rtl">

- **درگاه پرداخت**: یکپارچه‌سازی Stripe برای USD، پشتیبانی از ریال ایران
- **یکپارچه‌سازی استیم**: تحویل خودکار آیتم، همگام‌سازی موجودی
- **چت‌بات هوش مصنوعی**: دستیار پشتیبانی مشتری با قدرت OpenAI

</div>

<div dir="ltr">

### Additional Features | ویژگی‌های اضافی

- **API Documentation**: Complete Swagger/OpenAPI documentation
- **Multi-language Support**: English, Persian (فارسی), Russian (Русский)
- **Internationalization**: Dynamic language switching with user preferences

</div>

<div dir="rtl">

- **مستندات API**: مستندات کامل Swagger/OpenAPI
- **پشتیبانی چندزبانه**: انگلیسی، فارسی، روسی
- **بین‌المللی‌سازی**: تغییر زبان پویا با ترجیحات کاربر

</div>

---

## 🛠️ Technology Stack | پشته فناوری

<div dir="ltr">

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens, bcrypt password hashing
- **File Upload**: Multer for images
- **Email**: Nodemailer for verification emails
- **SMS**: Twilio for phone verification
- **Payments**: Stripe for USD payments
- **AI**: OpenAI GPT-3.5-turbo for chatbot
- **Steam API**: Integration for game items
- **Security**: Helmet, CORS, rate limiting
- **Documentation**: Swagger/OpenAPI 3.0
- **Internationalization**: i18n with multi-language support

</div>

<div dir="rtl">

- **بک‌اند**: Node.js، Express.js
- **پایگاه داده**: MongoDB با Mongoose
- **احراز هویت**: توکن‌های JWT، هش کردن رمز عبور با bcrypt
- **آپلود فایل**: Multer برای تصاویر
- **ایمیل**: Nodemailer برای ایمیل‌های تأیید
- **پیامک**: Twilio برای تأیید تلفن
- **پرداخت‌ها**: Stripe برای پرداخت‌های USD
- **هوش مصنوعی**: OpenAI GPT-3.5-turbo برای چت‌بات
- **API استیم**: یکپارچه‌سازی برای آیتم‌های بازی
- **امنیت**: Helmet، CORS، محدودیت نرخ
- **مستندات**: Swagger/OpenAPI 3.0
- **بین‌المللی‌سازی**: i18n با پشتیبانی چندزبانه

</div>

---

## 📁 Project Structure | ساختار پروژه

```
razeit/
├── models/                 # MongoDB models | مدل‌های MongoDB
│   ├── User.js
│   ├── Gem.js
│   ├── Wheel.js
│   ├── WheelToken.js
│   ├── MarketplaceItem.js
│   ├── Service.js
│   ├── ForumCategory.js
│   └── ForumTopic.js
├── routes/                 # API routes | مسیرهای API
│   ├── auth.js
│   ├── users.js
│   ├── admin.js
│   ├── gems.js
│   ├── wheel.js
│   ├── marketplace.js
│   ├── services.js
│   ├── payments.js
│   ├── steam.js
│   ├── chat.js
│   └── forums.js
├── middleware/            # Custom middleware | میان‌افزارهای سفارشی
│   ├── auth.js
│   └── i18n.js
├── config/               # Configuration files | فایل‌های پیکربندی
│   ├── swagger.js
│   └── i18n.js
├── locales/              # Language files | فایل‌های زبان
│   ├── en.json
│   ├── fa.json
│   └── ru.json
├── frontend/             # Frontend files | فایل‌های فرانت‌اند
│   ├── index.html
│   ├── dashboard.html
│   ├── marketplace.html
│   ├── forums.html
│   ├── services.html
│   ├── wheel.html
│   ├── admin.html
│   └── assets/
├── uploads/              # File uploads directory | دایرکتوری آپلود فایل
│   ├── avatars/
│   ├── marketplace/
│   └── services/
├── server.js             # Main server file | فایل اصلی سرور
├── package.json          # Dependencies | وابستگی‌ها
└── env.template         # Environment variables template | قالب متغیرهای محیطی
```

---

## 🚀 Getting Started | شروع کار

### Prerequisites | پیش‌نیازها

<div dir="ltr">

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (optional, for session storage)

</div>

<div dir="rtl">

- Node.js (نسخه 14 یا بالاتر)
- MongoDB (نسخه 4.4 یا بالاتر)
- Redis (اختیاری، برای ذخیره جلسه)

</div>

### Installation | نصب

<div dir="ltr">

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd razeit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/razeit-gaming-platform
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   STEAM_API_KEY=your-steam-api-key
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Start MongoDB**
   ```bash
   mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000`

</div>

<div dir="rtl">

1. **کلون کردن مخزن**
   ```bash
   git clone <repository-url>
   cd razeit
   ```

2. **نصب وابستگی‌ها**
   ```bash
   npm install
   ```

3. **تنظیم متغیرهای محیطی**
   ```bash
   cp env.template .env
   ```
   
   فایل `.env` را با پیکربندی خود به‌روزرسانی کنید:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/razeit-gaming-platform
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   STEAM_API_KEY=your-steam-api-key
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **شروع MongoDB**
   ```bash
   mongod
   ```

5. **اجرای برنامه**
   ```bash
   # حالت توسعه
   npm run dev
   
   # حالت تولید
   npm start
   ```

سرور روی `http://localhost:5000` شروع می‌شود

</div>

---

## 📚 API Documentation | مستندات API

### Swagger Documentation | مستندات Swagger

<div dir="ltr">

Visit `http://localhost:5000/api-docs` to view the interactive API documentation.

</div>

<div dir="rtl">

برای مشاهده مستندات تعاملی API به `http://localhost:5000/api-docs` مراجعه کنید.

</div>

### Language Support | پشتیبانی زبان

<div dir="ltr">

The API supports three languages:
- **English (en)**: Default language
- **Persian (fa)**: فارسی
- **Russian (ru)**: Русский

</div>

<div dir="rtl">

API از سه زبان پشتیبانی می‌کند:
- **انگلیسی (en)**: زبان پیش‌فرض
- **فارسی (fa)**: فارسی
- **روسی (ru)**: Русский

</div>

### Language Switching | تغییر زبان

<div dir="ltr">

You can switch languages using:
1. **Query Parameter**: `?lang=fa` (Persian) or `?lang=ru` (Russian)
2. **Cookie**: Set `locale` cookie
3. **User Preference**: Update user's language preference via `/api/auth/set-language`
4. **Header**: Send `Accept-Language` header

</div>

<div dir="rtl">

می‌توانید زبان را با استفاده از موارد زیر تغییر دهید:
1. **پارامتر Query**: `?lang=fa` (فارسی) یا `?lang=ru` (روسی)
2. **کوکی**: تنظیم کوکی `locale`
3. **ترجیح کاربر**: به‌روزرسانی ترجیح زبان کاربر از طریق `/api/auth/set-language`
4. **هدر**: ارسال هدر `Accept-Language`

</div>

---

## 🔗 API Endpoints | نقاط پایانی API

### Authentication Endpoints | نقاط پایانی احراز هویت

<div dir="ltr">

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email/:token` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password/:token` - Password reset
- `GET /api/auth/me` - Get current user

</div>

<div dir="rtl">

- `POST /api/auth/register` - ثبت‌نام کاربر
- `POST /api/auth/login` - ورود کاربر
- `GET /api/auth/verify-email/:token` - تأیید ایمیل
- `POST /api/auth/forgot-password` - درخواست بازنشانی رمز عبور
- `POST /api/auth/reset-password/:token` - بازنشانی رمز عبور
- `GET /api/auth/me` - دریافت کاربر فعلی

</div>

### User Management | مدیریت کاربر

<div dir="ltr">

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/dashboard` - Get dashboard data
- `GET /api/users/statistics` - Get user statistics

</div>

<div dir="rtl">

- `GET /api/users/profile` - دریافت پروفایل کاربر
- `PUT /api/users/profile` - به‌روزرسانی پروفایل
- `POST /api/users/avatar` - آپلود آواتار
- `GET /api/users/dashboard` - دریافت داده‌های داشبورد
- `GET /api/users/statistics` - دریافت آمار کاربر

</div>

### Marketplace | مارکت‌پلیس

<div dir="ltr">

- `GET /api/marketplace` - Get marketplace items
- `POST /api/marketplace` - Create item listing
- `GET /api/marketplace/:id` - Get item details
- `POST /api/marketplace/:id/purchase` - Purchase item
- `POST /api/marketplace/:id/like` - Like/unlike item

</div>

<div dir="rtl">

- `GET /api/marketplace` - دریافت آیتم‌های مارکت‌پلیس
- `POST /api/marketplace` - ایجاد لیست آیتم
- `GET /api/marketplace/:id` - دریافت جزئیات آیتم
- `POST /api/marketplace/:id/purchase` - خرید آیتم
- `POST /api/marketplace/:id/like` - لایک/آنلایک آیتم

</div>

### Services | سرویس‌ها

<div dir="ltr">

- `GET /api/services` - Get available services
- `POST /api/services` - Create service
- `POST /api/services/:id/order` - Order service
- `POST /api/services/:id/reviews` - Add review

</div>

<div dir="rtl">

- `GET /api/services` - دریافت سرویس‌های موجود
- `POST /api/services` - ایجاد سرویس
- `POST /api/services/:id/order` - سفارش سرویس
- `POST /api/services/:id/reviews` - اضافه کردن نظر

</div>

### Gem Currency | ارز جم

<div dir="ltr">

- `GET /api/gems` - Get gem information
- `POST /api/gems/purchase` - Purchase gems
- `GET /api/gems/balance/me` - Get user gem balance

</div>

<div dir="rtl">

- `GET /api/gems` - دریافت اطلاعات جم
- `POST /api/gems/purchase` - خرید جم
- `GET /api/gems/balance/me` - دریافت موجودی جم کاربر

</div>

### Wheel of Luck | گردونه شانس

<div dir="ltr">

- `GET /api/wheel/wheels` - Get active wheels
- `POST /api/wheel/spin/:wheelId` - Spin wheel
- `GET /api/wheel/tokens` - Get wheel tokens
- `POST /api/wheel/tokens/purchase` - Purchase wheel tokens

</div>

<div dir="rtl">

- `GET /api/wheel/wheels` - دریافت گردونه‌های فعال
- `POST /api/wheel/spin/:wheelId` - چرخاندن گردونه
- `GET /api/wheel/tokens` - دریافت توکن‌های گردونه
- `POST /api/wheel/tokens/purchase` - خرید توکن‌های گردونه

</div>

### Payment Gateway | درگاه پرداخت

<div dir="ltr">

- `POST /api/payments/create-payment-intent` - Create Stripe payment
- `POST /api/payments/confirm-payment` - Confirm payment
- `POST /api/payments/create-rial-payment` - Create Rial payment
- `POST /api/payments/verify-rial-payment` - Verify Rial payment

</div>

<div dir="rtl">

- `POST /api/payments/create-payment-intent` - ایجاد پرداخت Stripe
- `POST /api/payments/confirm-payment` - تأیید پرداخت
- `POST /api/payments/create-rial-payment` - ایجاد پرداخت ریالی
- `POST /api/payments/verify-rial-payment` - تأیید پرداخت ریالی

</div>

### Steam Integration | یکپارچه‌سازی استیم

<div dir="ltr">

- `POST /api/steam/connect` - Connect Steam account
- `GET /api/steam/inventory` - Get Steam inventory
- `POST /api/steam/deliver-item` - Deliver item to Steam

</div>

<div dir="rtl">

- `POST /api/steam/connect` - اتصال حساب استیم
- `GET /api/steam/inventory` - دریافت موجودی استیم
- `POST /api/steam/deliver-item` - تحویل آیتم به استیم

</div>

### AI Chatbot | چت‌بات هوش مصنوعی

<div dir="ltr">

- `POST /api/chat/chat` - Chat with AI assistant
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/quick-responses` - Get quick responses

</div>

<div dir="rtl">

- `POST /api/chat/chat` - چت با دستیار هوش مصنوعی
- `GET /api/chat/history` - دریافت تاریخچه چت
- `GET /api/chat/quick-responses` - دریافت پاسخ‌های سریع

</div>

### Forums | انجمن‌ها

<div dir="ltr">

- `GET /api/forums/categories` - Get forum categories
- `GET /api/forums/categories/:id` - Get category topics
- `POST /api/forums/topics` - Create topic
- `POST /api/forums/topics/:id/posts` - Add post to topic

</div>

<div dir="rtl">

- `GET /api/forums/categories` - دریافت دسته‌بندی‌های انجمن
- `GET /api/forums/categories/:id` - دریافت موضوعات دسته‌بندی
- `POST /api/forums/topics` - ایجاد موضوع
- `POST /api/forums/topics/:id/posts` - اضافه کردن پست به موضوع

</div>

### Admin Panel | پنل ادمین

<div dir="ltr">

- `GET /api/admin/dashboard` - Get admin dashboard
- `GET /api/admin/users` - Get users list
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/gems` - Add/remove gems
- `GET /api/admin/settings` - Get platform settings

</div>

<div dir="rtl">

- `GET /api/admin/dashboard` - دریافت داشبورد ادمین
- `GET /api/admin/users` - دریافت لیست کاربران
- `PUT /api/admin/users/:id/role` - به‌روزرسانی نقش کاربر
- `PUT /api/admin/users/:id/gems` - اضافه/حذف جم
- `GET /api/admin/settings` - دریافت تنظیمات پلتفرم

</div>

---

## 🔧 Configuration | پیکربندی

### Database Models | مدل‌های پایگاه داده

#### User Model | مدل کاربر

<div dir="ltr">

- Email, phone, username authentication
- Profile information and preferences
- Gem balance and wallet
- Steam account integration
- Statistics and activity tracking

</div>

<div dir="rtl">

- احراز هویت ایمیل، تلفن، نام کاربری
- اطلاعات پروفایل و ترجیحات
- موجودی جم و کیف پول
- یکپارچه‌سازی حساب استیم
- آمار و ردیابی فعالیت

</div>

#### Marketplace Model | مدل مارکت‌پلیس

<div dir="ltr">

- Item details (title, description, images)
- Pricing in gems, USD, and Rial
- Category and rarity system
- Seller/buyer tracking
- Like and view statistics

</div>

<div dir="rtl">

- جزئیات آیتم (عنوان، توضیحات، تصاویر)
- قیمت‌گذاری در جم، USD و ریال
- سیستم دسته‌بندی و نادر بودن
- ردیابی فروشنده/خریدار
- آمار لایک و بازدید

</div>

#### Service Model | مدل سرویس

<div dir="ltr">

- Service details and requirements
- Provider and pricing information
- Order management system
- Review and rating system

</div>

<div dir="rtl">

- جزئیات سرویس و الزامات
- اطلاعات ارائه‌دهنده و قیمت‌گذاری
- سیستم مدیریت سفارش
- سیستم نظر و امتیازدهی

</div>

#### Gem Model | مدل جم

<div dir="ltr">

- Exchange rates (USD/Rial to gems)
- Purchase limits and bonus rates
- Admin-configurable settings

</div>

<div dir="rtl">

- نرخ‌های تبدیل (USD/ریال به جم)
- محدودیت‌های خرید و نرخ‌های پاداش
- تنظیمات قابل پیکربندی توسط ادمین

</div>

#### Wheel Model | مدل گردونه

<div dir="ltr">

- Prize configuration with probabilities
- Cost per spin (gems/tokens)
- Daily limits and cooldowns

</div>

<div dir="rtl">

- پیکربندی جوایز با احتمالات
- هزینه هر چرخش (جم/توکن)
- محدودیت‌های روزانه و زمان انتظار

</div>

### Security Features | ویژگی‌های امنیتی

<div dir="ltr">

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent abuse and spam
- **CORS Protection**: Configured for frontend domains
- **Helmet Security**: Security headers
- **Input Validation**: express-validator for all inputs
- **File Upload Security**: Image type validation and size limits

</div>

<div dir="rtl">

- **احراز هویت JWT**: احراز هویت امن مبتنی بر توکن
- **هش کردن رمز عبور**: bcrypt با دورهای نمک
- **محدودیت نرخ**: جلوگیری از سوءاستفاده و اسپم
- **محافظت CORS**: پیکربندی شده برای دامنه‌های فرانت‌اند
- **امنیت Helmet**: هدرهای امنیتی
- **اعتبارسنجی ورودی**: express-validator برای تمام ورودی‌ها
- **امنیت آپلود فایل**: اعتبارسنجی نوع تصویر و محدودیت‌های اندازه

</div>

### Payment Integration | یکپارچه‌سازی پرداخت

<div dir="ltr">

- **Stripe**: USD payments with webhooks
- **Iranian Gateways**: Rial payment support (ZarinPal, Pay.ir)
- **Gem System**: Internal currency with exchange rates
- **Transaction Tracking**: Complete payment history

</div>

<div dir="rtl">

- **Stripe**: پرداخت‌های USD با webhook
- **درگاه‌های ایرانی**: پشتیبانی از پرداخت ریالی (زرین‌پال، پی.آی‌آر)
- **سیستم جم**: ارز داخلی با نرخ‌های تبدیل
- **ردیابی تراکنش**: تاریخچه کامل پرداخت

</div>

---

## 🚀 Deployment | استقرار

### Production Setup | راه‌اندازی تولید

<div dir="ltr">

1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-production-secret
   ```

2. **Database Indexes**
   ```bash
   # Create indexes for better performance
   db.users.createIndex({ email: 1 })
   db.users.createIndex({ username: 1 })
   db.marketplaceitems.createIndex({ category: 1, status: 1 })
   db.marketplaceitems.createIndex({ title: "text", description: "text" })
   ```

3. **File Storage**
   - Configure cloud storage (AWS S3, Cloudinary) for production
   - Update multer configuration for cloud uploads

4. **Monitoring**
   - Set up logging with Winston
   - Configure error tracking (Sentry)
   - Monitor API performance

</div>

<div dir="rtl">

1. **پیکربندی محیط**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-production-secret
   ```

2. **ایندکس‌های پایگاه داده**
   ```bash
   # ایجاد ایندکس‌ها برای عملکرد بهتر
   db.users.createIndex({ email: 1 })
   db.users.createIndex({ username: 1 })
   db.marketplaceitems.createIndex({ category: 1, status: 1 })
   db.marketplaceitems.createIndex({ title: "text", description: "text" })
   ```

3. **ذخیره‌سازی فایل**
   - پیکربندی ذخیره‌سازی ابری (AWS S3، Cloudinary) برای تولید
   - به‌روزرسانی پیکربندی multer برای آپلودهای ابری

4. **نظارت**
   - راه‌اندازی لاگ‌گیری با Winston
   - پیکربندی ردیابی خطا (Sentry)
   - نظارت بر عملکرد API

</div>

---

## 📝 API Examples | نمونه‌های API

### User Registration | ثبت‌نام کاربر

<div dir="ltr">

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gamer123",
    "email": "gamer@example.com",
    "password": "securepassword123",
    "phone": "+1234567890"
  }'
```

</div>

<div dir="rtl">

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gamer123",
    "email": "gamer@example.com",
    "password": "securepassword123",
    "phone": "+1234567890"
  }'
```

</div>

### Create Marketplace Item | ایجاد آیتم مارکت‌پلیس

<div dir="ltr">

```bash
curl -X POST http://localhost:5000/api/marketplace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "AK-47 Redline",
    "description": "Factory New AK-47 Redline from CS:GO",
    "category": "weapon",
    "game": "csgo",
    "priceGems": 500,
    "priceUSD": 25.00,
    "priceRial": 1000000,
    "images": ["image1.jpg", "image2.jpg"]
  }'
```

</div>

<div dir="rtl">

```bash
curl -X POST http://localhost:5000/api/marketplace \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "AK-47 Redline",
    "description": "Factory New AK-47 Redline from CS:GO",
    "category": "weapon",
    "game": "csgo",
    "priceGems": 500,
    "priceUSD": 25.00,
    "priceRial": 1000000,
    "images": ["image1.jpg", "image2.jpg"]
  }'
```

</div>

### Spin Wheel | چرخاندن گردونه

<div dir="ltr">

```bash
curl -X POST http://localhost:5000/api/wheel/spin/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenType": "gems",
    "amount": 100
  }'
```

</div>

<div dir="rtl">

```bash
curl -X POST http://localhost:5000/api/wheel/spin/64f8a1b2c3d4e5f6a7b8c9d0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tokenType": "gems",
    "amount": 100
  }'
```

</div>

---

## 🤝 Contributing | مشارکت

<div dir="ltr">

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

</div>

<div dir="rtl">

1. فورک کردن مخزن
2. ایجاد شاخه ویژگی (`git checkout -b feature/amazing-feature`)
3. کامیت تغییرات (`git commit -m 'Add amazing feature'`)
4. پوش به شاخه (`git push origin feature/amazing-feature`)
5. باز کردن Pull Request

</div>

---

## 📄 License | مجوز

<div dir="ltr">

This project is licensed under the MIT License - see the LICENSE file for details.

</div>

<div dir="rtl">

این پروژه تحت مجوز MIT مجوز دارد - برای جزئیات فایل LICENSE را ببینید.

</div>

---

## 🆘 Support | پشتیبانی

<div dir="ltr">

For support and questions:
- Create an issue in the repository
- Contact the development team
- Use the AI chatbot for platform-related questions

</div>

<div dir="rtl">

برای پشتیبانی و سوالات:
- ایجاد issue در مخزن
- تماس با تیم توسعه
- استفاده از چت‌بات هوش مصنوعی برای سوالات مربوط به پلتفرم

</div>

---

## 🔮 Future Enhancements | بهبودهای آینده

<div dir="ltr">

- **Mobile App**: React Native mobile application
- **Real-time Chat**: Socket.io for live communication
- **Advanced Analytics**: User behavior tracking
- **Multi-language Support**: Internationalization
- **Blockchain Integration**: Cryptocurrency payments
- **Machine Learning**: Recommendation system
- **Video Streaming**: Game streaming integration

</div>

<div dir="rtl">

- **اپلیکیشن موبایل**: اپلیکیشن موبایل React Native
- **چت بلادرنگ**: Socket.io برای ارتباط زنده
- **تحلیل‌های پیشرفته**: ردیابی رفتار کاربر
- **پشتیبانی چندزبانه**: بین‌المللی‌سازی
- **یکپارچه‌سازی بلاک‌چین**: پرداخت‌های ارز دیجیتال
- **یادگیری ماشین**: سیستم توصیه
- **استریم ویدیو**: یکپارچه‌سازی استریم بازی

</div>

---

<div dir="ltr">

Built with ❤️ by the RaZeit Team

</div>

<div dir="rtl">

ساخته شده با ❤️ توسط تیم رازیت

</div>