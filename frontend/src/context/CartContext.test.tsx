import { render, screen, act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartProvider, useCart, CartItem } from '../context/CartContext';
import { ReactNode } from 'react';

// Test wrapper component
const TestWrapper = ({ children }: { children: ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial empty cart state', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.shipping).toBe(25); // Default shipping for orders under $100
    expect(result.current.total).toBe(25);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    const product = {
      productId: 1,
      name: 'Test Product',
      price: 50,
      imgName: 'test.jpg'
    };

    act(() => {
      result.current.addItem(product, 2);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toEqual({
      productId: 1,
      name: 'Test Product',
      price: 50,
      quantity: 2,
      imageUrl: 'test.jpg',
      discount: undefined
    });
    expect(result.current.totalItems).toBe(2);
    expect(result.current.subtotal).toBe(100);
  });

  it('should update quantity when adding existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    const product = {
      productId: 1,
      name: 'Test Product',
      price: 50,
    };

    // Add item first time
    act(() => {
      result.current.addItem(product, 2);
    });

    // Add same item again
    act(() => {
      result.current.addItem(product, 3);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    const product = {
      productId: 1,
      name: 'Test Product',
      price: 50,
    };

    act(() => {
      result.current.addItem(product, 2);
    });

    act(() => {
      result.current.removeItem(1);
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.totalItems).toBe(0);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    const product = {
      productId: 1,
      name: 'Test Product',
      price: 50,
    };

    act(() => {
      result.current.addItem(product, 2);
    });

    act(() => {
      result.current.updateQuantity(1, 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.totalItems).toBe(5);
  });

  it('should remove item when updating quantity to 0', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    const product = {
      productId: 1,
      name: 'Test Product',
      price: 50,
    };

    act(() => {
      result.current.addItem(product, 2);
    });

    act(() => {
      result.current.updateQuantity(1, 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should clear entire cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    const product1 = { productId: 1, name: 'Product 1', price: 50 };
    const product2 = { productId: 2, name: 'Product 2', price: 30 };

    act(() => {
      result.current.addItem(product1, 2);
      result.current.addItem(product2, 1);
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should calculate shipping correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    // Order under $100 should have $25 shipping
    act(() => {
      result.current.addItem({ productId: 1, name: 'Product', price: 50 }, 1);
    });

    expect(result.current.subtotal).toBe(50);
    expect(result.current.shipping).toBe(25);
    expect(result.current.total).toBe(75);

    // Order $100 or over should have free shipping
    act(() => {
      result.current.updateQuantity(1, 2);
    });

    expect(result.current.subtotal).toBe(100);
    expect(result.current.shipping).toBe(0);
    expect(result.current.total).toBe(100);
  });

  it('should handle discount calculations correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    const productWithDiscount = {
      productId: 1,
      name: 'Discounted Product',
      price: 100,
      discount: 0.25 // 25% off
    };

    act(() => {
      result.current.addItem(productWithDiscount, 2);
    });

    // Price should be $75 per item after 25% discount
    expect(result.current.subtotal).toBe(150); // 2 * (100 * 0.75)
    expect(result.current.shipping).toBe(0); // Free shipping over $100
    expect(result.current.total).toBe(150);
  });

  it('should persist cart to localStorage', () => {
    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    const product = {
      productId: 1,
      name: 'Test Product',
      price: 50,
    };

    act(() => {
      result.current.addItem(product, 2);
    });

    // Check that localStorage.setItem was called
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'octocat-cart',
      JSON.stringify([{
        productId: 1,
        name: 'Test Product',
        price: 50,
        quantity: 2,
        imageUrl: undefined,
        discount: undefined
      }])
    );
  });

  it('should load cart from localStorage on mount', () => {
    const savedCart: CartItem[] = [
      {
        productId: 1,
        name: 'Saved Product',
        price: 30,
        quantity: 3,
      }
    ];

    // Mock localStorage to return saved cart
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(savedCart));

    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    expect(result.current.items).toEqual(savedCart);
    expect(result.current.totalItems).toBe(3);
    expect(result.current.subtotal).toBe(90);
  });

  it('should handle invalid localStorage data gracefully', () => {
    // Mock localStorage to return invalid JSON
    vi.mocked(localStorage.getItem).mockReturnValue('invalid-json');

    const { result } = renderHook(() => useCart(), { wrapper: TestWrapper });

    // Should fall back to empty cart
    expect(result.current.items).toEqual([]);
    expect(localStorage.removeItem).toHaveBeenCalledWith('octocat-cart');
  });

  it('should throw error when used outside CartProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      renderHook(() => useCart());
    }).toThrow('useCart must be used within a CartProvider');

    console.error = originalError;
  });
});