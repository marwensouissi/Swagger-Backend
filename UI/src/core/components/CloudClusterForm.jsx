import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaCloud, FaArrowLeft } from 'react-icons/fa';
import tf from '../../core/assets/tf.png';  
import digitalOceanLogo from '../../core/assets/png-transparent-digitalocean-hd-logo-thumbnail.png';

const CloudClusterForm = ({ onBack }) => {
  const [region, setRegion] = useState('fra1');
  const [clusterName, setClusterName] = useState('my-k6-cluster');
  const [nodeSize, setNodeSize] = useState('s-2vcpu-4gb');
  const [statusMessages, setStatusMessages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAction, setCurrentAction] = useState(null); // "deploy" or "destroy"
  const wsRef = useRef(null);

  const openWebSocket = (action) => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    setStatusMessages([]);
    setIsSubmitting(true);
    setCurrentAction(action);

    const ws = new WebSocket("ws://localhost:6060/jenkins/ws-run-k6-test");
    wsRef.current = ws;

    ws.onopen = () => {
      const payload = { 
        action, 
        region, 
        cluster_name: clusterName, 
        node_size: nodeSize 
      };
      ws.send(JSON.stringify(payload));
      setStatusMessages((prev) => [...prev, `🔌 Connected to WebSocket. Starting ${action}...`]);
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
      setCurrentAction(null);
    };
  };

  const handleSubmit = () => {
    openWebSocket('deploy');
  };

  const handleDestroy = async () => {
    if (!window.confirm(`Are you sure you want to destroy cluster "${clusterName}"? This action cannot be undone.`)) {
      return;
    }
  
    setIsSubmitting(true);
    setCurrentAction("destroy");
    setStatusMessages(["🧨 Initiating cluster destruction..."]);
  
    try {
      const response = await fetch("http://localhost:6060/jenkins/destroy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cluster_name: clusterName,
          region: region
        })
      });
  
      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }
  
      const data = await response.text(); // or response.json() if JSON response
      setStatusMessages(prev => [...prev, `✅ Destroy complete: ${data}`]);
    } catch (error) {
      console.error("Destroy error:", error);
      setStatusMessages(prev => [...prev, `❌ Failed to destroy: ${error.message}`]);
    } finally {
      setIsSubmitting(false);
      setCurrentAction(null);
    }
  };
  
  // Cleanup WebSocket on unmount
  useEffect(() => {
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
        <div className="corner-images">
        <img src={tf} style={{ height: '14%', width: '14%', marginTop:'0.5%' }} alt="" className="corner-image left" />          <img src={digitalOceanLogo} alt="DigitalOcean Logo" className="corner-image right" />
        </div>

        <div className="form-header">
          <h1 className="modal-title" style={{ color: '#ffffff', }}>
            {/* <FaCloud style={{ marginRight: '10px' }} /> */}
            Configure Your Cluster
          </h1>
        </div>

        <div className="form-fields">
          <div className="form-group">
            <label>Region:</label>
            <select 
              value={region} 
              onChange={(e) => setRegion(e.target.value)}
              className="form-input"
              disabled={isSubmitting}
            >
              <option value="fra1">Frankfurt (fra1)</option>
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
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label>Node Size:</label>
            <select 
              value={nodeSize} 
              onChange={(e) => setNodeSize(e.target.value)}
              className="form-input"
              disabled={isSubmitting}
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
                {currentAction === 'deploy' ? 'DEPLOYING' : currentAction === 'destroy' ? 'DESTROYING' : ''}
              </span>
            )}
          </div>
          <div className="console-content" aria-live="polite" aria-atomic="true">
            {statusMessages.length > 0 ? (
              statusMessages.map((line, i) => (
                <pre key={i}>{line}</pre>
              ))
            ) : (
              <pre className="console-placeholder">
                {isSubmitting 
                  ? `Waiting for ${currentAction} logs...` 
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
            disabled={isSubmitting}
          >
            <FaArrowLeft style={{ marginRight: '8px', color:'white  ' }} />
            Back
          </motion.button>
          
          <motion.button
            className="destroy-btn"
            onClick={handleDestroy}
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Destroy Cluster
          </motion.button>

          <motion.button
            className="launch-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (currentAction === 'deploy' ? 'Deploying...' : 'Destroying...') : 'Launch Cluster'}
          </motion.button>
        </div>

        <style jsx>{`

.swagger-ui h1 {
    font-size: 2em;
    margin: .67em 0;
    margin-top: -2%;
    margin-bottom: 7%;
    }
                
                
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
            background: linear-gradient(145deg, #1a202c, #0d1117);
            border-radius: 16px;
            padding: 2.5rem;
            width: 85%;
            max-width: 800px;
            max-height: 90vh;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            color: white;
            border: 1px solid #2d3748;
            overflow-y: auto;
            position: relative;
          }
          
          .corner-images {
            position: absolute;
            width: 100%;
            display: flex;
            justify-content: space-between;
            top: 0;
            left: 0;
            padding: 1.5rem;
            pointer-events: none;
          }
          
          .corner-image {
            width: 10%;
            height: 10%;
            opacity: 0.8;
            transition: opacity 0.3s ease;
          }
          

          .corner-image.right {
            filter: brightness(0) invert(1);
          }
          
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          .form-header {
            margin-bottom: 2rem;
            text-align: center;
            padding-top: 1.5rem;
          }
          
          .modal-title {
            font-size: 1.75rem;
            margin-bottom: 0.75rem;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          
          .modal-subtitle {
            color: #a0aec0;
            margin-bottom: 0;
            font-size: 1rem;
            max-width: 80%;
            margin: 0 auto;
            line-height: 1.5;
          }
          
          .form-fields {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.75rem;
            margin-bottom: 2rem;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
                        color: #e2e8f0;

          }
          .swagger-ui button {
    color: #fff;
    cursor: pointer;
}
          .form-group label {
            margin-bottom: 0.75rem;
            font-size: 0.95rem;
            color: #e2e8f0;
            font-weight: 500;
          }
          
.form-input {
  background: linear-gradient(145deg, #2d3748, #1a202c);
  border: 1px solid #4a5568;
  border-radius: 8px;
  padding: 0.85rem 1.25rem;
  color: white;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  height: 44px; /* Add fixed height to match */
  appearance: none; /* Remove default select styling */
  -webkit-appearance: none; /* For Safari */
  -moz-appearance: none; /* For Firefox */
}

.form-group select {
  background-color: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23a0aec0' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background:  #2d3748;
border: 1px solid #4a5568;
            color: #e2e8f0;
  background-position: right 1rem center;
  background-size: 12px;
  padding-right: 2.5rem; /* Make room for the arrow */
}

.form-group input, 
.form-group select {
  width: 100%;
  box-sizing: border-box;*
            color: #e2e8f0;
}
          
          .form-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2),
                        inset 0 1px 3px rgba(0, 0, 0, 0.2);
          }
          
          .form-input::placeholder {
            color: #718096;
          }
          
          .console-output {
            background: #0a0e17;
            border-radius: 10px;
            margin-bottom: 2rem;
            border: 1px solid #2d3748;
            overflow: hidden;
            box-shadow: inset 0 1px 10px rgba(0, 0, 0, 0.3);
          }
          
          .console-header {
            background: linear-gradient(90deg, #1a202c, #2d3748);
            padding: 0.85rem 1.25rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #4a5568;
            font-size: 0.95rem;
            color: #a0aec0;
            font-weight: 500;
          }
          
          .status-badge {
            background: rgba(247, 202, 24, 0.1);
            color: #f7ca18;
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: 1px solid rgba(247, 202, 24, 0.3);
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
            height: 2%;
            overflow-y: auto;
            padding: 1rem;
            font-family: 'Fira Code', 'Courier New', monospace;
            font-size: 0.9rem;
            color: #84BD00;
            line-height: 1.5;
            background: rgba(0, 0, 0, 0.3);
          }
          
          .console-content pre {
            margin: 0.25rem 0;
            white-space: pre-wrap;
          }
          
          .console-placeholder {
            color: #718096;
            font-style: italic;
            margin: 0;
          }
          
          .modal-actions {
            display: flex;
            justify-content: space-between;
            gap: 1.25rem;
          }
          
          .cancel-btn {
            background: linear-gradient(135deg, #416fd3, #0051ff);
            border: 1px solid #4a5568;
            color: #e2e8f0;
            padding: 0.85rem 1.75rem;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.3s ease;
            font-weight: 500;
          }
          
          .cancel-btn:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.05);
            border-color: #667eea;
          }
          
          .cancel-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .destroy-btn {
            background: linear-gradient(135deg, #416fd3, #0051ff);
            border: none;
            color: white;
            padding: 0.85rem 1.75rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            flex: 1;
            max-width: 200px;
          }
          
          .destroy-btn:hover:not(:disabled) {
            background: linear-gradient(135deg,rgb(151, 26, 26),rgb(213, 70, 70));
            box-shadow: 0 4px 12px rgba(237, 100, 166, 0.3);
          }
          
          .launch-btn {
            background: linear-gradient(135deg, #416fd3, #0051ff);
            border: none;
            color: white;
            padding: 0.85rem 1.75rem;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s ease;
            flex: 1;
            max-width: 200px;
          }

          .launch-btn:hover:not(:disabled) {
            background: linear-gradient(135deg,rgb(20, 95, 53),rgb(38, 239, 78));
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          
          .launch-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          
          @media (max-width: 768px) {
            .modal-content {
              width: 95%;
              padding: 1.75rem;
            }
            
            .corner-images {
              padding: 1rem;
            }
            
            .corner-image {
              height: 30px;
            }
            
            .form-fields {
              grid-template-columns: 1fr;
            }
            
            .modal-actions {
              flex-direction: column;
            }
            
            .launch-btn, .destroy-btn {
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