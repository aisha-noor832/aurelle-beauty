# Auréllé Beauty — E-Commerce & Order Management

Auréllé Beauty is a full-stack cosmetics e-commerce application built with the MERN stack. Customers can browse products, select variants, manage a shopping cart, place Cash on Delivery (COD) orders, and view order history. Administrators can manage the product catalogue, variants and inventory, and process customer orders.

The project also includes backend unit and integration tests, Redis/BullMQ background order-event processing, and a GitHub Actions continuous-integration workflow.

> **Scope:** The application implements a basic COD checkout. It does not include an online payment gateway or cloud deployment. The CI workflow validates code; it does not deploy the application.

---

## 1. Features

### Customer storefront
- Customer registration and login.
- JWT-based authentication.
- Product catalogue with search and category filtering.
- Product detail pages with images, descriptions, prices, finishes and variants/shades.
- Shopping cart with quantity updates and item removal.
- Checkout with shipping details using Cash on Delivery.
- Order confirmation and customer order history.

### Admin workspace
- Role-protected administrator routes.
- Dashboard overview of catalogue, orders and stock indicators.
- Create products with multiple variants/shades.
- Edit product information, pricing, images, variants and stock.
- Deactivate products from the customer catalogue (soft delete).
- View and filter customer orders.
- Advance order fulfilment status through:
  `pending → confirmed → processing → shipped → delivered`.

### Backend and engineering
- RESTful API built with Express.
- MongoDB persistence through Mongoose.
- Password hashing and JWT authentication.
- Role-based authorization for administrator operations.
- Request validation using Zod.
- Centralized error handling and HTTP request logging.
- Redis-backed BullMQ queue for asynchronous order events.
- Idempotent order-event persistence using a unique event identifier.
- Jest and Supertest unit/integration testing.
- GitHub Actions CI for backend tests, frontend linting and frontend build.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Routing | React Router |
| HTTP client | Axios |
| Icons | Lucide React |
| Styling | CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt |
| Validation | Zod |
| Background jobs | BullMQ |
| Queue storage | Redis |
| Backend tests | Jest, Supertest |
| CI | GitHub Actions |
| Local infrastructure | Docker Compose |

---

## 3. Architecture Overview

The backend follows a layered, MVC-inspired structure:

- **Models** define persisted entities and schema-level validation.
- **Controllers** receive HTTP requests, coordinate application operations and return responses.
- **Routes** map REST endpoints to controllers and attach middleware.
- **Services** contain reusable business logic, including checkout/order operations.
- **Middleware** handles authentication, authorization, request validation and centralized errors.
- **Jobs** publish and consume asynchronous order events.

The React frontend is a separate client application. It communicates with the backend through REST APIs and does not access MongoDB directly.

### High-level request flow

```text
Browser (React)
      |
      | HTTP / JSON + JWT
      v
Express REST API
      |
      +---- Routes and middleware
      |
      +---- Controllers
      |        |
      |        +---- Services / business logic
      |        |
      |        +---- Mongoose models
      |                    |
      |                    v
      |                 MongoDB
      |
      +---- BullMQ queue
                   |
                   v
                 Redis
                   |
                   v
             Order worker
                   |
                   v
          MongoDB OrderEvent
```

### Authentication flow
1. A customer registers or logs in through the authentication API.
2. Passwords are stored as bcrypt hashes, not plaintext.
3. The backend issues a signed JWT after successful authentication.
4. The frontend stores the token and sends it in the `Authorization: Bearer <token>` header for protected requests.
5. Authentication middleware verifies the token and attaches the authenticated user to the request.
6. Authorization middleware restricts administrator operations to users with the `admin` role.

Public registration creates customer accounts. Administrator access is provisioned separately.

### Order and background-event flow
1. The customer submits checkout details.
2. The backend loads the customer's cart and calculates prices on the server.
3. The backend checks product variant availability and conditionally decrements stock.
4. The order is saved with product/price snapshots and a generated order number.
5. The cart is cleared after successful order creation.
6. An `order.created` event is submitted to the BullMQ queue.
7. A separate worker consumes the event and records it in MongoDB using an idempotent insert keyed by the event identifier.

The worker is a separate process from the Express API and must be started separately.

---

## 4. Project Structure

