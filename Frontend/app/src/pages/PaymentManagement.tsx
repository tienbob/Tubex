import React from 'react';
import { Container } from '@mui/material';
import PaymentManagementComponent from '../components/payment/PaymentManagement';
import { SnackbarProvider } from 'notistack';

const PaymentManagement: React.FC = () => {
  return (
    <Container maxWidth={false} disableGutters>
      <SnackbarProvider maxSnack={3}>
        <PaymentManagementComponent />
      </SnackbarProvider>
    </Container>
  );
};

export default PaymentManagement;
