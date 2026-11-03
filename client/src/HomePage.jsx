import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import { useCart } from './context/useCart'
import { api, formatPrice } from './api/client'
import './App.css'

// Editorial fallback cards remain visible if the product API is unavailable or the catalogue is empty.
const featuredEdits = [
  {
    id: 'skin-tint',
    name: 'Second Skin Tint',
    category: 'Complexion',
    detail: 'Weightless, breathable coverage',
    price: '₹1,290',
    label: 'Bestseller',
    image:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85',
    tone: 'sand',
  },
  {
    id: 'soft-blush',
    name: 'Cloud Kiss Blush',
    category: 'Cheeks',
    detail: 'A soft-focus flush of colour',
    price: '₹890',
    label: 'Loved',
    image:
      'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=900&q=85',
    tone: 'rose',
  },
  {
    id: 'lip-oil',
    name: 'Lumière Lip Oil',
    category: 'Lips',
    detail: 'Gloss, comfort and a hint of tint',
    price: '₹750',
    label: 'New',
    image:
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85',
    tone: 'peach',
  },
  {
    id: 'soft-focus',
    name: 'Soft Focus Powder',
    category: 'Finishing',
    detail: 'A little blur, never a mask',
    price: '₹1,150',
    label: 'Everyday edit',
    image:
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85',
    tone: 'cream',
  },
]

const categories = [
  {
    name: 'Complexion',
    value: 'face',
    note: 'Your skin, only more you',
    image:
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1000&q=85',
    className: 'category-card--complexion',
  },
  {
    name: 'Lips',
    value: 'lips',
    note: 'A colour worth keeping close',
    image:
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=85',
    className: 'category-card--lips',
  },
  {
    name: 'Eyes',
    value: 'eyes',
    note: 'Make room for a little drama',
    image:
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=1000&q=85',
    className: 'category-card--eyes',
  },
  {
    name: 'Skincare',
    value: 'skincare',
    note: 'The ritual before everything',
    image:
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1000&q=85',
    className: 'category-card--skincare',
  },
]

