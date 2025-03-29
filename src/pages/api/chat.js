// src/pages/api/chat.js - 带详细调试的Gemini API
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
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 检查API密钥是否存在且不为空
    if (!apiKey || apiKey.trim() === '') {
      console.error('API密钥未配置或为空');
      return res.status(500).json({ 
        reply: 'API密钥未配置，请在Vercel设置GEMINI_API_KEY环境变量',
        debug: { error: 'API_KEY_MISSING' }
      });
    }
    
    // 记录API密钥的前几个字符以确认它被正确加载（不记录完整密钥）
    console.log('API密钥前5个字符:', apiKey.substring(0, 5));
    
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

    console.log('准备发送请求到Gemini API');
    console.log('API URL:', apiUrl.split('?')[0] + '?key=HIDDEN'); // 隐藏实际的API密钥
    console.log('用户消息长度:', message.length);
    
    try {
      // 调用Gemini API
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒超时
      });
      
      console.log('Gemini API响应状态:', response.status);
      
      if (response.data) {
        console.log('响应数据结构:', JSON.stringify(Object.keys(response.data)));
        
        // 提取回复
        let reply = '';
        if (response.data.candidates && 
            response.data.candidates.length > 0 && 
            response.data.candidates[0].content && 
            response.data.candidates[0].content.parts && 
            response.data.candidates[0].content.parts.length > 0) {
          
          reply = response.data.candidates[0].content.parts[0].text;
          console.log('成功提取回复，长度:', reply.length);
        } else {
          console.log('响应数据格式无法识别:', JSON.stringify(response.data));
          reply = '哼！我才懒得回答你这种问题！';
        }
        
        // 返回回复给前端
        return res.status(200).json({ reply });
      } else {
        throw new Error('API响应为空');
      }
    } catch (apiError) {
      console.error('Gemini API调用失败:', apiError.message);
      
      // 记录详细的错误信息
      if (apiError.response) {
        console.error('错误状态码:', apiError.response.status);
        console.error('错误详情:', JSON.stringify(apiError.response.data));
      }
      
      // 尝试不同的Gemini模型
      console.log('尝试备用Gemini模型...');
      const backupUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      
      try {
        const backupResponse = await axios.post(backupUrl, requestData, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        console.log('备用模型响应状态:', backupResponse.status);
        
        if (backupResponse.data && 
            backupResponse.data.candidates && 
            backupResponse.data.candidates.length > 0 && 
            backupResponse.data.candidates[0].content && 
            backupResponse.data.candidates[0].content.parts && 
            backupResponse.data.candidates[0].content.parts.length > 0) {
          
          const backupReply = backupResponse.data.candidates[0].content.parts[0].text;
          console.log('成功从备用模型获取回复');
          return res.status(200).json({ reply: backupReply });
        }
      } catch (backupError) {
        console.error('备用模型也失败了:', backupError.message);
        throw apiError; // 抛出原始错误继续处理
      }
      
      throw apiError; // 如果备用也失败，继续抛出错误
    }
  } catch (error) {
    console.error('处理过程中发生错误:', error.message);
    
    // 返回详细的错误信息
    return res.status(500).json({ 
      reply: '哼，你说什么？我怎么听不懂？不要跟我打哑谜！',
      debug: { 
        error: error.message,
        response: error.response?.data ? JSON.stringify(error.response.data) : null,
        status: error.response?.status || null
      }
    });
  }
}
