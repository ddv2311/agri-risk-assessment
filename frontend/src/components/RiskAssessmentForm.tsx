import React, { useState } from 'react';
import { 
  TextField, Button, Box, FormControl, InputLabel, Select, MenuItem, 
  Grid, Typography, Paper, Divider, Autocomplete, CircularProgress,
  FormHelperText, Stepper, Step, StepLabel, Card, CardContent, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import PestControlIcon from '@mui/icons-material/PestControl';
import CalculateIcon from '@mui/icons-material/Calculate';

interface RiskAssessmentFormProps {
  onSubmit: (formData: any) => void;
}

// Sample data for dropdowns
const LOCATIONS = [
  'Maharashtra', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Karnataka', 
  'Tamil Nadu', 'Andhra Pradesh', 'Gujarat', 'West Bengal', 'Madhya Pradesh'
];

const CROPS = [
  'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Maize', 
  'Pulses', 'Oilseeds', 'Vegetables', 'Fruits', 'Spices'
];

const SCENARIOS = [
  { value: 'normal', label: 'Normal', icon: <WaterDropIcon />, description: 'Regular weather conditions with adequate rainfall' },
  { value: 'drought', label: 'Drought', icon: <WbSunnyIcon />, description: 'Low rainfall and water scarcity conditions' },
  { value: 'flood', label: 'Flood', icon: <WaterDropIcon />, description: 'Excessive rainfall and water logging' },
  { value: 'pest', label: 'Pest Infestation', icon: <PestControlIcon />, description: 'High pest pressure affecting crop health' }
];

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    location: '',
    crop: '',
    scenario: 'normal',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.crop) newErrors.crop = 'Crop type is required';
    if (!formData.scenario) newErrors.scenario = 'Scenario is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Clear error when user types
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      onSubmit(formData);
      navigate('/results');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && !formData.location) {
      setErrors({ ...errors, location: 'Please select a location' });
      return;
    }
    if (activeStep === 1 && !formData.crop) {
      setErrors({ ...errors, crop: 'Please select a crop' });
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Location Information</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select the region where your agricultural activity is located. This helps us analyze
                regional climate patterns and risks specific to your area.
              </Typography>
              <Autocomplete
                options={LOCATIONS}
                value={formData.location}
                onChange={(_, newValue) => handleChange('location', newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Location" 
                    required 
                    error={!!errors.location}
                    helperText={errors.location}
                    fullWidth
                  />
                )}
              />
            </CardContent>
          </Card>
        );
      case 1:
        return (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AgricultureIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Crop Information</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Different crops have varying susceptibility to environmental risks. Select your crop to
                receive tailored risk assessment based on crop-specific vulnerabilities.
              </Typography>
              <Autocomplete
                options={CROPS}
                value={formData.crop}
                onChange={(_, newValue) => handleChange('crop', newValue)}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Crop Type" 
                    required
                    error={!!errors.crop}
                    helperText={errors.crop}
                    fullWidth
                  />
                )}
              />
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WaterDropIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Scenario Selection</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select the environmental scenario you want to assess risk for. This helps us calculate
                the potential impact on your agricultural activity.
              </Typography>
              <FormControl fullWidth error={!!errors.scenario}>
                <InputLabel>Scenario</InputLabel>
                <Select
                  value={formData.scenario}
                  label="Scenario"
                  onChange={(e) => handleChange('scenario', e.target.value)}
                >
                  {SCENARIOS.map((scenario) => (
                    <MenuItem key={scenario.value} value={scenario.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 1 }}>{scenario.icon}</Box>
                        {scenario.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.scenario && <FormHelperText>{errors.scenario}</FormHelperText>}
              </FormControl>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {SCENARIOS.find(s => s.value === formData.scenario)?.label} Scenario:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {SCENARIOS.find(s => s.value === formData.scenario)?.description}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#f8f9fa' }}>
        <Typography variant="body1" color="text.secondary">
          Complete the form below to receive a comprehensive risk assessment for your agricultural activity.
          The assessment considers location-specific climate data, crop vulnerability, and scenario-based risk factors.
        </Typography>
      </Paper>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Location</StepLabel>
        </Step>
        <Step>
          <StepLabel>Crop</StepLabel>
        </Step>
        <Step>
          <StepLabel>Scenario</StepLabel>
        </Step>
      </Stepper>
      
      <Box component="form" onSubmit={handleSubmit}>
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          
          <Box>
            {activeStep === 2 ? (
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
                sx={{ minWidth: 150 }}
              >
                {isSubmitting ? 'Calculating...' : 'Calculate Risk'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RiskAssessmentForm;
