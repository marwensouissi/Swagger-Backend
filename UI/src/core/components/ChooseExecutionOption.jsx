import React, { useState, useRef, useEffect } from 'react';
import { FaCloud, FaServer, FaArrowLeft, FaChartLine, FaExternalLinkAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
const ChooseExecutionOption = ({ onSelectOption, filename, onBack }) => {

  const [hoveredOption, setHoveredOption] = useState(null);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState('');
  const [error, setError] = useState(null);
  const [streamEnded, setStreamEnded] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dashboardAvailable, setDashboardAvailable] = useState(false);
  const logContainerRef = useRef(null);
  const [dashboardPort, setDashboardPort] = useState(null);



  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const openDashboard = () => {
    if (dashboardPort) {
      window.open(`http://localhost:${dashboardPort}`, '_blank');
    } else {
      alert("Dashboard port not available yet.");
    }
  };
  
  const runLocalTest = async () => {
    if (!filename) {
      alert("No test script filename available.");
      return;
    }

    setRunning(true);
    setLogs('');
    setError(null);
    setStreamEnded(false);
    setTestCompleted(false);
    setShowResults(true);
    setDashboardAvailable(false);

    try {
      const token = sessionStorage.getItem("authToken");
      const url = `http://localhost:6060/run/stream/${filename}?token=${token}`;

      const eventSource = new EventSource(url);
      eventSource.onmessage = (e) => {
        setLogs((prev) => prev + e.data + '\n');
      
        if (e.data.startsWith("DASHBOARD_PORT:")) {
          const port = e.data.split(":")[1];
          setDashboardPort(port);
          setDashboardAvailable(true); // you can trigger this when you get the port
        }
      
        if (
          e.data.toLowerCase().includes('web dashboard') ||
          e.data.includes('dashboard available')
        ) {
          setDashboardAvailable(true);
        }
      
        if (
          e.data.includes('test finished with exit code') ||
          e.data.includes('test completed') ||
          e.data.includes('execution complete')
        ) {
          setTestCompleted(true);
          setRunning(false);
        }
      };
      

      eventSource.onopen = () => {
        console.log("SSE connection opened");
        // Dashboard should be available shortly after test starts
        setTimeout(() => setDashboardAvailable(true), 2000);
      };

      eventSource.onerror = (err) => {
        console.error("SSE error", err);
        if (eventSource.readyState === EventSource.CONNECTING) {
          setError("Test Completed !");
          setRunning(false);
        } else if (eventSource.readyState === EventSource.CLOSED) {
          setLogs((prev) => prev + '\n[Test execution completed - Stream ended]');
          setStreamEnded(true);
          setTestCompleted(true);
          setRunning(false);
        }
        eventSource.close();
      };

      window._k6EventSource = eventSource;
    } catch (err) {
      setError(err.message);
      setRunning(false);
    }
  };

  const handleCancel = () => {
    if (window._k6EventSource) {
      window._k6EventSource.close();
      window._k6EventSource = null;
    }

    setRunning(false);
    setLogs('');
    setError(null);
    setStreamEnded(false);
    setTestCompleted(false);
    setShowResults(false);
    setDashboardAvailable(false);

  
  };

const handleBackToOptions = () => {
  if (window._k6EventSource) {
    window._k6EventSource.close();
    window._k6EventSource = null;
  }

  setRunning(false);
  setLogs('');
  setError(null);
  setStreamEnded(false);
  setTestCompleted(false);
  setShowResults(false);
  setDashboardAvailable(false);

  // Notify parent to go back or close modal
  if (onBack) {
    onBack(); // This will show LaunchTestModal
  }
};
  

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="modal-content"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {!showResults ? (
          <>
            <h2 className="modal-title" style={{ color: 'white' }}>Choose Execution Method</h2>
            <p className="modal-subtitle">Select where you want to run your performance test</p>
            
            <div className="option-buttons">
              <motion.button 
                onClick={runLocalTest}
                className={`launch-btn local ${hoveredOption === 'local' ? 'btn-hovered' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setHoveredOption('local')}
                onMouseLeave={() => setHoveredOption(null)}
                disabled={!filename}
                title={!filename ? "Generate test script first" : undefined}
              >
                <div className="btn-content">
                  <div className="btn-icon">
                    <FaServer size={24} />
                    {hoveredOption === 'local' && (
                      <motion.span 
                        className="pulse-dot"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </div>
                  <div className="btn-text">
                    <h3>Run Locally (with Dashboard)</h3>
                    <p>Execute test with real-time web dashboard on port 5665</p>
                  </div>
                </div>
              </motion.button>

              <motion.button 
                onClick={() => onSelectOption("k6-operator")} 
                
                className={`launch-btn cloud ${hoveredOption === 'cloud' ? 'btn-hovered' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => setHoveredOption('cloud')}
                onMouseLeave={() => setHoveredOption(null)}
              >
                <div className="btn-content">
                  <div className="btn-icon">
                    <FaCloud size={24} />
                    {hoveredOption === 'cloud' && (
                      <motion.span 
                        className="pulse-dot"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </div>
                  <div className="btn-text">
                    <h3>K6 Operator VM</h3>
                    <p>Run in cloud environment with distributed load</p>
                  </div>
                </div>
              </motion.button>
            </div>

            <div className="modal-actions">
            <motion.button 
  className="cancel-btn"
  onClick={handleBackToOptions}
  whileHover={{ x: -3 }}
  whileTap={{ scale: 0.95 }}
>
  <FaArrowLeft style={{ marginRight: '8px' }} />
  Back
</motion.button>

            </div>

            {!filename && (
              <p style={{ color: 'red', textAlign: 'center' }}>
                Please generate the test script before running.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="test-header">
            <h2 className="modal-title" style={{ color: 'white' }}>
                {running ? 'Running Test: ' : 'Test Results: '}{filename}
                {testCompleted && <span style={{ color: '#84BD00', marginLeft: '10px' }}>[COMPLETED]</span>}
                {running && <span style={{ color: '#f39c12', marginLeft: '10px' }}>[RUNNING...]</span>}
              </h2>
              
              {(running || dashboardAvailable) && (
                <motion.button
                  className="dashboard-btn"
                  onClick={openDashboard}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  Open Dashboard
                  <FaChartLine style={{ marginLeft: '8px', fontSize: '12px' }} />
                </motion.button>
              )}
            </div>

            <pre
              ref={logContainerRef}
              className="console-output"
            >
              {logs || "Waiting for output..."}
            </pre>
      
            <div className="modal-actions">
              {testCompleted ? (
                <>
                  <motion.button
                    className="action-btn run-again-btn"
                    onClick={handleBackToOptions}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Run Another Test
                  </motion.button>
                  <motion.button
                    className="cancel-btn"
                    onClick={handleCancel}
                    whileHover={{ x: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaArrowLeft style={{ marginRight: '8px' }} />
                    Close
                  </motion.button>
                </>
              ) : (
                <motion.button
                  className="cancel-btn stop-btn"
                  onClick={handleCancel}
                  whileHover={{ x: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaArrowLeft style={{ marginRight: '8px' }} />
                  Stop Test
                </motion.button>
              )}
            </div>
          </>
        )}
      </motion.div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          background: linear-gradient(145deg, #2d3748, #1a202c);
          border-radius: 12px;
          padding: 2rem;
          width: 85%;
          max-height: 90vh;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          color: white;
          border: 1px solid #4a5568;
          overflow: hidden;
        }
        
        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .modal-title {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #ffffff;
          text-align: center;
          flex: 1;
          min-width: 200px;
        }
        
        .dashboard-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          color: white !important;
          padding: 0.75rem 1.25rem;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .dashboard-btn:hover {
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .modal-subtitle {
          color: #a0aec0;
          text-align: center;
          margin-bottom: 2rem;
          font-size: 0.9rem;
        }
        
        .option-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .launch-btn {
          background: #2d3748;
          border: none;
          border-radius: 10px;
          padding: 1.5rem;
          color: white;
          width: 60%;
          margin: auto; 
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .launch-btn.cloud {
        margin: auto;
        }

        .launch-btn.local {
        margin: auto;
        }
        
        .launch-btn.btn-hovered {
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .launch-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: auto;
        }
        
        .btn-icon {
          position: relative;
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .pulse-dot {
          position: absolute;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
        }
        
        .btn-text h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #e2e8f0;
        }
        
        .btn-text p {
          margin: 0.3rem 0 0;
          font-size: 0.85rem;
          color: #a0aec0;
        }
        
        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .cancel-btn, .action-btn {
          background: none;
          border: 1px solid #4a5568;
          color:rgb(236, 239, 241) !important;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }
        
        .cancel-btn:hover, .action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }
        
        .run-again-btn {
          background: linear-gradient(135deg, #48bb78, #38a169);
          border-color: #48bb78;
          color: white;
        }
        
        .run-again-btn:hover {
          background: linear-gradient(135deg, #38a169, #2f855a);
        }
        
        .stop-btn {
          border-color: #e53e3e;
          color: #fc8181;
        }
        
        .stop-btn:hover {
          background: rgba(229, 62, 62, 0.1);
          color: #e53e3e;
        }
        
        .console-output {
          background: #000;
          color: #84BD00;
          height: 400px;
          overflow-y: auto;
          padding: 1rem;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          white-space: pre-wrap;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          border: 1px solid #4a5568;
        }
        
        .error-message {
          color: rgb(44, 255, 2);
          text-align: center;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .test-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .modal-title {
            text-align: center;
            margin-bottom: 1rem;
            font-size: 1.2rem;
          }
          
          .dashboard-btn {
            align-self: center;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default ChooseExecutionOption;