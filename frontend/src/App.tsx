import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './components/Login';
import RiskAssessmentForm from './components/RiskAssessmentForm';
import RiskResults from './components/RiskResults';
import { Container, Typography } from '@mui/material';

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

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={
            <Container maxWidth="sm" sx={{ mt: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                AgriRisk Assessment System
              </Typography>
              <Login onLogin={(username, password) => {
                console.log('Login attempt:', { username, password });
                // TODO: Implement actual login logic
              }} />
            </Container>
          } />
          
          <Route path="/" element={<LayoutWrapper />}>
            <Route index element={<Navigate to="/risk-assessment" replace />} />
            <Route path="risk-assessment" element={
              <Container maxWidth="md">
                <Typography variant="h4" component="h1" gutterBottom>
                  Risk Assessment
                </Typography>
                <RiskAssessmentForm onSubmit={(formData) => {
                  console.log('Form submitted:', formData);
                  // TODO: Implement actual form submission logic
                }} />
              </Container>
            } />
            <Route path="results" element={
              <Container maxWidth="md">
                <Typography variant="h4" component="h1" gutterBottom>
                  Assessment Results
                </Typography>
                <RiskResults result={{
                  score: 0.5,
                  reason: 'Moderate risk detected based on current conditions',
                  feature_contributions: {
                    'location': 0.2,
                    'crop': 0.3,
                    'scenario': 0.5
                  }
                }} />
              </Container>
            } />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
