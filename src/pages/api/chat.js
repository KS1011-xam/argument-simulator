// src/pages/api/chat.js - 使用Google Gemini API
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

    // 使用Google Gemini API
    // 注意：你需要在Vercel设置环境变量GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        reply: 'API密钥未配置，请在Vercel设置GEMINI_API_KEY环境变量'
      });
    }
    
    // Gemini API端点
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    
    // 准备请求数据
    const requestData = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "你需要扮演一个非常爱吵架的人。对我接下来说的任何话，都要表现出不耐烦、暴躁的态度，用讽刺和挖苦的语气回复。回复要简短有力，像真人吵架一样充满情绪，使用一些俏皮话和中文网络流行语。以下是我的话: " + message
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 200,
      }
    };

    console.log('发送请求到Gemini API');
    
    // 调用Gemini API
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Gemini API响应状态:', response.status);
    
    // 提取回复
    let reply = '';
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      reply = response.data.candidates[0].content.parts[0].text;
    } else {
      console.log('无法识别的响应格式:', response.data);
      reply = '哼！我才懒得回答你这种问题！';
    }
    
    // 返回回复给前端
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('API调用错误:', error.message);
    console.error('详细错误:', error.response?.data);
    
    // 返回错误信息
    return res.status(500).json({ 
      reply: '哼，你说什么？我怎么听不懂？不要跟我打哑谜！'
    });
  }
}
