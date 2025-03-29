import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

// 创建自定义主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#e53935', // 红色主题，适合"吵架"的感觉
      light: '#ff6f60',
      dark: '#ab000d',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffb74d', // 橙色系
      light: '#ffe97d',
      dark: '#c88719',
      contrastText: '#000000',
    },
    error: {
      main: '#f44336',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // 按钮文本不全部大写
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* 重置CSS */}
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;