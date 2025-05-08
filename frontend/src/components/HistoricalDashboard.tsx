import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  TextField,
  MenuItem,
  Box,
  useTheme,
  Paper,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface HistoricalData {
  date: string;
  riskScore: number;
  location: string;
  crop: string;
  scenario: string;
  contributingFactors: {
    [key: string]: number;
  };
}

const HistoricalDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('1m');
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('');
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [crops, setCrops] = useState<string[]>([]);

  useEffect(() => {
    fetchHistoricalData();
    // eslint-disable-next-line
  }, [timeRange, location, crop]);

  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/historical-risk?timeRange=${timeRange}&location=${location}&crop=${crop}`
      );
      const data = await response.json();
      setHistoricalData(data.data || []);
      setLocations(data.locations || []);
      setCrops(data.crops || []);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRisk = () => {
    if (historicalData.length === 0) return 0;
    const sum = historicalData.reduce((acc, curr) => acc + curr.riskScore, 0);
    return (sum / historicalData.length).toFixed(1);
  };

  const calculateRiskTrend = () => {
    if (historicalData.length < 2) return 0;
    const firstScore = historicalData[0].riskScore;
    const lastScore = historicalData[historicalData.length - 1].riskScore;
    return ((lastScore - firstScore) / firstScore * 100).toFixed(1);
  };

  const getTopContributingFactors = () => {
    if (historicalData.length === 0) return [];
    const latestData = historicalData[historicalData.length - 1];
    return Object.entries(latestData.contributingFactors || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([factor, value]) => ({
        factor,
        value: value * 100,
      }));
  };

  return (
    <Box sx={{ py: 4, px: { xs: 1, md: 6 }, background: '#f7fafc', minHeight: '100vh' }}>
      <Grid container justifyContent="center" spacing={3}>
        <Grid item xs={12} md={10}>
          <Card sx={{ borderRadius: 4, boxShadow: 3, mb: 4 }}>
            <CardContent>
              <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                Historical Risk Analysis
              </Typography>
              <Typography color="textSecondary">
                Explore trends and patterns in agricultural risk assessments over time. Filter by location, crop, and time range to analyze historical risk data.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Filters */}
        <Grid item xs={12} md={10}>
          <Paper sx={{ p: 2, borderRadius: 3, background: '#e3f0ff', mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Time Range"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  variant="outlined"
                >
                  <MenuItem value="1m">Last Month</MenuItem>
                  <MenuItem value="3m">Last 3 Months</MenuItem>
                  <MenuItem value="6m">Last 6 Months</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  variant="outlined"
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Crop"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  variant="outlined"
                >
                  <MenuItem value="">All Crops</MenuItem>
                  {crops.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {loading ? (
          <Grid item xs={12} md={10}>
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </Box>
          </Grid>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid item xs={12} md={10}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: 2, background: '#e3f0ff' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Average Risk Score
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="primary.main">
                        {calculateAverageRisk()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: 2, background: '#e3f0ff' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Risk Trend
                      </Typography>
                      <Typography
                        variant="h3"
                        fontWeight={700}
                        color={Number(calculateRiskTrend()) > 0 ? 'error' : 'success'}
                      >
                        {calculateRiskTrend()}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: 2, background: '#e3f0ff' }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Total Assessments
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="primary.main">
                        {historicalData.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid item xs={12} md={10} sx={{ mt: 4 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Risk Score Trend
                      </Typography>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="riskScore"
                              stroke={theme.palette.primary.main}
                              name="Risk Score"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" color="primary" gutterBottom>
                        Top Contributing Factors
                      </Typography>
                      <Box sx={{ height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getTopContributingFactors()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="factor" />
                            <YAxis />
                            <Tooltip />
                            <Bar
                              dataKey="value"
                              fill={theme.palette.primary.main}
                              name="Contribution (%)"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default HistoricalDashboard; 