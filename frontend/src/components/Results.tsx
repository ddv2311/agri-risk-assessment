import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button } from '@mui/material';

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    return (
      <Box sx={{ p: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            No results to display.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/')}>Go Back</Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" color="primary" gutterBottom>
          Risk Assessment Results
        </Typography>
        <Typography variant="h6" gutterBottom>
          Risk Score: {result.risk_score}
        </Typography>
        <Typography variant="body1" gutterBottom>
          Category: {result.risk_category}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Explanation: {result.explanation}
        </Typography>
        {/* You can add more details or charts here */}
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/')}>New Assessment</Button>
      </Paper>
    </Box>
  );
};

export default Results; 