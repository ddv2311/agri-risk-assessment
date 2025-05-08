import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import RegionNewsAlerts from '../components/RegionNewsAlerts';
import { useTranslation } from 'react-i18next';

const NewsAlertsPage: React.FC = () => {
  const { t } = useTranslation();
  // For now, we'll use a default location. In a real app, this would come from user preferences or geolocation
  const selectedRegion = localStorage.getItem('selectedRegion') || 'Maharashtra';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t('newsAlerts.title', 'Region News & Alerts')}
      </Typography>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <RegionNewsAlerts location={selectedRegion} />
      </Box>
    </Container>
  );
};

export default NewsAlertsPage; 