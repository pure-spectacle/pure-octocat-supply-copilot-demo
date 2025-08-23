import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navigation from './Navigation';
import { CartProvider } from '../context/CartContext';

// Mock contexts
const mockAuthContext = {
  isLoggedIn: false,
  isAdmin: false,
  logout: vi.fn()
};

const mockThemeContext = {
  darkMode: false,
  toggleTheme: vi.fn()
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => mockThemeContext
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <CartProvider>
      {children}
    </CartProvider>
  </BrowserRouter>
);

describe('Navigation Cart Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthContext.isLoggedIn = false;
    mockAuthContext.isAdmin = false;
    mockThemeContext.darkMode = false;
  });

  it('should render cart icon without badge when cart is empty', () => {
    render(<Navigation />, { wrapper: TestWrapper });

    const cartLink = screen.getByLabelText('Shopping cart');
    expect(cartLink).toBeInTheDocument();
    expect(cartLink).toHaveAttribute('href', '/cart');

    // Should not have badge when cart is empty
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it('should display correct item count badge when cart has items', () => {
    // Pre-populate localStorage with cart items
    const cartItems = [
      {
        productId: 1,
        name: 'Product 1',
        price: 50,
        quantity: 3
      },
      {
        productId: 2,
        name: 'Product 2',
        price: 30,
        quantity: 2
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Navigation />, { wrapper: TestWrapper });

    const cartLink = screen.getByLabelText('Shopping cart');
    expect(cartLink).toBeInTheDocument();
    
    // Should display total item count (3 + 2 = 5)
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should display "99+" when cart has more than 99 items', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Product 1',
        price: 50,
        quantity: 100
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Navigation />, { wrapper: TestWrapper });

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('should have correct styling for cart icon in light mode', () => {
    render(<Navigation />, { wrapper: TestWrapper });

    const cartLink = screen.getByLabelText('Shopping cart');
    const cartIcon = cartLink.querySelector('svg');
    
    expect(cartIcon).toHaveClass('text-gray-700');
    expect(cartIcon).toHaveClass('hover:text-primary');
  });

  it('should have correct styling for cart icon in dark mode', () => {
    mockThemeContext.darkMode = true;

    render(<Navigation />, { wrapper: TestWrapper });

    const cartLink = screen.getByLabelText('Shopping cart');
    const cartIcon = cartLink.querySelector('svg');
    
    expect(cartIcon).toHaveClass('text-light');
    expect(cartIcon).toHaveClass('hover:text-primary');
  });

  it('should position cart icon badge correctly', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Product 1',
        price: 50,
        quantity: 1
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    render(<Navigation />, { wrapper: TestWrapper });

    const badge = screen.getByText('1');
    expect(badge).toHaveClass('absolute');
    expect(badge).toHaveClass('-top-1');
    expect(badge).toHaveClass('-right-1');
    expect(badge).toHaveClass('bg-primary');
    expect(badge).toHaveClass('text-white');
    expect(badge).toHaveClass('rounded-full');
  });

  it('should maintain cart state after navigation render', () => {
    const cartItems = [
      {
        productId: 1,
        name: 'Product 1',
        price: 50,
        quantity: 2
      }
    ];
    
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(cartItems));

    const { rerender } = render(<Navigation />, { wrapper: TestWrapper });

    expect(screen.getByText('2')).toBeInTheDocument();

    // Re-render component (simulating navigation)
    rerender(<Navigation />);
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render cart icon with proper accessibility attributes', () => {
    render(<Navigation />, { wrapper: TestWrapper });

    const cartLink = screen.getByLabelText('Shopping cart');
    expect(cartLink).toBeInTheDocument();
    expect(cartLink).toHaveAttribute('aria-label', 'Shopping cart');
    expect(cartLink).toHaveClass('focus:outline-none');
  });

  it('should render all navigation elements correctly', () => {
    render(<Navigation />, { wrapper: TestWrapper });

    // Main navigation links
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /about us/i })).toBeInTheDocument();
    
    // Cart link
    expect(screen.getByLabelText('Shopping cart')).toBeInTheDocument();
    
    // Theme toggle
    expect(screen.getByLabelText('Toggle dark/light mode')).toBeInTheDocument();
    
    // Login link (when not logged in)
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
  });

  it('should show admin menu when user is admin', () => {
    mockAuthContext.isLoggedIn = true;
    mockAuthContext.isAdmin = true;

    render(<Navigation />, { wrapper: TestWrapper });

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('should show logout when user is logged in', () => {
    mockAuthContext.isLoggedIn = true;

    render(<Navigation />, { wrapper: TestWrapper });

    expect(screen.getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /login/i })).not.toBeInTheDocument();
  });
});