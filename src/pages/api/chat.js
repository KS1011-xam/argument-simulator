// src/pages/api/chat.js - 使用Gemini API生成回复
import axios from 'axios';

export default async function handler(req, res) {
  try {
    // 获取用户消息
    let message = '';
    if (req.body && typeof req.body === 'object' && 'message' in req.body) {
      message = req.body.message;
    }
    
    if (!message) {
      return res.status(200).json({
        reply: "你什么都没说就想让我回复？做梦吧你！"
      });
    }

    // 使用Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('缺少GEMINI_API_KEY环境变量');
      return res.status(200).json({
        reply: "系统配置错误，但我还是要怼你：你的问题真无聊！"
      });
    }
    
    // Gemini API调用
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
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

    console.log('调用Gemini API...');
    
    const response = await axios.post(apiUrl, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Gemini API响应状态:', response.status);
    
    let replyText = '';
    if (response.data && 
        response.data.candidates && 
        response.data.candidates.length > 0 && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts.length > 0) {
      
      replyText = response.data.candidates[0].content.parts[0].text;
      console.log('获取到AI回复:', replyText.substring(0, 50) + '...');
    } else {
      replyText = "哼！API出问题了，但肯定是你的问题太蠢了！";
      console.log('API响应格式异常:', JSON.stringify(response.data).substring(0, 100) + '...');
    }
    
    // 返回AI生成的回复
    return res.status(200).json({
      reply: replyText
    });
  } catch (error) {
    console.error('API调用错误:', error.message);
    console.error('错误详情:', error.response?.data || '无详细信息');
    
    return res.status(200).json({ 
      reply: '哼，遇到技术问题了，肯定是你的问题太奇怪了！'
    });
  }
}
