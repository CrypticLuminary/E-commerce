# AG-EcOM: Multi-Vendor E-Commerce Platform

A comprehensive multi-vendor e-commerce platform built with **Next.js 14 (App Router)** for the frontend and **Django REST Framework** for the backend. This project demonstrates a full-stack e-commerce solution with multi-vendor support, guest checkout, JWT authentication, and a clean responsive UI.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Documentation](#api-documentation)
- [Demo Credentials](#demo-credentials)
- [Architecture Overview](#architecture-overview)
- [Contributing](#contributing)

## ✨ Features

### Customer Features
- 🛒 Browse products with category filtering and search
- 🛍️ Add to cart (works for both guests and registered users)
- 📦 Complete checkout process with order tracking
- 👤 User authentication (register, login, logout)
- 📍 Manage multiple shipping addresses
- 📋 Order history and status tracking

### Vendor Features
- 🏪 Register as a vendor with approval workflow
- 📦 Product management (CRUD operations)
- 📊 Dashboard with sales statistics
- 🚚 Order fulfillment and status updates
- 💰 Track revenue and pending orders

### Admin Features
- 👥 User management
- 🏪 Vendor approval/rejection
- 📦 Product moderation
- 📊 Platform-wide analytics

### Technical Features
- 🔐 JWT Authentication with token refresh
- 🛒 Guest cart with merge on login
- 📱 Fully responsive design
- 🎨 Modern UI with Tailwind CSS
- 🔍 Product search and filtering
- 📄 Pagination throughout

## 🛠️ Tech Stack

### Backend
- **Django 4.2+** - Web framework
- **Django REST Framework** - API development
- **SimpleJWT** - JWT authentication
- **django-cors-headers** - CORS handling
- **django-filter** - Filtering support
- **SQLite** - Database (easily switchable to PostgreSQL)
- **Pillow** - Image processing

### Frontend
- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **react-hot-toast** - Toast notifications
- **Lucide React** - Icon library

## 📁 Project Structure

```
AG-EcOM/
├── backend/                  # Django Backend
│   ├── core/                 # Project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── accounts/             # User & Address management
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── vendors/              # Vendor management
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── products/             # Product & Category management
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── cart/                 # Shopping cart
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── orders/               # Order management
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/                 # Next.js Frontend
    ├── app/                  # App Router pages
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── login/
    │   ├── register/
    │   ├── products/
    │   ├── cart/
    │   ├── checkout/
    │   ├── orders/
    │   ├── dashboard/
    │   └── vendor/
    ├── components/           # Reusable components
    │   ├── layout/
    │   ├── products/
    │   └── ui/
    ├── context/              # React Context providers
    │   ├── AuthContext.tsx
    │   └── CartContext.tsx
    ├── lib/                  # Utilities
    │   ├── api-client.ts
    │   ├── api-config.ts
    │   ├── types.ts
    │   └── utils.ts
    ├── package.json
    ├── tailwind.config.js
    └── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **npm** or **yarn**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (admin):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Load sample data (optional):**
   ```bash
   python manage.py loaddata sample_data.json
   ```

7. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login (get tokens) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Logout (blacklist token) |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts/profile/` | Get user profile |
| PATCH | `/api/accounts/profile/` | Update profile |
| GET | `/api/accounts/addresses/` | List addresses |
| POST | `/api/accounts/addresses/` | Create address |
| PATCH | `/api/accounts/addresses/{id}/` | Update address |
| DELETE | `/api/accounts/addresses/{id}/` | Delete address |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products/` | List products |
| GET | `/api/products/{slug}/` | Get product detail |
| GET | `/api/products/categories/` | List categories |
| GET | `/api/products/featured/` | Get featured products |

### Cart Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart/` | Get cart |
| POST | `/api/cart/add/` | Add item to cart |
| PATCH | `/api/cart/items/{id}/` | Update item quantity |
| DELETE | `/api/cart/items/{id}/` | Remove item |
| POST | `/api/cart/merge/` | Merge guest cart |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders/` | List user orders |
| POST | `/api/orders/` | Create order |
| GET | `/api/orders/{order_number}/` | Get order detail |
| POST | `/api/orders/guest/` | Guest checkout |

### Vendor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vendors/register/` | Register as vendor |
| GET | `/api/vendors/profile/` | Get vendor profile |
| GET | `/api/vendors/products/` | List vendor products |
| GET | `/api/vendors/orders/` | List vendor orders |

## 👤 Demo Credentials

After setting up the project, you can use these test accounts:

### Customer Account
- **Email:** customer@example.com
- **Password:** password123

### Vendor Account
- **Email:** vendor@example.com
- **Password:** password123

### Admin Account
- Create via `python manage.py createsuperuser`

## 🏗️ Architecture Overview

### Authentication Flow
1. User registers or logs in
2. Server returns JWT access & refresh tokens
3. Access token stored in memory, refresh in httpOnly cookie
4. Token auto-refresh on expiry
5. Cart merges on login (guest items → user cart)

### Order Flow
1. Guest/User adds items to cart
2. Proceeds to checkout
3. Enters shipping info (or selects saved address)
4. Order created, cart cleared
5. Multi-vendor orders split by OrderItem
6. Each vendor fulfills their items independently

### Data Models

```
User
  └── Address (multiple)
  └── Vendor (optional)
  └── Cart (one active)
       └── CartItem (multiple)
  └── Order (multiple)
       └── OrderItem (multiple, per vendor)

Product
  └── Category
  └── Vendor
  └── ProductImage (multiple)

Order
  └── OrderItem (per product/vendor)
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with Django's PBKDF2
- CORS protection
- CSRF protection
- Input validation and sanitization
- SQL injection prevention (Django ORM)

## 📈 Future Enhancements

- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notifications
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced search with Elasticsearch
- [ ] Real-time notifications (WebSocket)
- [ ] Image upload for products
- [ ] Inventory management
- [ ] Discount/coupon system
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for educational purposes
