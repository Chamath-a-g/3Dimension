import React, { useState, useEffect } from 'react' // Import useState and useEffect
import {
 BrowserRouter,
 Routes,
 Route
} from "react-router-dom";
import './App.css'
import AboutUs from './AboutUs';
import { BlueprintUploader } from './BlueprintUploader';
import Contact from './Contact';
import Services from './Services';
import Team from './Team';
import Signup from './Signup';
import Login from './Login';
import auth from './firebase'; // Import Firebase auth

function App() {
  const [user, setUser] = useState(null); // State to track user login status

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser); // Listener for auth state changes
    return unsubscribe; // Unsubscribe on unmount
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BlueprintUploader user={user} />} /> {/* Pass user prop */}
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/services" element={<Services />} />
        <Route path="/team" element={<Team />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        {/* Add more routes as needed */}
      </Routes>
    </BrowserRouter>
  );
}

export default App