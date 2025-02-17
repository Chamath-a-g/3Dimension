import React, { useState } from "react";
import { SocialIcon } from "react-social-icons"; // Import social icons
import ApiResponseDisplay from "./ApiResponseDisplay";

function BlueprintUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const validTypes = ["image/png", "image/jpeg", "image/jpg"];

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      const fileType = selectedFile.type;
      const fileSize = selectedFile.size;

      if (!validTypes.includes(fileType)) {
        setError("Only .png, .jpg, and .jpeg files are allowed!");
        setFile(null);
        setPreview(null);
        return;
      }

      if (fileSize > MAX_FILE_SIZE) {
        setError("File size must be under 20MB!");
        setFile(null);
        setPreview(null);
        return;
      }

      setError(""); // Clear errors
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleInputChange = (e) => {
    handleFileChange(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileChange(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setIsLoading(true);
    setError("");
    setExtractedText("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/process", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setExtractedText(data.extracted_text || "No text found.");
      }
    } catch (err) {
      setError("Failed to process the blueprint.");
    }

    setIsLoading(false);
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/bgimage.jpg')" }} // Background Image
    >
      {/* Header Section */}
      <header className="flex justify-between items-center bg-blue-950 text-white p-4 shadow-md">
        {/* Left Side: Logo & Name */}
        <div className="flex items-center space-x-2">
          <img src="/Final logo.png" alt="Logo" className="w-10 h-10" />
          <span className="text-xl font-bold">3 Dimension</span>
        </div>

        {/* Middle: Navigation */}
        <nav className="space-x-4">
          <a href="/BlueprintUploader.js" className="hover:underline">Home</a>
          <a href="/contact" className="hover:underline">Contact Us</a>
          <a href="/gallery" className="hover:underline">Gallery</a>
          <a href="/faq" className="hover:underline">FAQ</a>
        </nav>

        {/* Right Side: Login/Signup */}
        <a href="/login" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-200">
          Login / Signup
        </a>
      </header>

      {/*  Main Content */}
      <main className="flex flex-col items-center p-4 flex-grow bg-gray-100 bg-opacity-80 rounded-lg mx-4 mt-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Upload a Blueprint</h2>

        {/* Drag and Drop Area */}
        <div
          className="border-2 border-dashed border-gray-400 p-6 w-80 text-center cursor-pointer bg-white hover:bg-gray-50 rounded-lg"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <p className="text-gray-600">Drag & Drop your blueprint here</p>
          <p className="text-gray-400">or</p>
          <label className="text-blue-500 cursor-pointer">
            Click to Upload
            <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={handleInputChange} />
          </label>
        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>} {/* Show error message */}

        {preview && <img src={preview} alt="Preview" className="w-64 h-auto border mb-4 mt-4" />}

        <button
          onClick={handleUpload}
          className={`px-4 py-2 rounded text-white ${file ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"}`}
          disabled={!file}
        >
          Upload Blueprint
        </button>

        {/* API Response Visualization */}
        <ApiResponseDisplay extractedText={extractedText} isLoading={isLoading} error={error} />
      </main>

      {/* Footer Section */}
      <footer className="bg-blue-950 text-white text-center p-4 mt-4">
        <p>© {new Date().getFullYear()} 3 Dimension. All rights reserved.</p>
        
        {/* Social Media Icons */}
        <div className="flex justify-center space-x-4 mt-2">
          <SocialIcon url="https://facebook.com" target="_blank" />
          <SocialIcon url="https://twitter.com" target="_blank" />
          <SocialIcon url="https://instagram.com" target="_blank" />
          <SocialIcon url="https://linkedin.com" target="_blank" />
        </div>
      </footer>
    </div>
  );
}

export { BlueprintUploader };
