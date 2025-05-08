import React from 'react';
import { MapContainer, TileLayer, Circle, Tooltip, LayersControl, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Box, Typography, Paper } from '@mui/material';

// Mock region risk data (lat, lon, riskLevel)
type RiskLevel = 'high' | 'medium' | 'low';
const regionRisk: { name: string; lat: number; lon: number; risk: RiskLevel }[] = [
  { name: 'Punjab', lat: 31.1471, lon: 75.3412, risk: 'high' },
  { name: 'Maharashtra', lat: 19.7515, lon: 75.7139, risk: 'medium' },
  { name: 'Tamil Nadu', lat: 11.1271, lon: 78.6569, risk: 'low' },
  { name: 'Gujarat', lat: 22.2587, lon: 71.1924, risk: 'medium' },
  { name: 'West Bengal', lat: 22.9868, lon: 87.8550, risk: 'high' },
  { name: 'Karnataka', lat: 15.3173, lon: 75.7139, risk: 'low' },
  { name: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, risk: 'medium' },
  { name: 'Bihar', lat: 25.0961, lon: 85.3131, risk: 'high' },
];

const riskColors: Record<RiskLevel, string> = {
  high: '#e53935',
  medium: '#ffb300',
  low: '#43a047',
};

const riskRadius: Record<RiskLevel, number> = {
  high: 40000,
  medium: 30000,
  low: 20000,
};

const RiskMapView: React.FC = () => (
  <Box sx={{ width: '100%', height: { xs: 400, sm: 600 }, my: 2 }}>
    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" component="h2">Agricultural Risk Map (India)</Typography>
      <Typography variant="body2" color="text.secondary">
        Visualize region-wise agricultural risk. Red = High, Orange = Medium, Green = Low risk.
      </Typography>
    </Paper>
    <MapContainer
      center={[22.5937, 78.9629]}
      zoom={5}
      style={{ width: '100%', height: '100%', borderRadius: 12 }}
      aria-label="Agricultural Risk Map of India"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LayersControl position="topright">
        <LayersControl.Overlay name="Risk Hotspots" checked>
          <LayerGroup>
            {regionRisk.map(region => (
              <Circle
                key={region.name}
                center={[region.lat, region.lon]}
                radius={riskRadius[region.risk]}
                pathOptions={{ color: riskColors[region.risk], fillColor: riskColors[region.risk], fillOpacity: 0.5 }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
                  <span>{region.name}: <b style={{ color: riskColors[region.risk] }}>{region.risk.toUpperCase()}</b></span>
                </Tooltip>
              </Circle>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
    <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
      <Typography variant="body2">Legend:</Typography>
      <Box sx={{ width: 16, height: 16, bgcolor: '#e53935', borderRadius: '50%' }} aria-label="High risk" />
      <Typography variant="caption">High</Typography>
      <Box sx={{ width: 16, height: 16, bgcolor: '#ffb300', borderRadius: '50%' }} aria-label="Medium risk" />
      <Typography variant="caption">Medium</Typography>
      <Box sx={{ width: 16, height: 16, bgcolor: '#43a047', borderRadius: '50%' }} aria-label="Low risk" />
      <Typography variant="caption">Low</Typography>
    </Box>
  </Box>
);

export default RiskMapView;
