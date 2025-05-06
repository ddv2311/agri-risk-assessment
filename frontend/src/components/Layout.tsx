import React from 'react';
import { AppBar, Toolbar, Typography, Box, Container, Paper, Divider, useTheme } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: '#f8f9fa'
    }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: theme.palette.primary.main,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AgricultureIcon sx={{ mr: 1.5, fontSize: 28 }} />
            <Typography 
              variant="h5" 
              component={RouterLink} 
              to="/" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: '0.5px',
                textDecoration: 'none', 
                color: 'inherit',
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              AgriRisk
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3, ml: 'auto' }}>
            <RouterLink 
              to="/risk-assessment" 
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1,
                borderBottom: isActive('risk-assessment') ? 
                  `3px solid ${theme.palette.secondary.main}` : 
                  '3px solid transparent',
              }}>
                <AssessmentIcon sx={{ mr: 0.5 }} />
                <Typography variant="button" sx={{ fontWeight: isActive('risk-assessment') ? 700 : 400 }}>
                  Risk Assessment
                </Typography>
              </Box>
            </RouterLink>
            
            <RouterLink 
              to="/results" 
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'flex',
                alignItems: 'center' 
              }}
            >
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                py: 1,
                borderBottom: isActive('results') ? 
                  `3px solid ${theme.palette.secondary.main}` : 
                  '3px solid transparent',
              }}>
                <BarChartIcon sx={{ mr: 0.5 }} />
                <Typography variant="button" sx={{ fontWeight: isActive('results') ? 700 : 400 }}>
                  Results
                </Typography>
              </Box>
            </RouterLink>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="lg">
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}
          >
            {children}
          </Paper>
        </Container>
      </Box>
      
      <Box 
        component="footer" 
        sx={{ 
          mt: 'auto', 
          py: 3, 
          bgcolor: '#f1f3f5',
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Container>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} AgriRisk Assessment System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
