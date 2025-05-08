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
  Info as InfoIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  type: 'weather' | 'market' | 'scheme';
  priority?: 'high' | 'medium' | 'low';
}

const TABS = [
  { label: 'Weather', icon: <WeatherIcon />, category: 'weather' },
  { label: 'Market', icon: <MarketIcon />, category: 'market' },
  { label: 'Schemes', icon: <SchemeIcon />, category: 'schemes' }
];

const getRegion = async () => {
  // Try browser geolocation, fallback to 'India'
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2000 })
    );
    // You can use a reverse geocoding API here to get the state/region from lat/lon
    // For demo, fallback to 'India'
    return 'India';
  } catch {
    return 'India';
  }
};

const RegionNewsAlerts: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [region, setRegion] = useState('India');
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async (selectedTab = tab, selectedRegion = region) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/news', {
        params: {
          region: selectedRegion,
          category: TABS[selectedTab].category
        }
      });
      setArticles(res.data.articles || []);
      setError(res.data.error || null);
    } catch (e: any) {
      setError('Failed to fetch news');
      setArticles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    getRegion().then(r => {
      setRegion(r);
      fetchNews(tab, r);
    });
    // eslint-disable-next-line
  }, []);

  const handleTabChange = (_: any, newTab: number) => {
    setTab(newTab);
    fetchNews(newTab, region);
  };

  const handleRefresh = () => fetchNews(tab, region);

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

  return (
    <Card elevation={3} sx={{ borderRadius: 2, width: '100%', maxWidth: 600, mx: 'auto', my: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Region News & Alerts</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 2 }}>
          {TABS.map((t, i) => (
            <Tab key={t.label} icon={t.icon} label={t.label} />
          ))}
        </Tabs>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: 'center', color: 'error.main', py: 2 }}>
            <ErrorOutlineIcon sx={{ mb: 1 }} />
            <Typography>{error}</Typography>
          </Box>
        ) : articles.length === 0 ? (
          <Typography align="center" color="text.secondary" sx={{ py: 2 }}>
            No news or alerts available for this region.
          </Typography>
        ) : (
          <List>
            {articles.map((a, idx) => (
              <ListItem key={idx} alignItems="flex-start" sx={{ mb: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" component="span">{a.title}</Typography>
                      {a.title?.toLowerCase().includes('alert') && (
                        <Chip label="High Alert" color="error" size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">{a.description}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {a.source?.name} • {a.publishedAt ? new Date(a.publishedAt).toLocaleString() : ''}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default RegionNewsAlerts; 