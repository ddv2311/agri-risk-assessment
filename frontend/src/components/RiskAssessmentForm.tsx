import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { 
  TextField, Button, Box, FormControl, 
  Typography, Autocomplete, CircularProgress, Paper,
  FormHelperText, Stepper, Step, StepLabel, Card, CardContent
} from '@mui/material';
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

// Define scenarios with clear values for selection
const SCENARIOS = [
  { value: 'normal', label: 'Normal', icon: <WaterDropIcon />, description: 'Regular weather conditions with adequate rainfall' },
  { value: 'drought', label: 'Drought', icon: <WbSunnyIcon />, description: 'Low rainfall and water scarcity conditions' },
  { value: 'flood', label: 'Flood', icon: <WaterDropIcon />, description: 'Excessive rainfall and water logging' },
  { value: 'pest', label: 'Pest Infestation', icon: <PestControlIcon />, description: 'High pest pressure affecting crop health' }
];

// No longer needed - removed to fix lint warning

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ onSubmit }) => {
  // Get scenario state from context
  const { scenario, setScenario } = useScenario();
  
  // Initialize form data with the scenario from context
  const [formData, setFormData] = useState({
    location: '',
    crop: '',
    scenario: scenario, // Use the scenario from context
  });
  
  // Update form data when scenario changes in context
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      scenario: scenario
    }));
  }, [scenario]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.crop) newErrors.crop = 'Crop type is required';
    if (!formData.scenario) newErrors.scenario = 'Scenario is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: any) => {
    console.log(`Updating ${field} to:`, value);
    
    // Create a new form data object with the updated field
    const updatedFormData = {
      ...formData,
      [field]: value,
    };
    
    // Log the updated form data
    console.log('Updated form data:', updatedFormData);
    
    // Update the state
    setFormData(updatedFormData);
    
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
      // Simulate API call (in a real app, this would be an actual API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Prepare the submission data with the current state values
      const submissionData = {
        location: formData.location,
        crop: formData.crop,
        scenario: scenario // Use the scenario from context
      };
      
      // Submit the form data to parent component
      onSubmit(submissionData);
      
      // No need to navigate here as the parent component handles navigation
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
              
              {/* Radio button group for scenario selection */}
              <FormControl component="fieldset" error={!!errors.scenario}>
                {SCENARIOS.map((scenario) => (
                  <Box 
                    key={scenario.value} 
                    onClick={() => {
                      // Update both context and local form data
                      setScenario(scenario.value);
                      setFormData(prevData => ({
                        ...prevData,
                        scenario: scenario.value
                      }));
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: formData.scenario === scenario.value ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      bgcolor: formData.scenario === scenario.value ? 'primary.light' : 'background.paper',
                      color: formData.scenario === scenario.value ? 'primary.contrastText' : 'text.primary',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: formData.scenario === scenario.value ? 'primary.light' : 'action.hover',
                      }
                    }}
                  >
                    <Box sx={{ mr: 2, color: formData.scenario === scenario.value ? 'inherit' : 'primary.main' }}>
                      {scenario.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: formData.scenario === scenario.value ? 'bold' : 'regular' }}>
                        {scenario.label}
                      </Typography>
                      <Typography variant="body2" color={formData.scenario === scenario.value ? 'inherit' : 'text.secondary'}>
                        {scenario.description}
                      </Typography>
                    </Box>
                  </Box>
                ))}
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
