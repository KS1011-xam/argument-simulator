import React from 'react';
import ChatInterface from '../components/Chat/ChatInterface';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useRouter } from 'next/router';

export default function Home() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // AuthContext会处理重定向
    } catch (error) {
      console.error('登出错误:', error);
    }
  };
  
  const goToHistory = () => {
    router.push('/history');
  };
  
  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            吵架模拟器
          </Typography>
          {currentUser && (
            <>
              <Button color="inherit" onClick={goToHistory}>
                历史记录
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                退出登录
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <ChatInterface />
      </Box>
    </Box>
  );
}