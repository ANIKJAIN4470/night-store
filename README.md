# Papi's Kitchen 🍔🍜

> **"Hostel Snacks, Delivered to Your Door."**

Papi's Kitchen is a full-stack, production-ready snack ordering web application designed specifically for hostel students. It allows students to browse snacks, customize orders, and get hot meals delivered directly to their hostel room without having to create an account. The owner manages all incoming tickets, prices, menus, and delivery configurations through a protected real-time admin portal.

---

## 🌟 Key Features

### 🎓 Student Customer Experience
- **No Sign-Up Friction:** Instant guest ordering without passwords or account verification.
- **Direct Hostel Room Delivery:** Captures Student Name, Phone, Hostel Block/Building, and Room Number.
- **Appetizing Snack Menu:** High-resolution food photography, pure vegetarian indicators, and categories:
  - *Maggi & Noodles* (Classic Masala, Double Cheese Burst, Peri-Peri)
  - *Grilled Sandwiches* (Bombay Veg Grill, Cheese Corn, Paneer Tikka)
  - *Burgers & Fries* (Crispy Aloo Tikki, Fiery Peri-Peri Fries)
  - *Indian Snacks* (Hot Samosas, Bread Pakora)
  - *Beverages & Combos* (Cold Coffee with Fudge, Chilled Soda, Late Night Study Combos)
- **Live Search & Price Sorting:** Filter by category, search by snack name or description, and sort by price.
- **Cart & Subtotal Integrity:** Persistent cart stored in `localStorage` with server-side price revalidation during checkout.
- **Flexible Payment Methods:**
  - Cash on Delivery (COD)
  - Cash on Delivery
- **Real-Time Order Tracking:** Accessible via unique public order number (`PK-XXXX`) and an unguessable 32-character tracking token. Live status progression:
  1. `Placed` ➔ 2. `Confirmed` ➔ 3. `Preparing` (In Kitchen) ➔ 4. `Out for Delivery` ➔ 5. `Delivered` (or `Cancelled`)
- **Self-Service Order Cancellation:** Students can cancel their order if it has not yet entered the kitchen preparation stage.

### 🛡️ Owner Admin Dashboard
- **Secure Authentication:** Password hashing using `bcryptjs` and signed JWT sessions with login rate-limiting protection.
- **Real-Time Operational Dashboard:**
  - Total orders placed today
  - Urgent pending orders awaiting confirmation
  - Active tickets cooking in the kitchen
  - Orders dispatched out for room delivery
  - Today's recorded order value vs. actual collected cash revenue
  - Database status indicator (MongoDB Atlas Live vs. Resilient Local Storage)
- **Order Pipeline Management:**
  - Search by order number, student name, phone, or hostel room
  - Filter by order status and specific date
  - Single-click status transitions with timestamped audit history
  - Toggle cash payment collected status
  - Cancellation with required business reason
- **Snack Product & Price Control:**
  - Add new snack products with image URL, price, and category
  - Edit existing snack names, descriptions, and INR prices
  - Instant toggle between "In Stock" and "Sold Out"
  - Delete items with confirmation dialog (existing orders safely retain immutable price snapshots)
- **Business & Delivery Settings:**
  - Kitchen opening and closing hours
  - Master Store Open / Paused switch
  - Customizable Room Delivery Fee (default ₹15) and Minimum Order Amount (default ₹50)
  - Estimated delivery duration
  - Editable accepted hostel list (add/remove campus hostels)
  - Custom announcement banner displayed at the top of the store

---

## 💻 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, Lucide React icons
- **Backend:** Node.js, Express.js, TypeScript (`tsx`)
- **Database & Persistence:**
  - Dual-mode architecture:
    - **Production:** MongoDB & Mongoose schemas with indexing and validation
    - **Local/Prototyping:** Resilient JSON file store (`.data/papis_kitchen.json`) ensuring 100% uptime even before MongoDB credentials are configured
- **Security:** `bcryptjs` password hashing, HMAC-SHA256 tokens, HTTP-only cookie support, rate-limiting, CORS, and nosniff/XSS headers

