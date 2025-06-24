import React, { useState } from "react";
import { FiPlus, FiPlay, FiX, FiClock, FiUsers } from "react-icons/fi";

const AddUserModal = ({ isOpen, onClose, onLaunch }) => {
  if (!isOpen) return null;

  const [stages, setStages] = useState([{ duration: "", target: "" }]);

  const handleStageChange = (index, field, value) => {
    const updated = [...stages];
    updated[index][field] = value;
    setStages(updated);
  };

  const handleAddStage = () => {
    setStages([...stages, { duration: "", target: "" }]);
  };

  const handleRemoveStage = (index) => {
    if (stages.length <= 1) return;
    const updated = stages.filter((_, i) => i !== index);
    setStages(updated);
  };

  const handleLaunchTest = () => {
    const formatted = stages.map((stage) => ({
      duration: stage.duration.endsWith("s")
        ? stage.duration
        : `${stage.duration}s`,
      target: parseInt(stage.target),
    }));
    onLaunch(formatted);
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

        <div
          style={{
            maxHeight: "60vh",
            overflowY: "auto",
            paddingRight: "8px",
            marginBottom: "20px",
          }}
        >
          {stages.map((stage, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "rgba(45, 55, 72, 0.5)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "16px",
                border: "1px solid #2d3748",
                position: "relative",
              }}
            >
              {stages.length > 1 && (
                <button
                  onClick={() => handleRemoveStage(index)}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    background: "rgba(160, 174, 192, 0.2)",
                    border: "none",
                    borderRadius: "50%",
                    zIndex: 1,
                    width: "24px",
                    height: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#e53e3e",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.background = "rgba(229, 62, 62, 0.2)";
                    e.currentTarget.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.background = "rgba(160, 174, 192, 0.2)";
                    e.currentTarget.color = "#e53e3e";
                  }}
                >
                  <FiX size={14} />
                </button>
              )}

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
                  <FiClock size={16} />
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  value={stage.duration}
                  onChange={(e) =>
                    handleStageChange(index, "duration", e.target.value)
                  }
                  style={{
                    width: "47%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #4a5568",
                    background: "#2d3748",
                    color: "#f7fafc",
                    fontSize: "14px",
                  }}
                  placeholder="e.g. 30"
                />
              </div>
              <div style={{ marginBottom: "16px", position: "absolute", top: "9.5%", right: "1px" }}>
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
                  <FiClock size={16} />
                  Iterations
                </label>
                <input
                  type="number"
                  
                  style={{
                    width: "89%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #4a5568",
                    background: "#2d3748",
                    color: "#f7fafc",
                    fontSize: "14px",
                  }}
                  placeholder="e.g. 30"
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
                  <FiUsers size={16} />
                  Target Users
                </label>
                <input
                  type="number"
                  value={stage.target}
                  onChange={(e) =>
                    handleStageChange(index, "target", e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #4a5568",
                    background: "#2d3748",
                    color: "#f7fafc",
                    fontSize: "14px",
                  }}
                  placeholder="e.g. 100"
                />
              </div>
            </div>
          ))}
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
            onClick={handleLaunchTest}
            style={{
              padding: "10px 20px",
              background: "#4299e1",
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.background = "#3182ce";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.background = "#4299e1";
            }}
            onMouseDown={(e) => {
              e.currentTarget.background = "#2c5282";
            }}
            onMouseUp={(e) => {
              e.currentTarget.background = "#3182ce";
            }}
          >
            <FiPlay size={16} />
            Launch Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
