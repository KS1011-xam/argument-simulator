// src/pages/api/chat.js - 灵活配置版本
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

    // DeepSeek API配置 - 从环境变量获取
    const apiKey = process.env.DEEPSEEK_API_KEY;
    // 允许通过环境变量自定义API端点
    const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
    // 允许通过环境变量自定义模型名称
    const modelName = process.env.DEEPSEEK_MODEL || 'deepseek/deepseek-chat:free';
    
    // 检查API密钥是否存在
    if (!apiKey) {
      return res.status(500).json({ 
        message: 'API密钥未配置',
        debug: '请在Vercel设置DEEPSEEK_API_KEY环境变量'
      });
    }
    
    // 准备DeepSeek API请求数据
    const requestData = {
      model: modelName,
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

    console.log('发送到DeepSeek的请求:', {
      url: apiUrl,
      model: requestData.model,
      messageLength: message.length
    });

    // 根据环境变量决定头部格式
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 添加授权头 - 支持两种常见格式
    if (process.env.DEEPSEEK_AUTH_TYPE === 'api-key') {
      headers['api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // 发送请求到DeepSeek API
    const response = await axios.post(apiUrl, requestData, { headers });

    console.log('DeepSeek API响应状态:', response.status);

    // 提取DeepSeek的回复 - 适应不同的响应格式
    let reply;
    if (response.data.choices && response.data.choices[0]) {
      if (response.data.choices[0].message) {
        reply = response.data.choices[0].message.content;
      } else if (response.data.choices[0].text) {
        reply = response.data.choices[0].text;
      } else {
        reply = JSON.stringify(response.data.choices[0]);
      }
    } else if (response.data.response) {
      reply = response.data.response;
    } else {
      // 如果无法识别响应格式，返回完整的响应数据以便调试
      console.log('未识别的响应格式:', response.data);
      reply = "API响应格式异常，请查看日志";
    }
    
    // 返回AI回复给前端
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('DeepSeek API 调用错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 检查是否有详细的错误信息
    let errorMessage = '哼，你说什么？我怎么听不懂？不要跟我打哑谜！';
    let errorDetails = null;
    
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        errorDetails = error.response.data;
      } else if (error.response.data.error) {
        errorDetails = error.response.data.error;
      } else {
        errorDetails = JSON.stringify(error.response.data);
      }
    }
    
    // 返回详细错误信息以便调试
    return res.status(500).json({ 
      message: errorMessage,
      error: true,
      debug: {
        errorMessage: error.message,
        responseData: errorDetails,
        responseStatus: error.response?.status,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      }
    });
  }
}
