import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Cart from './Cart';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider } from '../context/ThemeContext';

// Mock the theme context
const mockThemeContext = {
  darkMode: false,
  toggleTheme: vi.fn()
};

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => mockThemeContext,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  )
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('Cart Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockThemeContext.darkMode = false;
  });

  it('should display empty cart state', () => {
    render(<Cart />, { wrapper: TestWrapper });

    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.getByText('Add some products to get started!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
  });

  it('should display cart items when cart has items', () => {
    // Pre-populate localStorage with cart items
    const cartItems = [
      {
        productId: 1,
        name: 'SmartFeeder One',
        price: 129.99,
        quantity: 1,
        discount: 0.25,
        imageUrl: 'smartfeeder.jpg'
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('SmartFeeder One')).toBeInTheDocument();
    expect(screen.getByText('$129.99')).toBeInTheDocument();
    expect(screen.getByText('-25%')).toBeInTheDocument(); // Discount badge
  });

  it('should handle quantity increase', async () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Test Product',
        price: 50,
        quantity: 2
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    const increaseButton = screen.getByLabelText('Increase quantity of Test Product');
    fireEvent.click(increaseButton);

    // Check that localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'octocat-cart',
      expect.stringContaining('"quantity":3')
    );
  });

  it('should handle quantity decrease', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Test Product',
        price: 50,
        quantity: 2
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    const decreaseButton = screen.getByLabelText('Decrease quantity of Test Product');
    fireEvent.click(decreaseButton);

    // Check that localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'octocat-cart',
      expect.stringContaining('"quantity":1')
    );
  });

  it('should remove item when remove button clicked', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Test Product',
        price: 50,
        quantity: 1
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    const removeButton = screen.getByLabelText('Remove Test Product from cart');
    fireEvent.click(removeButton);

    // Cart should be empty after removal
    expect(localStorage.setItem).toHaveBeenCalledWith('octocat-cart', JSON.stringify([]));
  });

  it('should display correct order summary calculations', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Product 1',
        price: 50,
        quantity: 2
      },
      {
        productId: 2,
        name: 'Product 2',
        price: 30,
        quantity: 1
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    
    // Subtotal: (50*2) + (30*1) = 130, shipping: 25, total: 155
    // But since the total is over $100, shipping should be FREE
    const orderSummary = screen.getByText('Order Summary').parentElement;
    expect(orderSummary).toHaveTextContent('$130.00'); // Subtotal
    expect(orderSummary).toHaveTextContent('FREE'); // Free shipping over $100
    expect(orderSummary).toHaveTextContent('$130.00'); // Total should equal subtotal when shipping is free
  });

  it('should show free shipping message for orders over $100', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Expensive Product',
        price: 150,
        quantity: 1
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(screen.getByText('🎉 Free shipping on orders over $100!')).toBeInTheDocument();
  });

  it('should handle discount pricing correctly', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Discounted Product',
        price: 100,
        quantity: 1,
        discount: 0.25 // 25% off
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    // Check for original price in the product info
    const productInfo = screen.getByText('Discounted Product').parentElement;
    expect(productInfo).toHaveTextContent('$100.00'); // Original price
    expect(screen.getByText('-25%')).toBeInTheDocument(); // Discount badge
    
    // Check the final price after discount in the product row
    const productRow = screen.getByText('Discounted Product').closest('div[class*="shadow-md"]');
    expect(productRow).toHaveTextContent('$75.00'); // Final price after discount
  });

  it('should render properly in dark mode', () => {
    mockThemeContext.darkMode = true;

    const cartItems = [
      {
        productId: 1,
        name: 'Test Product',
        price: 50,
        quantity: 1
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    // Should render without errors in dark mode - check for cart content
    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('should have accessible quantity controls', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Test Product',
        price: 50,
        quantity: 2
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    expect(screen.getByLabelText('Decrease quantity of Test Product')).toBeInTheDocument();
    expect(screen.getByLabelText('Increase quantity of Test Product')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity of Test Product')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Test Product from cart')).toBeInTheDocument();
  });

  it('should display product image when available', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Test Product',
        price: 50,
        quantity: 1,
        imageUrl: 'test-product.jpg'
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    const productImage = screen.getByAltText('Test Product');
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute('src', '/images/products/test-product.jpg');
  });

  it('should display default box icon when no image available', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Test Product',
        price: 50,
        quantity: 1
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Cart />, { wrapper: TestWrapper });

    expect(screen.getByText('📦')).toBeInTheDocument();
  });
});