---

## 📁 Project Structure

```
├── .data/                     # Local persistent fallback data directory
│   └── papis_kitchen.json
├── server/                    # Full-Stack Backend
│   ├── models/                # Mongoose Models
│   │   ├── Product.ts         # Snack product schema
│   │   ├── Order.ts           # Order schema with snapshots & audit history
│   │   ├── Admin.ts           # Admin user schema
│   │   └── Settings.ts        # Business settings schema
│   ├── routes/                # Express Routers
│   │   ├── public.ts          # Public endpoints (products, checkout, tracking)
│   │   └── admin.ts           # Protected admin endpoints
│   ├── auth.ts                # JWT authentication, cookies, and rate limiter
│   ├── db.ts                  # Unified database adapter (MongoDB + Local Fallback)
│   ├── seedData.ts            # Default snacks, categories, and business settings
│   └── types.ts               # Shared backend TypeScript interfaces
├── src/                       # Frontend SPA
│   ├── components/            # Reusable UI Components
│   │   ├── Navbar.tsx         # Brand header, open/close status, cart trigger
│   │   ├── Footer.tsx         # Operating hours, hostels served, policies
│   │   ├── ProductCard.tsx    # Food photo, veg badge, price, quantity controls
│   │   ├── ProductDetailsModal.tsx # Snack details inspection modal
│   │   ├── CartDrawer.tsx     # Slide-over cart with calculations & min order check
│   │   ├── OrderStatusTimeline.tsx # Visual pipeline progression stepper
│   │   ├── LoadingSkeleton.tsx# Skeletons for loading states
│   │   └── EmptyState.tsx     # Reusable empty states
│   ├── context/               # Global State Providers
│   │   ├── CartContext.tsx    # Cart state & localStorage sync
│   │   └── AuthContext.tsx    # Admin authentication session
│   ├── pages/                 # Customer & Admin Pages
│   │   ├── HomePage.tsx       # Hero, specials, delivery guide, testimonials
│   │   ├── MenuPage.tsx       # Searchable & filterable menu grid
│   │   ├── CheckoutPage.tsx   # Room delivery form with COD selection
│   │   ├── OrderConfirmationPage.tsx # Order success screen with token
│   │   ├── OrderTrackingPage.tsx # Token-protected live status tracker
│   │   ├── NotFoundPage.tsx   # 404 page
│   │   └── admin/             # Admin Portal
│   │       ├── AdminLoginPage.tsx      # Secure login page
│   │       ├── AdminLayout.tsx         # Admin header & navigation tabs
│   │       ├── AdminDashboardPage.tsx  # Overview stats & recent orders
│   │       ├── AdminOrdersPage.tsx     # Order management & status changes
│   │       ├── AdminProductsPage.tsx   # Menu product creation & pricing
│   │       └── AdminSettingsPage.tsx   # Hours, fees, and store toggle
│   ├── services/
│   │   └── api.ts             # Centralized API client
│   ├── types.ts               # Frontend TypeScript interfaces
│   ├── App.tsx                # App root & view routing
│   ├── main.tsx               # Entry point
│   └── index.css              # Tailwind CSS imports & theme
├── test/
│   └── runTests.ts            # Automated test suite (11 integration tests)
├── .env.example               # Environment variables template
├── metadata.json              # AI Studio applet configuration
├── package.json               # Dependencies & scripts
├── server.ts                  # Full-stack server entry point (Express + Vite)
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- Optional: MongoDB Atlas connection string (app runs automatically in local mode if omitted)

### Installation
```bash
# 1. Clone repository
git clone <repository-url>
cd papis-kitchen

# 2. Install dependencies
npm install

# 3. Create .env file from template
cp .env.example .env
```

### Initial Admin Credentials
When the application starts for the first time, it automatically creates the initial admin account using environment variables (or defaults):
- **Username:** `admin`
- **Password:** `ChangeThisPassword123!`

*(You can change `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your `.env` file).*

