import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
  Collapse,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { buildApiUrl, API_CONFIG } from '../config';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HistoricalRiskTrendsProps {
  location: string;
  crop: string;
}

interface HistoricalData {
  date: string;
  riskScore: number;
}

const HistoricalRiskTrends: React.FC<HistoricalRiskTrendsProps> = ({ location, crop }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isExpanded, setIsExpanded] = useState(!isMobile);
  const [dateRange, setDateRange] = useState('6months');
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = buildApiUrl(API_CONFIG.ENDPOINTS.HISTORICAL_RISK, {
          location,
          crop,
          months: dateRange === '6months' ? 6 : 12
        });
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
        setHistoricalData(data);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError('Failed to load historical data. Please try again later.');
        // Fallback to mock data for development
        setHistoricalData(generateMockData());
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [location, crop, dateRange]);

  // Mock data generation for development
  const generateMockData = () => {
    const months = dateRange === '6months' ? 6 : 12;
    const data = [];
    const labels = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      // Generate random risk score between 0.2 and 0.8
      data.push(0.2 + Math.random() * 0.6);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Risk Score',
          data,
          fill: true,
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderColor: theme.palette.warning.main,
          tension: 0.4,
          pointBackgroundColor: theme.palette.warning.main,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            return `Risk Score: ${(context.raw as number * 100).toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear',
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: (value) => `${(value as number * 100).toFixed(0)}%`,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <Card sx={{ mt: 3, mb: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" component="h2">
            Historical Risk Trends
          </Typography>
          <IconButton
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ display: { sm: 'none' } }}
          >
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>

        <Collapse in={isExpanded}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <TextField
              select
              label="Date Range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="6months">Last 6 Months</MenuItem>
              <MenuItem value="12months">Last 12 Months</MenuItem>
            </TextField>
          </Stack>

          <Box sx={{ height: 400, width: '100%', position: 'relative' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : historicalData ? (
              <Line data={historicalData} options={chartOptions} />
            ) : null}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default HistoricalRiskTrends; 