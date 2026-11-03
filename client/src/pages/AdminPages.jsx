import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react'
import { api, formatPrice, getApiError } from '../api/client'
import { useAuth } from '../context/useAuth'
import { useCart } from '../context/useCart'
import './Admin.css'

const ORDER_TRANSITIONS = {
  pending: 'confirmed',
  confirmed: 'processing',
  processing: 'shipped',
  shipped: 'delivered',
}

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
]

const CATEGORIES = ['face', 'eyes', 'lips', 'skincare', 'tools']

function AdminError({ children }) {
  if (!children) return null
  return <div className="admin-error" role="alert">{children}</div>
}

function AdminLoading() {
  return (
    <div className="admin-loading">
      <span className="store-loader" />
      Loading your workspace…
    </div>
  )
}

function AdminLayout() {
  const { user, logout } = useAuth()
  const { refreshCart } = useCart()

  const handleLogout = () => {
    logout()
    refreshCart().catch(() => {})
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <span>Auréllé</span>
          <small>BEAUTY ADMIN</small>
        </Link>

        <div className="admin-profile">
          <div className="admin-avatar">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user?.name || 'Administrator'}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <span className="admin-nav-label">WORKSPACE</span>

        <nav className="admin-nav">
          <NavLink to="/admin" end>
            <LayoutDashboard size={17} />
            Overview
          </NavLink>
          <NavLink to="/admin/products">
            <Box size={17} />
            Products
          </NavLink>
          <NavLink to="/admin/orders">
            <ClipboardList size={17} />
            Orders
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <Link to="/" className="admin-store-link">
            <ArrowLeft size={16} />
            Back to storefront
          </Link>
          <button type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-kicker">AURÉLLÉ BEAUTY</span>
            <span className="admin-topbar-title">Management workspace</span>
          </div>
          <span className="admin-role-badge">Administrator</span>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, note, icon: Icon }) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-top">
        <span>{label}</span>
        <span className="admin-stat-icon"><Icon size={18} /></span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

