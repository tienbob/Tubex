import { useState, useEffect } from 'react';
import { productService, orderService, inventoryService } from '../services/api';

interface DashboardData {
  productCount: number;
  orderCount: number;
  inventoryCount: number;
  recentOrders: any[];
  lowStockItems: any[];
}

/**
 * Custom hook to fetch and manage dashboard data
 * @param userId The current user's ID
 * @param companyId The user's company ID
 * @returns Object containing dashboard data, loading state, and error state
 */
const useDashboardData = (userId: string | undefined, companyId: string | undefined) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData>({
    productCount: 0,
    orderCount: 0,
    inventoryCount: 0,
    recentOrders: [],
    lowStockItems: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch products count
        const productsResponse = await productService.getProducts({
          page: 1,
          limit: 1
        });
        
        // Fetch orders (with smaller limit for recent orders)
        const ordersResponse = await orderService.getOrders({
          page: 1,
          limit: 5
        });

        // Fetch inventory items count
        let inventoryCount = 0;
        let lowStockItems: any[] = [];

        if (companyId) {
          // Fetch low stock items
          const lowStockResponse = await inventoryService.checkLowStock(companyId);
          lowStockItems = lowStockResponse.data || [];
          
          // Get inventory count
          const inventoryResponse = await inventoryService.getInventory(companyId);
          inventoryCount = inventoryResponse.data?.length || 0;
        }

        setData({
          productCount: productsResponse.pagination.total,
          orderCount: ordersResponse.pagination.total,
          inventoryCount,
          recentOrders: ordersResponse.orders || [],
          lowStockItems
        });
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, companyId]);

  return { data, loading, error };
};

export default useDashboardData;