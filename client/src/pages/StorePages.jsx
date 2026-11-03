import { useCallback, useEffect, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Heart,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import { api, formatPrice, getApiError } from '../api/client'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'

const categoryOptions = [
  { value: '', label: 'All categories' },
  { value: 'face', label: 'Face' },
  { value: 'eyes', label: 'Eyes' },
  { value: 'lips', label: 'Lips' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'tools', label: 'Tools' },
]

function StoreHeader() {
  const { user } = useAuth()
  const { itemCount } = useCart()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const submitSearch = (event) => {
    event.preventDefault()
    navigate(`/shop${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return (
    <>
      <div className="announcement-bar">
        <span>Complimentary shipping on orders above ₹1,499</span>
        <span className="announcement-bar__dot">✳</span>
        <span>A little luxury, delivered to you</span>
      </div>
      <header className="store-header">
        <Link className="brand-mark" to="/" aria-label="Auréllé Beauty home">
          <span className="brand-mark__name">Auréllé</span>
          <span className="brand-mark__sub">BEAUTY, IN YOUR LIGHT</span>
        </Link>

        <form className="store-header__search" onSubmit={submitSearch}>
          <Search size={16} />
          <input
            aria-label="Search products"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the edit"
          />
        </form>

        <nav className="store-header__nav" aria-label="Store navigation">
          <Link to="/shop">Shop</Link>
          <Link to="/shop?category=face">Face</Link>
          <Link to="/shop?category=lips">Lips</Link>
          <Link to="/shop?category=skincare">Skincare</Link>
        </nav>

        <div className="store-header__actions">
          <Link className="icon-button" to={user ? '/account' : '/login'} aria-label={user ? 'My account' : 'Sign in'}>
            <UserRound size={18} />
          </Link>
          <Link className="icon-button store-bag-link" to="/cart" aria-label={`Shopping bag with ${itemCount} items`}>
            <ShoppingBag size={18} />
            <span>{itemCount}</span>
          </Link>
        </div>
      </header>
    </>
  )
}

function PageFrame({ children }) {
  return (
    <div className="store-page">
      <StoreHeader />
      {children}
      <footer className="store-simple-footer">
        <Link className="brand-mark" to="/">
          <span className="brand-mark__name">Auréllé</span>
          <span className="brand-mark__sub">BEAUTY, IN YOUR LIGHT</span>
        </Link>
        <span>© {new Date().getFullYear()} Auréllé Beauty · Made with care, in India.</span>
      </footer>
    </div>
  )
}

function ErrorNotice({ children }) {
  if (!children) return null
  return <div className="store-error" role="alert">{children}</div>
}

function LoadingState({ label = 'Curating your experience…' }) {
  return (
    <div className="store-loading" role="status">
      <span className="store-loader" />
      <span>{label}</span>
    </div>
  )
}

function ProductCard({ product }) {
  const image = product.images?.[0]
  const [saved, setSaved] = useState(false)

  return (
    <article className="catalog-card">
      <Link className="catalog-card__image" to={`/products/${product._id}`}>
        {image ? <img src={image} alt={product.name} loading="lazy" /> : <div className="catalog-image-fallback">Auréllé</div>}
        {product.isFeatured && <span className="catalog-card__badge">Featured</span>}
      </Link>
      <button
        className={`catalog-card__save ${saved ? 'is-saved' : ''}`}
        type="button"
        aria-label={saved ? `Unsave ${product.name}` : `Save ${product.name}`}
        aria-pressed={saved}
        onClick={() => setSaved((value) => !value)}
      >
        <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
      </button>
      <div className="catalog-card__info">
        <div>
          <span className="catalog-card__category">{product.category}</span>
          <Link to={`/products/${product._id}`}><h3>{product.name}</h3></Link>
          <p>{product.finish ? `${product.finish} finish` : product.brand || 'Auréllé Beauty'}</p>
        </div>
        <strong>{formatPrice(product.price)}</strong>
      </div>
    </article>
  )
}

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState('')

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page: 1, limit: 48 }
      if (search.trim()) params.search = search.trim()
      if (category) params.category = category

      const response = await api.get('/products', { params })
      let nextProducts = Array.isArray(response.data?.data) ? response.data.data : []
      if (sort === 'price_asc') nextProducts = [...nextProducts].sort((a, b) => a.price - b.price)
      if (sort === 'price_desc') nextProducts = [...nextProducts].sort((a, b) => b.price - a.price)
      if (sort === 'newest') nextProducts = [...nextProducts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setProducts(nextProducts)
      setPagination(response.data?.pagination ?? null)
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not load the catalogue.'))
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [search, category, sort])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 250)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const updateSearchParams = (nextSearch, nextCategory) => {
    const next = {}
    if (nextSearch.trim()) next.search = nextSearch.trim()
    if (nextCategory) next.category = nextCategory
    setSearchParams(next)
  }

  return (
    <PageFrame>
      <main className="store-main">
        <div className="store-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Shop all</span></div>
        <section className="catalog-intro">
          <span className="eyebrow">The Auréllé edit</span>
          <h1>Find your <em>everyday</em> favourite.</h1>
          <p>Considered essentials, expressive colour and textures made to feel like you.</p>
        </section>

        <section className="catalog-toolbar" aria-label="Product filters">
          <label className="catalog-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Search products"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                updateSearchParams(event.target.value, category)
              }}
            />
          </label>
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              updateSearchParams(search, event.target.value)
            }}
          >
            {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="">Recommended</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
          {pagination && <span className="catalog-result-count">{pagination.total} pieces</span>}
        </section>

        <ErrorNotice>{error}</ErrorNotice>
        {loading ? <LoadingState label="Finding your favourites…" /> : (
          products.length ? (
            <div className="catalog-grid">
              {products.map((product) => <ProductCard product={product} key={product._id} />)}
            </div>
          ) : (
            <div className="catalog-empty">
              <span className="eyebrow">A little quiet here</span>
              <h2>No products found just yet.</h2>
              <p>Try another search or choose a different category.</p>
              <button
                className="button button--dark"
                type="button"
                onClick={() => {
                  setSearch('')
                  setCategory('')
                  setSearchParams({})
                }}
              >
                Clear filters <X size={15} />
              </button>
            </div>
          )
        )}
      </main>
    </PageFrame>
  )
}

export function ProductPage() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const { addToCart, busy } = useCart()
  const navigate = useNavigate()
  const [resource, setResource] = useState({ id: null, loading: true, product: null, error: '' })
  const [selectedVariant, setSelectedVariant] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    api.get(`/products/${id}`)
      .then((response) => {
        if (!active) return
        const item = response.data?.data?.product ?? response.data?.data
        setResource({ id, loading: false, product: item, error: '' })
        setSelectedVariant(item?.variants?.[0]?.sku || '')
      })
      .catch((requestError) => {
        if (active) {
          setResource({
            id,
            loading: false,
            product: null,
            error: getApiError(requestError, 'We could not find this product.'),
          })
        }
      })
    return () => { active = false }
  }, [id])

  const loading = resource.id !== id || resource.loading
  const product = resource.id === id ? resource.product : null
  const pageError = resource.id === id ? resource.error : ''
  const variant = product?.variants?.find((item) => item.sku === selectedVariant)
  const availableStock = variant?.stock ?? 0

  const handleAdd = async () => {
    setError('')
    setNotice('')
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${id}` } })
      return
    }
    if (!selectedVariant) {
      setError('Please choose a shade before adding this product to your bag.')
      return
    }
    try {
      await addToCart(product._id, selectedVariant, quantity)
      setNotice('Added to your bag.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (loading) return <PageFrame><LoadingState label="Opening the product…" /></PageFrame>
  if (pageError && !product) return <PageFrame><div className="store-main"><ErrorNotice>{pageError}</ErrorNotice><Link className="text-link" to="/shop">Back to shop <ArrowRight size={15} /></Link></div></PageFrame>
  if (!product) return null

  return (
    <PageFrame>
      <main className="store-main">
        <div className="store-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/shop">Shop</Link><span>/</span><span>{product.name}</span></div>
        <section className="product-detail">
          <div className="product-detail__visual">
            {product.images?.[0]
              ? <img src={product.images[0]} alt={product.name} />
              : <div className="catalog-image-fallback">Auréllé</div>}
            {product.images?.length > 1 && (
              <div className="product-detail__thumbs">
                {product.images.slice(1).map((image) => <img src={image} alt="" key={image} />)}
              </div>
            )}
          </div>
          <div className="product-detail__copy">
            <span className="eyebrow">{product.brand || 'Auréllé Beauty'} · {product.category}</span>
            <h1>{product.name}</h1>
            <div className="product-detail__price">
              <strong>{formatPrice(product.price)}</strong>
              {product.compareAtPrice > product.price && <del>{formatPrice(product.compareAtPrice)}</del>}
            </div>
            <p className="product-detail__description">{product.description}</p>

            {product.variants?.length > 0 && (
              <div className="variant-picker">
                <div className="variant-picker__heading">
                  <span>Choose your shade</span>
                  <strong>{variant?.label || 'Select a shade'}</strong>
                </div>
                <div className="variant-picker__options">
                  {product.variants.map((item) => (
                    <button
                      className={`shade-option ${selectedVariant === item.sku ? 'is-selected' : ''}`}
                      type="button"
                      key={item.sku}
                      title={`${item.label} — ${item.stock} available`}
                      aria-label={`Choose ${item.label}`}
                      aria-pressed={selectedVariant === item.sku}
                      onClick={() => setSelectedVariant(item.sku)}
                      disabled={item.stock <= 0}
                    >
                      <span style={{ backgroundColor: item.shadeHex || '#c9a79a' }} />
                    </button>
                  ))}
                </div>
                {variant && <p className="variant-stock">{availableStock > 0 ? `${availableStock} available` : 'Currently out of stock'}</p>}
              </div>
            )}

            <div className="product-detail__buy-row">
              <div className="quantity-control">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                <span>{quantity}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(Math.max(availableStock, 1), value + 1))}>+</button>
              </div>
              <button className="button button--dark product-add-button" type="button" onClick={handleAdd} disabled={busy || (variant && availableStock <= 0)}>
                {busy ? 'Adding…' : 'Add to bag'} <ShoppingBag size={16} />
              </button>
            </div>
            <ErrorNotice>{error}</ErrorNotice>
            {notice && <p className="store-success" role="status">{notice}</p>}

            <div className="product-detail__meta">
              {product.finish && <p><span>Finish</span>{product.finish}</p>}
              {product.skinTypes?.length > 0 && <p><span>Skin types</span>{product.skinTypes.join(', ')}</p>}
              {product.ingredients?.length > 0 && <p><span>Key ingredients</span>{product.ingredients.join(', ')}</p>}
            </div>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}

