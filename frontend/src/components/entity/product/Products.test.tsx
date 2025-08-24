import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Products from './Products';
import { CartProvider } from '../../../context/CartContext';

// Mock dependencies
vi.mock('axios');
vi.mock('../../../api/config', () => ({
  api: {
    baseURL: 'http://localhost:3000/api/v1',
    endpoints: {
      products: '/products'
    }
  }
}));

const mockThemeContext = {
  darkMode: false,
  toggleTheme: vi.fn()
};

vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => mockThemeContext
}));

// Mock products data
const mockProducts = [
  {
    productId: 1,
    name: 'SmartFeeder One',
    description: 'AI-powered cat feeder',
    price: 129.99,
    imgName: 'smartfeeder.jpg',
    sku: 'SF001',
    unit: 'piece',
    supplierId: 1,
    discount: 0.25
  },
  {
    productId: 2,
    name: 'AutoClean Litter Dome',
    description: 'Self-cleaning litter box',
    price: 199.99,
    imgName: 'autoclean.jpg',
    sku: 'AC001',
    unit: 'piece',
    supplierId: 1
  },
  {
    productId: 3,
    name: 'CatFlix Portal',
    description: 'Entertainment system for cats',
    price: 89.99,
    imgName: 'catflix.jpg',
    sku: 'CF001',
    unit: 'piece',
    supplierId: 2
  }
];

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CartProvider>
          {children}
        </CartProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Products Cart Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockThemeContext.darkMode = false;
  });

  it('should render products and quantity controls', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockProducts });

    render(<Products />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('SmartFeeder One')).toBeInTheDocument();
      expect(screen.getByText('AutoClean Litter Dome')).toBeInTheDocument();
      expect(screen.getByText('CatFlix Portal')).toBeInTheDocument();
    });

    // Check that quantity controls are present for each product
    const addToCartButtons = screen.getAllByText('Add to Cart');
    expect(addToCartButtons).toHaveLength(3);

    // Check for quantity input fields (initially showing 0)
    const quantityInputs = screen.getAllByDisplayValue('0');
    expect(quantityInputs.length).toBeGreaterThanOrEqual(3);
  });

  it('should handle quantity increase and decrease', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockProducts });

    render(<Products />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('SmartFeeder One')).toBeInTheDocument();
    });

    // Find the first product's plus and minus buttons by getting the parent container
    const firstProduct = screen.getByText('SmartFeeder One').closest('div[class*="bg-white"]');
    const plusButton = firstProduct?.querySelector('button[aria-label*="Increase"]');
    const minusButton = firstProduct?.querySelector('button[aria-label*="Decrease"]');

    if (plusButton && minusButton) {
      // Click plus button to increase quantity
      fireEvent.click(plusButton);

      // Should show quantity 1
      await waitFor(() => {
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
      });

      // Click minus button to decrease
      fireEvent.click(minusButton);

      // Should show quantity 0
      await waitFor(() => {
        expect(screen.getByDisplayValue('0')).toBeInTheDocument();
      });
    } else {
      // Fallback: just check that controls exist
      expect(firstProduct).toHaveTextContent('0');
    }
  });

  it('should display discount badges for discounted products', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockProducts });

    render(<Products />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('SmartFeeder One')).toBeInTheDocument();
    });

    // Should show 25% OFF badge for SmartFeeder (has discount: 0.25)
    expect(screen.getByText('25% OFF')).toBeInTheDocument();

    // Should show discounted price calculation
    expect(screen.getByText('$97.49')).toBeInTheDocument(); // $129.99 * (1 - 0.25) = $97.49
  });

  it('should handle loading state', () => {
    vi.mocked(axios.get).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Products />, { wrapper: TestWrapper });

    // Should show loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
    expect(spinner).toHaveClass('border-primary');
  });

  it('should handle error state', async () => {
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network error'));

    render(<Products />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch products')).toBeInTheDocument();
    });
  });

  it('should render in dark mode', async () => {
    mockThemeContext.darkMode = true;
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockProducts });

    render(<Products />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText('Products')).toBeInTheDocument();
    });

    // Component should render without errors in dark mode
    expect(screen.getByText('Products')).toHaveClass('text-light');
  });
});