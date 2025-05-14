import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Switch, FormControlLabel } from '@mui/material';
import { useCompanySettings } from '../../contexts/CompanySettingsContext';

interface CompanySelectorProps {
  companyId: string;
  onCompanyChange?: (companyId: string) => void;
}

/**
 * A component for selecting which company's settings to view/edit
 * and option to apply settings company-wide
 */
const CompanySettingsSelector: React.FC<CompanySelectorProps> = ({ 
  companyId,
  onCompanyChange 
}) => {
  const { isCompanyAdmin } = useCompanySettings();
  
  // This would normally fetch from an API
  // For now we'll use mock data
  const userCompanies = [
    { id: companyId, name: 'Current Company' },
    ...(isCompanyAdmin ? [
      { id: 'all', name: 'All Companies' }  
    ] : [])
  ];
  
  const handleCompanyChange = (event: SelectChangeEvent<string>) => {
    if (onCompanyChange) {
      onCompanyChange(event.target.value);
    }
  };

  return (
    <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Company Settings Configuration
      </Typography>
      
      {userCompanies.length > 1 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="company-select-label">Select Company</InputLabel>
          <Select
            labelId="company-select-label"
            value={companyId}
            label="Select Company"
            onChange={handleCompanyChange}
          >
            {userCompanies.map(company => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      
      {isCompanyAdmin && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            As a company admin, you can apply settings to all users in your organization or just to your account.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CompanySettingsSelector;
