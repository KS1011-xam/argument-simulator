import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Box, Alert } from '@mui/material';
import Link from 'next/link';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  // 确保Firebase相关代码只在客户端执行
  useEffect(() => {
    const loadFirebase = async () => {
      try {
        const { auth, db } = await import('../../firebase/config');
        setAuth(auth);
        setDb(db);
      } catch (error) {
        console.error("Error loading Firebase:", error);
      }
    };
    
    loadFirebase();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!auth || !db) {
      setError('Firebase尚未初始化，请稍后再试');
      return;
    }
    
    setError('');
    
    if (password !== confirmPassword) {
      return setError('两次输入的密码不一致');
    }
    
    setLoading(true);
    
    try {
      // 创建用户
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const { doc, setDoc } = await import('firebase/firestore');
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 更新用户档案
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // 在Firestore中为用户创建文档
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date().toISOString(),
        preferences: {
          favoriteScenarios: []
        }
      });
      
      // 注册成功后会自动由AuthContext处理重定向
    } catch (err) {
      setError('注册失败: ' + err.message);
    }
    
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 2 }}>
      <Typography variant="h4" component="h1" align="center" gutterBottom>
        注册吵架模拟器
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <form onSubmit={handleRegister}>
        <TextField
          label="用户名"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
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
        
        <TextField
          label="确认密码"
          type="password"
          fullWidth
          margin="normal"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? '注册中...' : '注册'}
        </Button>
      </form>
      
      <Typography align="center" sx={{ mt: 2 }}>
        已有账号? <Link href="/login">点击登录</Link>
      </Typography>
    </Box>
  );
};

export default Register;
