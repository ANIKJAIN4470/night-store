import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '../services/api';
import { Product } from '../types';

const PRODUCTS_QUERY_KEY = ['admin', 'products'];

/**
 * Hook to fetch all products for admin panel
 * Automatically refetches when data becomes stale
 */
export const useAdminProducts = () => {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: async () => {
      const data = await adminGetProducts();
      return data;
    },
    staleTime: 1000 * 60 * 5, // Revalidate after 5 minutes
    refetchOnMount: true,
  });
};

/**
 * Hook to create a new product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
      adminCreateProduct(productData as any),
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
};

/**
 * Hook to update an existing product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      adminUpdateProduct(id, updates as any),
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
};

/**
 * Hook to delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => adminDeleteProduct(productId),
    onSuccess: () => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
};
