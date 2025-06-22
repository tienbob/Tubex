// Test dashboard inventory calculation with sample data
const sampleInventoryData = [
    {
        "id": "f821f48c-6466-41ca-8a73-25fb097d56c2",
        "quantity": "100.00",
        "unit": "piece",
        "min_threshold": "20.00",
        "warehouse_capacity": "20000.00",
        "warehouse_name": "Test 1",
        "product_name": "Nuke",
        "product": {
            "name": "Nuke"
        },
        "warehouse": {
            "capacity": "20000.00"
        }
    }
];

// Simulate the dashboard calculation
const inventoryItems = Array.isArray(sampleInventoryData) ? sampleInventoryData : [];
console.log('Inventory items count:', inventoryItems.length);

const totalQuantity = inventoryItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
console.log('Total quantity:', totalQuantity);

const totalWarehouseCapacity = inventoryItems.reduce((sum, item) => {
    const warehouseCapacity = parseFloat(item.warehouse_capacity) || parseFloat(item.warehouse?.capacity) || 1000;
    return sum + warehouseCapacity;
}, 0);
console.log('Total warehouse capacity:', totalWarehouseCapacity);

const warehouseUtilization = totalWarehouseCapacity > 0 
    ? Math.min(100, Math.round((totalQuantity / totalWarehouseCapacity) * 100))
    : 0;
console.log('Warehouse utilization:', warehouseUtilization + '%');

const lowStockItems = inventoryItems.filter((item) => 
    (item.min_threshold && parseFloat(item.quantity) <= parseFloat(item.min_threshold)) || parseFloat(item.quantity) === 0
);
console.log('Low stock items:', lowStockItems.length);

const summary = {
    totalItems: inventoryItems.length,
    lowStockItems: lowStockItems.length,
    warehouseUtilization
};

console.log('Dashboard summary:', summary);
