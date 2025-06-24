import React from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Box,
  TextFieldProps
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import useDebouncedSearch from '../../hooks/useDebouncedSearch';

interface SearchFieldProps extends Omit<TextFieldProps, 'onChange'> {
  /**
   * Callback function triggered when search is performed (after debounce)
   */
  onSearch?: (query: string) => void;
  
  /**
   * Debounce delay in milliseconds
   * @default 500
   */
  debounceDelay?: number;
  
  /**
   * Minimum number of characters required to trigger search
   * @default 2
   */
  minSearchChars?: number;
  
  /**
   * Initial search value
   * @default ''
   */
  initialValue?: string;
  
  /**
   * Placeholder text for the search field
   * @default 'Search...'
   */
  placeholder?: string;
}

/**
 * A reusable search field component with debounced search functionality
 */
const SearchField: React.FC<SearchFieldProps> = ({
  onSearch,
  debounceDelay = 500,
  minSearchChars = 2,
  initialValue = '',
  placeholder = 'Search...',
  size = 'medium',
  fullWidth = true,
  variant = 'outlined',
  ...props
}) => {
  const {
    searchValue,
    isSearching,
    handleSearchChange,
    clearSearch,
    executeSearch
  } = useDebouncedSearch({
    delay: debounceDelay,
    minChars: minSearchChars,
    onSearch,
    initialValue
  });
  
  // Handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  return (
    <TextField
      {...props}
      value={searchValue}
      onChange={(e) => handleSearchChange(e.target.value)}
      onKeyPress={handleKeyPress}
      placeholder={placeholder}
      size={size}
      fullWidth={fullWidth}
      variant={variant}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {isSearching && <CircularProgress size={20} sx={{ mr: 1 }} />}
              {searchValue && (
                <IconButton 
                  size="small" 
                  onClick={clearSearch}
                  edge="end"
                  aria-label="clear search"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </InputAdornment>
        ),
        ...props.InputProps
      }}
    />
  );
};

export default SearchField;
