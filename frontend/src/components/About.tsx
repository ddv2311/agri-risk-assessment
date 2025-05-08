import React from 'react';
import { Container, Typography, Paper, Box, Grid } from '@mui/material';
import { Assessment, Timeline, Info } from '@mui/icons-material';

const About: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        About AgriRisk Assessment
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="body1" paragraph>
          AgriRisk Assessment is an advanced agricultural risk assessment system that helps farmers and agricultural professionals make informed decisions about crop cultivation and risk management.
        </Typography>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Key Features
        </Typography>
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Assessment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Risk Assessment
              </Typography>
              <Typography variant="body2">
                Comprehensive risk evaluation based on location, crop type, and environmental scenarios.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Timeline sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Historical Analysis
              </Typography>
              <Typography variant="body2">
                Track risk trends and patterns over time with detailed historical data visualization.
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Info sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Smart Insights
              </Typography>
              <Typography variant="body2">
                AI-powered analysis providing actionable insights and recommendations.
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Technology Stack
        </Typography>
        
        <Typography variant="body1" paragraph>
          Our system leverages advanced technologies including:
        </Typography>
        
        <ul>
          <li>
            <Typography variant="body1">
              <strong>XGBoost Model:</strong> Machine learning model for accurate risk prediction
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Real-time Data Integration:</strong> Weather, market, and agricultural data
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Interactive Visualizations:</strong> Dynamic charts and graphs for data analysis
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Responsive Design:</strong> Accessible on all devices and screen sizes
            </Typography>
          </li>
        </ul>
      </Paper>
    </Container>
  );
};

export default About; 