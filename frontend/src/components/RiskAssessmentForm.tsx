import React, { useState, useEffect } from 'react';
import { 
  TextField, Button, Box, FormControl, 
  Typography, Autocomplete, CircularProgress, Paper,
  FormHelperText, Stepper, Step, StepLabel, Card, CardContent,
  Grid, Avatar, Fade, Grow, Zoom, Alert, Chip,
  useTheme, alpha
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import PestControlIcon from '@mui/icons-material/PestControl';
import CalculateIcon from '@mui/icons-material/Calculate';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useScenario } from '../context/ScenarioContext';
import { riskService } from '../services/api';

interface RiskAssessmentFormProps {
  onSubmit: (formData: any) => void;
}

// Sample data for dropdowns with additional metadata
const LOCATIONS = [
  { id: 'mh', name: 'Maharashtra', riskFactor: 0.8, climateZone: 'Semi-arid' },
  { id: 'pb', name: 'Punjab', riskFactor: 0.7, climateZone: 'Sub-tropical' },
  { id: 'hr', name: 'Haryana', riskFactor: 0.7, climateZone: 'Sub-tropical' },
  { id: 'up', name: 'Uttar Pradesh', riskFactor: 0.75, climateZone: 'Sub-tropical' },
  { id: 'ka', name: 'Karnataka', riskFactor: 0.65, climateZone: 'Tropical wet & dry' },
  { id: 'tn', name: 'Tamil Nadu', riskFactor: 0.6, climateZone: 'Tropical wet' },
  { id: 'ap', name: 'Andhra Pradesh', riskFactor: 0.7, climateZone: 'Tropical wet & dry' },
  { id: 'gj', name: 'Gujarat', riskFactor: 0.85, climateZone: 'Arid to semi-arid' },
  { id: 'wb', name: 'West Bengal', riskFactor: 0.6, climateZone: 'Tropical wet' },
  { id: 'mp', name: 'Madhya Pradesh', riskFactor: 0.75, climateZone: 'Sub-tropical' }
];

const CROPS = [
  { id: 'rice', name: 'Rice', waterRequirement: 'High', growthDuration: '3-6 months', droughtSensitivity: 'High' },
  { id: 'wheat', name: 'Wheat', waterRequirement: 'Medium', growthDuration: '4-5 months', droughtSensitivity: 'Medium' },
  { id: 'cotton', name: 'Cotton', waterRequirement: 'Medium', growthDuration: '5-6 months', droughtSensitivity: 'Medium' },
  { id: 'sugarcane', name: 'Sugarcane', waterRequirement: 'High', growthDuration: '12-18 months', droughtSensitivity: 'Medium' },
  { id: 'maize', name: 'Maize', waterRequirement: 'Medium', growthDuration: '3-4 months', droughtSensitivity: 'Medium' },
  { id: 'pulses', name: 'Pulses', waterRequirement: 'Low', growthDuration: '3-4 months', droughtSensitivity: 'Low' },
  { id: 'oilseeds', name: 'Oilseeds', waterRequirement: 'Low', growthDuration: '3-5 months', droughtSensitivity: 'Low' },
  { id: 'vegetables', name: 'Vegetables', waterRequirement: 'Medium-High', growthDuration: '2-4 months', droughtSensitivity: 'High' },
  { id: 'fruits', name: 'Fruits', waterRequirement: 'Medium-High', growthDuration: 'Perennial', droughtSensitivity: 'Medium' },
  { id: 'spices', name: 'Spices', waterRequirement: 'Medium', growthDuration: '4-8 months', droughtSensitivity: 'Medium' }
];

// Define scenarios with clear values for selection
const SCENARIOS = [
  { 
    value: 'normal', 
    label: 'Normal Conditions', 
    icon: <WbSunnyIcon />, 
    description: 'Standard weather and market conditions',
    color: '#4caf50',
    bgColor: '#e8f5e9'
  },
  { 
    value: 'drought', 
    label: 'Drought', 
    icon: <WbSunnyIcon />, 
    description: 'Extended period of abnormally low rainfall',
    color: '#ff9800',
    bgColor: '#fff3e0'
  },
  { 
    value: 'flood', 
    label: 'Flood', 
    icon: <WaterDropIcon />, 
    description: 'Overflow of water that submerges land',
    color: '#2196f3',
    bgColor: '#e3f2fd'
  },
  { 
    value: 'pest', 
    label: 'Pest Infestation', 
    icon: <PestControlIcon />, 
    description: 'Destructive insect outbreak affecting crops',
    color: '#f44336',
    bgColor: '#ffebee'
  }
];