export function CartPage() {
  const { isAuthenticated } = useAuth()
  const { cart, items, loading, busy, updateCartItem, removeCartItem } = useCart()
  const [error, setError] = useState('')

  const changeQuantity = async (item, nextQuantity) => {
    setError('')
    try {
      if (nextQuantity < 1) await removeCartItem(item.itemId)
      else await updateCartItem(item.itemId, nextQuantity)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (!isAuthenticated) {
    return <PageFrame><main className="store-main"><div className="catalog-empty"><span className="eyebrow">Your Auréllé bag</span><h1>Sign in to see your bag.</h1><p>Your selected pieces will be waiting when you sign in.</p><Link className="button button--dark" to="/login">Sign in <ArrowRight size={15} /></Link></div></main></PageFrame>
  }

  return (
    <PageFrame>
      <main className="store-main">
        <div className="store-breadcrumb"><Link to="/">Home</Link><span>/</span><span>Your bag</span></div>
        <section className="cart-page-heading">
          <span className="eyebrow">The lovely things</span>
          <h1>Your <em>bag.</em></h1>
          <p>{cart.totalItems || 0} item{cart.totalItems === 1 ? '' : 's'} selected</p>
        </section>
        <ErrorNotice>{error}</ErrorNotice>
        {loading ? <LoadingState label="Opening your bag…" /> : items.length === 0 ? (
          <div className="catalog-empty">
            <div className="bag-empty__icon"><ShoppingBag size={25} /></div>
            <h2>Your bag is taking a little breather.</h2>
            <p>Find something lovely and it will show up here.</p>
            <Link className="button button--dark" to="/shop">Explore the edit <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map((item) => (
                <article className="cart-line" key={item.itemId}>
                  <div className="cart-line__image">
                    {item.product?.image && <img src={item.product.image} alt={item.product.name} />}
                  </div>
                  <div className="cart-line__details">
                    <span className="catalog-card__category">{item.product?.category || 'Auréllé Beauty'}</span>
                    <h3>{item.product?.name || 'Beauty essential'}</h3>
                    <p>{item.variantLabel || item.variantSku}</p>
                    <span className="cart-line__unit">{formatPrice(item.unitPrice)} each</span>
                    {!item.available && <span className="store-error">This shade is currently unavailable.</span>}
                  </div>
                  <div className="cart-line__actions">
                    <div className="quantity-control">
                      <button type="button" onClick={() => changeQuantity(item, item.quantity - 1)} disabled={busy} aria-label="Decrease quantity">−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => changeQuantity(item, item.quantity + 1)} disabled={busy || item.quantity >= item.availableStock} aria-label="Increase quantity">+</button>
                    </div>
                    <strong>{formatPrice(item.lineTotal)}</strong>
                    <button className="cart-remove" type="button" onClick={() => changeQuantity(item, 0)} disabled={busy}>Remove</button>
                  </div>
                </article>
              ))}
            </div>
            <aside className="cart-summary">
              <span className="eyebrow">A little summary</span>
              <h2>Order total</h2>
              <div><span>Subtotal</span><strong>{formatPrice(cart.subtotal)}</strong></div>
              <div><span>Shipping</span><span>Calculated at checkout</span></div>
              <p>Shipping and final total are calculated securely by the store when you place your order.</p>
              <Link className="button button--dark cart-checkout-button" to="/checkout">Continue to checkout <ArrowRight size={15} /></Link>
              <Link className="cart-continue" to="/shop">Continue shopping</Link>
            </aside>
          </div>
        )}
      </main>
    </PageFrame>
  )
}

