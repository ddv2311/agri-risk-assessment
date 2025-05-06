import React from 'react';
import { 
  Box, Typography, LinearProgress, Card, CardContent, 
  Divider, Stack, useTheme, Button, IconButton
} from '@mui/material';
import { 
  WarningAmberOutlined as WarningIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon
} from '@mui/icons-material';

interface RiskResultsProps {
  result: {
    score: number;
    reason: string;
    feature_contributions: {
      [key: string]: number;
    };
  };
}

const RiskResults: React.FC<RiskResultsProps> = ({ result }) => {
  const theme = useTheme();
  const { score, reason, feature_contributions } = result;
  
  // Determine risk level and styling
  const getRiskLevel = (score: number) => {
    if (score < 0.3) return { level: 'Low Risk', color: 'success.main', icon: <CheckIcon /> };
    if (score < 0.7) return { level: 'Moderate Risk', color: 'warning.main', icon: <WarningIcon /> };
    return { level: 'High Risk', color: 'error.main', icon: <ErrorIcon /> };
  };
  
  const riskInfo = getRiskLevel(score);
  
  // Generate recommendations based on risk level
  const getRecommendations = () => {
    if (score < 0.3) {
      return [
        'Continue with current agricultural practices',
        'Monitor weather forecasts regularly',
        'Consider crop insurance as a precautionary measure'
      ];
    } else if (score < 0.7) {
      return [
        'Implement water conservation techniques',
        'Consider diversifying crop portfolio',
        'Invest in moderate protection measures',
        'Review and update contingency plans'
      ];
    } else {
      return [
        'Implement immediate risk mitigation strategies',
        'Consider alternative crop selection for next season',
        'Invest in advanced protection systems',
        'Consult with agricultural experts for personalized advice',
        'Apply for government assistance programs if available'
      ];
    }
  };
  
  const recommendations = getRecommendations();
  
  // Format date for report
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Handle report actions
  const handleDownloadReport = () => {
    alert('Report download functionality will be implemented in the next version');
  };

  const handleShareReport = () => {
    alert('Report sharing functionality will be implemented in the next version');
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <Box>
      {/* Summary Card */}
      <Card 
        elevation={3} 
        sx={{ 
          mb: 4, 
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            height: 8, 
            width: '100%', 
            bgcolor: riskInfo.color,
            position: 'absolute',
            top: 0
          }} 
        />
        <CardContent sx={{ pt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 1.5,
                borderRadius: '50%',
                bgcolor: `${riskInfo.color}15`,
                color: riskInfo.color,
                mr: 2
              }}
            >
              {riskInfo.icon}
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Assessment Result
              </Typography>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                {riskInfo.level}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={handleDownloadReport} title="Download Report">
                <DownloadIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleShareReport} title="Share Report">
                <ShareIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handlePrintReport} title="Print Report">
                <PrintIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Risk Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h3" component="div" sx={{ fontWeight: 700, color: riskInfo.color }}>
                    {(score * 100).toFixed(0)}%
                  </Typography>
                  <Box sx={{ flexGrow: 1, ml: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={score * 100}
                      color={score < 0.3 ? 'success' : score < 0.7 ? 'warning' : 'error'}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </Box>
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Assessment Summary
              </Typography>
              <Typography variant="body1" paragraph>
                {reason}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                Report generated on {currentDate}
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Contributing Factors
              </Typography>
              <Box sx={{ mb: 3 }}>
                {Object.entries(feature_contributions).map(([feature, contribution]) => (
                  <Box key={feature} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {feature.charAt(0).toUpperCase() + feature.slice(1)}
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {(contribution * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={contribution * 100}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: `${theme.palette.primary.main}15`,
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Recommendations Card */}
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon color="info" sx={{ mr: 1 }} />
            <Typography variant="h6">Recommendations</Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Based on your risk assessment, we recommend the following actions:
          </Typography>
          
          <Stack spacing={1} sx={{ mt: 2 }}>
            {recommendations.map((recommendation, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 1.5, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2">
                  {index + 1}. {recommendation}
                </Typography>
              </Box>
            ))}
          </Stack>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              color="primary"
              startIcon={<InfoIcon />}
              onClick={() => alert('Detailed recommendations will be available in the next version')}
            >
              Get Detailed Recommendations
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RiskResults;
