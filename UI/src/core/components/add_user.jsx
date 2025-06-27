import React, { useState } from "react";
import { FiPlus, FiPlay, FiX, FiLock, FiUsers } from "react-icons/fi";

const AddUserModal = ({ isOpen, onClose, onUserAdded = () => {}  }) => {
  if (!isOpen) return null;

  const [userData, setUserData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!userData.username || !userData.password || !userData.confirmPassword) {
      setError("All fields are required");
      return;
    }
    
    if (userData.password !== userData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (userData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem("authToken"); // Retrieve token from session storage
      const response = await fetch("http://localhost:6060/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Add Authorization header
        },
        body: JSON.stringify({
          username: userData.username,
          password: userData.password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add user");
      }

      const data = await response.json();
      onUserAdded(data); // Pass the new user data back to parent
      onClose(); // Close the modal
    } catch (err) {
      setError(err.message || "An error occurred while adding the user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "linear-gradient(145deg, #2d3748, #1a202c)",
          borderRadius: "12px",
          padding: "24px",
          width: "450px",
          maxWidth: "90vw",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
          color: "#f7fafc",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              fontWeight: "600",
              color: "#f7fafc",
            }}
          >
            Add User
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#a0aec0",
              cursor: "pointer",
              fontSize: "20px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a0aec0")}
          >
            <FiX />
          </button>
        </div>

        {error && (
          <div style={{
            color: "#e53e3e",
            marginBottom: "16px",
            padding: "8px",
            backgroundColor: "rgba(229, 62, 62, 0.1)",
            borderRadius: "4px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(45, 55, 72, 0.5)",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
              border: "1px solid #2d3748",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#a0aec0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FiUsers size={16} />
                Username
              </label>
              <input
                type="text"
                value={userData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #4a5568",
                  background: "#2d3748",
                  color: "#f7fafc",
                  fontSize: "14px",
                }}
                placeholder="Enter username"
              />
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#a0aec0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FiLock size={16} />
                Password
              </label>
              <input
                type="password"
                value={userData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #4a5568",
                  background: "#2d3748",
                  color: "#f7fafc",
                  fontSize: "14px",
                }}
                placeholder="Enter password"
              />
            </div>
            
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  color: "#a0aec0",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <FiLock size={16} />
                Confirm Password
              </label>
              <input
                type="password"
                value={userData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #4a5568",
                  background: "#2d3748",
                  color: "#f7fafc",
                  fontSize: "14px",
                }}
                placeholder="Confirm password"
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              background: "rgba(160, 174, 192, 0.1)",
              border: "1px solid #4a5568",
              borderRadius: "6px",
              color: "#a0aec0",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "14px",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.background = "rgba(160, 174, 192, 0.2)";
              e.currentTarget.color = "#f7fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.background = "rgba(160, 174, 192, 0.1)";
              e.currentTarget.color = "#a0aec0";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: "10px 20px",
              background: isSubmitting ? "#2c5282" : "#4299e1",
              border: "none",
              borderRadius: "6px",
              color: "white",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.background = "#3182ce";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.background = "#4299e1";
              }
            }}
          >
            {isSubmitting ? (
              "Adding..."
            ) : (
              <>
                <FiPlus size={16} />
                Add User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;