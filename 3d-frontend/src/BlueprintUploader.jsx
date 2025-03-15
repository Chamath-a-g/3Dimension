import React, { useState, useRef } from "react";
import { SocialIcon } from "react-social-icons";

function BlueprintUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [processedImage, setProcessedImage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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

      setError("");
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      // Clear processed image when new file is selected
      setProcessedImage(null);
    }
  };

  const handleInputChange = (e) => {
    handleFileChange(e.target.files[0]);
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Trigger file input click
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }
  
    setIsLoading(true);
    setError("");
    setProcessedImage(null);
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
      if (response.ok) {
        alert("File uploaded successfully!");
        
        // If we want to process the image after upload
        if (data.file_path) {
          try {
            // This assumes you have a separate endpoint to get the processed image
            // You might need to adjust based on your actual API design
            const processResponse = await fetch("http://localhost:5000/process", {
              method: "POST",
              body: formData,
            });
            
            const processData = await processResponse.json();
            if (processResponse.ok && processData.processed_image) {
              // For this example, we'll assume the backend returns a path that we can use
              // In a real app, you might need to construct a full URL or use a different approach
              setProcessedImage(`http://localhost:5000/static/${processData.processed_image.split('/').pop()}`);
            }
          } catch (processErr) {
            console.error("Error processing image:", processErr);
          }
        }
      } else {
        setError(data.error || "Failed to upload the file.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
      console.error(err);
    }
  
    setIsLoading(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}>
      
      {/* Header */}
      <header className="flex justify-between items-center bg-blue-950 text-white p-4 shadow-md">
        <div className="flex items-center space-x-2">
          <img src="/Logo.png" alt="Logo" className="w-27 h-20" />
          <span className="text-xl font-bold">3 Dimension</span>
        </div>

        <nav className="space-x-10">
          <a href="/" className="hover:underline">Home</a>
          <a href="/contact" className="hover:underline">Contact Us</a>
          <a href="/gallery" className="hover:underline">Gallery</a>
          <a href="/faq" className="hover:underline">FAQ</a>
        </nav>

        <a href="/login" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-200">
          Login / Signup
        </a>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center p-4 flex-grow bg-gray-100 bg-opacity-80 rounded-lg mx-4 mt-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Upload a Blueprint</h2>

        {/* Drag & Drop Area */}
        <div 
          className={`border-2 border-dashed p-6 w-80 text-center cursor-pointer bg-white rounded-lg transition-colors ${
            dragActive ? "border-blue-500 bg-blue-50" : "border-gray-400 hover:bg-gray-50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={(e) => {
            // Only trigger if it's not a click on the label
            if (e.target.tagName.toLowerCase() !== 'label') {
              onButtonClick();
            }
          }}
        >
          <p className="text-gray-600">Drag & Drop your blueprint here</p>
          <p className="text-gray-400">or</p>
          <label className="text-blue-500 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            Click to Upload
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg" 
              className="hidden" 
              onChange={handleInputChange} 
            />
          </label>
        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>}

        {/* File Preview Section */}
        {preview && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-md w-full max-w-md">
            <h3 className="text-lg font-medium mb-2">File Preview</h3>
            <img src={preview} alt="Preview" className="w-full h-auto border rounded mb-2" />
            <p className="text-sm text-gray-500">
              {file && `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
            </p>
          </div>
        )}

        {/* Upload Button with Loading State */}
        <button 
          onClick={handleUpload}
          disabled={isLoading || !file}
          className={`mt-4 px-6 py-2 rounded text-white font-medium flex items-center ${
            isLoading || !file ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </>
          ) : (
            "Upload Blueprint"
          )}
        </button>

        {/* Processed Image Result */}
        {processedImage && (
          <div className="mt-8 p-4 bg-white rounded-lg shadow-md w-full max-w-md">
            <h3 className="text-lg font-medium mb-2">Processed Result</h3>
            <img 
              src={processedImage} 
              alt="Processed Blueprint" 
              className="w-full h-auto border rounded" 
            />
            <p className="mt-2 text-sm text-gray-600">
              Your blueprint has been successfully processed!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-blue-950 text-white text-center p-4 mt-4">
        <p>© {new Date().getFullYear()} 3 Dimension. All rights reserved.</p>
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