function AdminOverview() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadOverview = useCallback(() => {
    // setLoading(true)
    // setError('')

    const productRequest = api.get('/products', {
      params: { page: 1, limit: 30 },
    })

    const orderRequest = api.get('/orders/admin/all', {
      params: { page: 1, limit: 20 },
    })

    Promise.all([productRequest, orderRequest])
      .then(([productResponse, orderResponse]) => {
        setProducts(
          Array.isArray(productResponse.data?.data)
            ? productResponse.data.data
            : [],
        )
        setOrders(
          Array.isArray(orderResponse.data?.data)
            ? orderResponse.data.data
            : [],
        )
      })
      .catch((requestError) => {
        setError(getApiError(requestError, 'Unable to load dashboard data.'))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  const metrics = useMemo(() => {
    const pendingOrders = orders.filter(
      (order) => order.orderStatus === 'pending',
    ).length

    const paidValue = orders
      .filter((order) => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + Number(order.total || 0), 0)

    const orderValue = orders.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0,
    )

    const lowStock = products.filter((product) => {
      const stock = (product.variants || []).reduce(
        (sum, variant) => sum + Number(variant.stock || 0),
        0,
      )
      return stock > 0 && stock <= 10
    }).length

    return {
      productCount: products.length,
      orderCount: orders.length,
      pendingOrders,
      paidValue,
      orderValue,
      lowStock,
    }
  }, [products, orders])

  if (loading) return <AdminLoading />

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">YOUR BUSINESS AT A GLANCE</span>
          <h1>Good day, <em>Auréllé.</em></h1>
          <p>Here's what's happening in your beauty store.</p>
        </div>
        <button
          className="admin-secondary-button"
          type="button"
          onClick={() => {
  setLoading(true)
  setError('')
  loadOverview()
}}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <AdminError>{error}</AdminError>

      <div className="admin-stat-grid">
        <StatCard
          label="Catalogue products"
          value={metrics.productCount}
          note="Products returned by the catalogue API"
          icon={Box}
        />
        <StatCard
          label="Total orders"
          value={metrics.orderCount}
          note="Recent orders loaded"
          icon={ShoppingBag}
        />
        <StatCard
          label="Awaiting confirmation"
          value={metrics.pendingOrders}
          note="Orders that need attention"
          icon={ClipboardList}
        />
        <StatCard
          label="Low stock products"
          value={metrics.lowStock}
          note="Combined variant stock at 10 or below"
          icon={TrendingUp}
        />
      </div>

      <div className="admin-overview-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="eyebrow">FULFILMENT</span>
              <h2>Recent orders</h2>
            </div>
            <Link to="/admin/orders" className="admin-inline-link">
              All orders <ArrowUpRight size={15} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <p className="admin-muted">No orders have been placed yet.</p>
          ) : (
            <div className="admin-recent-orders">
              {orders.slice(0, 6).map((order) => (
                <div className="admin-recent-order" key={order._id}>
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.user?.name || 'Customer'}</span>
                  </div>
                  <div>
                    <strong>{formatPrice(order.total)}</strong>
                    <span className={`admin-status admin-status--${order.orderStatus}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel admin-business-panel">
          <span className="eyebrow">BUSINESS SNAPSHOT</span>
          <h2>Order value</h2>
          <strong className="admin-large-value">
            {formatPrice(metrics.orderValue)}
          </strong>
          <p>
            Total value of the orders loaded. This includes pending and
            unpaid orders; it is not recognised revenue.
          </p>
          <div className="admin-value-divider" />
          <span className="eyebrow">CAPTURED PAYMENTS</span>
          <strong className="admin-paid-value">
            {formatPrice(metrics.paidValue)}
          </strong>
          <p>Orders whose payment status is recorded as paid.</p>
        </section>
      </div>

      <div className="admin-quick-actions">
        <Link to="/admin/products" className="admin-quick-action">
          <PackagePlus size={20} />
          <span>
            <strong>Manage catalogue</strong>
            <small>Add products and update inventory</small>
          </span>
          <ArrowUpRight size={17} />
        </Link>
        <Link to="/admin/orders" className="admin-quick-action">
          <ClipboardList size={20} />
          <span>
            <strong>Process orders</strong>
            <small>Review and update fulfilment</small>
          </span>
          <ArrowUpRight size={17} />
        </Link>
      </div>
    </section>
  )
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function createEmptyProduct() {
  return {
    name: '',
    slug: '',
    description: '',
    brand: 'Aurelle Beauty',
    category: 'lips',
    price: '',
    compareAtPrice: '',
    imagesText: '',
    variants: [{ sku: '', label: '', shadeHex: '#A83245', stock: 0 }],
    skinTypesText: '',
    finish: '',
    ingredientsText: '',
    tagsText: '',
    isFeatured: false,
    isActive: true,
  }
}

function productToForm(product) {
  return {
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    brand: product.brand || 'Aurelle Beauty',
    category: product.category || 'lips',
    price: String(product.price ?? ''),
    compareAtPrice: String(product.compareAtPrice ?? ''),
    imagesText: (product.images || []).join('\n'),
    variants: (product.variants || []).map((variant) => ({
      sku: variant.sku || '',
      label: variant.label || '',
      shadeHex: variant.shadeHex || '#A83245',
      stock: Number(variant.stock || 0),
    })),
    skinTypesText: (product.skinTypes || []).join(', '),
    finish: product.finish || '',
    ingredientsText: (product.ingredients || []).join(', '),
    tagsText: (product.tags || []).join(', '),
    isFeatured: Boolean(product.isFeatured),
    isActive: product.isActive !== false,
  }
}

function AdminProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState(() => (
    product ? productToForm(product) : createEmptyProduct()
  ))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const updateVariant = (index, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => (
        variantIndex === index
          ? { ...variant, [field]: field === 'stock' ? Number(value) : value }
          : variant
      )),
    }))
  }

  const addVariant = () => {
    setForm((current) => ({
      ...current,
      variants: [
        ...current.variants,
        { sku: '', label: '', shadeHex: '#B96955', stock: 0 },
      ],
    }))
  }

  const removeVariant = (index) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.filter((_, i) => i !== index),
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')

    const variants = form.variants
      .filter((variant) => variant.sku.trim() && variant.label.trim())
      .map((variant) => ({
        sku: variant.sku.trim(),
        label: variant.label.trim(),
        shadeHex: variant.shadeHex,
        stock: Number(variant.stock),
      }))

    if (!variants.length) {
      setError('Add at least one variant with a SKU and shade label.')
      return
    }

    const payload = {
    name: form.name.trim(),
    slug: form.slug.trim() || slugify(form.name),
    description: form.description.trim(),
    brand: form.brand.trim(),
    category: form.category,
    price: Number(form.price),

    images: form.imagesText
        .split('\n')
        .map((image) => image.trim())
        .filter(Boolean),

    variants,

    skinTypes: splitList(form.skinTypesText),

    ingredients: splitList(form.ingredientsText),

    tags: splitList(form.tagsText),

    isFeatured: form.isFeatured,
    }

    // Only send finish when a valid value has been selected.
    if (form.finish.trim()) {
    payload.finish = form.finish.trim()
    }

    if (form.compareAtPrice !== '') {
    payload.compareAtPrice = Number(form.compareAtPrice)
    }

    setSaving(true)

    try {
      if (product?._id) {
        await api.patch(`/products/${product._id}`, payload)
      } else {
        await api.post('/products', payload)
      }
      onSaved()
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to save this product.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        className="admin-product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-form-title"
      >
        <header className="admin-modal-header">
          <div>
            <span className="eyebrow">CATALOGUE MANAGEMENT</span>
            <h2 id="admin-product-form-title">
              {product ? 'Edit product' : 'Add a product'}
            </h2>
          </div>
          <button className="admin-icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form className="admin-product-form" onSubmit={submit}>
          <div className="admin-form-grid">
            <label>
              Product name
              <input name="name" value={form.name} onChange={updateField} required minLength={2} />
            </label>
            <label>
              Slug
              <input
                name="slug"
                value={form.slug}
                onChange={updateField}
                placeholder={slugify(form.name) || 'product-slug'}
              />
            </label>
            <label className="admin-form-full">
              Description
              <textarea name="description" value={form.description} onChange={updateField} required rows={3} />
            </label>
            <label>
              Brand
              <input name="brand" value={form.brand} onChange={updateField} required />
            </label>
            <label>
              Category
              <select name="category" value={form.category} onChange={updateField}>
                {CATEGORIES.map((category) => (
                  <option value={category} key={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Price (₹)
              <input name="price" type="number" min="0" step="1" value={form.price} onChange={updateField} required />
            </label>
            <label>
              Compare-at price (₹)
              <input name="compareAtPrice" type="number" min="0" step="1" value={form.compareAtPrice} onChange={updateField} />
            </label>
            <label className="admin-form-full">
              Product image URLs <small>One URL per line</small>
              <textarea name="imagesText" value={form.imagesText} onChange={updateField} rows={3} placeholder="https://..." />
            </label>
            <label>
              Finish
              <input name="finish" value={form.finish} onChange={updateField} placeholder="matte, dewy, satin..." />
            </label>
            <label>
              Skin types <small>Comma-separated</small>
              <input name="skinTypesText" value={form.skinTypesText} onChange={updateField} placeholder="normal, dry" />
            </label>
            <label className="admin-form-full">
              Ingredients <small>Comma-separated</small>
              <input name="ingredientsText" value={form.ingredientsText} onChange={updateField} />
            </label>
            <label className="admin-form-full">
              Tags <small>Comma-separated</small>
              <input name="tagsText" value={form.tagsText} onChange={updateField} />
            </label>
          </div>

          <div className="admin-variants-heading">
            <div>
              <strong>Product variants / shades</strong>
              <small>Each shade must have a unique SKU.</small>
            </div>
            <button className="admin-secondary-button" type="button" onClick={addVariant}>
              <Plus size={14} /> Add shade
            </button>
          </div>

          <div className="admin-variant-list">
            {form.variants.map((variant, index) => (
              <div className="admin-variant-row" key={`${index}-${variant.sku}`}>
                <label>
                  SKU
                  <input value={variant.sku} onChange={(event) => updateVariant(index, 'sku', event.target.value)} required />
                </label>
                <label>
                  Shade label
                  <input value={variant.label} onChange={(event) => updateVariant(index, 'label', event.target.value)} required />
                </label>
                <label>
                  Colour
                  <input type="color" value={variant.shadeHex} onChange={(event) => updateVariant(index, 'shadeHex', event.target.value)} />
                </label>
                <label>
                  Stock
                  <input type="number" min="0" step="1" value={variant.stock} onChange={(event) => updateVariant(index, 'stock', event.target.value)} required />
                </label>
                <button
                  className="admin-icon-button admin-remove-variant"
                  type="button"
                  disabled={form.variants.length === 1}
                  onClick={() => removeVariant(index)}
                  aria-label={`Remove variant ${index + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="admin-checkbox-row">
            <label>
              <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={updateField} />
              Featured product
            </label>
            <label>
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} />
              Active in catalogue
            </label>
          </div>

          <AdminError>{error}</AdminError>

          <div className="admin-modal-actions">
            <button className="admin-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="admin-primary-button" type="submit" disabled={saving}>
              {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  const loadProducts = useCallback(() => {
    // setLoading(true)
    // setError('')

    api.get('/products', { params: { page: 1, limit: 100 } })
      .then((response) => {
        setProducts(Array.isArray(response.data?.data) ? response.data.data : [])
      })
      .catch((requestError) => {
        setError(getApiError(requestError, 'Unable to load products.'))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return products

    return products.filter((product) => (
      `${product.name} ${product.brand} ${product.category} ${product.slug}`
        .toLowerCase()
        .includes(normalized)
    ))
  }, [products, query])

  const saveComplete = () => {
    setFormOpen(false)
    setEditingProduct(null)
    loadProducts()
  }

  const deactivateProduct = async (product) => {
    const confirmed = window.confirm(
      `Deactivate "${product.name}"? It will no longer appear in the customer catalogue.`,
    )
    if (!confirmed) return

    try {
      await api.delete(`/products/${product._id}`)
      loadProducts()
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to deactivate this product.'))
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">YOUR CATALOGUE</span>
          <h1>Products <em>& shades.</em></h1>
          <p>Create products, manage variants and keep inventory current.</p>
        </div>
        <button
          className="admin-primary-button"
          type="button"
          onClick={() => {
            setEditingProduct(null)
            setFormOpen(true)
          }}
        >
          <Plus size={16} /> Add product
        </button>
      </div>

      <div className="admin-table-toolbar">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search product, brand or category..."
          aria-label="Search products"
        />
        <button className="admin-secondary-button" type="button" onClick={() => {
  setLoading(true)
  setError('')
  loadProducts()
}}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <AdminError>{error}</AdminError>

      {loading ? <AdminLoading /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Variants</th>
                <th>Total stock</th>
                <th>Visibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const stock = (product.variants || []).reduce(
                  (sum, variant) => sum + Number(variant.stock || 0),
                  0,
                )
                return (
                  <tr key={product._id}>
                    <td>
                      <div className="admin-product-cell">
                        {product.images?.[0]
                          ? <img src={product.images[0]} alt="" />
                          : <span className="admin-product-placeholder">A</span>}
                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.brand}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="admin-category-pill">{product.category}</span></td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.variants?.length || 0}</td>
                    <td>
                      <span className={stock <= 10 ? 'admin-stock-low' : 'admin-stock-good'}>
                        {stock}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-visibility ${product.isActive ? 'is-active' : 'is-inactive'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          className="admin-icon-button"
                          type="button"
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => {
                            setEditingProduct(product)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="admin-icon-button is-danger"
                          type="button"
                          title="Deactivate product"
                          aria-label={`Deactivate ${product.name}`}
                          onClick={() => deactivateProduct(product)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {visibleProducts.length === 0 && (
                <tr>
                  <td colSpan="7" className="admin-table-empty">
                    No products match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <AdminProductForm
          key={editingProduct?._id || 'new-product'}
          product={editingProduct}
          onClose={() => {
            setFormOpen(false)
            setEditingProduct(null)
          }}
          onSaved={saveComplete}
        />
      )}
    </section>
  )
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  const loadOrders = useCallback(() => {
    // setLoading(true)
    // setError('')

    const params = { page: 1, limit: 20 }
    if (statusFilter) params.status = statusFilter

    api.get('/orders/admin/all', { params })
      .then((response) => {
        setOrders(Array.isArray(response.data?.data) ? response.data.data : [])
      })
      .catch((requestError) => {
        setError(getApiError(requestError, 'Unable to load orders.'))
      })
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const advanceOrder = async (order) => {
    const nextStatus = ORDER_TRANSITIONS[order.orderStatus]
    if (!nextStatus) return

    setError('')
    setUpdatingId(order._id)

    try {
      const response = await api.patch(
        `/orders/admin/${order._id}/status`,
        { orderStatus: nextStatus },
      )
      const updatedOrder = response.data?.data?.order

      setOrders((current) => current.map((item) => (
        item._id === order._id
          ? updatedOrder || { ...item, orderStatus: nextStatus }
          : item
      )))
    } catch (requestError) {
      setError(getApiError(requestError, 'Unable to update this order.'))
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">CUSTOMER FULFILMENT</span>
          <h1>Orders <em>& delivery.</em></h1>
          <p>Review purchases and move each order through its fulfilment journey.</p>
        </div>
        <button className="admin-secondary-button" type="button" onClick={() => {
  setLoading(true)
  setError('')
  loadOrders()
}}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="admin-table-toolbar">
        <label className="admin-filter-label">
          Filter status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option value={status} key={status}>{status}</option>
            ))}
          </select>
        </label>
        <span className="admin-results-count">{orders.length} orders loaded</span>
      </div>

      <AdminError>{error}</AdminError>

      {loading ? <AdminLoading /> : (
        <div className="admin-orders-list">
          {orders.map((order) => {
            const nextStatus = ORDER_TRANSITIONS[order.orderStatus]
            return (
              <article className="admin-order-card" key={order._id}>
                <div className="admin-order-card-top">
                  <div>
                    <span className="eyebrow">{order.orderNumber}</span>
                    <h3>{order.user?.name || 'Customer'}</h3>
                    <p>{order.user?.email || 'No email available'}</p>
                  </div>
                  <div className="admin-order-total">
                    <strong>{formatPrice(order.total)}</strong>
                    <span>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="admin-order-card-meta">
                  <div>
                    <span>Order status</span>
                    <strong className={`admin-status admin-status--${order.orderStatus}`}>
                      {order.orderStatus}
                    </strong>
                  </div>
                  <div>
                    <span>Payment</span>
                    <strong>{order.paymentMethod?.toUpperCase()} · {order.paymentStatus}</strong>
                  </div>
                  <div>
                    <span>Items</span>
                    <strong>{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</strong>
                  </div>
                  <div>
                    <span>Ship to</span>
                    <strong>{order.shippingAddress?.city || '—'}, {order.shippingAddress?.state || ''}</strong>
                  </div>
                </div>

                <div className="admin-order-items">
                  {(order.items || []).map((item) => (
                    <div key={item._id || `${item.variantSku}-${item.productName}`}>
                      <span>{item.quantity} × {item.productName}</span>
                      <small>{item.variantLabel || item.variantSku}</small>
                    </div>
                  ))}
                </div>

                <div className="admin-order-card-bottom">
                  <span>Subtotal {formatPrice(order.subtotal)} · Shipping {formatPrice(order.shippingFee)}</span>
                  {nextStatus ? (
                    <button
                      className="admin-primary-button admin-advance-button"
                      type="button"
                      disabled={updatingId === order._id}
                      onClick={() => advanceOrder(order)}
                    >
                      {updatingId === order._id ? 'Updating…' : `Mark as ${nextStatus}`}
                      <ArrowUpRight size={15} />
                    </button>
                  ) : (
                    <span className="admin-order-complete">Fulfilment complete</span>
                  )}
                </div>
              </article>
            )
          })}

          {orders.length === 0 && (
            <div className="admin-table-empty admin-empty-panel">
              No orders found for this status.
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export { AdminLayout, AdminOverview }