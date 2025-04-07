// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDqAi_oZczyRWi1NcynxOh8HVWVNh-mens",
  authDomain: "argument-simulator.firebaseapp.com",
  projectId: "argument-simulator",
  storageBucket: "argument-simulator.firebasestorage.app",
  messagingSenderId: "1073066231942",
  appId: "1:1073066231942:web:e30e2566d46b05d85b6907",
  measurementId: "G-CMWDDQ719L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
