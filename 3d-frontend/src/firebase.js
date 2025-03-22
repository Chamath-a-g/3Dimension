// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1krrU_RH4F-zFTF8ugB87-2ObWHJYMV4",
  authDomain: "dimension-697de.firebaseapp.com",
  projectId: "dimension-697de",
  storageBucket: "dimension-697de.firebasestorage.app",
  messagingSenderId: "977368416466",
  appId: "1:977368416466:web:34e547c5d9d8ec1877ed0b",
  measurementId: "G-D74YFVE2FM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export default app;