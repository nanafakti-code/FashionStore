# 👗 FashionStore - Modern E-commerce Platform

[![Astro 5.0](https://img.shields.io/badge/Astro-5.0-EB3349?logo=astro&logoColor=white)](https://astro.build/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Preact](https://img.shields.io/badge/Preact-Islands-673AB7?logo=preact&logoColor=white)](https://preactjs.com/)

**FashionStore** is a premium, high-performance e-commerce platform built with the latest web technologies. It leverages **Astro 5.0's Islands Architecture** and **Supabase** to deliver a blazingly fast experience for customers and a robust management suite for administrators.

---

## 🚀 Key Features

### 🛍️ Storefront (Customer Experience)
*   **Islands Architecture:** Interactive components (islands) only load JavaScript when needed, ensuring near-instant load times.
*   **Live Search:** Real-time product search with debouncing and visual suggestions.
*   **Dynamic Catalog:** Category-based navigation and advanced filtering.
*   **Product Variants:** Deep support for colors, sizes, and specific product attributes.
*   **Smart Cart:** Persistent shopping cart using **Nano Stores**, synced across sessions and authenticated states.
*   **Reviews & Ratings:** Community-driven feedback system with verified purchase tags.
*   **Smooth Checkout:** Integrated with **Stripe** for secure, gold-standard payment processing.
*   **Guest Checkout:** Seamless ordering process for non-registered users.

### 📊 Admin Dashboard (Business Management)
*   **Real-time Analytics:** KPI cards for monthly sales, pending orders, and customer activity.
*   **Inventory Management:** Full CRUD operations for products, variants, and stock levels.
*   **Order Fulfillment:** Workflow management for processing, shipping, and completing orders.
*   **Returns System:** Specialized module for handling return requests and stock restoration.
*   **Automatic Invoicing:** On-the-fly PDF generation for invoices and credit notes (jsPDF).
*   **Promo Engine:** Comprehensive coupon and discount code management system.

---

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Astro 5.0](https://astro.build/) (Hybrid Rendering: SSG + SSR) |
| **UI Library** | [Preact](https://preactjs.com/) (React-compatible, lightweight) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) (Modern Colorful Theme) |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL + RLS Security) |
| **State Management** | [Nano Stores](https://github.com/nanostores/nanostores) |
| **Payments** | [Stripe SDK](https://stripe.com/) |
| **PDF Generation** | [jsPDF](https://github.com/parallax/jsPDF) |

---

## ⚙️ Key Optimizations

*   **Atomic Stock Management:** Uses Supabase **Remote Procedure Calls (RPCs)** to handle stock deductions during checkout, preventing overselling and race conditions.
*   **SEO Engine:** 
    *   Dynamic **Sitemap** generation.
    *   Optimized `robots.txt` configuration.
    *   Prerendered static routes for blazing-fast SEO performance.
*   **Row-Level Security (RLS):** Policies defined at the database level ensure customer data privacy and secure admin access.
*   **Hybrid Power:** Uses Server-Side Rendering (SSR) for personalized data and Static Site Generation (SSG) for public catalog pages.

---

## 📂 Project Structure

```text
├── src/
│   ├── components/       # Reusable UI components (Islands)
│   ├── layouts/          # Base page layouts
│   ├── lib/              # Service services (Supabase, Stripe, API)
│   ├── pages/            # File-based routing (Astro)
│   └── stores/           # Nano Stores state management
├── public/               # Static assets (images, robots.txt)
├── supabase/             # Database migrations and SQL functions
└── astro.config.mjs      # Framework configuration
```

---

## 🛠️ Getting Started

1.  **Clone the repo:**
    ```bash
    git clone https://github.com/your-username/FashionStore.git
    cd FashionStore
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment:**
    Create a `.env` file with your credentials:
    ```env
    PUBLIC_SUPABASE_URL=your_url
    PUBLIC_SUPABASE_ANON_KEY=your_key
    SUPABASE_SERVICE_ROLE_KEY=your_admin_key
    STRIPE_SECRET_KEY=your_stripe_key
    ```

4.  **Run development server:**
    ```bash
    npm run dev
    ```

---

## 📄 License

Developed as a Final Project for the **SGE (Enterprise Management Systems)** module in 2DAM.