function BrandMark() {
  return (
    <a className="brand-mark" href="#home" aria-label="Auréllé Beauty home">
      <span className="brand-mark__name">Auréllé</span>
      <span className="brand-mark__sub">BEAUTY, IN YOUR LIGHT</span>
    </a>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { itemCount } = useCart()
  const [liveProducts, setLiveProducts] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [savedItems, setSavedItems] = useState([])
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    let active = true
    api.get('/products', { params: { page: 1, limit: 8 } })
      .then((response) => {
        if (active && Array.isArray(response.data?.data)) {
          setLiveProducts(response.data.data.slice(0, 4))
        }
      })
      .catch(() => {
        // Keep the editorial starter cards visible if the API is not running yet.
      })
    return () => { active = false }
  }, [])

  const displayProducts = useMemo(() => {
    if (!liveProducts.length) return featuredEdits
    return liveProducts.map((product, index) => ({
      ...product,
      id: product._id,
      name: product.name,
      category: product.category,
      detail: product.description || product.finish || 'A thoughtful everyday essential',
      price: formatPrice(product.price),
      label: product.isFeatured ? 'Featured' : 'The edit',
      image: product.images?.[0] || featuredEdits[index % featuredEdits.length].image,
      tone: featuredEdits[index % featuredEdits.length].tone,
    }))
  }, [liveProducts])

  const matchingEdits = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return displayProducts
    return displayProducts.filter((item) =>
      `${item.name} ${item.category} ${item.detail}`.toLowerCase().includes(normalizedQuery),
    )
  }, [searchQuery, displayProducts])

  const toggleSaved = (id) => {
    setSavedItems((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const handleNewsletterSubmit = (event) => {
    event.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="site-shell" id="home">
      <div className="announcement-bar">
        <span>Complimentary shipping on orders above ₹1,499</span>
        <span className="announcement-bar__dot" aria-hidden="true">✳</span>
        <span>A little luxury, delivered to you</span>
      </div>

      <header className="site-header">
        <div className="site-header__inner">
          <button
            className="icon-button mobile-menu-trigger"
            type="button"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>

          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="/shop">Shop all</a>
            <a href="/shop?category=face">Face</a>
            <a href="/shop?category=lips">Lips</a>
            <a href="/shop?category=eyes">Eyes</a>
          </nav>

          <BrandMark />

          <div className="header-actions">
            <button
              className="icon-button header-action"
              type="button"
              aria-label="Search products"
              aria-expanded={searchOpen}
              onClick={() => {
                setSearchOpen((open) => !open)
              }}
            >
              {searchOpen ? <X size={19} /> : <Search size={19} />}
            </button>
            <a className="icon-button header-action account-link" href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Sign in"}>
              <UserRound size={19} />
            </a>
            <button
              className="icon-button bag-button"
              type="button"
              aria-label="Open shopping bag"
              onClick={() => {
                setSearchOpen(false)
                navigate('/cart')
              }}
            >
              <ShoppingBag size={19} />
              <span className="bag-button__count">{itemCount}</span>
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="search-panel">
            <div className="search-panel__inner">
              <Search size={19} aria-hidden="true" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search the edit..."
                aria-label="Search the edit"
              />
              <button type="button" onClick={() => setSearchQuery('')} className="search-clear">
                Clear
              </button>
            </div>
            <div className="search-panel__results">
              <span className="eyebrow">The edit</span>
              {matchingEdits.length ? (
                matchingEdits.map((item) => (
                  <a href="/shop" key={item.id} onClick={() => setSearchOpen(false)}>
                    <span>{item.name}</span>
                    <span>{item.category}</span>
                  </a>
                ))
              ) : (
                <p className="search-empty">No matches just yet. Try “lips”, “skin” or “blush”.</p>
              )}
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <a href="/shop" onClick={closeMobileMenu}>Shop all <ArrowUpRight size={16} /></a>
          <a href="/shop?category=face" onClick={closeMobileMenu}>Face <ArrowUpRight size={16} /></a>
          <a href="/shop?category=lips" onClick={closeMobileMenu}>Lips <ArrowUpRight size={16} /></a>
          <a href="/shop?category=eyes" onClick={closeMobileMenu}>Eyes <ArrowUpRight size={16} /></a>
          <a href="#story" onClick={closeMobileMenu}>Our philosophy <ArrowUpRight size={16} /></a>
        </nav>
      )}

      <main>
        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><Sparkles size={13} /> A softer kind of statement</span>
            <h1>Beauty that feels like <em>you.</em></h1>
            <p className="hero-description">
              Thoughtful colour. Skin-loving textures. Little rituals that make
              getting ready feel like time well spent.
            </p>
            <div className="hero-actions">
              <a className="button button--dark" href="#bestsellers">
                Discover the edit <ArrowRight size={16} />
              </a>
              <a className="text-link" href="#story">Our point of view</a>
            </div>
            <div className="hero-note">
              <span className="hero-note__line" />
              <span>Made for real skin, real days and every version of you.</span>
            </div>
          </div>

          <div className="hero-visual">
            <img
              src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1500&q=90"
              alt="An editorial beauty moment with soft, natural makeup"
              className="hero-visual__image"
            />
            <div className="hero-visual__veil" />
            <div className="hero-stamp" aria-label="Beauty, in your light">
              <span>BEAUTY</span>
              <span className="hero-stamp__star">✳</span>
              <span>IN YOUR LIGHT</span>
            </div>
            <div className="hero-caption">
              <span>01 / THE EVERYDAY EDIT</span>
              <span>Effortless, by design</span>
            </div>
          </div>
        </section>

        <section className="promise-strip" aria-label="Our promises">
          <div><span className="promise-icon">✳</span> Made to feel like you</div>
          <div><span className="promise-icon">✳</span> Thoughtful formulas</div>
          <div><span className="promise-icon">✳</span> Everyday, elevated</div>
        </section>

        <section className="section category-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Find your feeling</span>
              <h2>A little something for <em>every day.</em></h2>
            </div>
            <a className="text-link section-heading__link" href="#bestsellers">
              Explore all <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="category-grid">
            {categories.map((category, index) => (
              <a className={`category-card ${category.className}`} href={`/shop?category=${category.value}`} key={category.name}>
                <img src={category.image} alt="" loading="lazy" />
                <div className="category-card__shade" />
                <div className="category-card__content">
                  <span>0{index + 1} / {category.name}</span>
                  <h3>{category.name}</h3>
                  <p>{category.note}</p>
                </div>
                <span className="category-card__arrow"><ArrowUpRight size={19} /></span>
              </a>
            ))}
          </div>
        </section>

        <section className="section bestsellers-section" id="bestsellers">
          <div className="section-heading">
            <div>
              <span className="eyebrow">The good things</span>
              <h2>Our most-loved <em>little luxuries.</em></h2>
              <p className="section-intro">
                The pieces that earn their place in your everyday ritual.
              </p>
            </div>
            <a className="text-link section-heading__link" href="#newsletter">
              See what’s new <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="product-grid">
            {displayProducts.map((item) => (
              <article className="product-card" key={item.id}>
                <div className={`product-card__image-wrap product-card__image-wrap--${item.tone}`}>
                  <img src={item.image} alt={item.name} loading="lazy" />
                  <span className="product-label">{item.label}</span>
                  <button
                    className={`save-button ${savedItems.includes(item.id) ? 'is-saved' : ''}`}
                    type="button"
                    aria-label={savedItems.includes(item.id) ? `Remove ${item.name} from saved items` : `Save ${item.name}`}
                    aria-pressed={savedItems.includes(item.id)}
                    onClick={() => toggleSaved(item.id)}
                  >
                    <Heart size={17} fill={savedItems.includes(item.id) ? 'currentColor' : 'none'} />
                  </button>
                  <a className="product-quick-link" href={item._id ? `/products/${item._id}` : "/shop"}>
                    Discover <ArrowUpRight size={15} />
                  </a>
                </div>
                <div className="product-card__details">
                  <div>
                    <span className="product-category">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                  </div>
                  <span className="product-price">{item.price}</span>
                </div>
              </article>
            ))}
          </div>
          <p className="catalog-note">
            A first look at the Auréllé edit. Product availability and live pricing will come from the store catalogue.
          </p>
        </section>

        <section className="story-section" id="story">
          <div className="story-image">
            <img
              src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=88"
              alt="A calm, considered beauty ritual"
              loading="lazy"
            />
            <span className="story-image__caption">A MOMENT, JUST FOR YOU</span>
          </div>
          <div className="story-copy">
            <span className="eyebrow">The Auréllé philosophy</span>
            <h2>Not a new you.<br />Just <em>more you.</em></h2>
            <p>
              We believe beauty should meet you where you are. No rules to follow,
              no version to become. Just considered essentials, expressive colour
              and textures that let you feel at home in your own skin.
            </p>
            <a className="button button--outline" href="#newsletter">
              Get to know us <ArrowRight size={16} />
            </a>
            <span className="story-signoff">With care, Auréllé.</span>
          </div>
        </section>

        <section className="ritual-banner">
          <div className="ritual-banner__ornament">A</div>
          <div>
            <span className="eyebrow">A note to self</span>
            <h2>Your ritual.<br /><em>Your rules.</em></h2>
          </div>
          <p>
            Five minutes or fifty. Bare skin or bold colour.
            The best look is the one that feels like yours.
          </p>
          <a className="round-link" href="#bestsellers" aria-label="Explore the edit">
            <ArrowUpRight size={23} />
          </a>
        </section>

        <section className="newsletter-section" id="newsletter">
          <div className="newsletter-decoration" aria-hidden="true">✳</div>
          <span className="eyebrow">A little note from us</span>
          <h2>Good things look<br /><em>better shared.</em></h2>
          <p>New arrivals, thoughtful tips and the occasional love note. Only the good stuff.</p>
          {subscribed ? (
            <div className="newsletter-success" role="status">
              <Check size={18} /> You’re on the list. We’ll be in touch.
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <label className="sr-only" htmlFor="newsletter-email">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email address"
              />
              <button type="submit" aria-label="Subscribe to newsletter">
                Join us <ArrowRight size={16} />
              </button>
            </form>
          )}
          <span className="newsletter-fine-print">By subscribing, you agree to receive occasional emails from Auréllé Beauty.</span>
        </section>
      </main>

      <footer className="site-footer" id="footer">
        <div className="footer-main">
          <div className="footer-brand">
            <BrandMark />
            <p>Beauty, in your light.<br />Made for every version of you.</p>
            <a className="footer-social" href="https://www.instagram.com/" target="_blank" rel="noreferrer">
              <span aria-hidden="true">◎</span> Follow our little world
            </a>
          </div>
          <div className="footer-column">
            <span className="footer-title">Explore</span>
            <a href="/shop">Shop all</a>
            <a href="/shop?category=face">Face</a>
            <a href="/shop?category=lips">Lips</a>
            <a href="/shop?category=eyes">Eyes</a>
          </div>
          <div className="footer-column">
            <span className="footer-title">Auréllé</span>
            <a href="#story">Our philosophy</a>
            <a href="#newsletter">Contact</a>
            <a href="#newsletter">Join the list</a>
          </div>
          <div className="footer-column footer-column--note">
            <span className="footer-title">A softer kind of beauty.</span>
            <p>Thoughtful details. Everyday rituals. A little room to be yourself.</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Auréllé Beauty</span>
          <span>Made with care, in India.</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </footer>

    </div>
  )
}

export default HomePage
