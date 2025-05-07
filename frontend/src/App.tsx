import { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Button } from '@mui/material';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import RiskAssessmentForm from './components/RiskAssessmentForm';
import RiskResults from './components/RiskResults';
import { Container, Typography } from '@mui/material';
import { ScenarioProvider, useScenario } from './context/ScenarioContext';

// Define theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Layout wrapper component that includes the Outlet for nested routes
const LayoutWrapper = () => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

// Main app component
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ScenarioProvider>
        <Router>
          <AppContent />
        </Router>
      </ScenarioProvider>
    </ThemeProvider>
  );
}

// Separate component for content that needs router hooks
function AppContent() {
  const [assessmentData, setAssessmentData] = useState<any>(null);
  // We'll use the scenario context for setting values
  const { setScenario } = useScenario();
  const navigate = useNavigate();

  // Calculate risk score based on form data
  const calculateRiskScore = (formData: any) => {
    console.log('Calculating risk score for:', formData);
    console.log('Using scenario for calculation:', formData.scenario);
    
    // Extract form values
    const { location, crop, scenario } = formData;
    let baseScore = 0;
    
    // Location-based risk factors
    const locationRiskMap: {[key: string]: number} = {
      'Maharashtra': 0.4,
      'Punjab': 0.3,
      'Haryana': 0.35,
      'Uttar Pradesh': 0.45,
      'Karnataka': 0.25,
      'Tamil Nadu': 0.3,
      'Andhra Pradesh': 0.4,
      'Gujarat': 0.5,
      'West Bengal': 0.6,
      'Madhya Pradesh': 0.55
    };
    
    // Crop-based risk factors
    const cropRiskMap: {[key: string]: number} = {
      'Rice': 0.4,
      'Wheat': 0.3,
      'Cotton': 0.6,
      'Sugarcane': 0.35,
      'Maize': 0.25,
      'Pulses': 0.3,
      'Oilseeds': 0.45,
      'Vegetables': 0.5,
      'Fruits': 0.4,
      'Spices': 0.55
    };
    
    // Scenario multipliers
    const scenarioMultipliers: {[key: string]: number} = {
      'normal': 1.0,
      'drought': 2.0,
      'flood': 1.8,
      'pest': 1.6
    };
    
    // Scenario risk factors (direct contribution)
    const scenarioRiskFactors: {[key: string]: number} = {
      'normal': 0.1,
      'drought': 0.5,
      'flood': 0.45,
      'pest': 0.4
    };
    
    // Calculate location component
    const locationRisk = locationRiskMap[location] || 0.4;
    
    // Calculate crop component
    const cropRisk = cropRiskMap[crop] || 0.4;
    
    // Get scenario risk factor (direct contribution)
    const scenarioRiskFactor = scenarioRiskFactors[scenario] || 0.1;
    
    // Calculate scenario multiplier
    const scenarioMultiplier = scenarioMultipliers[scenario] || 1.0;
    
    // Calculate base score (average of location and crop risk)
    baseScore = (locationRisk + cropRisk) / 2;
    
    // Apply scenario multiplier and add direct scenario risk (capped at 1.0)
    let finalScore = Math.min((baseScore * scenarioMultiplier) + scenarioRiskFactor, 1.0);
    
    // Calculate individual risk components
    const locationComponent = locationRisk * 0.4;
    const cropComponent = cropRisk * 0.4;
    const scenarioComponent = scenarioRiskFactor * 0.2;
    
    // Total risk components (ensure they sum to 1.0)
    const totalComponents = locationComponent + cropComponent + scenarioComponent;
    
    // Calculate normalized contributions
    const locationContribution = locationComponent / totalComponents;
    const cropContribution = cropComponent / totalComponents;
    const scenarioContribution = scenarioComponent / totalComponents;
    
    // Generate reason based on score
    let reason = '';
    if (finalScore < 0.3) {
      reason = `Low risk detected for ${crop} cultivation in ${location} under ${scenario} conditions.`;
    } else if (finalScore < 0.7) {
      reason = `Moderate risk detected for ${crop} cultivation in ${location} under ${scenario} conditions.`;
    } else {
      reason = `High risk detected for ${crop} cultivation in ${location} under ${scenario} conditions.`;
    }
    
    return {
      score: finalScore,
      reason: reason,
      feature_contributions: {
        'location': locationContribution,
        'crop': cropContribution,
        'scenario': scenarioContribution
      }
    };
  };

  // Handle form submission from RiskAssessmentForm
  const handleFormSubmit = (formData: any) => {
    console.log('Form submitted in App component:', formData);
    console.log('Selected scenario for risk assessment:', formData.scenario);
    
    // If we have risk data from the API, use it
    if (formData.riskData) {
      console.log('Using API risk assessment data:', formData.riskData);
      
      // Format the API result to match our expected format
      const formattedResult = {
        score: formData.riskData.risk_score || 0.5,
        reason: formData.riskData.explanation || 'Risk assessment based on agricultural data',
        feature_contributions: formData.riskData.contributing_factors || {
          location: 0.4,
          crop: 0.3,
          scenario: 0.3
        }
      };
      
      console.log('Formatted API result:', formattedResult);
      
      // Store the API result and form data in application state
      setAssessmentData({
        formData: {
          location: formData.location,
          crop: formData.crop,
          scenario: formData.scenario
        },
        result: formattedResult
      });
    } else {
      // Fallback to local calculation if API data not available
      console.log('API data not available, using local calculation');
      
      // Use the scenario from the form data
      const processedFormData = {
        location: formData.location,
        crop: formData.crop,
        scenario: formData.scenario
      };
      
      console.log('Processing form data with scenario from form:', processedFormData);
      
      // Calculate risk assessment result
      console.log('Calculating risk with scenario:', processedFormData.scenario);
      const result = calculateRiskScore(processedFormData);
      
      // Ensure the feature_contributions values are valid
      if (result.feature_contributions) {
        const contributions = result.feature_contributions as Record<string, number | string>;
        let sum = 0;
        
        // Convert any string values to numbers
        Object.keys(contributions).forEach(key => {
          if (typeof contributions[key] === 'string') {
            contributions[key] = parseFloat(contributions[key] as string) || 0.33;
          }
          sum += Number(contributions[key]);
        });
        
        // Normalize values if sum is not close to 1
        if (Math.abs(sum - 1) > 0.1) {
          Object.keys(contributions).forEach(key => {
            contributions[key] = Number(contributions[key]) / sum;
          });
        }
      }
      
      console.log('Calculated result:', result);
      
      // Store the result and form data in application state
      setAssessmentData({
        ...result,
        formData: processedFormData
      });
    }
    
    // Navigate to results page
    navigate('/results');
  };

  const handleLogin = (username: string, password: string) => {
    console.log('Login attempt:', { username, password });
    // In a real app, this would authenticate with a backend
    navigate('/risk-assessment');
  };

  return (
    <Routes>
      <Route path="/login" element={
        <Container maxWidth="sm" sx={{ mt: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            AgriRisk Assessment System
          </Typography>
          <Login onLogin={handleLogin} />
        </Container>
      } />
      
      <Route path="/" element={<LayoutWrapper />}>
        <Route index element={<Navigate to="/risk-assessment" replace />} />
        <Route path="risk-assessment" element={
          <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
              Risk Assessment
            </Typography>
            <RiskAssessmentForm onSubmit={handleFormSubmit} />
          </Container>
        } />
        <Route 
          path="results" 
          element={
            assessmentData ? (
              <Container maxWidth="md">
                <Typography variant="h4" component="h1" gutterBottom>
                  Assessment Results
                </Typography>
                <RiskResults 
                  result={assessmentData} 
                  formData={{
                    location: assessmentData.formData?.location || '',
                    crop: assessmentData.formData?.crop || '',
                    scenario: assessmentData.formData?.scenario || ''
                  }} 
                />
              </Container>
            ) : (
              <Container maxWidth="md">
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    No assessment data available. Please complete the risk assessment form first.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => navigate('/risk-assessment')}
                  >
                    Go to Risk Assessment
                  </Button>
                </Box>
              </Container>
            )
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;
