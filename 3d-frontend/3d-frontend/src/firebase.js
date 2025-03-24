// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration (PASTE YOUR CONFIG HERE)
const firebaseConfig = {
    apiKey: "AIzaSyC0ylskTVbS3T35ORuMNydn0OLbE403ri0",
    authDomain: "dimension-7f8b7.firebaseapp.com",
    projectId: "dimension-7f8b7",
    storageBucket: "dimension-7f8b7.firebasestorage.app",
    messagingSenderId: "462620321212",
    appId: "1:462620321212:web:fa3a31493663cbb7b437b9",
    measurementId: "G-CLSNMTHR5B"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get the Auth instance
const auth = getAuth(app);

export default auth; // Export the auth instance