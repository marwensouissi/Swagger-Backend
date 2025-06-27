import React, { useState, useRef, useEffect } from 'react';
import { FaCloud, FaServer, FaArrowLeft, FaChartLine, FaFileExport } from 'react-icons/fa';
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
  const [keyInput, setKeyInput] = useState('');
  const [extractedValues, setExtractedValues] = useState([]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  
  const handleExtractValues = () => {
  if (!keyInput) {
    alert('Please enter a key to search.');
    return;
  }

  try {
    const matches = [];
    const lines = logs.split('\n');

    lines.forEach(line => {
      // Look for the specific pattern in your logs
      if (line.includes('🧪 idedd response:')) {
        const responseIndex = line.indexOf('🧪 idedd response:');
        const jsonPart = line.slice(responseIndex + '🧪 idedd response:'.length).trim();
        
        // Find all occurrences of the key
        let keyPos = jsonPart.indexOf(`"${keyInput}"`);
        while (keyPos !== -1) {
          // Find the value after the key
          const valueStart = jsonPart.indexOf(':', keyPos) + 1;
          if (valueStart > 0) {
            let valueEnd = jsonPart.indexOf(',', valueStart);
            if (valueEnd === -1) valueEnd = jsonPart.indexOf('}', valueStart);
            if (valueEnd === -1) valueEnd = jsonPart.length;
            
            let value = jsonPart.slice(valueStart, valueEnd).trim();
            
            // Clean up the value
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }
            
            if (value) {
              matches.push(value);
            }
          }
          keyPos = jsonPart.indexOf(`"${keyInput}"`, keyPos + 1);
        }
      }
    });

    setExtractedValues(matches);

    if (matches.length === 0) {
      console.log('No matches found in logs:', logs);
      alert(`No values found for "${keyInput}" in the response lines.`);
    } else {
      console.log(`Found values for "${keyInput}":`, matches);
      alert(`Found values for "${keyInput}":\n${matches.join('\n')}`);
    }
  } catch (error) {
    console.error('Extraction error:', error);
    alert('Error extracting values. Check console for details.');
  }
};

  // Rest of your component code remains the same...
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
      const url = `http://localhost:6060/execution/run/stream/${filename}`;

      const eventSource = new EventSource(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      eventSource.onmessage = (e) => {
        setLogs((prev) => prev + e.data + '\n');

        if (e.data.startsWith("DASHBOARD_PORT:")) {
          const port = e.data.split(":")[1];
          setDashboardPort(port);
          setDashboardAvailable(true);
        }

        if (e.data.toLowerCase().includes('web dashboard') || e.data.includes('dashboard available')) {
          setDashboardAvailable(true);
        }

        if (e.data.includes('test finished with exit code') || e.data.includes('test completed') || e.data.includes('execution complete')) {
          setTestCompleted(true);
          setRunning(false);
        }
      };

      eventSource.onopen = () => {
        console.log("SSE connection opened");
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

    if (onBack) {
      onBack();
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

              <input
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                type='text'
                style={{
                  width: "17%",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  border: "1px solid #4a5568",
                  background: "#2d3748",
                  color: "#f7fafc",
                  fontSize: "14px",
                }}
                placeholder="Enter key to extract"
              />
              
              <motion.button
                className="dashboard-btn"
                onClick={handleExtractValues}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Extract
                <FaFileExport style={{ marginLeft: '8px', fontSize: '12px' }} />
              </motion.button>
<button 
  onClick={() => {
    const testLogs = `{
  "output": " {INFO[0009] 📦 cred: {"softwareId":null,"customerId":{"entityType":"CUSTOMER","id":"13814000-1dd2-11b2-8080-808080808080"},"label":"Room 234 Sensor","deviceProfileId":{"entityType":"DEVICE_PROFILE","id":"23e20400-50db-11f0-9b8b-6b4e8677fc8a"},"deviceData":{"configuration":{"type":"DEFAULT"},"transportConfiguration":{"type":"DEFAULT"}},"id":{"id":"23e27930-50db-11f0-9b8b-6b4e8677fc8a","entityType":"DEVICE"},"externalId":null,"additionalInfo":null,"name":"poxrxjzrtztp","type":"Temperature Sensor","userCreatorId":{"entityType":"USER","id"
:"1f7e34b0-50db-11f0-9b8b-6b4e8677fc8a"},"createdTime":1750756257859,"tenantId":{"id":"1f716370-50db-11f0-9b8b-6b4e8677fc8a","entityType":"TENANT"},"publicKey":"0xaaa437388b85fc7a3b0f972f35f0314549b62516","firmwareId":null}  source=console
INFO[0009] 📦 cred: {"privateKey":"0xedd2b0fb6fc940d09f57d6a31cbe5ceb54d1fd71b771b409a14ba4e828067878","id":{"id":"24014bd0-50db-11f0-9b8b-6b4e8677fc8a"},"createdTime":1750756258061,"deviceId":{"entityType":"DEVICE","id":"23e27930-50db-11f0-9b8b-6b4e8677fc8a"},"credentialsType":"ACCESS_TOKEN","credentialsId":"WcW9z7al3bIetnG3fO4l","credentialsValue":null}  source=console
INFO[0015] 📦 cred: {"id":{"entityType":"DEVICE","id":"278fc9c0-50db-11f0-9b8b-6b4e8677fc8a"},"publicKey":"0xc92562d7c8e3e053b831087e62f3d5a57ffba928","deviceProfileId":{"entityType":"DEVICE_PROFILE","id":"278f7ba0-50db-11f0-9b8b-6b4e8677fc8a"},"type":"Temperature Sensor","label":"Room 234 Sensor","deviceData":{"configuration":{"type":"DEFAULT"},"transportConfiguration":{"type":"DEFAULT"}},"additionalInfo":null,"tenantId":{"entityType":"TENANT","id":"236bc290-50db-11f0-9b8b-6b4e8677fc8a"},"name":"oalwdabphvdi","firmwareId":null,"softw
areId":null,"externalId":null,"userCreatorId":{"entityType":"USER","id":"237140d0-50db-11f0-9b8b-6b4e8677fc8a"},"createdTime":1750756264028,"customerId":{"entityType":"CUSTOMER","id":"13814000-1dd2-11b2-8080-808080808080"}}  source=console
INFO[0015] 📦 cred: {"credentialsType":"ACCESS_TOKEN","credentialsId":"MTv5alTDDlJfjEoVsALM","credentialsValue":null,"privateKey":"0x4e97ecf4dc6500779fb098501b335766396677d0cc7d85474b89ef007b9c48c1","id":{"id":"27b29400-50db-11f0-9b8b-6b4e8677fc8a"},"createdTime":1750756264256,"deviceId":{"entityType":"DEVICE","id":"278fc9c0-50db-11f0-9b8b-6b4e8677fc8a"}}  source=console
INFO[0015] 📦 cred: {"additionalInfo":null,"type":"Temperature Sensor","deviceData":{"configuration":{"type":"DEFAULT"},"transportConfiguration":{"type":"DEFAULT"}},"externalId":null,"tenantId":{"entityType":"TENANT","id":"24337f60-50db-11f0-9b8b-6b4e8677fc8a"},"customerId":{"entityType":"CUSTOMER","id":"13814000-1dd2-11b2-8080-808080808080"},"deviceProfileId":{"id":"27f3e2c0-50db-11f0-9b8b-6b4e8677fc8a","entityType":"DEVICE_PROFILE"},"softwareId":null,"id":{"entityType":"DEVICE","id":"27f4cd20-50db-11f0-9b8b-6b4e8677fc8a"},"createdTi
me":1750756264690,"userCreatorId":{"entityType":"USER","id":"24379e10-50db-11f0-9b8b-6b4e8677fc8a"},"name":"xnkazszjznim","label":"Room 234 Sensor","publicKey":"0xe13f4a5582884aa50e4b4524f10769d4e5991f95","firmwareId":null}  source=console
INFO[0016] 📦 cred: {"credentialsId":"SEYyYPX2825pZzAhE9rS","credentialsValue":null,"privateKey":"0x157558231506d59fc766865ce42303256652943ff2fba01c230bcf1c007ae34b","id":{"id":"2819ba40-50db-11f0-9b8b-6b4e8677fc8a"},"createdTime":1750756264932,"deviceId":{"entityType":"DEVICE","id":"27f4cd20-50db-11f0-9b8b-6b4e8677fc8a"},"credentialsType":"ACCESS_TOKEN"}  source=console
`;
    setLogs(testLogs);
    setKeyInput('id');
    setTimeout(handleExtractValues, 100);
  }}
  style={{
    padding: '0.5rem 1rem',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    margin: '0.5rem',
    cursor: 'pointer'
  }}
>
  Test Extraction
</button>
              {dashboardAvailable && (
                <motion.button
                  className="dashboard-btn"
                  onClick={openDashboard}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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

            {extractedValues.length > 0 && (
              <div style={{
                margin: '1rem 0',
                padding: '1rem',
                background: '#1a1a1a',
                borderRadius: '8px',
                border: '1px solid #333'
              }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#4CAF50' }}>
                  Extracted Values for "{keyInput}"
                </h4>
                {extractedValues.map((value, i) => (
                  <pre key={i} style={{
                    margin: '0.5rem 0',
                    padding: '0.75rem',
                    background: '#222',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    color: '#f0f0f0',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto'
                  }}>
                    {value}
                  </pre>
                ))}
              </div>
            )}

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