### Running Locally
```bash
# Start full-stack development server on http://localhost:3000
npm run dev
```

### Running Tests
```bash
npm test
# Or run with tsx directly:
npx tsx test/runTests.ts
```

### Production Build
```bash
npm run build
npm start
```

---

## 📡 API Reference

### Public Customer Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check, uptime, and database connection status |
| `GET` | `/api/products` | Retrieve snack menu (supports `?category=`, `?search=`) |
| `GET` | `/api/products/:id` | Retrieve single product details |
| `GET` | `/api/settings/public` | Public store hours, delivery fee, and hostels served |
| `POST` | `/api/orders` | Place a guest order (validates room details, recalculates totals) |
| `GET` | `/api/orders/:orderNumber?token=...` | Secure order tracking requiring matching token |
| `POST` | `/api/orders/:orderNumber/cancel` | Customer cancellation (permitted only when status is `Placed`) |

### Protected Admin Endpoints (`Bearer <token>` or HTTP-only Cookie)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Owner authentication with rate limiting |
| `POST` | `/api/admin/auth/logout` | Clears admin session |
| `GET` | `/api/admin/auth/me` | Current authenticated admin profile |
| `GET` | `/api/admin/dashboard` | Aggregated analytics, revenue, orders count, and recent orders |
| `GET` | `/api/admin/orders` | Search, filter by status and date, with pagination |
| `GET` | `/api/admin/orders/:id` | Full order details with customer phone and audit log |
| `PATCH` | `/api/admin/orders/:id/status` | Update pipeline status (`Placed`, `Confirmed`, `Preparing`, etc.) |
| `PATCH` | `/api/admin/orders/:id/payment` | Update payment collected status (`Pending`, `Paid`) |
| `POST` | `/api/admin/orders/:id/cancel` | Cancel order with required audit reason |
| `GET` | `/api/admin/products` | List all menu products |
| `POST` | `/api/admin/products` | Create new snack product |
| `PUT` | `/api/admin/products/:id` | Update product details, price, or availability |
| `DELETE` | `/api/admin/products/:id` | Delete product (preserves historical order snapshots) |
| `GET` | `/api/admin/settings` | Get all business settings |
| `PUT` | `/api/admin/settings` | Update store hours, delivery fee, or pause orders |

---

## ☁️ Deployment Instructions

### 1. MongoDB Atlas Setup
1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a free **M0 Shared Cluster**.
3. Under **Security ➔ Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Render/cloud servers.
4. Under **Security ➔ Database Access**, create a user with read/write privileges.
5. In **Clusters ➔ Connect ➔ Connect your application**, copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/papis_kitchen?retryWrites=true&w=majority
   ```

### 2. Deploy Backend & Frontend (Full-Stack on Render)
1. Push your code to GitHub.
2. In Render, select **New ➔ Web Service** and link your repository.
3. Configure settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `PORT`: `3000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas connection URI>`
   - `DATABASE_NAME`: `papis_kitchen`
   - `JWT_SECRET`: `<A random 32+ character string>`
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD`: `<Your secure owner password>`
   - `BUSINESS_NAME`: `Papi's Kitchen`
   - `DEFAULT_DELIVERY_FEE`: `15`

### 3. Deploying Frontend Separately on Vercel (Optional)
If deploying the frontend separately on Vercel:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- Set `CLIENT_ORIGIN` on your backend to the Vercel domain.

---

## 🔧 Troubleshooting

- **Admin Login fails with rate limit error:**
  Wait 10 minutes or clear browser cookies / restart server to reset the failed login counter.
- **Port 3000 conflict during development:**
  Ensure no other processes are bound to port 3000 (`lsof -i :3000` and kill the old process).
- **MongoDB connection timeout:**
  Verify that your IP address or `0.0.0.0/0` is whitelisted in MongoDB Atlas Network Access rules. Papi's Kitchen will automatically fall back to its resilient local store if MongoDB is momentarily unreachable.

---

© 2026 Papi's Kitchen. Crafted for hostel foodies.
