import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getApiError } from '../api/client'
import { useAuth } from './useAuth'
import { CartContext } from './cart-context'

const emptyCart = {
  cartId: null,
  items: [],
  subtotal: 0,
  totalItems: 0,
  currency: 'INR',
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [cart, setCart] = useState(emptyCart)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem('aurelle_token')) {
      setCart(emptyCart)
      return emptyCart
    }

    setLoading(true)
    try {
      const response = await api.get('/cart')
      const nextCart = response.data?.data?.cart ?? emptyCart
      setCart(nextCart)
      return nextCart
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        setCart(emptyCart)
      }
      throw new Error(getApiError(error, 'Unable to load your bag.'), { cause: error })
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch the signed-in customer's cart after auth hydration. We deliberately
  // avoid a synchronous loading-state update in the effect body.
  useEffect(() => {
    if (authLoading || !user) return undefined

    let active = true
    api.get('/cart')
      .then((response) => {
        if (active) setCart(response.data?.data?.cart ?? emptyCart)
      })
      .catch((error) => {
        if (!active) return
        if (error.response?.status === 401 || error.response?.status === 403) {
          setCart(emptyCart)
        }
      })

    return () => {
      active = false
    }
  }, [user, authLoading])

  const addToCart = useCallback(async (productId, variantSku, quantity = 1) => {
    setBusy(true)
    try {
      const response = await api.post('/cart/items', {
        productId,
        variantSku,
        quantity,
      })
      const nextCart = response.data?.data?.cart
      if (nextCart) setCart(nextCart)
      return nextCart
    } catch (error) {
      throw new Error(getApiError(error, 'Unable to add this item to your bag.'), { cause: error })
    } finally {
      setBusy(false)
    }
  }, [])

  const updateCartItem = useCallback(async (itemId, quantity) => {
    setBusy(true)
    try {
      const response = await api.patch(`/cart/items/${itemId}`, { quantity })
      const nextCart = response.data?.data?.cart
      if (nextCart) setCart(nextCart)
      return nextCart
    } catch (error) {
      throw new Error(getApiError(error, 'Unable to update the quantity.'), { cause: error })
    } finally {
      setBusy(false)
    }
  }, [])

  const removeCartItem = useCallback(async (itemId) => {
    setBusy(true)
    try {
      const response = await api.delete(`/cart/items/${itemId}`)
      const nextCart = response.data?.data?.cart
      if (nextCart) setCart(nextCart)
      else await refreshCart()
    } catch (error) {
      throw new Error(getApiError(error, 'Unable to remove this item.'), { cause: error })
    } finally {
      setBusy(false)
    }
  }, [refreshCart])

  const clearCart = useCallback(async () => {
    setBusy(true)
    try {
      await api.delete('/cart')
      setCart(emptyCart)
    } catch (error) {
      throw new Error(getApiError(error, 'Unable to clear your bag.'), { cause: error })
    } finally {
      setBusy(false)
    }
  }, [])

  // When signed out, hide the last authenticated customer's cart immediately.
  const visibleCart = user ? cart : emptyCart

  const value = useMemo(() => ({
    cart: visibleCart,
    items: visibleCart.items ?? [],
    itemCount: visibleCart.totalItems ?? (visibleCart.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
    loading,
    busy,
    refreshCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
  }), [visibleCart, loading, busy, refreshCart, addToCart, updateCartItem, removeCartItem, clearCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
