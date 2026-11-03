AURÉLLÉ BEAUTY — FRONTEND STORE INTEGRATION

This bundle replaces/adds files under your existing client/ folder.

WHAT IS INCLUDED
- Your editorial homepage, updated to load real products from GET /api/v1/products when the API is available.
- API client with bearer-token attachment and friendly error messages.
- Auth context using:
  POST /api/v1/auth/register
  POST /api/v1/auth/login
  GET  /api/v1/auth/me
- Live catalogue using GET /api/v1/products (search/category filters and paging).
- Product detail using GET /api/v1/products/:id.
- Cart using GET /api/v1/cart, POST /api/v1/cart/items,
  PATCH /api/v1/cart/items/:itemId, DELETE /api/v1/cart/items/:itemId,
  DELETE /api/v1/cart.
- Checkout using POST /api/v1/orders/checkout with shippingAddress + paymentMethod=cod.
- Account order list using GET /api/v1/orders/my-orders.
- Order confirmation/detail using GET /api/v1/orders/:id.

INSTALL
1) Copy the contents of client/src/ from this bundle into your existing
   D:\Enterprise_Project\aurelle-beauty\client\src\ folder, replacing files when prompted.
2) Copy client/.env.example to client/.env (or create client/.env yourself).
3) In client/.env, set:
   VITE_API_URL=http://localhost:5000/api/v1

RUN LOCALLY
Terminal 1:
  cd D:\Enterprise_Project\aurelle-beauty\server
  npm run dev

Terminal 2 (Redis worker, if testing background events):
  cd D:\Enterprise_Project\aurelle-beauty\server
  npm run worker

Terminal 3:
  cd D:\Enterprise_Project\aurelle-beauty\client
  npm run dev

Open http://localhost:5173

IMPORTANT
- Cash on Delivery is the only checkout method exposed. Online payments are not implemented.
- A login is required to use the server-side cart and checkout.
- Product cards now load from the real catalogue. An empty catalogue will correctly show an empty state; add products with the existing admin API.
- The frontend does not create admin accounts or expose admin-only management controls.
- Existing backend routes are not changed.
- The checkout body uses { shippingAddress, paymentMethod: "cod" } with the address keys
  recipientName, phone, addressLine1, addressLine2, city, state, postalCode, country.
- If the server's Zod checkout validator expects a different field structure, use its validation response as source of truth and adjust only CheckoutPage submit payload.
- Add client/.env.example to Git; do not commit client/.env.


LINT FOLLOW-UP
The context providers and hooks are split into separate files so the React
Fast Refresh rule is satisfied. Async session/cart/product loading is handled
in request callbacks rather than synchronous state updates in effect bodies.
Errors rethrown with user-facing messages retain their original error via
Error.cause.
