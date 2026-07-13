import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, IconButton, Avatar, Chip,
  Paper, Divider, Tooltip, useTheme, alpha, Fade,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import MicIcon from '@mui/icons-material/Mic';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { ChatMessage } from '../../types';

const SUGGESTED_PROMPTS = [
  'Help me understand quadratic equations',
  'Create a study schedule for exams',
  'Translate this school notice to English',
  'Give me revision tips for Science',
  'What are good learning resources for History?',
  'Explain photosynthesis simply',
  'How can I improve my child\'s English?',
  'Create a practice quiz for Mathematics',
];

const AI_RESPONSES: Record<string, string> = {
  default: "I'm your EduGuardian AI Assistant! I can help with homework questions, explain topics, create study schedules, translate notices, and much more. What would you like to know?",
  study: "Here's a balanced study schedule for exam preparation:\n\n**Morning (6-7 AM)**\n• Review previous day's notes (20 min)\n• Fresh subject study (40 min)\n\n**After School (2-4 PM)**\n• Complete homework first\n• Practice past year papers\n\n**Evening (7-9 PM)**\n• Revision and summarizing\n• Prepare for next day\n\n**Tips:**\n• Take 10-min breaks every 45 minutes\n• Stay hydrated and get 8 hours sleep\n• Use mind maps for complex topics",
  math: "Great question! Let me explain **quadratic equations**:\n\nA quadratic equation has the form: **ax² + bx + c = 0**\n\n**Methods to solve:**\n\n1. **Factoring**: Find two numbers that multiply to (a×c) and add to b\n   Example: x² + 5x + 6 = 0 → (x+2)(x+3) = 0\n\n2. **Quadratic Formula**:\n   x = (-b ± √(b²-4ac)) / 2a\n\n3. **Completing the Square**: Add/subtract to create a perfect square\n\n**Practice tip**: Start with simple factoring problems, then move to the formula. Want me to create practice problems?",
  science: "**Photosynthesis** is how plants make their own food! 🌱\n\n**Simple explanation:**\nPlants use sunlight, water, and carbon dioxide to produce glucose (sugar) and oxygen.\n\n**The equation:**\n6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂\n\n**Key parts:**\n- **Chlorophyll** (in leaves) absorbs sunlight\n- **Stomata** (tiny pores) take in CO₂\n- **Roots** absorb water\n\n**Memory trick:** 'Plants eat light and breathe out oxygen'\n\nWould you like practice questions on this topic?",
  tips: "Here are **top revision tips** for better results:\n\n**Active Learning:**\n• Teach the topic to someone else\n• Make flashcards and test yourself\n• Draw mind maps and diagrams\n\n**Memory Techniques:**\n• Use acronyms (e.g., ROY G BIV for colors)\n• Create stories around facts\n• Spaced repetition (review after 1 day, 3 days, 1 week)\n\n**Environment:**\n• Study in a quiet, well-lit place\n• Put away your phone\n• Listen to white noise or classical music\n\n**Health:**\n• Sleep 8-9 hours before exams\n• Exercise for 30 minutes daily\n• Eat brain foods: nuts, blueberries, fish",
};

function getAIResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('schedule') || lower.includes('study plan')) return AI_RESPONSES.study;
  if (lower.includes('quadratic') || lower.includes('algebra') || lower.includes('math')) return AI_RESPONSES.math;
  if (lower.includes('photosynthesis') || lower.includes('science') || lower.includes('biology')) return AI_RESPONSES.science;
  if (lower.includes('tip') || lower.includes('revision') || lower.includes('improve')) return AI_RESPONSES.tips;
  return `I understand you're asking about: **"${message}"**\n\nAs your EduGuardian AI assistant, I can help with:\n\n• **Homework explanations** - Break down any subject\n• **Study schedules** - Personalized planning\n• **Topic summaries** - Quick revision notes\n• **Practice questions** - Test understanding\n• **Translation** - School notices in any language\n\nPlease provide more details about what you need help with, and I'll give you a comprehensive answer! 📚`;
}

