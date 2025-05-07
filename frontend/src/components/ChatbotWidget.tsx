import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  Fab, 
  Avatar, 
  Zoom,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Send as SendIcon, 
  ChatBubble as ChatBubbleIcon,
  Close as CloseIcon,
  Agriculture as AgricultureIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Define message type
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Initial bot messages
const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Hello! I\'m your AgriRisk assistant. How can I help you today?',
    sender: 'bot',
    timestamp: new Date()
  },
  {
    id: '2',
    text: 'You can ask me about risk assessment, crop information, or how to interpret your results.',
    sender: 'bot',
    timestamp: new Date()
  }
];

// Predefined responses for common questions
const responses: Record<string, string[]> = {
  'risk': [
    'Risk assessment is calculated based on multiple factors including location, crop type, and environmental scenarios.',
    'Our risk model uses historical data and predictive analytics to estimate the likelihood of crop failure or reduced yield.',
    'Risk levels are categorized as Low (0-30%), Moderate (30-70%), and High (70-100%).'
  ],
  'score': [
    'Your risk score indicates the probability of facing agricultural challenges.',
    'A higher score means greater risk to your crop yield or quality.',
    'We recommend implementing risk mitigation strategies for scores above 50%.'
  ],
  'factor': [
    'Contributing factors include climate conditions, crop susceptibility, and historical data from your region.',
    'Each factor is weighted based on its impact on agricultural outcomes.',
    'You can see the breakdown of factors in the Risk Results page.'
  ],
  'insurance': [
    'Crop insurance can help protect against financial losses due to natural disasters or market fluctuations.',
    'Your risk assessment can be used when applying for agricultural insurance.',
    'Different insurance plans cover different types of risks, so choose one that addresses your specific concerns.'
  ],
  'drought': [
    'Drought risk is assessed based on historical rainfall patterns and climate forecasts.',
    'Drought-resistant crop varieties and efficient irrigation systems can help mitigate drought risk.',
    'Consider water conservation techniques and soil moisture management practices.'
  ],
  'flood': [
    'Flood risk assessment considers terrain, proximity to water bodies, and historical flood data.',
    'Proper drainage systems and raised planting beds can help manage flood risk.',
    'Consider flood-resistant crop varieties for high-risk areas.'
  ],
  'pest': [
    'Pest risk is evaluated based on historical pest pressure and environmental conditions.',
    'Integrated Pest Management (IPM) strategies can help reduce pest-related crop damage.',
    'Regular monitoring and early intervention are key to managing pest risk.'
  ],
  'help': [
    'I can help you understand your risk assessment results, provide information about crops, and suggest risk mitigation strategies.',
    'Try asking about specific risk factors, insurance options, or how to interpret your risk score.',
    'You can also ask about specific crops or environmental scenarios.'
  ]
};

const ChatbotWidget: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Toggle chatbot open/closed
  const toggleChat = () => {
    setOpen(!open);
  };

  // Send message
  const sendMessage = () => {
    if (input.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate bot thinking and then respond
    setTimeout(() => {
      const botResponse = generateResponse(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  // Generate response based on user input
  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Check for matches with predefined keywords
    for (const [keyword, answers] of Object.entries(responses)) {
      if (input.includes(keyword)) {
        return answers[Math.floor(Math.random() * answers.length)];
      }
    }
    
    // Default responses if no keyword matches
    const defaultResponses = [
      "I'm not sure I understand. Could you rephrase your question?",
      "That's an interesting question. Let me help you with agricultural risk assessment instead.",
      "I'm specialized in agricultural risk assessment. Could you ask something related to crops, risk factors, or insurance?",
      "I don't have information on that topic yet. Try asking about risk assessment, crop information, or insurance options."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Handle enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat button */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Tooltip title={open ? "Close chat" : "Open chat assistant"}>
          <Fab 
            color="primary" 
            onClick={toggleChat}
            aria-label="chat"
            sx={{ 
              boxShadow: 3,
              '&:hover': {
                transform: 'scale(1.05)'
              },
              transition: 'transform 0.2s'
            }}
          >
            {open ? <CloseIcon /> : <ChatBubbleIcon />}
          </Fab>
        </Tooltip>
      </Box>

      {/* Chat window */}
      <Zoom in={open}>
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: { xs: 'calc(100% - 40px)', sm: 350 },
            maxWidth: 350,
            height: 450,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 1000,
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          {/* Chat header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <AgricultureIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              AgriRisk Assistant
            </Typography>
            <IconButton 
              size="small" 
              onClick={toggleChat}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Chat messages */}
          <Box
            sx={{
              p: 2,
              flexGrow: 1,
              overflow: 'auto',
              bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#f5f5f5'
            }}
          >
            <List sx={{ width: '100%', p: 0 }}>
              {messages.map((message, index) => (
                <React.Fragment key={message.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      px: 0
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar
                        sx={{
                          bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                          width: 32,
                          height: 32
                        }}
                      >
                        {message.sender === 'user' ? <PersonIcon fontSize="small" /> : <AgricultureIcon fontSize="small" />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            display: 'inline-block',
                            maxWidth: '85%',
                            bgcolor: message.sender === 'user' ? 'primary.light' : 'background.paper',
                            color: message.sender === 'user' ? 'white' : 'text.primary',
                            boxShadow: 1
                          }}
                        >
                          {message.text}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            mt: 0.5,
                            textAlign: message.sender === 'user' ? 'right' : 'left'
                          }}
                        >
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < messages.length - 1 && <Box sx={{ height: 8 }} />}
                </React.Fragment>
              ))}
              {isTyping && (
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'secondary.main',
                        width: 32,
                        height: 32
                      }}
                    >
                      <AgricultureIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          display: 'inline-block',
                          bgcolor: 'background.paper',
                          boxShadow: 1
                        }}
                      >
                        <CircularProgress size={16} thickness={4} />
                      </Box>
                    }
                  />
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* Chat input */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
              display: 'flex'
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Type your question..."
              variant="outlined"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              sx={{ mr: 1 }}
            />
            <IconButton
              color="primary"
              onClick={sendMessage}
              disabled={input.trim() === ''}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark'
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Zoom>
    </>
  );
};

export default ChatbotWidget;
