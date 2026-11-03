import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../services/api';
import { Product } from '../types';

const CUSTOMER_PRODUCTS_QUERY_KEY = ['customer', 'products'];

/**
 * Hook for customer-side product fetching with real-time polling
 * Automatically refetches products at regular intervals to show real-time updates
 */
export const useCustomerProducts = (options?: {
  category?: string;
  search?: string;
  availableOnly?: boolean;
  refetchInterval?: number; // In milliseconds, default 30 seconds
}) => {
  return useQuery({
    queryKey: [CUSTOMER_PRODUCTS_QUERY_KEY, options?.category, options?.search, options?.availableOnly],
    queryFn: async () => {
      const data = await fetchProducts({
        category: options?.category,
        search: options?.search,
        availableOnly: options?.availableOnly,
      });
      return data;
    },
    staleTime: 1000 * 20, // Consider data stale after 20 seconds
    refetchInterval: options?.refetchInterval ?? 1000 * 30, // Refetch every 30 seconds by default
    refetchOnWindowFocus: false, // Don't refetch just because window regained focus
    refetchIntervalInBackground: true, // Keep polling even if tab is in background
  });
};

/**
 * Hook for fetching a single product by ID on customer side
 */
export const useCustomerProductById = (productId: string, refetchInterval?: number) => {
  return useQuery({
    queryKey: [CUSTOMER_PRODUCTS_QUERY_KEY, productId],
    queryFn: async () => {
      // Since we don't have a dedicated single product endpoint, 
      // we fetch all products and filter
      // In production, you'd want a dedicated endpoint
      const products = await fetchProducts();
      return products.find(p => p.id === productId) || null;
    },
    staleTime: 1000 * 20,
    refetchInterval: refetchInterval ?? 1000 * 30,
    refetchOnWindowFocus: false,
    enabled: !!productId,
  });
};

/**
 * Invalidate customer products cache (call after creating/updating orders)
 */
export const invalidateCustomerProducts = (queryClient: any) => {
  queryClient.invalidateQueries({ queryKey: CUSTOMER_PRODUCTS_QUERY_KEY });
};
