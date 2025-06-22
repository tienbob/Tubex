import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Autocomplete,
  TextField,
  FormHelperText,
  Chip,
  Box,
  Typography,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { productService } from '../../services/api/productService';

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
}

interface SmartCategoryInputProps {
  companyId: string;
  value: string;
  onChange: (categoryId: string, categoryName?: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  helperText?: string;
}

const SmartCategoryInput: React.FC<SmartCategoryInputProps> = ({
  companyId,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  label = "Product Category",
  helperText = "Choose or create a category that best describes your product"
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');

  // Fetch existing categories
  useEffect(() => {
    fetchCategories();
  }, [companyId]);

  // Update selected category when value changes
  useEffect(() => {
    if (value && categories.length > 0) {
      const found = categories.find(cat => cat.id === value);
      setSelectedCategory(found || null);
      setInputValue(found?.name || '');
    } else {
      setSelectedCategory(null);
      setInputValue('');
    }
  }, [value, categories]);

  const fetchCategories = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const response = await productService.getCategories(companyId);
      setCategories(response.data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };
  const handleCategoryChange = (event: any, newValue: ProductCategory | string | null) => {
    console.log('SmartCategoryInput handleCategoryChange:', { newValue, type: typeof newValue });
    
    if (typeof newValue === 'string') {
      // User typed a new category name
      setNewCategoryName(newValue);
      setSelectedCategory(null);
      setInputValue(newValue);
      // Pass the new category name to parent
      onChange('', newValue);
    } else if (newValue) {
      // User selected an existing category
      setSelectedCategory(newValue);
      setInputValue(newValue.name);
      setNewCategoryName('');
      onChange(newValue.id);
    } else {
      // User cleared the selection
      setSelectedCategory(null);
      setInputValue('');
      setNewCategoryName('');
      onChange('');
    }
  };

  const handleInputChange = (event: any, newInputValue: string) => {
    console.log('SmartCategoryInput handleInputChange:', { newInputValue });
    setInputValue(newInputValue);
    
    // Check if the input matches any existing category
    const exactMatch = categories.find(cat => 
      cat.name.toLowerCase() === newInputValue.toLowerCase()
    );
    
    if (exactMatch) {
      // If exact match found, treat as selecting existing category
      setSelectedCategory(exactMatch);
      setNewCategoryName('');
      onChange(exactMatch.id);
    } else if (newInputValue.trim()) {
      // If no exact match but has value, treat as new category
      setSelectedCategory(null);
      setNewCategoryName(newInputValue.trim());
      onChange('', newInputValue.trim());
    } else {
      // If empty, clear everything
      setSelectedCategory(null);
      setNewCategoryName('');
      onChange('');
    }
  };

  const isNewCategory = !selectedCategory && inputValue.trim() !== '' && 
    !categories.some(cat => cat.name.toLowerCase() === inputValue.toLowerCase());

  return (
    <FormControl fullWidth required={required} error={!!error} disabled={disabled}>
      <Autocomplete
        options={categories}
        getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
        value={selectedCategory}        onChange={handleCategoryChange}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        freeSolo
        loading={loading}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={categories.length === 0 ? "No categories yet - type to create one" : "Select or type to create category"}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? null : params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography variant="body2">{option.name}</Typography>
              {option.description && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ ml: 1, fontStyle: 'italic' }}
                >
                  - {option.description}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => (
            <Chip
              variant="outlined"
              label={typeof option === 'string' ? option : option.name}
              {...getTagProps({ index })}
              key={index}
            />
          ))
        }
        noOptionsText={
          <Box sx={{ p: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {inputValue.trim() ? `Press Enter to create "${inputValue}"` : 'Start typing to create a new category'}
            </Typography>
          </Box>
        }
      />
      
      {/* Show info about new category creation */}
      {isNewCategory && (
        <Alert 
          severity="info" 
          sx={{ mt: 1 }}
          icon={<AddIcon />}
        >
          <Typography variant="body2">
            New category "{inputValue}" will be created when you save the product
          </Typography>
        </Alert>
      )}
      
      {/* Helper text or error */}
      <FormHelperText>
        {error || helperText}
      </FormHelperText>
    </FormControl>
  );
};

export default SmartCategoryInput;
