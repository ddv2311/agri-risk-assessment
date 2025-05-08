import React from 'react';
import { AppBar, Toolbar, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const { t } = useTranslation();

  const navItems = [
    { text: t('navbar.riskAssessment'), icon: <AssessmentIcon />, path: '/risk-assessment' },
    { text: t('navbar.results'), icon: <BarChartIcon />, path: '/results' },
    { text: t('newsAlerts.title'), icon: <NotificationsIcon />, path: '/news-alerts' }
  ];

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <List sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
          {navItems.map(item => (
            <ListItem
              button
              component={Link}
              to={item.path}
              key={item.text}
              sx={{ width: 'auto' }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 