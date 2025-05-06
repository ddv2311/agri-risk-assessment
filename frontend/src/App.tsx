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
  const navigate = useNavigate();
  const { scenario } = useScenario(); // Access the scenario from context

  // Calculate risk score based on form data
  const calculateRiskScore = (formData: any) => {
    // This is a simplified risk calculation model
    // In a real application, this would be more complex or call an API
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
    
    // DIRECT APPROACH: Check the URL for a scenario parameter
    // This is a workaround for the scenario selection issue
    let scenarioValue = 'normal'; // Default
    
    // Try to get the scenario from the URL
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlScenario = urlParams.get('scenario');
      if (urlScenario) {
        scenarioValue = urlScenario;
      } else if (formData.scenario && formData.scenario !== 'normal') {
        // If no URL parameter but form data has a non-normal scenario, use that
        scenarioValue = formData.scenario;
      }
    } catch (error) {
      console.error('Error getting scenario from URL:', error);
    }
    
    // OVERRIDE: If the user explicitly selected a scenario in the form
    // and it's different from normal, use that instead
    if (formData.scenario && formData.scenario !== 'normal') {
      console.log('Overriding with form scenario:', formData.scenario);
      scenarioValue = formData.scenario;
    }
    
    console.log('FINAL SCENARIO VALUE TO USE:', scenarioValue);
    
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
    const locationRisk = locationRiskMap[formData.location] || 0.4;
    
    // Calculate crop component
    const cropRisk = cropRiskMap[formData.crop] || 0.4;
    
    // Debug the scenario value
    console.log('Scenario value in risk calculation:', scenarioValue, typeof scenarioValue);
    console.log('Available scenarios:', Object.keys(scenarioRiskFactors));
    
    // Get scenario risk factor (direct contribution)
    const scenarioRiskFactor = scenarioRiskFactors[scenarioValue] || 0.1;
    console.log('Selected scenario risk factor:', scenarioRiskFactor);
    
    // Calculate scenario multiplier
    const scenarioMultiplier = scenarioMultipliers[scenarioValue] || 1.0;
    console.log('Selected scenario multiplier:', scenarioMultiplier);
    
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
      reason = `Low risk detected for ${formData.crop} cultivation in ${formData.location} under ${formData.scenario} conditions.`;
    } else if (finalScore < 0.7) {
      reason = `Moderate risk detected for ${formData.crop} cultivation in ${formData.location} under ${formData.scenario} conditions.`;
    } else {
      reason = `High risk detected for ${formData.crop} cultivation in ${formData.location} under ${formData.scenario} conditions.`;
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

  const handleFormSubmit = (formData: any) => {
    console.log('Form submitted in App component:', formData);
    
    // Use the scenario from context to ensure consistency
    const processedFormData = {
      location: formData.location,
      crop: formData.crop,
      scenario: scenario // Use the scenario from context
    };
    
    console.log('Processing form data with scenario from context:', processedFormData);
    
    // Calculate risk assessment result
    const result = calculateRiskScore(processedFormData);
    
    console.log('Calculated result:', result);
    
    // Store the result and form data in application state
    setAssessmentData({
      formData: processedFormData,
      result
    });
    
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
        <Route path="results" element={
          <Container maxWidth="md">
            <Typography variant="h4" component="h1" gutterBottom>
              Assessment Results
            </Typography>
            {assessmentData ? (
              <RiskResults result={assessmentData.result} />
            ) : (
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
            )}
          </Container>
        } />
      </Route>
    </Routes>
  );
}

export default App;
