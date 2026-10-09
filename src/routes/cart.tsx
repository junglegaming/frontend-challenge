import { createFileRoute } from '@tanstack/react-router';
import { CartPage } from '@/features/cart/components/CartPage';

export const Route = createFileRoute('/cart')({
  component: CartPage,
});
