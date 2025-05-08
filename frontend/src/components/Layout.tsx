import React from 'react';
import { 
  AppBar, Toolbar, Typography, Box, Container, Paper, Divider, 
  useTheme, Button, IconButton, useMediaQuery, Drawer, List,
  ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip
} from '@mui/material';
import { Link as RouterLink, useLocation, Outlet } from 'react-router-dom';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MapIcon from '@mui/icons-material/Map';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import Navbar from './Navbar';
import ChatbotPopup from './ChatbotPopup';

const stateLanguages = [
  { state: 'Maharashtra', code: 'mr', label: 'Marathi' },
  { state: 'Punjab', code: 'pa', label: 'Punjabi' },
  { state: 'Haryana', code: 'hi', label: 'Hindi' },
  { state: 'Uttar Pradesh', code: 'hi', label: 'Hindi' },
  { state: 'Karnataka', code: 'kn', label: 'Kannada' },
  { state: 'Tamil Nadu', code: 'ta', label: 'Tamil' },
  { state: 'Andhra Pradesh', code: 'te', label: 'Telugu' },
  { state: 'Gujarat', code: 'gu', label: 'Gujarati' },
  { state: 'West Bengal', code: 'bn', label: 'Bengali' },
  { state: 'Madhya Pradesh', code: 'hi', label: 'Hindi' }
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  const navItems = [
    { text: t('navbar.riskAssessment'), path: '/risk-assessment', icon: <AssessmentIcon /> },
    { text: t('navbar.results'), path: '/results', icon: <BarChartIcon /> },
    { text: t('newsAlerts.title'), icon: <NotificationsIcon />, path: '/news-alerts' },
    { text: 'Risk Map', icon: <MapIcon />, path: '/risk-map' }
  ];

  const handleLangMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleLangClose = () => setAnchorEl(null);

  const handleLangChange = (code: string) => {
    i18n.changeLanguage(code);
    handleLangClose();
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ my: 2, display: 'flex', alignItems: 'center' }}>
          <AgricultureIcon sx={{ mr: 1 }} /> AgriRisk
        </Typography>
        <IconButton edge="end" color="inherit" onClick={handleDrawerToggle} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
            sx={{
              color: isActive(item.path) ? 'primary.main' : 'text.primary',
              bgcolor: isActive(item.path) ? 'action.selected' : 'transparent',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: '#f8f9fa'
    }}>
      <Navbar />
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          bgcolor: 'white', 
          color: 'primary.main',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Box 
            component={RouterLink} 
            to="/" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <AgricultureIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              AgriRisk
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    mx: 1,
                    color: isActive(item.path) ? 'primary.main' : 'text.primary',
                    bgcolor: isActive(item.path) ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    fontWeight: isActive(item.path) ? 600 : 400,
                    borderRadius: 2,
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, py: 3, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="md">
          <Paper 
            elevation={2} 
            sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              width: '100%'
            }}
          >
            <Outlet />
          </Paper>
        </Container>
      </Box>
      
      <Paper 
        component="footer" 
        elevation={3}
        square
        sx={{ 
          py: 3, 
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Container>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ mb: { xs: 2, md: 0 } }}>
              <Typography variant="subtitle1" color="text.primary" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <AgricultureIcon sx={{ mr: 1, fontSize: 20 }} /> AgriRisk
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agricultural risk assessment platform for farmers
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton color="primary" aria-label="github" component="a" href="https://github.com/ddv2311/agri-risk-assessment" target="_blank">
                <GitHubIcon />
              </IconButton>
              <IconButton color="primary" aria-label="linkedin">
                <LinkedInIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              &copy; {new Date().getFullYear()} AgriRisk Assessment System. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Paper>
      <ChatbotPopup />
    </Box>
  );
};

export default Layout;
