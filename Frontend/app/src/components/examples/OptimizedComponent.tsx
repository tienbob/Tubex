import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  TextField,
  CircularProgress
} from '@mui/material';

// Import our custom hooks and components
import SearchField from '../ui/SearchField';
import { useNotificationContext } from '../../contexts/NotificationContext';
import useApiRequest from '../../hooks/useApiRequest';
import useTableData from '../../hooks/useTableData';
import useForm from '../../hooks/useForm';

// Example form interface
interface ExampleFormData {
  title: string;
  description: string;
  category: string;
}

/**
 * Example component demonstrating the use of our optimized hooks and components
 */
const OptimizedComponent: React.FC = () => {
  // Use the notification context
  const { success, error, info } = useNotificationContext();
  
  // Example form with validation
  const exampleForm = useForm<ExampleFormData>({
    initialValues: {
      title: '',
      description: '',
      category: 'general'
    },
    validate: (values) => {
      const errors: Partial<Record<keyof ExampleFormData, string>> = {};
      
      if (!values.title.trim()) {
        errors.title = 'Title is required';
      }
      
      if (!values.description.trim()) {
        errors.description = 'Description is required';
      }
      
      return errors;
    },
    onSubmit: async (values) => {
      try {
        // This would be an actual API call in a real component
        console.log('Submitting form data:', values);
        
        // Show success notification
        success('Form submitted successfully!');
        
        // Reset the form
        exampleForm.resetForm();
      } catch (err) {
        // Show error notification
        error('Failed to submit form. Please try again.');
        console.error('Form submission error:', err);
      }
    }
  });
  
  // Example API request
  const dataRequest = useApiRequest(
    async () => {
      // This would be an actual API call in a real component
      // Simulating API call with timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
            totalCount: 2
          });
        }, 1000);
      });
    },
    [],
    {
      onSuccess: (data) => {
        success('Data loaded successfully');
      },
      onError: (err) => {
        error(`Failed to load data: ${err.message}`);
      }
    }
  );
  
  // Example table data
  const tableData = useTableData({
    defaultSortBy: 'id',
    defaultSortDirection: 'asc',
    fetchDataFn: async (params) => {
      // This would call an actual API with the params
      console.log('Fetching table data with params:', params);
      
      // Simulating API response
      return {
        data: [
          { id: 1, name: 'Record 1', category: 'A' },
          { id: 2, name: 'Record 2', category: 'B' }
        ],
        totalCount: 2
      };
    }
  });
  
  // Handle search
  const handleSearch = (query: string) => {
    info(`Searching for: ${query}`);
    tableData.handleSearchQueryChange(query);
  };
  
  // Example of fetching data on mount
  useEffect(() => {
    dataRequest.request();
  }, []);
  
  // Example of fetching table data when needed
  useEffect(() => {
    tableData.fetchData();
  }, [tableData.page, tableData.sortBy, tableData.sortDirection, tableData.searchQuery]);
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Optimized Component Example
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Search Example */}
        <Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Search Example (with debounced search)
            </Typography>
            <SearchField
              onSearch={handleSearch}
              debounceDelay={500}
              minSearchChars={2}
              placeholder="Search records..."
            />
          </Paper>
        </Box>
        
        {/* API Request and Form Example Side by Side */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* API Request Example */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                API Request Example
              </Typography>
              {dataRequest.isLoading ? (
                <Typography>Loading data...</Typography>
              ) : dataRequest.error ? (
                <Typography color="error">Error: {dataRequest.error.message}</Typography>
              ) : (
                <Box>
                  <Typography>Data loaded successfully!</Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => dataRequest.request()}
                    sx={{ mt: 2 }}
                  >
                    Refresh Data
                  </Button>
                </Box>
              )}
            </Paper>
          </Box>
          
          {/* Form Example */}
          <Box sx={{ flex: 1 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Form Example (with validation)
              </Typography>
              <form onSubmit={(e) => {
                e.preventDefault();
                exampleForm.handleSubmit();
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <TextField
                      label="Title"
                      fullWidth
                      {...exampleForm.getFieldProps('title')}
                      error={!!exampleForm.touched.title && !!exampleForm.errors.title}
                      helperText={exampleForm.touched.title ? exampleForm.errors.title : ''}
                    />
                  </Box>
                  <Box>
                    <TextField
                      label="Description"
                      fullWidth
                      multiline
                      rows={3}
                      {...exampleForm.getFieldProps('description')}
                      error={!!exampleForm.touched.description && !!exampleForm.errors.description}
                      helperText={exampleForm.touched.description ? exampleForm.errors.description : ''}
                    />
                  </Box>
                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={exampleForm.isSubmitting}
                    >
                      {exampleForm.isSubmitting ? 'Submitting...' : 'Submit Form'}
                    </Button>
                  </Box>
                </Box>
              </form>
            </Paper>
          </Box>
        </Box>
        
        {/* Notification Examples */}
        <Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Notification Examples
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                color="success"
                onClick={() => success('Operation completed successfully!')}
              >
                Success Notification
              </Button>
              <Button 
                variant="outlined" 
                color="error"
                onClick={() => error('An error occurred while processing your request.')}
              >
                Error Notification
              </Button>
              <Button 
                variant="outlined" 
                color="warning"
                onClick={() => info('Information: System maintenance scheduled for tonight.')}
              >
                Info Notification
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => success('Action completed!', { 
                  action: { 
                    label: 'Undo', 
                    onClick: () => info('Undo action triggered') 
                  }
                })}
              >
                Notification with Action
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
      
      {/* Documentation */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Component Documentation
        </Typography>
        <Typography variant="body1" paragraph>
          This component demonstrates the use of our optimized hooks and components:
        </Typography>
        <Typography component="ul">
          <li><strong>useNotificationContext</strong>: For showing success, error, and info messages</li>
          <li><strong>useApiRequest</strong>: For making API calls with loading, success, and error states</li>
          <li><strong>useTableData</strong>: For managing table data with pagination, sorting, and filtering</li>
          <li><strong>useForm</strong>: For form state management with validation</li>
          <li><strong>SearchField</strong>: For debounced search functionality</li>
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          These optimized components and hooks make it easier to build consistent, 
          performant, and maintainable React components across the application.
        </Typography>
      </Box>
    </Box>
  );
};

export default OptimizedComponent;
