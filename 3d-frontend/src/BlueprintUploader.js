import React, { useState } from "react";

function BlueprintUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(""); // State for error messages

  const validTypes = ["image/png", "image/jpeg", "image/jpg"];

  const handleFileChange = (selectedFile) => {
    if (selectedFile) {
      const fileType = selectedFile.type;

      if (!validTypes.includes(fileType)) {
        setError("Only .png, .jpg, and .jpeg files are allowed!");
        setFile(null);
        setPreview(null);
        return;
      }

      setError(""); // Clear previous errors
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileChange(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a valid image file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Upload response:", data);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-semibold mb-4">Upload a Blueprint</h2>

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

      {error && <p className="text-red-500 mt-2">{error}</p>} {/* Show error message if file is invalid */}

      {preview && <img src={preview} alt="Preview" className="w-64 h-auto border mb-4 mt-4" />}

      <button
        onClick={handleUpload}
        className={`px-4 py-2 rounded text-white ${
          file ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
        }`}
        disabled={!file} // Disable button if no file is selected
      >
        Upload Blueprint
      </button>
    </div>
  );
}

export { BlueprintUploader };
