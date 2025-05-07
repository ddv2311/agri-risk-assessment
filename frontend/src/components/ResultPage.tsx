import React from 'react';
import { Box, Typography } from '@mui/material';
import { Bar } from 'react-chartjs-2';

const ResultsPage = ({ assessmentData }: { assessmentData: any }) => {
  const { result, formData } = assessmentData;
  const chartData = {
    labels: Object.keys(result.feature_contributions),
    datasets: [
      {
        label: 'Feature Importance',
        data: Object.values(result.feature_contributions),
        backgroundColor: ['#1976d2', '#dc004e', '#ff9800'],
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Risk Score: {result.score}
      </Typography>
      <Typography variant="body1" gutterBottom>
        Reason: {result.reason}
      </Typography>
      <Bar data={chartData} />
    </Box>
  );
};

export default ResultsPage;