```text
aurelle-beauty/
├── .github/
│   └── workflows/
│       └── ci.yml
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── auth-context.js
│   │   │   ├── cart-context.js
│   │   │   ├── useAuth.js
│   │   │   └── useCart.js
│   │   ├── pages/
│   │   │   ├── StorePages.jsx
│   │   │   ├── AdminPages.jsx
│   │   │   └── Admin.css
│   │   ├── App.jsx
│   │   ├── HomePage.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── redis.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── cartController.js
│   │   │   └── orderController.js
│   │   ├── jobs/
│   │   │   ├── orderQueue.js
│   │   │   └── orderWorker.js
│   │   ├── middleware/
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Cart.js
│   │   │   ├── Order.js
│   │   │   └── OrderEvent.js
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── orderService.js
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── scripts/
│   │   ├── seedAdmin.js
│   │   └── checkOrderEvents.js
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── setup.js
│   │   └── helpers.js
│   ├── .env.example
│   ├── jest.config.js
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── docker-compose.yml
```

The backend `middleware`, `routes`, `utils` and `validators` directories contain individual modules; they are abbreviated above for readability.

---

## 5. Prerequisites

- Node.js 22.x (npm is included).
- MongoDB running locally.
- Docker Desktop with Docker Compose, for Redis.
- Git.
- A modern browser.

The commands below use PowerShell on Windows. The npm commands are equivalent on macOS/Linux.

---

## 6. Application Setup

### 6.1 Clone the repository

```bash
git clone https://github.com/aisha-noor832/aurelle-beauty.git
cd aurelle-beauty
```

### 6.2 Start MongoDB

Start the local MongoDB service. The development database used during implementation was:

```text
mongodb://127.0.0.1:27017/aurelle_beauty
```

### 6.3 Configure the backend

Create the local environment file:

**PowerShell**
```powershell
Copy-Item server/.env.example server/.env
```

**macOS/Linux**
```bash
cp server/.env.example server/.env
```

Open `server/.env` and fill in the values required by `server/.env.example` and the backend configuration. Configure the MongoDB connection, JWT signing secret, server port and Redis connection details.

For local development, the MongoDB URI can be:

```env
MONGO_URI=mongodb://127.0.0.1:27017/aurelle_beauty
```

Use a long, random value for `JWT_SECRET`. Do not commit `server/.env` or share its values.

Install backend dependencies:

```bash
cd server
npm ci
```

### 6.4 Start Redis

From the repository root:

```bash
docker compose up -d redis
docker compose ps
```

Optional Redis check:

```bash
docker exec aurelle-redis redis-cli ping
```

Expected response:

```text
PONG
```

### 6.5 Start the backend API

In a terminal:

```bash
cd server
npm run dev
```

The local API listens on port `5000` unless configured otherwise.

Health endpoint:

```text
http://localhost:5000/api/v1/health
```

### 6.6 Start the order worker

Open a separate terminal:

```bash
cd server
npm run worker
```

Keep this process running when testing background order-event processing.

### 6.7 Configure and start the frontend

Create the frontend environment file:

**PowerShell**
```powershell
Copy-Item client/.env.example client/.env
```

**macOS/Linux**
```bash
cp client/.env.example client/.env
```

Set the API base URL in `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Install dependencies and start the frontend:

```bash
cd client
npm ci
npm run dev
```

Open:

```text
http://localhost:5173
```

### 6.8 Administrator account

Public registration creates customer accounts. To provision an administrator, use the backend seed script:

```bash
cd server
node scripts/seedAdmin.js
```

Configure seed-script values as required by the script and backend environment. Do not expose administrator credentials in the repository.

Admin workspace:

```text
http://localhost:5173/admin
```

---

## 7. REST API Reference

All API routes are prefixed with:

```text
/api/v1
```

Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

Administrator endpoints additionally require the authenticated user to have the `admin` role.

### 7.1 Health

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | API health check |

### 7.2 Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a customer |
| POST | `/auth/login` | Public | Authenticate a user |
| GET | `/auth/me` | Authenticated | Retrieve the current user |

Registration body:

```json
{
  "name": "Auréllé Customer",
  "email": "customer@example.com",
  "password": "ChangeThisPassword123"
}
```

Login body:

```json
{
  "email": "customer@example.com",
  "password": "ChangeThisPassword123"
}
```

Public registration does not permit a caller to assign themselves the administrator role.

### 7.3 Products

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/products` | Public | List active products |
| GET | `/products/:id` | Public | Retrieve product details |
| POST | `/products` | Admin | Create a product |
| PATCH | `/products/:id` | Admin | Update product details |
| DELETE | `/products/:id` | Admin | Deactivate a product (soft delete) |