function MessageBubble({ message, onCopy, onRegenerate }: { message: ChatMessage; onCopy: (text: string) => void; onRegenerate?: () => void }) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <Fade in>
      <Box
        sx={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          gap: 1.5, mb: 2, alignItems: 'flex-start',
        }}
      >
        <Avatar
          sx={{
            width: 36, height: 36, flexShrink: 0,
            bgcolor: isUser ? 'primary.main' : 'secondary.main',
            fontSize: '0.875rem',
          }}
        >
          {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
        </Avatar>
        <Box sx={{ maxWidth: '75%' }}>
          <Paper
            elevation={0}
            sx={{
              p: 2, borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              bgcolor: isUser
                ? 'primary.main'
                : theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
              color: isUser ? 'white' : 'text.primary',
              border: '1px solid',
              borderColor: isUser ? 'primary.main' : 'divider',
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {message.content.split('**').map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </Typography>
          </Paper>
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <Typography variant="caption" color="text.disabled">
              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
            {!isUser && (
              <>
                <Tooltip title="Copy">
                  <IconButton size="small" onClick={() => onCopy(message.content)} sx={{ p: 0.25 }}>
                    <ContentCopyIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  </IconButton>
                </Tooltip>
                {onRegenerate && (
                  <Tooltip title="Regenerate">
                    <IconButton size="small" onClick={onRegenerate} sx={{ p: 0.25 }}>
                      <RefreshIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

export default function AIAssistant() {
  const { user } = useAuth();
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('chat_history')
        .select('*')
        .eq('session_id', sessionId.current)
        .order('created_at');
      if (data && data.length > 0) {
        setMessages(data as ChatMessage[]);
      } else {
        // Welcome message
        const welcome: ChatMessage = {
          id: crypto.randomUUID(),
          user_id: user.id,
          role: 'assistant',
          content: AI_RESPONSES.default,
          session_id: sessionId.current,
          created_at: new Date().toISOString(),
        };
        setMessages([welcome]);
      }
    })();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user) return;
    setInput('');
    setLoading(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'user',
      content: text.trim(),
      session_id: sessionId.current,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Save to DB
    await supabase.from('chat_history').insert({
      user_id: user.id,
      role: 'user',
      content: text.trim(),
      session_id: sessionId.current,
    });

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1200));
    const responseText = getAIResponse(text);

    const aiMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user.id,
      role: 'assistant',
      content: responseText,
      session_id: sessionId.current,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);

    await supabase.from('chat_history').insert({
      user_id: user.id,
      role: 'assistant',
      content: responseText,
      session_id: sessionId.current,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleClearChat = () => {
    sessionId.current = crypto.randomUUID();
    const welcome: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user?.id ?? '',
      role: 'assistant',
      content: AI_RESPONSES.default,
      session_id: sessionId.current,
      created_at: new Date().toISOString(),
    };
    setMessages([welcome]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2.5,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <SmartToyIcon sx={{ color: 'white' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight={700}>AI Assistant</Typography>
            <Chip label="AI Powered" size="small" icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important' }} />} sx={{ bgcolor: 'primary.main', color: 'white', height: 22, fontSize: '0.7rem' }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Homework help, study tips, topic explanations & more
          </Typography>
        </Box>
        <Tooltip title="Clear conversation">
          <IconButton onClick={handleClearChat} color="inherit">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Suggested prompts */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
        {SUGGESTED_PROMPTS.slice(0, 4).map((p) => (
          <Chip
            key={p}
            label={p}
            size="small"
            onClick={() => sendMessage(p)}
            sx={{
              cursor: 'pointer', fontSize: '0.72rem',
              bgcolor: theme.palette.mode === 'light' ? 'primary.50' : alpha('#2563EB', 0.1),
              color: 'primary.main', fontWeight: 500,
              border: '1px solid', borderColor: alpha('#2563EB', 0.2),
              '&:hover': { bgcolor: alpha('#2563EB', 0.15) },
            }}
          />
        ))}
      </Box>

      {/* Chat area */}
      <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CardContent sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onCopy={handleCopy}
              onRegenerate={i === messages.length - 1 && msg.role === 'assistant'
                ? () => {
                    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                    if (lastUser) sendMessage(lastUser.content);
                  }
                : undefined
              }
            />
          ))}
          {loading && (
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-start' }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main' }}>
                <SmartToyIcon fontSize="small" />
              </Avatar>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '4px 16px 16px 16px', bgcolor: theme.palette.mode === 'light' ? 'grey.50' : 'grey.900', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`, '@keyframes bounce': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } } }} />
                  ))}
                </Box>
              </Paper>
            </Box>
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <Divider />

        {/* Input */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <Tooltip title="Attach file">
              <IconButton size="small" color="inherit" sx={{ color: 'text.secondary' }}>
                <AttachFileIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Voice input">
              <IconButton size="small" color="inherit" sx={{ color: 'text.secondary' }}>
                <MicIcon />
              </IconButton>
            </Tooltip>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask me anything about homework, study tips, subjects..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            />
            <IconButton
              color="primary"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: 'primary.main', color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                width: 40, height: 40,
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            Press Enter to send • Shift+Enter for new line
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
