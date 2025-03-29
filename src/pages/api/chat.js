// src/pages/api/chat.js - 使用DeepSeek免费模型
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
    
    // 检查API密钥是否存在
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'API密钥未配置',
        debug: '请在Vercel设置DEEPSEEK_API_KEY环境变量'
      });
    }
    
    // 使用DeepSeek API端点
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';

    // 准备DeepSeek API请求数据 - 使用免费模型
    const requestData = {
      model: 'deepseek/deepseek-chat:free', // 使用DeepSeek免费模型
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

    console.log('发送到DeepSeek的请求:', {
      url: apiUrl,
      model: requestData.model,
      messageLength: message.length
    });

    // 发送请求到DeepSeek API
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('DeepSeek API响应状态:', response.status);

    // 提取DeepSeek的回复
    const reply = response.data.choices[0].message.content;
    
    // 返回AI回复给前端
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('DeepSeek API 调用错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 返回详细错误信息以便调试
    return res.status(500).json({ 
      message: '哼，你说什么？我怎么听不懂？不要跟我打哑谜！',
      error: true,
      debug: {
        errorMessage: error.message,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      }
    });
  }
}