Supported catalogue query parameters:

| Parameter | Description |
|---|---|
| `page` | Page number |
| `limit` | Requested page size; product endpoint caps it at 50 |
| `search` | Search product name, brand or description |
| `category` | `face`, `eyes`, `lips`, `skincare`, `tools` |
| `brand` | Brand filter |
| `finish` | Finish filter |
| `minPrice` | Minimum price |
| `maxPrice` | Maximum price |
| `inStock` | Set to `true` to return products with available variant stock |
| `sort` | `newest`, `price_asc`, `price_desc`, `name_asc` |

Example product creation request:

```json
{
  "name": "Soft Drama Kajal",
  "slug": "soft-drama-kajal",
  "description": "A richly pigmented, creamy kajal for comfortable everyday definition.",
  "brand": "Aurelle Beauty",
  "category": "eyes",
  "price": 699,
  "compareAtPrice": 849,
  "images": ["https://example.com/soft-drama-kajal.jpg"],
  "variants": [
    {
      "sku": "AUR-EYE-KAJAL-BLK",
      "label": "Midnight Black",
      "shadeHex": "#171313",
      "stock": 25
    },
    {
      "sku": "AUR-EYE-KAJAL-BRN",
      "label": "Espresso Brown",
      "shadeHex": "#4B302A",
      "stock": 18
    }
  ],
  "finish": "matte",
  "ingredients": ["Castor Oil", "Vitamin E", "Candelilla Wax"],
  "tags": ["kajal", "eyeliner", "eyes"],
  "isFeatured": true
}
```

Allowed finish values: `matte`, `dewy`, `satin`, `natural`, `shimmer`, `glossy`, `other`.

A variant requires a unique SKU, a label and a non-negative integer stock quantity. A supplied shade hex value must be a six-digit hexadecimal colour. Product updates are validated against the backend's strict Zod schema. Deactivation is performed through DELETE; `isActive` is not accepted as a product request field by the current validator.

### 7.4 Cart

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/cart` | Authenticated | Retrieve the current user's cart |
| POST | `/cart/items` | Authenticated | Add a product variant |
| PATCH | `/cart/items/:itemId` | Authenticated | Update item quantity |
| DELETE | `/cart/items/:itemId` | Authenticated | Remove a cart item |
| DELETE | `/cart` | Authenticated | Clear the cart |

Add-to-cart body:

```json
{
  "productId": "PRODUCT_OBJECT_ID",
  "variantSku": "AUR-EYE-KAJAL-BLK",
  "quantity": 1
}
```

Quantity update body:

```json
{
  "quantity": 2
}
```

Cart pricing is derived from product data on the backend; the frontend does not decide the authoritative order total.

### 7.5 Orders

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/orders/checkout` | Authenticated | Create an order from the user's cart |
| GET | `/orders/my-orders` | Authenticated | List the current user's orders |
| GET | `/orders/:id` | Owner or Admin | Retrieve an order |
| GET | `/orders/admin/all` | Admin | List/filter all orders |
| PATCH | `/orders/admin/:id/status` | Admin | Advance an order's fulfilment status |

Checkout uses the authenticated user's server-side cart. The frontend submits shipping details and the COD payment method; the backend validates the request, checks stock, calculates prices, creates the order and clears the cart after successful order creation.

Order-status request example:

```json
{
  "orderStatus": "confirmed"
}
```

Supported transitions:

```text
pending → confirmed → processing → shipped → delivered
```

Invalid state transitions are rejected by the backend.

---

## 8. Order Processing and Inventory

### Server-side pricing
The backend uses product and variant information from MongoDB to calculate line totals, subtotal, shipping and final order total. The browser does not supply an authoritative total.

### Inventory updates
Checkout verifies that the requested variant has sufficient stock and uses a conditional stock update so a request cannot decrement a variant that no longer has the requested quantity.

The checkout service also attempts compensating stock restoration if a later operation fails during the request.

### Order event processing
The order queue is backed by Redis and BullMQ. The API enqueues an `order.created` event after order creation. The worker consumes queued events and writes event records to the `OrderEvent` collection.

The event identifier is unique, and the worker uses an insert-if-absent pattern to avoid duplicate event records.

Check processed events:

```bash
cd server
node scripts/checkOrderEvents.js
```

Run the worker in a separate terminal while testing order creation.

