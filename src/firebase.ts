import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDcnEOM4zjvplOwYqN52pDlkMo9H0mFdPw",
    authDomain: "aprendepe-team.firebaseapp.com",
    projectId: "aprendepe-team",
    storageBucket: "aprendepe-team.firebasestorage.app",
    messagingSenderId: "139342246545",
    appId: "1:139342246545:web:6c5abf016e1a5f8f008530",
    measurementId: "G-X5ZVBZXV14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);