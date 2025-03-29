import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import Link from 'next/link';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState(null);

  // 确保Firebase相关代码只在客户端执行
  useEffect(() => {
    const loadFirebase = async () => {
      try {
        const { auth } = await import('../../firebase/config');
        setAuth(auth);
      } catch (error) {
        console.error("Error loading Firebase:", error);
      }
    };
    
    loadFirebase();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!auth) {
      setError('Firebase尚未初始化，请稍后再试');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
      // 登录成功后会自动由AuthContext处理重定向
    } catch (err) {
      setError('登录失败: ' + err.message);
    }
    
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 2 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        登录吵架模拟器
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <form onSubmit={handleLogin}>
        <TextField
          label="电子邮件"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <TextField
          label="密码"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          fullWidth 
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </Button>
      </form>
      
      <Typography align="center" sx={{ mt: 2 }}>
        还没有账号? <Link href="/register">点击注册</Link>
      </Typography>
    </Box>
  );
};

export default Login;