---

## 9. Testing

The backend test suite uses Jest and Supertest.

### Test database isolation

Integration tests use a separate database:

```text
aurelle_beauty_test
```

The test setup uses `TEST_MONGO_URI` when configured and otherwise falls back to the test database URI defined in the test setup. Tests must not be run against the development database.

Ensure MongoDB is running before executing integration tests.

### Run all backend tests

```bash
cd server
npm test -- --runInBand --detectOpenHandles
```

Run unit tests:

```bash
npm test -- --runInBand tests/unit
```

Run integration tests:

```bash
npm test -- --runInBand tests/integration
```

### Run frontend checks

```bash
cd client
npm run lint
npm run build
```

### Test results recorded during development

The backend test suite completed successfully with:

```text
Test Suites: 6 passed, 6 total
Tests:       33 passed, 33 total
Snapshots:   0 total
```

The suite comprised unit tests and integration tests for authentication, products, cart and orders.

Frontend ESLint and the Vite production build were also run successfully during local integration. Rerun the commands above on the final checkout to verify the current working tree.

---

## 10. CI Pipeline

The GitHub Actions workflow is located at:

```text
.github/workflows/ci.yml
```

It runs on pushes, pull requests and manual workflow dispatches.

The workflow provisions MongoDB and Redis service containers, sets up Node.js 22.x, and performs these checks:

1. Checks out the repository.
2. Sets up Node.js.
3. Installs backend dependencies using `npm ci`.
4. Runs backend tests.
5. Installs frontend dependencies using `npm ci`.
6. Runs frontend ESLint.
7. Builds the frontend using Vite.

### Recorded CI status

The initial GitHub Actions workflow run for commit `af1d210` completed successfully on branch `main`.

This is a **Continuous Integration** workflow. It validates tests, linting and the frontend build; it does not deploy the application.

Repository:

```text
https://github.com/aisha-noor832/aurelle-beauty
```

---

## 11. Assumptions and Limitations

- Checkout supports **Cash on Delivery**. No Razorpay, Stripe or other online payment gateway is integrated.
- Cloud/production deployment is not part of this submission.
- Product images are represented by image URLs. A dedicated image-upload service or cloud media storage is not included.
- The newsletter form is a frontend interaction; it is not connected to an email marketing service.
- Saved-item/heart controls are presentation-level interactions and are not persisted as a server-side wishlist.
- Order-event processing is asynchronous through Redis/BullMQ. The current implementation does not use a transactional outbox; if the process fails after the order is saved but before the event is successfully enqueued, event delivery is not guaranteed.
- Stock updates use conditional updates and request-level compensation, but checkout is not a crash-proof multi-document MongoDB transaction. A process or machine failure between database operations may require reconciliation.
- The admin dashboard's overview figures are based on the records returned by its current API requests; they are operational indicators, not a full accounting or analytics report.
- The CI workflow is not a deployment pipeline.
- Secrets and local environment files must remain outside Git. Use `.env.example` files as templates and provide real values only in local `.env` files.

---

## 12. Security Notes

- Passwords are hashed before persistence.
- JWTs are required for authenticated operations.
- Administrative routes enforce role-based authorization.
- Product and checkout payloads are validated on the backend.
- Order ownership is checked by the server.
- Database connection strings, JWT secrets and other credentials must never be committed.
- The frontend must not be treated as a security boundary; authorization and price/stock validation are enforced by the backend.

---

## 13. Quick Command Reference

Start Redis:

```bash
docker compose up -d redis
```

Start API:

```bash
cd server
npm run dev
```

Start worker (separate terminal):

```bash
cd server
npm run worker
```

Start frontend:

```bash
cd client
npm run dev
```

Run backend tests:

```bash
cd server
npm test -- --runInBand --detectOpenHandles
```

Run frontend checks:

```bash
cd client
npm run lint
npm run build
```

Inspect processed order events:

```bash
cd server
node scripts/checkOrderEvents.js
```

---

## 14. Conclusion

Auréllé Beauty demonstrates a full-stack e-commerce workflow with customer authentication, product discovery, variant-aware cart management, server-side checkout and inventory handling, order history, administrator catalogue management, order fulfilment, background order-event processing, automated tests and continuous integration.

The implementation focuses on the E-Commerce Order & Inventory use case, with attention to REST API design, validation, role-based access, inventory consistency, asynchronous messaging and maintainable project structure.
