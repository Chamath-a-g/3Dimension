import React, { useState } from "react";
import { SocialIcon } from "react-social-icons";

function BlueprintUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
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

      setError("");
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleInputChange = (e) => {
    handleFileChange(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setIsLoading(true);
    setError("");

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
      }
    } catch (err) {
      setError("Failed to process the blueprint.");
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

        <div className="border-2 border-dashed border-gray-400 p-6 w-80 text-center cursor-pointer bg-white hover:bg-gray-50 rounded-lg">
          <p className="text-gray-600">Drag & Drop your blueprint here</p>
          <p className="text-gray-400">or</p>
          <label className="text-blue-500 cursor-pointer">
            Click to Upload
            <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={handleInputChange} />
          </label>
        </div>

        {error && <p className="text-red-500 mt-2">{error}</p>}
        {preview && <img src={preview} alt="Preview" className="w-64 h-auto border mb-4 mt-4" />}

        <button onClick={handleUpload}
          className="px-4 py-2 rounded text-white bg-blue-500 hover:bg-blue-600">
          {isLoading ? "Uploading..." : "Upload Blueprint"}
        </button>
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
