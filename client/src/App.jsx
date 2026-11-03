import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './HomePage'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { CartProvider } from './context/CartContext'
import {
  AccountPage,
  CartPage,
  CheckoutPage,
  LoginPage,
  OrderPage,
  ProductPage,
  RegisterPage,
  ShopPage,
} from './pages/StorePages'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <div className="route-loading"><span className="store-loader" />Opening your Auréllé space…</div>
  }
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/products/:id" element={<ProductPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
      <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
      <Route path="/orders/:id" element={<RequireAuth><OrderPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
