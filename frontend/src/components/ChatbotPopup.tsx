import React, { useState } from 'react';
import { Box, IconButton, TextField, Paper, Typography, Button, CircularProgress } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';

const ChatbotPopup: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{from: 'user'|'bot', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, {from: 'user', text: input}]);
    setLoading(true);
    setInput('');
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: input, sender: 'farmer1'})
      });
      const data = await res.json();
      const botReplies = Array.isArray(data) ? data : [{ text: "Sorry, I didn't understand the response." }];
      setMessages(msgs => [...msgs, ...botReplies.map((d: any) => ({from: 'bot', text: d.text}))]);
    } catch {
      setMessages(msgs => [...msgs, {from: 'bot', text: 'Sorry, I am currently unavailable.'}]);
    }
    setLoading(false);
  };

  return (
    <>
      <IconButton
        sx={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1300, bgcolor: 'primary.main', color: 'white',
          '&:hover': { bgcolor: 'primary.dark' }
        }}
        onClick={() => setOpen(true)}
        size="large"
      >
        <ChatIcon />
      </IconButton>
      {open && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed', bottom: 90, right: 24, width: 340, maxWidth: '95vw', maxHeight: '70vh',
            display: 'flex', flexDirection: 'column', zIndex: 1400
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>Agri Assistant</Typography>
            <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f9f9f9' }}>
            {messages.map((msg, i) => (
              <Box key={i} sx={{ mb: 1, textAlign: msg.from === 'user' ? 'right' : 'left' }}>
                <Typography
                  variant="body2"
                  sx={{
                    display: 'inline-block',
                    bgcolor: msg.from === 'user' ? 'primary.light' : 'grey.200',
                    color: msg.from === 'user' ? 'white' : 'black',
                    px: 2, py: 1, borderRadius: 2, maxWidth: '80%'
                  }}
                >
                  {msg.text}
                </Typography>
              </Box>
            ))}
            {loading && <CircularProgress size={20} sx={{ display: 'block', mx: 'auto', my: 1 }} />}
          </Box>
          <Box sx={{ display: 'flex', p: 1, borderTop: 1, borderColor: 'divider' }}>
            <TextField
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything about farming..."
              size="small"
              fullWidth
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()} sx={{ ml: 1 }} variant="contained">Send</Button>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ChatbotPopup;
