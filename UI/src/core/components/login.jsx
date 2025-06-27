import React, { useState } from 'react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:6060/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Login failed');
      }

      const data = await res.json();
      setToken(data.token);
      localStorage.setItem('authToken', data.token); // Optional: save token
      setError('');
    } catch (err) {
      setError(err.message);
      setToken(null);
    }
  };

  return (
    <div style={{ maxWidth: '300px', margin: '50px auto', padding: '20px', border: '1px solid #ccc' }}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '10px' }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: '10px' }}
      />
      <button onClick={handleLogin} style={{ width: '100%' }}>Login</button>

      {token && (
        <div style={{ marginTop: '10px', color: 'green' }}>
          ✅ Token received: <code>{token}</code>
        </div>
      )}
      {error && (
        <div style={{ marginTop: '10px', color: 'red' }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
};
export default LoginPage;
