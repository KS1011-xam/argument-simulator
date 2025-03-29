// src/pages/api/chat.js - 详细调试版
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

    // 优先使用OPENAI_API_KEY，如果不存在则使用DEEPSEEK_API_KEY
    const apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
    
    // 检查API密钥是否存在
    if (!apiKey) {
      return res.status(500).json({ 
        reply: 'API密钥未配置，请在Vercel设置OPENAI_API_KEY或DEEPSEEK_API_KEY环境变量'
      });
    }
    
    // 使用可能的不同API端点
    let apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    // 准备API请求数据
    const requestData = {
      model: 'deepseek/deepseek-chat:free',
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
      temperature: 0.9,
      max_tokens: 500
    };

    console.log('发送请求到:', apiUrl);
    console.log('使用模型:', requestData.model);
    
    // 尝试调用API
    try {
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 10000 // 10秒超时
      });
      
      console.log('API响应状态:', response.status);
      
      // 提取回复
      const reply = response.data.choices[0].message.content;
      
      // 返回AI回复给前端
      return res.status(200).json({ reply });
    } catch (apiError) {
      console.error('第一个API端点失败:', apiError.message);
      
      // 尝试另一个可能的API端点
      apiUrl = 'https://api.deepseek.ai/v1/chat/completions';
      console.log('尝试备用API端点:', apiUrl);
      
      try {
        const response = await axios.post(apiUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000 // 10秒超时
        });
        
        console.log('备用API响应状态:', response.status);
        
        // 提取回复
        const reply = response.data.choices[0].message.content;
        
        // 返回AI回复给前端
        return res.status(200).json({ reply });
      } catch (backupApiError) {
        console.error('备用API端点也失败:', backupApiError.message);
        throw new Error(`两个API端点都失败。第一个错误: ${apiError.message}, 第二个错误: ${backupApiError.message}`);
      }
    }
  } catch (error) {
    console.error('API调用详细错误:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 返回更详细的错误信息
    return res.status(500).json({ 
      reply: '哼，你说什么？我怎么听不懂？不要跟我打哑谜！',
      error: true,
      debug: {
        message: error.message,
        response: error.response?.data ? JSON.stringify(error.response.data) : null,
        status: error.response?.status || null
      }
    });
  }
}
