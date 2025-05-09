import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

interface InventoryAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  item: any;
  onSuccess: () => void;
}

const InventoryAdjustmentModal: React.FC<InventoryAdjustmentModalProps> = ({ open, onClose, item, onSuccess }) => {
  const handleSave = () => {
    // Placeholder for save logic
    onSuccess();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Adjust Inventory</DialogTitle>
      <DialogContent>
        <p>Adjusting inventory for: {item.product_name}</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryAdjustmentModal;