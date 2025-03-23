import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { BlueprintUploader } from "./BlueprintUploader";
import AboutUs from "./AboutUs";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BlueprintUploader />} />
        <Route path="/about" element={<AboutUs />} />
        {/* Add other routes as you build more pages */}
        <Route path="*" element={<BlueprintUploader />} />
      </Routes>
    </Router>
  );
}

export default App;