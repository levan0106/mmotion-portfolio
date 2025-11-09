import React from 'react';
import { Box, Container } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAccount } from '../contexts/AccountContext';
import { GoalsList } from '../components/Goals';

const Goals: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId?: string }>();
  const { accountId } = useAccount();

  if (!accountId) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <div>Please login to access goals</div>
        </Box>
      </Container>
    );
  }

  return (
    <Box>
        <GoalsList accountId={accountId} portfolioId={portfolioId} />
    </Box>
  );
};

export default Goals;
