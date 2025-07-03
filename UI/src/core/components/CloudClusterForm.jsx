import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCloud, FaArrowLeft } from 'react-icons/fa';

const CloudClusterForm = ({ onBack }) => {
  const [region, setRegion] = useState('nyc3');
  const [clusterName, setClusterName] = useState('my-k6-cluster');
  const [nodeSize, setNodeSize] = useState('s-2vcpu-4gb');
  const [statusMessages, setStatusMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // WebSocket ref to persist across renders
  const wsRef = React.useRef(null);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setStatusMessages([]);
    // Close any previous WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
    const ws = new WebSocket("ws://localhost:6060/jenkins/ws-run-k6-test");
    wsRef.current = ws;

    ws.onopen = () => {
      const payload = { region, cluster_name: clusterName, node_size: nodeSize };
      ws.send(JSON.stringify(payload));
      setStatusMessages((prev) => [...prev, "🔌 Connected to WebSocket..."]);
    };

    ws.onmessage = (event) => {
      setStatusMessages((prev) => [...prev, event.data]);
    };

    ws.onerror = (err) => {
      setStatusMessages((prev) => [...prev, "❌ WebSocket Error"]);
      console.error(err);
    };

    ws.onclose = () => {
      setStatusMessages((prev) => [...prev, "🔚 Connection closed"]);
      setIsSubmitting(false);
    };
  };

  // Cleanup WebSocket on unmount
  React.useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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
        <div className="form-header">
          <h2 className="modal-title">
            <FaCloud style={{ marginRight: '10px' }} />
            Launch K6 Cloud Test
          </h2>
          <p className="modal-subtitle">Configure your cloud cluster and launch the test</p>
        </div>

        <div className="form-fields">
          <div className="form-group">
            <label>Region:</label>
            <select 
              value={region} 
              onChange={(e) => setRegion(e.target.value)}
              className="form-input"
            >
              <option value="nyc3">New York (nyc3)</option>
              <option value="sfo3">San Francisco (sfo3)</option>
              <option value="ams3">Amsterdam (ams3)</option>
              <option value="sgp1">Singapore (sgp1)</option>
              <option value="lon1">London (lon1)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Cluster Name:</label>
            <input 
              value={clusterName} 
              onChange={(e) => setClusterName(e.target.value)} 
              className="form-input"
              placeholder="Enter cluster name"
            />
          </div>

          <div className="form-group">
            <label>Node Size:</label>
            <select 
              value={nodeSize} 
              onChange={(e) => setNodeSize(e.target.value)}
              className="form-input"
            >
              <option value="s-1vcpu-2gb">1 vCPU, 2GB RAM</option>
              <option value="s-2vcpu-4gb">2 vCPU, 4GB RAM</option>
              <option value="s-4vcpu-8gb">4 vCPU, 8GB RAM</option>
              <option value="s-8vcpu-16gb">8 vCPU, 16GB RAM</option>
            </select>
          </div>
        </div>

        <div className="console-output">
          <div className="console-header">
            <span>Deployment Logs</span>
            {isSubmitting && (
              <span className="status-badge">
                <span className="pulse-dot"></span>
                DEPLOYING
              </span>
            )}
          </div>
          <div className="console-content">
            {statusMessages.length > 0 ? (
              statusMessages.map((line, i) => (
                <pre key={i}>{line}</pre>
              ))
            ) : (
              <pre className="console-placeholder">
                {isSubmitting 
                  ? "Waiting for deployment logs..." 
                  : "Configuration will appear here after submission"}
              </pre>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <motion.button 
            className="cancel-btn"
            onClick={onBack}
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Back
          </motion.button>
          
          <motion.button
            className="launch-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? 'Deploying...' : 'Launch Cluster'}
          </motion.button>
        </div>

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
            max-width: 800px;
            max-height: 90vh;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
            color: white;
            border: 1px solid #4a5568;
            overflow-y: auto;
          }
          
          .form-header {
            margin-bottom: 1.5rem;
            text-align: center;
          }
          
          .modal-title {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .modal-subtitle {
            color: #a0aec0;
            margin-bottom: 0;
            font-size: 0.9rem;
          }
          
          .form-fields {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 1.5rem;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
          }
          
          .form-group label {
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: #e2e8f0;
          }
          
          .form-input {
            background: #2d3748;
            border: 1px solid #4a5568;
            border-radius: 6px;
            padding: 0.75rem 1rem;
            color: white;
            font-size: 0.9rem;
            transition: all 0.2s ease;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
          }
          
          .console-output {
            background: #000;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            border: 1px solid #4a5568;
            overflow: hidden;
          }
          
          .console-header {
            background: #1a202c;
            padding: 0.75rem 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #4a5568;
            font-size: 0.9rem;
            color: #a0aec0;
          }
          
          .status-badge {
            background: rgba(247, 202, 24, 0.1);
            color: #f7ca18;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .pulse-dot {
            width: 8px;
            height: 8px;
            background: #f7ca18;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
          }
          
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
          
          .console-content {
            height: 200px;
            overflow-y: auto;
            padding: 1rem;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            color: #84BD00;
          }
          
          .console-placeholder {
            color: #a0aec0;
            font-style: italic;
          }
          
          .modal-actions {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
          }
          
          .cancel-btn {
            background: none;
            border: 1px solid #4a5568;
            color: #e2e8f0;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
          }
          
          .cancel-btn:hover {
            background: rgba(255, 255, 255, 0.05);
          }
          
          .launch-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            border: none;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            flex: 1;
            max-width: 200px;
          }
          
          .launch-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #5a67d8, #6b46c1);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          
          .launch-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          
          @media (max-width: 768px) {
            .modal-content {
              width: 95%;
              padding: 1.5rem;
            }
            
            .form-fields {
              grid-template-columns: 1fr;
            }
            
            .modal-actions {
              flex-direction: column;
            }
            
            .launch-btn {
              max-width: none;
              width: 100%;
            }
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
};

export default CloudClusterForm;