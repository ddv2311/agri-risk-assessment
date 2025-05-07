import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, CircularProgress, Alert,
  InputAdornment, IconButton, Card, CardContent
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { authService } from '../services/api';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the auth service to login
      const response = await authService.login(username, password);
      
      if (response.access_token) {
        onLogin(username, password);
        navigate('/risk-assessment');
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card 
      elevation={4} 
      sx={{ 
        maxWidth: 450, 
        mx: 'auto',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          py: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <AgricultureIcon sx={{ fontSize: 40, mb: 1 }} />
        <Typography variant="h4" component="h1" fontWeight="500">
          AgriRisk
        </Typography>
        <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.9 }}>
          Agricultural Risk Assessment System
        </Typography>
      </Box>
      
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
          Sign In
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineOutlinedIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={isLoading}
            sx={{ 
              mt: 4, 
              py: 1.5,
              fontWeight: 'bold',
              borderRadius: 1.5
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Demo credentials: admin / password
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Login;
