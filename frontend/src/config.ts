// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000', // Hardcoded for local dev, update for production as needed
  ENDPOINTS: {
    HISTORICAL_RISK: '/api/v1/historical-risk',
    RISK_ASSESSMENT: '/api/v1/risk-assessment',
  },
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>) => {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });
  }
  return url.toString();
}; 