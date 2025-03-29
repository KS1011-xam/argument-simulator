import React from 'react';
import Login from '../components/Auth/Login';
import { Box, Container } from '@mui/material';

const LoginPage = () => {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Login />
      </Box>
    </Container>
  );
};

export default LoginPage;
