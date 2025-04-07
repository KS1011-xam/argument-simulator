// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 将这里的值替换为你自己的 Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyDqAi_oZczyRWi1NcynxOh8HVWVNh-mens",
  authDomain: "argument-simulator.firebaseapp.com",
  projectId: "argument-simulator",
  storageBucket: "argument-simulator.firebasestorage.app",
  messagingSenderId: "1073066231942",
  appId: "1:1073066231942:web:e30e2566d46b05d85b6907",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
