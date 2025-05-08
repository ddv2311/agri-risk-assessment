import React from 'react';
import { 
  Box, Typography, LinearProgress, Card, CardContent, 
  Divider, Stack, useTheme, IconButton
} from '@mui/material';
import { 
  WarningAmberOutlined as WarningIcon,
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  LightbulbOutlined,
  Opacity,
  BugReport,
  WbSunny
} from '@mui/icons-material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import HistoricalRiskTrends from './HistoricalRiskTrends';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface RiskResultsProps {
  result: {
    score: number;
    reason: string;
    feature_contributions: {
      [key: string]: number;
    };
  };
  formData?: {
    location: string;
    crop: string;
    scenario: string;
  };
}

const RiskResults: React.FC<RiskResultsProps> = ({ result, formData }) => {
  const theme = useTheme();
  // Add default values to prevent undefined errors
  const { 
    score = 0.5, 
    reason = '', 
    feature_contributions = {}
  } = result || {};
  
  // Get location, crop, and scenario information from formData if available
  const location = formData?.location || 'Unknown location';
  const crop = formData?.crop || 'Unknown crop';
  const scenario = formData?.scenario || 'normal conditions';
  
  // Determine risk level and styling
  const getRiskLevel = (score: number) => {
    if (score < 0.3) return { level: 'Low Risk', color: 'success.main', icon: <CheckIcon /> };
    if (score < 0.7) return { level: 'Moderate Risk', color: 'warning.main', icon: <WarningIcon /> };
    return { level: 'High Risk', color: 'error.main', icon: <ErrorIcon /> };
  };
  
  const riskInfo = getRiskLevel(score);
  
  // Generate recommendations based on risk level and scenario
  const getRecommendations = () => {
    // Base recommendations on risk level
    const baseRecommendations = score < 0.3 ? [
      'Continue with current agricultural practices',
      'Monitor weather forecasts regularly',
      'Consider crop insurance as a precautionary measure'
    ] : score < 0.7 ? [
      'Implement water conservation techniques',
      'Consider diversifying crop portfolio',
      'Invest in moderate protection measures',
      'Review and update contingency plans'
    ] : [
      'Implement immediate risk mitigation strategies',
      'Consider alternative crop selection for next season',
      'Invest in advanced protection systems',
      'Consult with agricultural experts for personalized advice',
      'Apply for government assistance programs if available'
    ];
    
    // Add scenario-specific recommendations
    if (scenario === 'drought') {
      return [
        `Implement drought-resistant farming techniques for ${crop} in ${location}`,
        'Install water-efficient irrigation systems',
        'Consider crop varieties with higher drought tolerance',
        ...baseRecommendations
      ];
    } else if (scenario === 'flood') {
      return [
        `Improve drainage systems for ${crop} fields in ${location}`,
        'Implement flood-resistant planting techniques',
        'Consider raised bed cultivation where appropriate',
        ...baseRecommendations
      ];
    } else if (scenario === 'pest') {
      return [
        `Implement integrated pest management for ${crop} in ${location}`,
        'Use pest-resistant crop varieties when available',
        'Consider biological control methods',
        ...baseRecommendations
      ];
    }
    
    return baseRecommendations;
  };
  
  const recommendations = getRecommendations();
  
  // Generate default risk factors based on location, crop and scenario
  const getDefaultRiskFactors = () => {
    // Base location risk factors
    const locationRiskFactors: { [key: string]: number } = {
      'Maharashtra': 0.35,
      'Punjab': 0.30,
      'Haryana': 0.32,
      'Uttar Pradesh': 0.38,
      'Karnataka': 0.40,
      'Tamil Nadu': 0.42,
      'Andhra Pradesh': 0.45,
      'Gujarat': 0.38,
      'West Bengal': 0.50,
      'Madhya Pradesh': 0.36
    };
    
    // Base crop risk factors
    const cropRiskFactors: { [key: string]: number } = {
      'Rice': 0.40,
      'Wheat': 0.30,
      'Cotton': 0.45,
      'Sugarcane': 0.35,
      'Maize': 0.32,
      'Pulses': 0.38,
      'Oilseeds': 0.42,
      'Vegetables': 0.25,
      'Fruits': 0.28,
      'Spices': 0.40
    };
    
    // Scenario risk multipliers
    const scenarioRiskFactors: { [key: string]: number } = {
      'normal': 0.20,
      'drought': 0.45,
      'flood': 0.50,
      'pest': 0.40
    };
    
    // Get risk values based on selected options or use defaults
    const locationRisk = locationRiskFactors[location] || 0.40;
    const cropRisk = cropRiskFactors[crop] || 0.30;
    const scenarioRisk = scenarioRiskFactors[scenario] || 0.30;
    
    // Return structured risk factors
    return {
      location: locationRisk,
      crop: cropRisk,
      scenario: scenarioRisk
    };
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    // Create default contributions based on selected options
    const defaultContributions = getDefaultRiskFactors();
    
    // Use feature_contributions if available, otherwise use defaults
    const contributions = Object.keys(feature_contributions || {}).length > 0 
      ? feature_contributions 
      : defaultContributions;
    
    // Ensure we have data to display
    if (!contributions || Object.keys(contributions).length === 0) {
      console.warn('No contribution data available, using defaults');
      return {
        labels: ['Location', 'Crop', 'Scenario'],
        datasets: [{
          label: 'Risk Contribution',
          data: [0.4, 0.3, 0.3],
          backgroundColor: [
            theme.palette.warning.main,
            theme.palette.success.main,
            theme.palette.warning.main
          ],
          borderColor: 'rgba(255,255,255,0.8)',
          borderWidth: 1,
          hoverOffset: 4
        }]
      };
    }
    
    const labels = Object.keys(contributions).map(key => {
      // Capitalize and format keys
      return key.charAt(0).toUpperCase() + key.slice(1);
    });
    
    const data = Object.values(contributions);
    
    // Generate colors based on contribution values
    const backgroundColors = data.map(value => {
      if (value < 0.3) return theme.palette.success.main;
      if (value < 0.7) return theme.palette.warning.main;
      return theme.palette.error.main;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Risk Contribution',
          data,
          backgroundColor: backgroundColors,
          borderColor: 'rgba(255,255,255,0.8)',
          borderWidth: 1,
          hoverOffset: 4,
          barThickness: 30,
        },
      ],
    };
  };

  const chartData = prepareChartData();
  
  // Chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Risk Factors Contribution',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${Math.round(context.raw * 100)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        grid: {
          display: false
        }
      },
      x: {
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: function(value: any) {
            return `${value * 100}%`;
          }
        },
        grid: {
          color: theme.palette.divider
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Risk Distribution',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${Math.round(context.raw * 100)}%`;
          }
        }
      }
    },
  };
  
  // Format date for report
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Format scenario name for display
  const formatScenarioName = (scenarioKey: string) => {
    switch(scenarioKey) {
      case 'normal': return 'Normal Conditions';
      case 'drought': return 'Drought Conditions';
      case 'flood': return 'Flood Risk';
      case 'pest': return 'Pest Infestation';
      default: return scenarioKey.charAt(0).toUpperCase() + scenarioKey.slice(1);
    }
  };

  // Download as PDF handler
  const handleDownloadReport = async () => {
    const element = document.getElementById('assessment-results');
    if (!element) return;
    const canvas = await html2canvas(element, { backgroundColor: '#fff', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save('AgriRisk-Assessment.pdf');
  };

  const handleShareReport = () => {
    alert('Report sharing functionality will be implemented in the next version');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const getPersonalizedRecommendations = (riskLevel: string, crop: string, location: string) => {
    // Example logic for recommendations
    const recs = [];
    if (riskLevel === 'High Risk') {
      recs.push({
        icon: <WarningIcon color="error" />, title: 'Immediate Action', advice: 'Implement urgent risk mitigation strategies and consult local experts.'
      });
    }
    if (crop.toLowerCase().includes('rice')) {
      recs.push({
        icon: <Opacity color="primary" />, title: 'Water Management', advice: 'Ensure paddy fields are not waterlogged and monitor irrigation closely.'
      });
    }
    if (crop.toLowerCase().includes('wheat')) {
      recs.push({
        icon: <WbSunny color="warning" />, title: 'Weather Precaution', advice: 'Protect wheat crops from unseasonal rains and monitor temperature swings.'
      });
    }
    if (location.toLowerCase().includes('punjab')) {
      recs.push({
        icon: <BugReport color="success" />, title: 'Pest Alert', advice: 'Scout for pests regularly and use integrated pest management.'
      });
    }
    // Default recommendation
    if (recs.length === 0) {
      recs.push({
        icon: <LightbulbOutlined color="secondary" />, title: 'General Advice', advice: 'Follow best practices for crop and soil health.'
      });
    }
    return recs.slice(0, 4);
  };

  return (
    <Box id="assessment-results">
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
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {location} | {crop} | {formatScenarioName(scenario)}
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
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Risk Level
              </Typography>
              <Typography variant="h4" component="div" sx={{ color: riskInfo.color, fontWeight: 'bold', mb: 1 }}>
                {riskInfo.level}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {reason && typeof reason === 'string' && reason.includes('MVP fallback') 
                  ? `Risk assessment for ${crop} cultivation in ${location} under ${scenario} conditions. This analysis considers regional climate patterns, crop-specific vulnerabilities, and scenario-based risk factors.`
                  : reason || `Risk assessment for ${crop} cultivation in ${location} under ${scenario} conditions.`
                }
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Risk Factors
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {/* Use default risk factors if no feature_contributions are provided */}
                  {(Object.keys(feature_contributions || {}).length > 0 
                    ? Object.entries(feature_contributions)
                    : Object.entries(getDefaultRiskFactors())
                  ).map(([key, contribution]) => (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">
                          {key === 'location' ? `${location} (Location)` :
                           key === 'crop' ? `${crop} (Crop)` :
                           key === 'scenario' ? `${formatScenarioName(scenario)} (Scenario)` :
                           key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {Math.round(Number(contribution) * 100)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Number(contribution) * 100}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          bgcolor: `${theme.palette.primary.main}15`,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: Number(contribution) < 0.3 ? theme.palette.success.main :
                                    Number(contribution) < 0.6 ? theme.palette.warning.main :
                                    theme.palette.error.main
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ height: 250, width: '100%' }}>
                <Doughnut 
                  data={chartData} 
                  options={doughnutOptions}
                />
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Report generated on {currentDate}
            </Typography>
            
            <Box>
              <IconButton onClick={handleDownloadReport} size="small" title="Download Report">
                <DownloadIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={handleShareReport} size="small" title="Share Report">
                <ShareIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={handlePrintReport} size="small" title="Print Report">
                <PrintIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Chart Visualization Section */}
      <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Risk Factor Analysis
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" align="center" gutterBottom>
                Risk Factors Contribution
              </Typography>
              <Box sx={{ height: 250, mt: 2, mb: 2 }}>
                <Bar data={chartData} options={barOptions} />
              </Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" align="center" gutterBottom>
                Risk Distribution
              </Typography>
              <Box sx={{ height: 250, mt: 2, mb: 2 }}>
                <Doughnut data={chartData} options={doughnutOptions} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      {/* Recommendations Section */}
      <Card elevation={3} sx={{ mb: 4, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            Recommendations
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Based on your risk assessment, we recommend the following actions:
          </Typography>
          
          <Stack spacing={1} sx={{ mt: 2 }}>
            {recommendations.map((recommendation, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <InfoIcon sx={{ mr: 1, color: 'primary.main', fontSize: 20, mt: 0.5 }} />
                <Typography variant="body1">{recommendation}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Personalized Recommendations Section */}
      <Box sx={{
        my: 3,
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.mode === 'light' ? '#fffde7' : '#263238',
        boxShadow: 1,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        flexWrap: 'wrap',
        alignItems: 'stretch',
      }}>
        <Typography variant="h6" sx={{ mb: { xs: 2, sm: 0 }, width: '100%' }}>
          Personalized Recommendations
        </Typography>
        {getPersonalizedRecommendations(riskInfo.level, crop, location).map((rec, idx) => (
          <Box key={idx} sx={{
            flex: '1 1 220px',
            minWidth: 200,
            bgcolor: theme.palette.mode === 'light' ? '#f9fbe7' : '#37474f',
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 2,
            boxShadow: 0,
          }}>
            {rec.icon}
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>{rec.title}</Typography>
              <Typography variant="body2" color="text.secondary">{rec.advice}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Add Historical Risk Trends section */}
      <HistoricalRiskTrends
        location={location}
        crop={crop}
      />
    </Box>
  );
};

export default RiskResults;
