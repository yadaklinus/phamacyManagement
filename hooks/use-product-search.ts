import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

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
}

interface ProductSearchResult {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface UseProductSearchProps {
  warehouseId: string;
  limit?: number;
}

export const useProductSearch = ({ warehouseId, limit = 50 }: UseProductSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  // Debounced search function
  const debouncedSearch = useMemo<any>(
    () => debounce(async (search: string, page: number = 1) => {
      if (!warehouseId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post('/api/product/search', {
          warehouseId,
          search,
          page,
          limit
        });

        const data: ProductSearchResult = response.data;
        
        if (page === 1) {
          setProducts(data.products);
        } else {
          // For pagination, append to existing products
          setProducts(prev => [...prev, ...data.products]);
        }
        
        setPagination(data.pagination);
      } catch (err) {
        setError('Failed to search products');
        console.error('Product search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300),
    [warehouseId, limit]
  );

  // Search with new term
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    setProducts([]); // Clear previous results
    debouncedSearch(term, 1);
  }, [debouncedSearch]);

  // Load more products (pagination)
  const loadMore = useCallback(() => {
    if (!pagination.hasNext || loading) return;
    debouncedSearch(searchTerm, pagination.currentPage + 1);
  }, [debouncedSearch, searchTerm, pagination.hasNext, pagination.currentPage, loading]);

  // Initial load
  useEffect(() => {
    if (warehouseId) {
      debouncedSearch('', 1);
    }
  }, [warehouseId, debouncedSearch]);

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return {
    searchTerm,
    products,
    loading,
    error,
    pagination,
    search,
    loadMore
  };
};