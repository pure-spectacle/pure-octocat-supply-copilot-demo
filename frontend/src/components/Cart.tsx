import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useTheme } from '../context/ThemeContext';

export default function Cart() {
  const { items, subtotal, shipping, total, updateQuantity, removeItem } = useCart();
  const { darkMode } = useTheme();

  const handleQuantityChange = (productId: number, newQuantity: number) => {
    updateQuantity(productId, newQuantity);
  };

  if (items.length === 0) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className={`text-6xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              🛒
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
              Your cart is empty
            </h2>
            <p className={`text-lg mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
              Add some products to get started!
            </p>
            <Link
              to="/products"
              className="bg-primary hover:bg-accent text-white px-6 py-3 rounded-lg text-lg font-medium transition-colors duration-300"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-20 pb-16 px-4 transition-colors duration-300`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
          Shopping Cart
        </h1>

        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          {items.map((item) => {
            const itemPrice = item.discount ? item.price * (1 - item.discount) : item.price;
            const itemTotal = itemPrice * item.quantity;

            return (
              <div
                key={item.productId}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 transition-colors duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg flex items-center justify-center transition-colors duration-300`}>
                      {item.imageUrl ? (
                        <img 
                          src={`/images/products/${item.imageUrl}`} 
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className={`text-2xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>📦</span>
                      )}
                    </div>
                    <div>
                      <h3 className={`font-medium ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                        {item.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
                          ${item.price.toFixed(2)}
                        </span>
                        {item.discount && (
                          <span className="text-red-500 text-sm font-medium">
                            -{Math.round(item.discount * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        className={`w-8 h-8 flex items-center justify-center ${darkMode ? 'text-light' : 'text-gray-700'} hover:text-primary transition-colors duration-300`}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <span aria-hidden="true">−</span>
                      </button>
                      <span 
                        className={`${darkMode ? 'text-light' : 'text-gray-800'} min-w-[2rem] text-center transition-colors duration-300`}
                        aria-label={`Quantity of ${item.name}`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        className={`w-8 h-8 flex items-center justify-center ${darkMode ? 'text-light' : 'text-gray-700'} hover:text-primary transition-colors duration-300`}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right min-w-[4rem]">
                      <span className={`font-medium ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                        ${itemTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className={`text-red-500 hover:text-red-600 p-1 transition-colors duration-300`}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 transition-colors duration-300`}>
          <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
            Order Summary
          </h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
                Subtotal
              </span>
              <span className={`${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                ${subtotal.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
                Shipping
              </span>
              <span className={`${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            
            {shipping === 0 && subtotal >= 100 && (
              <div className="text-green-500 text-sm">
                🎉 Free shipping on orders over $100!
              </div>
            )}
            
            <hr className={`${darkMode ? 'border-gray-600' : 'border-gray-200'} transition-colors duration-300`} />
            
            <div className="flex justify-between text-lg font-bold">
              <span className={`${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                Total
              </span>
              <span className={`${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex space-x-4">
            <Link
              to="/products"
              className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-light' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} px-4 py-3 rounded-lg text-center font-medium transition-colors duration-300`}
            >
              Continue Shopping
            </Link>
            <button
              className="flex-1 bg-primary hover:bg-accent text-white px-4 py-3 rounded-lg font-medium transition-colors duration-300"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}