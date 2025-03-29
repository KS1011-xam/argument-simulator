import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 确保Firebase相关代码只在客户端执行
    const initializeAuth = async () => {
      try {
        const { auth } = await import('../firebase/config');
        const { onAuthStateChanged } = await import('firebase/auth');
        
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser(user);
          setLoading(false);
          
          // 根据登录状态重定向
          const publicPaths = ['/login', '/register'];
          const path = router.pathname;
          
          if (user && publicPaths.includes(path)) {
            router.push('/');
          } else if (!user && !publicPaths.includes(path)) {
            router.push('/login');
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error initializing Firebase Auth:", error);
        setLoading(false);
      }
    };

    // 只在客户端运行
    if (typeof window !== 'undefined') {
      initializeAuth();
    } else {
      setLoading(false);
    }
  }, [router]);

  const value = {
    currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
