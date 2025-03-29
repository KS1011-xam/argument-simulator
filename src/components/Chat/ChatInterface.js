import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Button, Typography, Paper, Avatar, IconButton, Divider, MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Chip, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import RecommendIcon from '@mui/icons-material/Recommend';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { scenarios } from '../../data/scenarios';
import { generateRecommendations } from '../../services/recommendationService';

// 对话消息组件
const Message = ({ message, isUser }) => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      mb: 2
    }}
  >
    {!isUser && (
      <Avatar 
        sx={{ 
          bgcolor: 'error.main', 
          mr: 1,
          width: 36,
          height: 36
        }}
      >
        AI
      </Avatar>
    )}
    
    <Paper 
      elevation={1} 
      sx={{ 
        p: 2, 
        maxWidth: '75%',
        bgcolor: isUser ? 'primary.light' : 'grey.100',
        color: isUser ? 'white' : 'text.primary',
        borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
      }}
    >
      <Typography variant="body1">{message.content}</Typography>
    </Paper>
    
    {isUser && (
      <Avatar 
        sx={{ 
          bgcolor: 'primary.main', 
          ml: 1,
          width: 36,
          height: 36
        }}
      >
        你
      </Avatar>
    )}
  </Box>
);

// 主聊天界面组件
const ChatInterface = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [scenario, setScenario] = useState('');
  const [customScenario, setCustomScenario] = useState('');
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [recommendedScenarios, setRecommendedScenarios] = useState([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const messagesEndRef = useRef(null);

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载用户推荐场景
  useEffect(() => {
    // 只有当用户登录后才加载推荐
    if (currentUser) {
      loadRecommendations();
    }
  }, [currentUser]);

  // 加载推荐场景
  const loadRecommendations = async () => {
    try {
      const recommendations = await generateRecommendations(currentUser.uid, 3);
      setRecommendedScenarios(recommendations);
      setShowRecommendations(recommendations.length > 0);
    } catch (error) {
      console.error("Error loading recommendations:", error);
    }
  };

  // 处理选择场景
  const handleScenarioChange = (event) => {
    const value = event.target.value;
    
    if (value === 'custom') {
      setShowCustomDialog(true);
      return;
    }
    
    setScenario(value);
    resetChat();
    
    // 找到选中的场景
    const selectedScenario = scenarios.find(s => s.id === value);
    if (selectedScenario) {
      setCharacterName(selectedScenario.character);
      
      // 添加场景描述消息
      setMessages([
        { id: 'scenario-desc', role: 'system', content: selectedScenario.description }
      ]);
      
      // 添加AI的初始消息
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: selectedScenario.initialMessage }
        ]);
      }, 1000);
    }
  };

  // 重置聊天
  const resetChat = () => {
    setMessages([]);
    setInput('');
  };

  // 处理自定义场景提交
  const handleCustomScenarioSubmit = () => {
    if (!customScenario.trim()) return;
    
    setScenario('custom');
    resetChat();
    setShowCustomDialog(false);
    
    // 添加自定义场景描述
    setMessages([
      { id: 'custom-scenario', role: 'system', content: customScenario }
    ]);
    
    // AI初始响应
    setIsLoading(true);
    
    // 调用API获取AI的初始回应
    fetchAIResponse(customScenario, [])
      .then(response => {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: response }
        ]);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error getting AI response:', error);
        setMessages(prev => [
          ...prev,
          { 
            id: Date.now().toString(), 
            role: 'assistant', 
            content: '哼，有什么事？快说吧，我很忙的！' 
          }
        ]);
        setIsLoading(false);
      });
  };

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || !scenario) return;
    
    // 添加用户消息
    const userMessageId = Date.now().toString();
    const userMessage = { id: userMessageId, role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // 获取当前对话历史
      const history = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      // 获取场景描述
      const scenarioDescription = messages.find(msg => msg.role === 'system')?.content || '';
      
      // 调用API获取AI回应
      const aiResponse = await fetchAIResponse(scenarioDescription, [...history, { role: 'user', content: input }]);
      
      // 添加AI回应
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: aiResponse }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      // 添加一个默认的AI回应
      setMessages(prev => [
        ...prev,
        { 
          id: Date.now().toString(), 
          role: 'assistant', 
          content: '哼，你说什么？我怎么听不懂？不要跟我打哑谜！' 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // 调用AI API获取回应
  const fetchAIResponse = async (scenarioDesc, messageHistory) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario: scenarioDesc,
          messages: messageHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error fetching AI response:', error);
      throw error;
    }
  };

  // 保存对话记录
  const saveConversation = async () => {
    if (messages.length < 2 || !currentUser) return;
    
    try {
      // 获取场景标题
      let scenarioTitle = "自定义场景";
      if (scenario !== 'custom') {
        const selectedScenario = scenarios.find(s => s.id === scenario);
        if (selectedScenario) {
          scenarioTitle = selectedScenario.title;
        }
      }
      
      // 保存到Firestore
      await addDoc(collection(db, "conversations"), {
        userId: currentUser.uid,
        scenario: scenarioTitle,
        messages: messages,
        createdAt: serverTimestamp(),
      });
      
      alert("对话已保存！");
    } catch (error) {
      console.error("Error saving conversation:", error);
      alert("保存失败：" + error.message);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 顶部选择区域 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          吵架模拟器
        </Typography>
        
        <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
          <InputLabel>选择吵架场景</InputLabel>
          <Select
            value={scenario}
            onChange={handleScenarioChange}
            label="选择吵架场景"
          >
            <MenuItem value="">
              <em>请选择一个场景</em>
            </MenuItem>
            
            {/* 推荐场景区域 */}
            {showRecommendations && recommendedScenarios.length > 0 && (
              <>
                <MenuItem disabled>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RecommendIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                    <Typography variant="body2" color="secondary.main">为你推荐</Typography>
                  </Box>
                </MenuItem>
                
                {recommendedScenarios.map((s) => (
                  <MenuItem key={`rec-${s.id}`} value={s.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography>{s.title}</Typography>
                      <Chip 
                        size="small" 
                        label="推荐" 
                        color="secondary" 
                        sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                      />
                    </Box>
                  </MenuItem>
                ))}
                
                <Divider />
              </>
            )}
            
            {/* 所有预设场景 */}
            <MenuItem disabled>
              <Typography variant="body2" color="textSecondary">所有场景</Typography>
            </MenuItem>
            
            {scenarios.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.title}
              </MenuItem>
            ))}
            
            <Divider />
            <MenuItem value="custom">自定义场景...</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* 消息区域 */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 2, 
        overflowY: 'auto',
        bgcolor: 'grey.50',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.map((message) => (
          message.role === 'system' ? (
            <Paper 
              key={message.id}
              elevation={0}
              sx={{ 
                p: 2, 
                mb: 2, 
                bgcolor: 'info.light', 
                color: 'info.contrastText',
                borderRadius: 2
              }}
            >
              <Typography variant="body2">{message.content}</Typography>
            </Paper>
          ) : (
            <Message 
              key={message.id} 
              message={message} 
              isUser={message.role === 'user'} 
            />
          )
        ))}
        
        {isTyping && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1, mb: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="textSecondary">
              对方正在输入...
            </Typography>
          </Box>
        )}
        
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>
      
      {/* 输入区域 */}
      <Box sx={{ 
        p: 2, 
        borderTop: 1, 
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex'
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={scenario ? "输入你想说的话..." : "请先选择一个吵架场景"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={!scenario || isTyping}
          sx={{ mr: 1 }}
        />
        
        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={sendMessage}
          disabled={!scenario || !input.trim() || isTyping}
        >
          发送
        </Button>
        
        <IconButton 
          color="secondary" 
          onClick={saveConversation}
          disabled={messages.length < 2}
          sx={{ ml: 1 }}
          title="保存对话"
        >
          <SaveIcon />
        </IconButton>
      </Box>
      
      {/* 自定义场景对话框 */}
      <Dialog open={showCustomDialog} onClose={() => setShowCustomDialog(false)}>
        <DialogTitle>创建自定义吵架场景</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="描述你想要的吵架场景"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={customScenario}
            onChange={(e) => setCustomScenario(e.target.value)}
            placeholder="例如：在餐厅吃饭时隔壁桌的人一直用手机外放视频..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomDialog(false)} color="primary">
            取消
          </Button>
          <Button 
            onClick={handleCustomScenarioSubmit} 
            color="primary"
            disabled={!customScenario.trim()}
          >
            开始吵架
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatInterface;