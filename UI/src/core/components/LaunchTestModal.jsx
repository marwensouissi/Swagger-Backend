import React, { useState } from "react";
import { FiPlus, FiPlay, FiX, FiClock, FiUsers } from "react-icons/fi";

const LaunchTestModal = ({ isOpen, onClose, onLaunch,   swaggerFilename  // Destructure prop properly
 }) => {
  if (!isOpen) return null;

  const [stages, setStages] = useState([{ duration: "", target: "", iterations: "", vus: "" }]);
  const [disabledFields, setDisabledFields] = useState({
    duration: false,
    iterations: false,
    target: false,
    vus: false,
  });
  const [isAddStageVisible, setIsAddStageVisible] = useState(true);

  const handleStageChange = (index, field, value) => {
    const updated = [...stages];
    updated[index][field] = value;
    setStages(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...stages];
    updated[index][field] = value;
    setStages(updated);

    if (field === "iterations" && value) {
      setDisabledFields({ duration: true, target: true, iterations: false, vus: false });
      setIsAddStageVisible(false);
    } else if (field === "duration" && value) {
      setDisabledFields({ duration: false, target: false, iterations: true, vus: true });
      setIsAddStageVisible(true);
    } else if (!value) {
      setDisabledFields({ duration: false, target: false, iterations: false, vus: false });
      setIsAddStageVisible(true);
    }
  };
console.log("Passing swaggerFilename to ListSelectedApis:", swaggerFilename);

  const handleAddStage = () => {
    setStages([...stages, { duration: "", target: "" }]);
  };

  const handleRemoveStage = (index) => {
    if (stages.length <= 1) return;
    const updated = stages.filter((_, i) => i !== index);
    setStages(updated);
  };

const handleLaunchTest = () => {
  const formattedStages = stages.map((stage) => {
    if (stage.iterations && stage.vus) {
      return {
        iterations: parseInt(stage.iterations),
        vus: parseInt(stage.vus),
      };
    } else if (stage.duration && stage.target) {
      return {
        duration: stage.duration.endsWith("s") ? stage.duration : `${stage.duration}s`,
        target: parseInt(stage.target),
      };
    }
    return {};
  });

  // Just pass the stages up to the parent
  onLaunch(formattedStages);
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
            Launch Load Test
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
                  onChange={(e) => handleFieldChange(index, "duration", e.target.value)}
                  disabled={disabledFields.duration}
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
              <div style={{ marginBottom: "4px", position: "absolute", top: "10%", right: "1px" }}>
                <label
                  style={{
                    display: "block",
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
                  onChange={(e) => handleFieldChange(index, "iterations", e.target.value)}
                  disabled={disabledFields.iterations}
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
                  onChange={(e) => handleFieldChange(index, "target", e.target.value)}
                  disabled={disabledFields.target}
                  style={{
                    width: "47%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #4a5568",
                    background: "#2d3748",
                    color: "#f7fafc",
                    fontSize: "14px",
                  }}
                  placeholder="e.g. 100"
                />
                <div  style={{ marginBottom: "10px", position: "absolute", top: "54.5%", right: "1px" }}>
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
                  VUS
                </label>
                <input
                  type="number"
                  value={stage.vus}
                  onChange={(e) => handleStageChange(index, "vus", e.target.value)}
                  disabled={disabledFields.vus}
                  style={{
                    width: "89%",
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
            </div>
          ))}
        </div>

        {isAddStageVisible && (
          <button
            onClick={handleAddStage}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "10px",
              marginBottom: "20px",
              background: "rgba(66, 153, 225, 0.1)",
              border: "1px dashed #4299e1",
              borderRadius: "6px",
              color: "#4299e1",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "14px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.background = "rgba(66, 153, 225, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.background = "rgba(66, 153, 225, 0.1)";
            }}
          >
            <FiPlus size={16} />
            Add Stage
          </button>
        )}

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

export default LaunchTestModal;