const emptyAddress = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
}

export function CheckoutPage() {
  const { isAuthenticated } = useAuth()
  const { cart, items, refreshCart } = useCart()
  const navigate = useNavigate()
  const [address, setAddress] = useState(emptyAddress)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { refreshCart().catch(() => {}) }, [refreshCart])

  const updateField = (event) => {
    const { name, value } = event.target
    setAddress((current) => ({ ...current, [name]: value }))
  }

  const submitOrder = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await api.post('/orders/checkout', {
        shippingAddress: address,
        paymentMethod: 'cod',
      })
      const order = response.data?.data?.order ?? response.data?.data
      await refreshCart().catch(() => {})
      navigate(order?._id ? `/orders/${order._id}` : '/account', {
        state: { orderNumber: order?.orderNumber },
      })
    } catch (requestError) {
      setError(getApiError(requestError, 'We could not place your order.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: '/checkout' }} />

  if (!items.length) {
    return <PageFrame><main className="store-main"><div className="catalog-empty"><h1>Your bag is empty.</h1><Link className="button button--dark" to="/shop">Explore the edit <ArrowRight size={15} /></Link></div></main></PageFrame>
  }

  return (
    <PageFrame>
      <main className="store-main">
        <div className="store-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to="/cart">Your bag</Link><span>/</span><span>Checkout</span></div>
        <section className="cart-page-heading">
          <span className="eyebrow">Almost yours</span>
          <h1>Delivery <em>details.</em></h1>
          <p>Tell us where to send your Auréllé favourites.</p>
        </section>

        <form className="checkout-layout" onSubmit={submitOrder}>
          <div className="checkout-form">
            <span className="form-section-title">Shipping address</span>
            <div className="form-grid">
              <label className="form-field form-field--full">Full name<input name="recipientName" value={address.recipientName} onChange={updateField} required minLength={2} /></label>
              <label className="form-field">Phone number<input name="phone" type="tel" value={address.phone} onChange={updateField} required pattern="[0-9+ ()-]{8,18}" /></label>
              <label className="form-field">Postal code<input name="postalCode" value={address.postalCode} onChange={updateField} required /></label>
              <label className="form-field form-field--full">Address line 1<input name="addressLine1" value={address.addressLine1} onChange={updateField} required /></label>
              <label className="form-field form-field--full">Address line 2 <span className="field-optional">Optional</span><input name="addressLine2" value={address.addressLine2} onChange={updateField} /></label>
              <label className="form-field">City<input name="city" value={address.city} onChange={updateField} required /></label>
              <label className="form-field">State<input name="state" value={address.state} onChange={updateField} required /></label>
              <label className="form-field form-field--full">Country<input name="country" value={address.country} onChange={updateField} required /></label>
            </div>
            <div className="payment-choice">
              <span className="form-section-title">Payment method</span>
              <label><input type="radio" checked readOnly /> <span><strong>Cash on Delivery</strong><small>Pay when your order arrives.</small></span></label>
              <p>Online payment will be available after a payment gateway is integrated.</p>
            </div>
            <ErrorNotice>{error}</ErrorNotice>
            <button className="button button--dark checkout-submit" type="submit" disabled={submitting}>
              {submitting ? 'Placing your order…' : 'Place COD order'} <ArrowRight size={16} />
            </button>
          </div>

          <aside className="cart-summary checkout-summary">
            <span className="eyebrow">Your selection</span>
            <h2>Order summary</h2>
            {items.map((item) => (
              <div className="checkout-summary__item" key={item.itemId}>
                <span>{item.quantity} × {item.product?.name} <small>{item.variantLabel}</small></span>
                <strong>{formatPrice(item.lineTotal)}</strong>
              </div>
            ))}
            <div className="checkout-summary__total"><span>Current subtotal</span><strong>{formatPrice(cart.subtotal)}</strong></div>
            <p>Shipping, discount eligibility and final total are calculated by the server when your order is placed.</p>
          </aside>
        </form>
      </main>
    </PageFrame>
  )
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { user, login, register, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/account'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true })
  }, [user, loading, navigate, redirectTo])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let destination = redirectTo

      if (isRegister) {
        const result = await register(name, email, password)

        if (!result.authenticated) {
          navigate('/login', {
            replace: true,
            state: { registered: true },
          })
          return
        }

        destination = location.state?.from || '/account'
      } else {
        const signedInUser = await login(email, password)

        if (!location.state?.from) {
          destination = signedInUser?.role === 'admin'
            ? '/admin'
            : '/account'
        }
      }

      navigate(destination, { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageFrame>
      <main className="auth-page">
        <div className="auth-card">
          <span className="eyebrow">{isRegister ? 'A little more personal' : 'Welcome back'}</span>
          <h1>{isRegister ? 'Join our little world.' : 'Lovely to see you.'}</h1>
          <p>{isRegister ? 'Create an account to keep your favourites close.' : 'Sign in to see your bag and your orders.'}</p>
          {location.state?.registered && <p className="store-success">Account created. Please sign in to continue.</p>}
          <form onSubmit={submit}>
            {isRegister && <label className="form-field">Your name<input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="name" /></label>}
            <label className="form-field">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            <label className="form-field">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} /></label>
            <ErrorNotice>{error}</ErrorNotice>
            <button className="button button--dark auth-submit" type="submit" disabled={submitting}>
              {submitting ? 'One moment…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={15} />
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? 'Already part of Auréllé?' : 'New to Auréllé?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
          </p>
        </div>
      </main>
    </PageFrame>
  )
}

export function LoginPage() {
  return <AuthPage mode="login" />
}

export function RegisterPage() {
  return <AuthPage mode="register" />
}

export function AccountPage() {
  const { user, logout, loading } = useAuth()
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/orders/my-orders', { params: { page: 1, limit: 10 } })
      .then((response) => {
        if (active) setOrders(Array.isArray(response.data?.data) ? response.data.data : [])
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError, 'Unable to load your orders.'))
      })
      .finally(() => {
        if (active) setOrdersLoading(false)
      })
    return () => { active = false }
  }, [])

  if (loading) return <PageFrame><LoadingState /></PageFrame>
  if (!user) return <Navigate to="/login" replace />

  return (
    <PageFrame>
      <main className="store-main account-page">
        <div className="account-heading">
          <div><span className="eyebrow">Your Auréllé space</span><h1>Hello, <em>{user.name || 'there'}.</em></h1><p>{user.email}</p></div>
          <button className="button button--outline" type="button" onClick={logout}>Sign out</button>
        </div>
        <div className="account-section-heading"><h2>Your orders</h2><span>{orders.length} recent</span></div>
        <ErrorNotice>{error}</ErrorNotice>
        {ordersLoading ? <LoadingState label="Finding your orders…" /> : orders.length ? (
          <div className="order-list">
            {orders.map((order) => (
              <Link className="order-row" to={`/orders/${order._id}`} key={order._id}>
                <div><span className="eyebrow">{order.orderNumber}</span><strong>{new Date(order.createdAt).toLocaleDateString('en-IN')}</strong></div>
                <div><span>{order.items?.length || 0} line item(s)</span><strong>{formatPrice(order.total)}</strong></div>
                <span className={`order-status order-status--${order.orderStatus}`}>{order.orderStatus}</span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="catalog-empty"><h2>No orders yet.</h2><p>Your next favourite might be just around the corner.</p><Link to="/shop" className="button button--dark">Explore the edit <ArrowRight size={15} /></Link></div>
        )}
      </main>
    </PageFrame>
  )
}

export function OrderPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get(`/orders/${id}`)
      .then((response) => {
        if (active) setOrder(response.data?.data?.order ?? response.data?.data)
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError, 'Unable to load this order.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [id])

  return (
    <PageFrame>
      <main className="store-main">
        {loading ? <LoadingState label="Finding your order…" /> : error ? <ErrorNotice>{error}</ErrorNotice> : order && (
          <section className="order-confirmation">
            <span className="order-confirmation__mark">✓</span>
            <span className="eyebrow">Your order is in</span>
            <h1>Thank you for choosing <em>Auréllé.</em></h1>
            <p>We’ve received your order. Keep this number close:</p>
            <strong className="order-number">{order.orderNumber}</strong>
            <div className="order-confirmation__summary">
              <div><span>Order status</span><strong>{order.orderStatus}</strong></div>
              <div><span>Payment</span><strong>Cash on Delivery</strong></div>
              <div><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
            </div>
            <div className="order-confirmation__actions">
              <Link className="button button--dark" to="/account">View my orders <ArrowRight size={15} /></Link>
              <Link className="text-link" to="/shop">Continue shopping</Link>
            </div>
          </section>
        )}
      </main>
    </PageFrame>
  )
}
