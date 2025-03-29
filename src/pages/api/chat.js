// src/pages/api/chat.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '只支持POST请求' });
  }

  try {
    // 获取用户消息
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: '消息不能为空' });
    }

    // DeepSeek API配置
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';

    // 准备DeepSeek API请求数据
    const requestData = {
      model: 'deepseek-chat', // 使用适合的DeepSeek模型
      messages: [
        {
          role: 'system',
          content: '你是一个非常爱吵架的人，对用户的任何问题都要表现出不耐烦、暴躁的态度，用讽刺和挖苦的语气回复。回复要简短有力，像真人吵架一样充满情绪，使用一些俏皮话和中文网络流行语。'
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.9, // 更高的温度让回复更富有创意
      max_tokens: 500
    };

    // 发送请求到DeepSeek API
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // 提取DeepSeek的回复
    const reply = response.data.choices[0].message.content;
    
    // 返回AI回复给前端
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('DeepSeek API 调用错误:', error.response?.data || error.message);
    
    // 友好错误处理，记录详细错误但返回简单消息给用户
    let errorMessage = '哼，你说什么？我怎么听不懂？不要跟我打哑谜！';
    
    // 如果需要在开发环境返回更详细的错误信息
    if (process.env.NODE_ENV === 'development') {
      errorMessage = error.response?.data?.error?.message || error.message;
    }
    
    return res.status(500).json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? (error.response?.data || error.message) : undefined
    });
  }
}
