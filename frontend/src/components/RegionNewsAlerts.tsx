import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  WbSunny as WeatherIcon,
  TrendingUp as MarketIcon,
  Campaign as SchemeIcon,
  Refresh as RefreshIcon,
  Warning as AlertIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  type: 'weather' | 'market' | 'scheme';
  priority?: 'high' | 'medium' | 'low';
}

interface RegionNewsAlertsProps {
  location: string;
}

const RegionNewsAlerts: React.FC<RegionNewsAlertsProps> = ({ location }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration - Replace with actual API calls
  const mockNewsData: NewsItem[] = [
    {
      id: '1',
      title: 'Heavy Rainfall Alert',
      description: 'Heavy rainfall expected in the next 48 hours. Farmers advised to take necessary precautions.',
      source: 'IMD',
      date: '2024-03-20',
      type: 'weather',
      priority: 'high'
    },
    {
      id: '2',
      title: 'Wheat MSP Increased',
      description: 'Government announces new MSP for wheat at ₹2,275 per quintal for the upcoming season.',
      source: 'Ministry of Agriculture',
      date: '2024-03-19',
      type: 'market',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'PM-KISAN Scheme Update',
      description: 'Next installment of PM-KISAN to be credited by end of this month.',
      source: 'Agriculture Department',
      date: '2024-03-18',
      type: 'scheme',
      priority: 'medium'
    }
  ];

  useEffect(() => {
    fetchNews();
  }, [location]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNews(mockNewsData);
      setError(null);
    } catch (err) {
      setError(t('newsAlerts.error'));
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'weather':
        return <WeatherIcon />;
      case 'market':
        return <MarketIcon />;
      case 'scheme':
        return <SchemeIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const filteredNews = news.filter(item => {
    switch (activeTab) {
      case 0:
        return item.type === 'weather';
      case 1:
        return item.type === 'market';
      case 2:
        return item.type === 'scheme';
      default:
        return true;
    }
  });

  return (
    <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            {t('newsAlerts.title')}
          </Typography>
          <Tooltip title={t('newsAlerts.refresh')}>
            <IconButton onClick={fetchNews} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab icon={<WeatherIcon />} label={t('newsAlerts.weather')} />
          <Tab icon={<MarketIcon />} label={t('newsAlerts.market')} />
          <Tab icon={<SchemeIcon />} label={t('newsAlerts.schemes')} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : filteredNews.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
            {t('newsAlerts.noUpdates')}
          </Typography>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredNews.map((item, index) => (
              <React.Fragment key={item.id}>
                <ListItem alignItems="flex-start" sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getIconForType(item.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" component="span">
                          {item.title}
                        </Typography>
                        {item.priority && (
                          <Chip
                            label={item.priority}
                            size="small"
                            sx={{
                              bgcolor: `${getPriorityColor(item.priority)}20`,
                              color: getPriorityColor(item.priority),
                              height: 20,
                              '& .MuiChip-label': { px: 1 }
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {item.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {item.source} • {new Date(item.date).toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < filteredNews.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RegionNewsAlerts; 