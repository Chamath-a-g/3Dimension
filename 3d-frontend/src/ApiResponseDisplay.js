import React from "react";

function ApiResponseDisplay({ extractedText, isLoading, error }) {
  return (
    <div className="p-4 border rounded bg-white shadow-md w-full max-w-lg">
      <h2 className="text-lg font-semibold mb-2">Extracted Text</h2>

      {isLoading ? (
        <p className="text-blue-500">Processing blueprint... Please wait.</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : extractedText ? (
        <div className="p-2 bg-gray-100 rounded border">
          <p className="text-gray-700">{extractedText}</p>
        </div>
      ) : (
        <p className="text-gray-500">No text extracted yet.</p>
      )}
    </div>
  );
}

export default ApiResponseDisplay;
