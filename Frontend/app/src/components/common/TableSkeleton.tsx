import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Paper,
  Box
} from '@mui/material';

interface TableSkeletonProps {
  rowCount?: number;
  columnCount?: number;
  showHeader?: boolean;
  dense?: boolean;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rowCount = 5,
  columnCount = 5,
  showHeader = true,
  dense = false
}) => {
  return (
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      <Table size={dense ? 'small' : 'medium'} aria-label="loading table placeholder">
        {showHeader && (
          <TableHead>
            <TableRow>
              {Array.from({ length: columnCount }).map((_, col) => (
                <TableCell key={`header-${col}`}>
                  <Skeleton variant="text" width={col === 0 ? '60%' : '40%'} height={24} />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {Array.from({ length: rowCount }).map((_, row) => (
            <TableRow key={`row-${row}`}>
              {Array.from({ length: columnCount }).map((_, col) => (
                <TableCell key={`cell-${row}-${col}`}>
                  <Skeleton 
                    variant="text" 
                    width={(() => {
                      // Create varying widths for more realistic appearance
                      if (col === 0) return '70%';
                      if (col === columnCount - 1) return '30%';
                      return `${Math.floor(Math.random() * 30) + 40}%`;
                    })()}
                    height={20}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// CardSkeleton for dashboard cards
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {Array.from({ length: count }).map((_, index) => (
        <Paper key={index} sx={{ p: 2, width: '100%', maxWidth: 300, flex: '1 1 250px' }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="40%" height={20} />
        </Paper>
      ))}
    </Box>
  );
};

export default TableSkeleton;