const RiskAssessmentForm: React.FC<RiskAssessmentFormProps> = ({ onSubmit }) => {
  const theme = useTheme();
  // Get scenario state from context
  const { scenario, setScenario } = useScenario();
  
  // Initialize form data with default values but don't set a default scenario
  // This will force the user to explicitly select a scenario
  const [formData, setFormData] = useState({
    location: '',
    crop: '',
    scenario: '' // No default scenario - user must select one
  });
  
  // We're no longer automatically syncing form data with context
  // This ensures the user must explicitly select a scenario
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.crop) newErrors.crop = 'Crop type is required';
    if (!formData.scenario) newErrors.scenario = 'Please select a scenario before calculating risk';
    
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
    
    // Mark step as completed if value is present
    if (value) {
      if (field === 'location' && activeStep === 0) {
        setCompleted({ ...completed, 0: true });
      } else if (field === 'crop' && activeStep === 1) {
        setCompleted({ ...completed, 1: true });
      } else if (field === 'scenario' && activeStep === 2) {
        setCompleted({ ...completed, 2: true });
      }
    }
    
    // Clear error when user types
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };
  
  // Get the location object from the selected location name
  const getLocationObject = () => {
    return LOCATIONS.find(loc => loc.name === formData.location) || null;
  };
  
  // Get the crop object from the selected crop name
  const getCropObject = () => {
    return CROPS.find(crop => crop.name === formData.crop) || null;
  };
  
  // Get the scenario object from the selected scenario value
  const getScenarioObject = () => {
    return SCENARIOS.find(s => s.value === formData.scenario) || null;
  };

  // Log the current scenario before submission for debugging
  useEffect(() => {
    console.log('Current scenario in context:', scenario);
    console.log('Current scenario in form data:', formData.scenario);
  }, [scenario, formData.scenario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Get the currently selected scenario from the form data
    // This is critical to ensure we use what the user selected
    const selectedScenario = formData.scenario;
    console.log('Selected scenario for calculation:', selectedScenario);
    
    // Make sure the context is updated with the selected scenario
    if (selectedScenario !== scenario) {
      console.log('Updating context scenario to match form selection:', selectedScenario);
      setScenario(selectedScenario);
    }
    
    console.log('Submitting with scenario:', selectedScenario);
    setIsSubmitting(true);
    
    try {
      // Get the full objects for enhanced data
      const locationObj = getLocationObject();
      const cropObj = getCropObject();
      const scenarioObj = getScenarioObject();
      
      // Prepare the submission data with the current state values
      // Explicitly use the scenario from form data to ensure it's correct
      const submissionData = {
        location: formData.location,
        crop: formData.crop,
        scenario: selectedScenario, // Use the scenario from form data
        locationDetails: locationObj,
        cropDetails: cropObj,
        scenarioDetails: scenarioObj
      };
      
      console.log('Final submission data:', submissionData);
      
      try {
        // Attempt to make the actual API call to assess risk
        const riskData = await riskService.assessRisk({
          location: formData.location,
          crop: formData.crop,
          scenario: selectedScenario
        });
        
        // Submit the form data and risk assessment results to parent component
        // Make sure to use the selectedScenario from form data
        onSubmit({
          ...submissionData, // This includes the correct scenario and enhanced data
          riskData: riskData
        });
        
        console.log('Successfully submitted with scenario:', submissionData.scenario);
      } catch (apiError) {
        console.warn('API call failed, using fallback local calculation:', apiError);
        
        // Fallback: Submit just the form data without API risk data
        // The parent component will use its local calculation
        onSubmit(submissionData);
      }
      
      // No need to navigate here as the parent component handles navigation
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({
        ...errors,
        submit: 'Failed to assess risk. Using local calculation instead.'
      });
      
      // Final fallback - submit basic data even if there was an error
      // Make sure to use the scenario from form data, not context
      onSubmit({
        location: formData.location,
        crop: formData.crop,
        scenario: formData.scenario // Use form data scenario
      });
      
      console.log('Fallback submission with scenario:', formData.scenario);
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
    
    // Mark current step as completed if it has a value
    if ((activeStep === 0 && formData.location) ||
        (activeStep === 1 && formData.crop) ||
        (activeStep === 2 && formData.scenario)) {
      setCompleted({ ...completed, [activeStep]: true });
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Check if all steps are completed
  const isStepComplete = (step: number) => {
    return completed[step];
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grow in={activeStep === 0} timeout={500}>
            <Card elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', width: '100%' }}>
              <Box sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                p: 2, 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2 }}>
                  <LocationOnIcon />
                </Avatar>
                <Typography variant="h6">Location Information</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Select the region where your agricultural activity is located. This helps us analyze
                  regional climate patterns and risks specific to your area.
                </Typography>
                
                <Autocomplete
                  options={LOCATIONS}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  value={getLocationObject()}
                  onChange={(_, newValue) => handleChange('location', newValue ? newValue.name : '')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Select Location" 
                      required 
                      error={!!errors.location}
                      helperText={errors.location}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <LocationOnIcon color="primary" sx={{ ml: 1, mr: 0.5 }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1">{option.name}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Chip 
                            label={option.climateZone} 
                            size="small" 
                            sx={{ mr: 1, bgcolor: alpha(theme.palette.primary.main, 0.1) }} 
                          />
                          <Typography variant="caption" color="text.secondary">
                            Risk Factor: {option.riskFactor.toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                />
                
                {formData.location && (
                  <Fade in={!!formData.location} timeout={500}>
                    <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom color="primary.main">
                        Selected Location: {formData.location}
                      </Typography>
                      {getLocationObject() && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Climate Zone: {getLocationObject()?.climateZone}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Risk Factor: {getLocationObject()?.riskFactor.toFixed(1)}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Grow>
        );
      case 1:
        return (
          <Grow in={activeStep === 1} timeout={500}>
            <Card elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', width: '100%' }}>
              <Box sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                p: 2, 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2 }}>
                  <AgricultureIcon />
                </Avatar>
                <Typography variant="h6">Crop Information</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Different crops have varying susceptibility to environmental risks. Select your crop to
                  receive tailored risk assessment based on crop-specific vulnerabilities.
                </Typography>
                
                <Autocomplete
                  options={CROPS}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                  value={getCropObject()}
                  onChange={(_, newValue) => handleChange('crop', newValue ? newValue.name : '')}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Select Crop Type" 
                      required
                      error={!!errors.crop}
                      helperText={errors.crop}
                      fullWidth
                      variant="outlined"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <AgricultureIcon color="primary" sx={{ ml: 1, mr: 0.5 }} />
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="subtitle1">{option.name}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                          <Chip 
                            label={`Water: ${option.waterRequirement}`} 
                            size="small" 
                            sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }} 
                          />
                          <Chip 
                            label={`Growth: ${option.growthDuration}`} 
                            size="small" 
                            sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }} 
                          />
                          <Chip 
                            label={`Drought Sensitivity: ${option.droughtSensitivity}`} 
                            size="small" 
                            sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }} 
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                />
                
                {formData.crop && (
                  <Fade in={!!formData.crop} timeout={500}>
                    <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                      <Typography variant="subtitle2" gutterBottom color="primary.main">
                        Selected Crop: {formData.crop}
                      </Typography>
                      {getCropObject() && (
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mt: 1 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Water Requirement: {getCropObject()?.waterRequirement}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Growth Duration: {getCropObject()?.growthDuration}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Drought Sensitivity: {getCropObject()?.droughtSensitivity}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Grow>
        );
      case 2:
        return (
          <Grow in={activeStep === 2} timeout={500}>
            <Card elevation={3} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', width: '100%' }}>
              <Box sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                p: 2, 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mr: 2 }}>
                  <WaterDropIcon />
                </Avatar>
                <Typography variant="h6">Scenario Selection</Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Select the environmental scenario you want to assess risk for. This helps us calculate
                  the potential impact on your agricultural activity.
                </Typography>
                
                {/* Scenario selection cards */}
                <FormControl component="fieldset" error={!!errors.scenario} sx={{ width: '100%' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    {SCENARIOS.map((scenarioOption) => (
                      <Box key={scenarioOption.value}>
                        <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                          <Card 
                            elevation={formData.scenario === scenarioOption.value ? 3 : 1}
                            onClick={() => {
                              console.log('Selected scenario:', scenarioOption.value);
                              // Update both context and local form data
                              setScenario(scenarioOption.value);
                              setFormData(prevData => ({
                                ...prevData,
                                scenario: scenarioOption.value
                              }));
                              setCompleted({ ...completed, 2: true });
                              // Log the updated scenario selection
                              console.log('Updated scenario selection to:', scenarioOption.value);
                            }}
                            sx={{
                              p: 2,
                              height: '100%',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              borderLeft: '4px solid',
                              borderColor: scenarioOption.color,
                              bgcolor: formData.scenario === scenarioOption.value ? 
                                scenarioOption.bgColor : 'background.paper',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4
                              }
                            }}
                          >
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              width: '100%' 
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' }, width: '100%' }}>
                                <Avatar 
                                  sx={{ 
                                    bgcolor: scenarioOption.bgColor, 
                                    color: scenarioOption.color,
                                    mr: 2,
                                    mt: 0.5,
                                    flexShrink: 0
                                  }}
                                >
                                  {scenarioOption.icon}
                                </Avatar>
                                <Box sx={{ width: '100%' }}>
                                  <Typography variant="h6" sx={{ 
                                    color: formData.scenario === scenarioOption.value ? 
                                      scenarioOption.color : 'text.primary',
                                    fontWeight: formData.scenario === scenarioOption.value ? 600 : 400
                                  }}>
                                    {scenarioOption.label}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {scenarioOption.description}
                                  </Typography>
                                </Box>
                              </Box>
                              {formData.scenario === scenarioOption.value && (
                                <CheckCircleOutlineIcon sx={{ color: scenarioOption.color, flexShrink: 0, ml: 1 }} />
                              )}
                            </Box>
                          </Card>
                        </Zoom>
                      </Box>
                    ))}
                  </Box>
                  {errors.scenario && (
                    <FormHelperText error sx={{ mt: 2, fontSize: '0.9rem' }}>
                      <ErrorOutlineIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                      {errors.scenario}
                    </FormHelperText>
                  )}
                </FormControl>
                
                {formData.scenario && (
                  <Fade in={!!formData.scenario} timeout={500}>
                    <Box sx={{ 
                      mt: 3, 
                      p: 2, 
                      bgcolor: getScenarioObject()?.bgColor || alpha(theme.palette.primary.main, 0.05), 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: getScenarioObject()?.color || theme.palette.divider
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        gutterBottom 
                        sx={{ 
                          color: getScenarioObject()?.color || 'primary.main',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {getScenarioObject()?.icon}
                        <Box component="span" sx={{ ml: 1 }}>
                          {getScenarioObject()?.label} Scenario Selected
                        </Box>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getScenarioObject()?.description}
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </CardContent>
            </Card>
          </Grow>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          mb: 3, 
          borderRadius: 2, 
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          borderLeft: `4px solid ${theme.palette.primary.main}`,
          width: '100%'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2, mb: { xs: 2, sm: 0 } }}>
            <AgricultureIcon />
          </Avatar>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h6" color="primary.main" gutterBottom>
              Agricultural Risk Assessment
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Complete the form below to receive a comprehensive risk assessment for your agricultural activity.
              The assessment considers location-specific climate data, crop vulnerability, and scenario-based risk factors.
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel
        sx={{ 
          mb: 3,
          p: { xs: 1.5, sm: 2 },
          bgcolor: 'white',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          width: '100%'
        }}
      >
        <Step completed={isStepComplete(0)}>
          <StepLabel StepIconProps={{ 
            sx: { color: isStepComplete(0) ? 'success.main' : undefined } 
          }}>
            <Typography variant="subtitle2">
              Location
            </Typography>
          </StepLabel>
        </Step>
        <Step completed={isStepComplete(1)}>
          <StepLabel StepIconProps={{ 
            sx: { color: isStepComplete(1) ? 'success.main' : undefined } 
          }}>
            <Typography variant="subtitle2">
              Crop
            </Typography>
          </StepLabel>
        </Step>
        <Step completed={isStepComplete(2)}>
          <StepLabel StepIconProps={{ 
            sx: { color: isStepComplete(2) ? 'success.main' : undefined } 
          }}>
            <Typography variant="subtitle2">
              Scenario
            </Typography>
          </StepLabel>
        </Step>
      </Stepper>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        {getStepContent(activeStep)}
        
        {errors.submit && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => setErrors({ ...errors, submit: '' })}>
                Dismiss
              </Button>
            }
          >
            {errors.submit}
          </Alert>
        )}
        
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 3,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            width: '100%',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: { xs: 2, sm: 0 }
          }}
        >
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
            startIcon={<NavigateBeforeIcon />}
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === 2 ? (
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={isSubmitting || !formData.scenario} // Disable if no scenario selected
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
                sx={{ 
                  minWidth: 180,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                {isSubmitting ? 'Calculating...' : 'Calculate Risk'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleNext}
                endIcon={<NavigateNextIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 3
                }}
                disabled={activeStep === 0 && !formData.location || activeStep === 1 && !formData.crop}
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
