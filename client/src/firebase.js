// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5wIl9MEuxL908UsXTLPQWJ3d8crAho6Y",
  authDomain: "sample-firebase-ai-app-120d4.firebaseapp.com",
  projectId: "sample-firebase-ai-app-120d4",
  storageBucket: "sample-firebase-ai-app-120d4.firebasestorage.app",
  messagingSenderId: "15265783619",
  appId: "1:15265783619:web:e6e925ebde5231b0f919f6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
