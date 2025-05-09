import React from 'react';

interface InventoryFormProps {
  inventoryId?: string;
  companyId: string;
  onSave: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ inventoryId, companyId, onSave }) => {
  return (
    <div>
      <h2>{inventoryId ? 'Edit Inventory' : 'Add Inventory'}</h2>
      <p>Company ID: {companyId}</p>
      <button onClick={onSave}>Save</button>
    </div>
  );
};

export default InventoryForm;
