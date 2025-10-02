import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Product {
  id: string;
  name: string;
  barcode: string;
  cost: number;
  wholeSalePrice: number;
  retailPrice: number;
  quantity: number;
  unit: string;
  taxRate: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  sync: boolean;
  isDeleted: boolean;
}

interface PaginatedProductsResult {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
  };
}

interface UsePaginatedProductsProps {
  warehouseId: string;
  limit?: number;
}

export const usePaginatedProducts = ({ warehouseId, limit = 50 }: UsePaginatedProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
    limit
  });

  const [filters, setFilters] = useState({
    search: '',
    categoryFilter: 'all',
    statusFilter: 'all'
  });

  const fetchProducts = useCallback(async (page: number = 1, newFilters = filters) => {
    if (!warehouseId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/product/list-paginated', {
        warehouseId,
        page,
        limit,
        ...newFilters
      });

      const data: PaginatedProductsResult = response.data;
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Products fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, limit, filters]);

  // Initial load
  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  // Navigate to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages && !loading) {
      fetchProducts(page);
    }
  }, [fetchProducts, pagination.totalPages, loading]);

  // Next page
  const nextPage = useCallback(() => {
    if (pagination.hasNext && !loading) {
      goToPage(pagination.currentPage + 1);
    }
  }, [goToPage, pagination.hasNext, pagination.currentPage, loading]);

  // Previous page
  const prevPage = useCallback(() => {
    if (pagination.hasPrev && !loading) {
      goToPage(pagination.currentPage - 1);
    }
  }, [goToPage, pagination.hasPrev, pagination.currentPage, loading]);

  // Update filters and refresh
  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchProducts(1, updatedFilters);
  }, [filters, fetchProducts]);

  // Refresh current page
  const refresh = useCallback(() => {
    fetchProducts(pagination.currentPage);
  }, [fetchProducts, pagination.currentPage]);

  return {
    products,
    loading,
    error,
    pagination,
    filters,
    goToPage,
    nextPage,
    prevPage,
    updateFilters,
    refresh
  };
};