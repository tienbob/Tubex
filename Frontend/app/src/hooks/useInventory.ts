import { useState } from 'react';

export const useInventory = () => {
  const [loading, setLoading] = useState(false);

  const getInventoryItems = async () => {
    setLoading(true);
    try {
      // Placeholder data
      return [
        {
          id: '1',
          product_id: 'p1',
          product_name: 'Product 1',
          warehouse_id: 'w1',
          warehouse_name: 'Warehouse 1',
          quantity: 100,
          unit: 'pcs',
          batch_id: 'b1',
          batch_number: 'B001',
          last_updated: new Date().toISOString(),
        },
      ];
    } finally {
      setLoading(false);
    }
  };

  return { getInventoryItems, loading };
};