import React from 'react';
import ConversationHistory from '../components/History/ConversationHistory';
import { Box, Container } from '@mui/material';

const HistoryPage = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <ConversationHistory />
      </Box>
    </Container>
  );
};

export default HistoryPage;
