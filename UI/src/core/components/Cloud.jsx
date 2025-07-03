import React, { useEffect, useState } from 'react';

const Cloud = () => {
  const [statusMessages, setStatusMessages] = useState([]);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:6060/jenkins/ws-run-k6-test');

    socket.onmessage = (event) => {
      const msg = event.data;
      setStatusMessages((prev) => [...prev, msg]);

      if (msg.includes('Status: SUCCESS')) {
        setStep(2); // Proceed to next step
      } else if (msg.includes('Status: FAILURE')) {
        setStep(-1); // Error
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setStep(-1);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h2>📦 K6 Cloud Test Pipeline</h2>

      <div className="step">
        <h3 style={{ color: step >= 1 ? '#84BD00' : '#aaa' }}>
          1️⃣ Creating Cluster...
        </h3>
        {step === 1 && <p>Waiting for Jenkins job to finish provisioning.</p>}
        {step === -1 && <p style={{ color: 'red' }}>Error occurred during cluster creation.</p>}
      </div>

      <div className="log-output" style={{ marginTop: '1rem', background: '#111', padding: '1rem', borderRadius: '8px' }}>
        {statusMessages.map((msg, idx) => (
          <div key={idx}>{msg}</div>
        ))}
      </div>

      {/* You can add steps 2 and 3 similarly */}
    </div>
  );
};

export default Cloud;
