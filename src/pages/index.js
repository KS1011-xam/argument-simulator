import { useState } from 'react';

export default function HomePage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    
    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setLoading(true);
    
    try {
      // 调用API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      
      const data = await response.json();
      
      // 添加AI回复
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply || '无回复'
      }]);
    } catch (error) {
      console.error('错误:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '发生错误，请重试。'
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  }
  
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>吵架模拟器</h1>
      
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '8px',
        height: '400px',
        overflowY: 'auto',
        padding: '16px',
        marginBottom: '16px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{
            marginBottom: '12px',
            textAlign: msg.role === 'user' ? 'right' : 'left',
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: msg.role === 'user' ? '#0084ff' : '#f0f0f0',
              color: msg.role === 'user' ? 'white' : 'black',
              maxWidth: '80%'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={{ textAlign: 'left', marginBottom: '12px' }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 12px',
              borderRadius: '12px',
              backgroundColor: '#f0f0f0',
            }}>
              正在思考...
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSend} style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="输入消息..."
          style={{ 
            flex: 1, 
            padding: '10px', 
            borderRadius: '4px 0 0 4px',
            border: '1px solid #ddd',
          }}
        />
        <button 
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 16px',
            backgroundColor: '#0084ff',
            color: 'white',
            border: 'none',
            borderRadius: '0 4px 4px 0',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          发送
        </button>
      </form>
    </div>
  );
}
