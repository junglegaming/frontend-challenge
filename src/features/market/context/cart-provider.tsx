import type { NFT, NFTEdition } from "@/data/nfts";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  nft: NFT;
  quantity: number;
  edition: NFTEdition;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addToCart: (nft: NFT, quantity: number, edition: NFTEdition) => void;
  removeFromCart: (nftId: string, edition: NFTEdition) => void;
  updateQuantity: (
    nftId: string,
    edition: NFTEdition,
    quantity: number,
  ) => void;
  clearCart: () => void;
}

interface CartProviderProps {
  children: ReactNode;
  userId: string | null;
}

const getCartStorageKey = (userId: string | null) =>
  userId ? `kurio-cart-${userId}` : "kurio-cart-guest";

const CartContext = createContext<CartContextValue | null>(null);

function getStoredCart(userId: string | null): CartItem[] {
  try {
    const storedCart = localStorage.getItem(getCartStorageKey(userId));

    if (!storedCart) return [];

    const parsedCart: unknown = JSON.parse(storedCart);

    return Array.isArray(parsedCart) ? (parsedCart as CartItem[]) : [];
  } catch {
    return [];
  }
}

function mergeCart(
  existingCart: CartItem[],
  incomingCart: CartItem[],
): CartItem[] {
  const mergedCart = [...existingCart];

  for (const incomingItem of incomingCart) {
    const existingIndex = mergedCart.findIndex(
      (item) =>
        item.nft.id === incomingItem.nft.id &&
        item.edition === incomingItem.edition,
    );

    if (existingIndex !== -1) {
      mergedCart[existingIndex] = {
        ...mergedCart[existingIndex],
        quantity: mergedCart[existingIndex].quantity + incomingItem.quantity,
      };
    } else {
      mergedCart.push(incomingItem);
    }
  }

  return mergedCart;
}

function getInitialCart(userId: string | null): CartItem[] {
  if (!userId) {
    return getStoredCart(null);
  }

  const userCart = getStoredCart(userId);
  const guestCart = getStoredCart(null);

  return mergeCart(userCart, guestCart);
}

export function CartProvider({ children, userId }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => getInitialCart(userId));

  const previousUserId = useRef(userId);

  useEffect(() => {
    if (previousUserId.current !== userId) {
      const previousId = previousUserId.current;

      if (userId) {
        const userCart = getStoredCart(userId);

        const incomingCart = previousId === null ? items : [];

        const mergedCart = mergeCart(userCart, incomingCart);

        setItems(mergedCart);

        localStorage.setItem(
          getCartStorageKey(userId),
          JSON.stringify(mergedCart),
        );

        localStorage.removeItem(getCartStorageKey(null));
      } else {
        if (previousId) {
          localStorage.removeItem(getCartStorageKey(previousId));
        }

        setItems([]);
      }

      previousUserId.current = userId;
      return;
    }

    localStorage.setItem(getCartStorageKey(userId), JSON.stringify(items));

    if (userId) {
      localStorage.removeItem(getCartStorageKey(null));
    }
  }, [items, userId]);

  const addToCart = useCallback(
    (nft: NFT, quantity: number, edition: NFTEdition) => {
      setItems((currentItems) => {
        const existingItem = currentItems.find(
          (item) => item.nft.id === nft.id && item.edition === edition,
        );

        if (existingItem) {
          return currentItems.map((item) =>
            item.nft.id === nft.id && item.edition === edition
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                }
              : item,
          );
        }

        return [...currentItems, { nft, quantity, edition }];
      });
    },
    [],
  );

  const removeFromCart = useCallback((nftId: string, edition: NFTEdition) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) => item.nft.id !== nftId || item.edition !== edition,
      ),
    );
  }, []);

  const updateQuantity = useCallback(
    (nftId: string, edition: NFTEdition, quantity: number) => {
      if (quantity < 1) return;

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.nft.id === nftId && item.edition === edition
            ? { ...item, quantity }
            : item,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const subtotal = items.reduce(
    (total, item) => total + item.nft.price * item.quantity,
    0,
  );

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      totalItems,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart deve ser utilizado dentro de CartProvider.");
  }

  return context;
}
