import React, { useState, useRef } from "react";
import { SocialIcon } from "react-social-icons";
import ThreeDModelViewer from "./components/threejs/ThreeDModelViewer"; // Import ThreeDModelViewer

function BlueprintUploader() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [blueprintData, setBlueprintData] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const [processingSuccess, setProcessingSuccess] = useState(false); // NEW STATE FOR SUCCESS MESSAGE

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
                setBlueprintData(null); // Clear blueprint data on invalid file
                return;
            }

            if (fileSize > MAX_FILE_SIZE) {
                setError("File size must be under 20MB!");
                setFile(null);
                setPreview(null);
                setBlueprintData(null); // Clear blueprint data on invalid file
                return;
            }

            setError("");
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setBlueprintData(null); // Clear previous blueprint data
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
        setBlueprintData(null);
        setProcessingSuccess(false); // Reset success state

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("http://localhost:5000/process", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                if (data.blueprint_data) {
                    setBlueprintData(data.blueprint_data);
                    console.log("Blueprint Data:", JSON.stringify(data.blueprint_data, null, 2));
                    setProcessingSuccess(true); // Set success state to true
                } else {
                    setError("Blueprint processing failed on server.");
                    setProcessingSuccess(false);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.error || "File upload failed.");
                setProcessingSuccess(false);
            }
        } catch (err) {
            setError("Failed to connect to the server.");
            console.error(err);
            setProcessingSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-gradient-to-b from-slate-900 to-blue-900">
            {/* Header - Updated to match the image */}
            <header className="flex justify-between items-center bg-slate-900 text-white p-4">
                <div className="flex items-center space-x-4">
                    <img src="/Logo.png" alt="Logo" className="w-28 h-20" />
                    <span className="text-2xl font-bold text-white">3Dimension</span>
                </div>

                <nav className="flex space-x-8">
                    <a href="/" className="text-white hover:text-blue-300 transition"style={{color: 'white'}}>Home</a>
                    <a href="/services" className="text-white hover:text-blue-300 transition"style={{color: 'white'}}>Services</a>
                    <a href="/about" className="text-white hover:text-blue-300 transition"style={{color: 'white'}}>About Us</a>
                    <a href="/team" className="text-white hover:text-blue-300 transition"style={{color: 'white'}}>Project Team</a>
                    <a href="/contact" className="text-white hover:text-blue-300 transition"style={{color: 'white'}}>Contact Us</a>
                </nav>

                {/* Combined Login/Signup button */}
                <div className="flex space-x-3">
                    <a href="/signup" className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-full transition"style={{color: 'white'}}>
                        Login/Signup
                    </a>
                </div>
            </header>

            {/* Hero Section - Removed Get Started and Watch Demo buttons */}
            <div className="text-center py-20 px-4">
                <h1 className="text-5xl font-bold mb-4">
                    <span className="text-white">Transform 2D Blueprints into </span>
                    <span className="text-blue-300">Interactive<br />3D Models</span>
                </h1>

                <p className="text-gray-300 max-w-3xl mx-auto text-lg mt-6 mb-12">
                    Bridge the gap between technical architectural plans and accessible visualization tools
                    to enhance spatial understanding and decision-making.
                </p>
            </div>

            {/* Upload Section */}
            <div className="max-w-4xl mx-auto w-full px-4 pb-20">
                <div className="bg-slate-800 bg-opacity-50 p-8 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-semibold mb-6 text-white text-center">Upload Your Blueprint</h2>

                    {/* Drag & Drop Area - No changes */}
                    <div
                        className={`border-2 border-dashed p-10 text-center cursor-pointer rounded-lg transition-colors ${
                            dragActive ? "border-blue-400 bg-slate-700" : "border-gray-400 bg-slate-800 hover:bg-slate-700"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={(e) => {
                            if (e.target.tagName.toLowerCase() !== 'label') {
                                onButtonClick();
                            }
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-300 text-lg">Drag & Drop your blueprint here</p>
                        <p className="text-gray-400 mt-2">or</p>
                        <label className="text-blue-400 font-medium cursor-pointer mt-2 inline-block" onClick={(e) => e.stopPropagation()}>
                            Click to Upload
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/png, image/jpeg, image/jpg"
                                className="hidden"
                                onChange={handleInputChange}
                            />
                        </label>
                        <p className="text-gray-500 text-sm mt-4">Supported formats: PNG, JPG, JPEG (max 20MB)</p>
                    </div>

                    {error && <p className="text-red-400 mt-4 text-center">{error}</p>}

                    {/* File Preview Section - No changes */}
                    {preview && (
                        <div className="mt-8 p-6 bg-slate-700 rounded-lg shadow-lg">
                            <h3 className="text-lg font-medium mb-3 text-white">File Preview</h3>
                            <img src={preview} alt="Preview" className="w-full h-auto border border-gray-600 rounded mb-3" />
                            <p className="text-sm text-gray-300">
                                {file && `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                            </p>
                        </div>
                    )}

                    {/* Upload Button with Loading State - No changes */}
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleUpload}
                            disabled={isLoading || !file}
                            className={`px-8 py-3 rounded-full text-white font-medium flex items-center ${
                                isLoading || !file ? "bg-blue-800 opacity-60 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
                            } transition`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                "Upload Blueprint"
                            )}
                        </button>
                    </div>

                    {/* --- SUCCESS MESSAGE DISPLAYED HERE --- */}
                    {processingSuccess && (
                        <div className="mt-8 p-6 bg-slate-700 rounded-lg shadow-lg text-center">
                            <h3 className="text-lg font-medium mb-3 text-white">Blueprint Processed Successfully!</h3>
                            <p className="text-green-400">
                                The blueprint has been successfully processed by the server.
                            </p>
                        </div>
                    )}

                    {/* 3D Model Viewer - Conditionally render */}
                    {blueprintData && (
                        <div className="mt-8">
                            <h3 className="text-lg font-medium mb-3 text-white">3D Model Preview</h3>
                            <div className="bg-slate-700 rounded-lg shadow-lg overflow-hidden"> {/* Container for Three.js canvas */}
                                <ThreeDModelViewer blueprintData={blueprintData} /> {/* Render ThreeDModelViewer and pass data */}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 text-white text-center p-6 mt-auto">
                <p>© {new Date().getFullYear()} 3Dimension. All rights reserved.</p>
                <div className="flex justify-center space-x-4 mt-4">
                    <SocialIcon url="https://facebook.com" bgColor="#6B7280" style={{ height: 35, width: 35 }} target="_blank" />
                    <SocialIcon url="https://twitter.com" bgColor="#6B7280" style={{ height: 35, width: 35 }} target="_blank" />
                    <SocialIcon url="https://instagram.com" bgColor="#6B7280" style={{ height: 35, width: 35 }} target="_blank" />
                    <SocialIcon url="https://linkedin.com" bgColor="#6B7280" style={{ height: 35, width: 35 }} target="_blank" />
                </div>
            </footer>
        </div>
    );
}

export { BlueprintUploader };