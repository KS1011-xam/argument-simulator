import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Avatar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from 'date-fns';
import { useRouter } from 'next/router';

const ConversationHistory = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const router = useRouter();

  // 加载用户的对话历史
  const loadConversations = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // 创建查询
      const q = query(
        collection(db, "conversations"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      
      // 执行查询
      const querySnapshot = await getDocs(q);
      
      // 处理结果
      const loadedConversations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      setConversations(loadedConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      alert("无法加载对话历史: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // 初始加载
  useEffect(() => {
    loadConversations();
  }, [currentUser, loadConversations]);

  // 删除对话记录
  const deleteConversation = async (id) => {
    try {
      await deleteDoc(doc(db, "conversations", id));
      setConversations(prev => prev.filter(conv => conv.id !== id));
      setConfirmDelete(null);
      
      // 如果当前正在查看这个对话，返回列表
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert("删除失败: " + error.message);
    }
  };

  // 格式化日期
  const formatDate = (date) => {
    if (!date) return "未知日期";
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  };

  // 返回列表
  const backToList = () => {
    setSelectedConversation(null);
  };

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          {selectedConversation ? '对话详情' : '吵架历史记录'}
        </Typography>
        
        {selectedConversation && (
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={backToList}
            variant="outlined"
          >
            返回列表
          </Button>
        )}
        
        {!selectedConversation && (
          <Button onClick={() => router.push('/')} variant="outlined">
            返回吵架
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : selectedConversation ? (
        // 显示选中的对话详情
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2 
          }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedConversation.scenario}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {formatDate(selectedConversation.createdAt)}
              </Typography>
            </Box>
            
            <IconButton 
              color="error" 
              onClick={() => setConfirmDelete(selectedConversation)}
              title="删除此对话"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <List>
            {selectedConversation.messages
              .filter(msg => msg.role !== 'system')
              .map((message, index) => (
                <ListItem 
                  key={index} 
                  alignItems="flex-start"
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                    py: 1
                  }}
                >
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    mb: 0.5,
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                  }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: message.role === 'user' ? 'primary.main' : 'error.main',
                        mr: message.role === 'user' ? 0 : 1,
                        ml: message.role === 'user' ? 1 : 0,
                        width: 30,
                        height: 30,
                        fontSize: '0.875rem'
                      }}
                    >
                      {message.role === 'user' ? '你' : 'AI'}
                    </Avatar>
                    
                    <Typography variant="caption" color="textSecondary">
                      {message.role === 'user' ? '你' : '对方'}
                    </Typography>
                  </Box>
                  
                  <Paper 
                    elevation={1}
                    sx={{ 
                      p: 2,
                      bgcolor: message.role === 'user' ? 'primary.light' : 'grey.100',
                      color: message.role === 'user' ? 'white' : 'text.primary',
                      borderRadius: message.role === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                      maxWidth: '80%',
                      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Typography variant="body1">
                      {message.content}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
          </List>
        </Paper>
      ) : conversations.length > 0 ? (
        // 显示对话列表
        <List component={Paper} elevation={2}>
          {conversations.map((conversation) => (
            <React.Fragment key={conversation.id}>
              <ListItem
                button
                onClick={() => setSelectedConversation(conversation)}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(conversation);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={conversation.scenario}
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="textSecondary"
                      >
                        {formatDate(conversation.createdAt)}
                      </Typography>
                      <br />
                      <Typography
                        component="span"
                        variant="body2"
                        color="textSecondary"
                      >
                        {`${conversation.messages.filter(m => m.role !== 'system').length} 条消息`}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      ) : (
        // 没有对话记录
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="textSecondary">
            你还没有任何吵架记录。
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => router.push('/')}
          >
            开始你的第一次吵架！
          </Button>
        </Paper>
      )}

      {/* 删除确认对话框 */}
      <Dialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除这条吵架记录吗？此操作无法撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} color="primary">
            取消
          </Button>
          <Button 
            onClick={() => deleteConversation(confirmDelete.id)} 
            color="error"
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationHistory;
