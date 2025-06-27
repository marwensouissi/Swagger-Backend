import React, { useState } from "react";
import { uploadSwaggerJson } from "../../services/swaggerService";

const Upload = ({ onSuccess }) => {
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file || !file.name.endsWith(".json")) {
      setError("Please upload a valid JSON file.");
      return;
    }

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);

      // Send to backend API
      const response = await fetch("http://localhost:6060/swagger/upload-json", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Failed to upload file");
      }

      // Optionally, get the saved spec info from the response
      const data = await response.json();

      // Call onSuccess with the backend response
      onSuccess(data);
    } catch (err) {
      setError("Failed to upload file: " + err.message);
    }
  };

  const readFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      style={{
        height: "70vh",
        border: "2px solid rgba(255, 255, 255, 0.2)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#090D2B",
        color: "#fff",
        borderRadius: "12px",
        flexDirection: "column",
        fontFamily: "'Segoe UI', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background elements */}
      <div style={{
        position: "absolute",
        top: "-50px",
        left: "-50px",
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        background: "rgba(80, 170, 100, 0.1)",
        animation: "float 15s infinite linear",
      }} />
      <div style={{
        position: "absolute",
        bottom: "20%",
        right: "10%",
        width: "150px",
        height: "150px",
        borderRadius: "50%",
        background: "rgba(80, 100, 170, 0.1)",
        animation: "float 12s infinite linear reverse",
      }} />
      <div style={{
        position: "absolute",
        top: "30%",
        right: "20%",
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "rgba(170, 80, 100, 0.1)",
        animation: "float 18s infinite linear",
      }} />

      {/* Main content */}
      <div style={{
        position: "relative",
        zIndex: 2,
        padding: "40px",
        borderRadius: "16px",
        backgroundColor: isDragging ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.03)",
        border: isDragging ? "2px dashed #84BD00" : "2px dashed rgba(255, 255, 255, 0.2)",
        transition: "all 0.3s ease",
        textAlign: "center",
        maxWidth: "500px",
        width: "90%",
      }}>

        <h2 style={{ 
          marginBottom: "16px", 
          fontWeight: 600,
          color: isDragging ? "#84BD00" : "#fff",
          transition: "color 0.3s ease"
        }}>
          Drop your <code style={{ 
            background: "rgba(132, 189, 0, 0.2)", 
            padding: "2px 6px", 
            borderRadius: "4px",
            color: "#84BD00"
          }}>swagger.json</code> here
        </h2>
        <p style={{ 
          marginBottom: "24px", 
          color: "rgba(255, 255, 255, 0.7)",
          fontSize: "14px"
        }}>
          or click below to select a file
        </p>
        
        <label style={{
          display: "inline-block",
          padding: "12px 24px",
          backgroundColor: "#84BD00",
          color: "#090D2B",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 600,
          transition: "all 0.2s ease",
          ":hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 4px 12px rgba(132, 189, 0, 0.3)"
          }
        }}>
          Browse Files
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileDrop} 
            style={{ display: "none" }} 
          />
        </label>
        
        {error && (
          <p style={{ 
            color: "#FF3B30", 
            marginTop: "16px",
            padding: "8px 12px",
            background: "rgba(255, 59, 48, 0.1)",
            borderRadius: "4px"
          }}>
            {error}
          </p>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(50px, 50px) rotate(90deg);
          }
          50% {
            transform: translate(100px, 0) rotate(180deg);
          }
          75% {
            transform: translate(50px, -50px) rotate(270deg);
          }
          100% {
            transform: translate(0, 0) rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default Upload;