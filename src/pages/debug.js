// src/pages/debug.js
import { useState } from 'react';

export default function Debug() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse('');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API 调试页面</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="message">消息:</label>
          <input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '8px' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            marginTop: '12px', 
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {loading ? '发送中...' : '发送'}
        </button>
      </form>
      
      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <h3>错误:</h3>
          <pre>{error}</pre>
        </div>
      )}
      
      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>响应:</h3>
          <pre style={{ 
            backgroundColor: '#f0f0f0', 
            padding: '12px', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}
