import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storeProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storeProducts !== null) {
        setProducts(JSON.parse(storeProducts));
        return;
      }

      setProducts([]);
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    }

    updateProducts();
  }, [products]);

  const increment = useCallback(
    async id => {
      const indexProduct = products.findIndex(product => product.id === id);

      const newArray = [...products];

      newArray[indexProduct] = {
        ...newArray[indexProduct],
        quantity: newArray[indexProduct].quantity + 1,
      };

      setProducts(newArray);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const indexProduct = products.findIndex(product => product.id === id);

      const newArray = [...products];

      if (newArray[indexProduct].quantity === 1) {
        const newArrayDecrement = newArray.filter(product => product.id !== id);

        setProducts(newArrayDecrement);

        return;
      }

      newArray[indexProduct] = {
        ...newArray[indexProduct],
        quantity: newArray[indexProduct].quantity - 1,
      };

      setProducts(newArray);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newArray),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExit = products.filter(item => item.id === product.id);

      if (productExit.length > 0) {
        increment(productExit[0].id);
        return;
      }

      const newProduct: Product = {
        ...product,
        quantity: 1,
      };

      setProducts(state => [...state, newProduct]);
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
