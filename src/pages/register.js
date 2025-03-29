import React from 'react';
import Register from '../components/Auth/Register';
import { Box, Container } from '@mui/material';

const RegisterPage = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Register />
      </Box>
    </Container>
  );
};

export default RegisterPage;