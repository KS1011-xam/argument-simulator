// src/pages/api/chat.js - 使用Hugging Face API
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

    // 使用Hugging Face API
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.error('缺少HUGGINGFACE_API_KEY环境变量');
      return res.status(200).json({
        reply: "系统配置错误，但我还是要怼你：你的问题真无聊！"
      });
    }
    
    // 使用一个适合中文对话的模型
    // 这里选择THUDM/chatglm3-6b，是一个优秀的中文大模型
    const modelUrl = 'https://api-inference.huggingface.co/models/THUDM/chatglm3-6b';
    
    // 准备提示词
    const prompt = `以下是一个人正在与一个非常爱吵架的AI助手对话。这个AI助手脾气暴躁，不耐烦，说话带刺，总是用讽刺和挖苦的语气回复。它的回答简短有力，充满情绪，使用中文网络流行语和俏皮话。

用户: ${message}

AI助手:`;

    // 准备请求数据
    const requestData = {
      inputs: prompt,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.9,
        top_p: 0.9,
        do_sample: true
      }
    };

    console.log('调用Hugging Face API...');
    
    // 发送请求到Hugging Face API
    const response = await axios.post(modelUrl, requestData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30秒超时，因为Hugging Face有时需要更长时间
    });
    
    console.log('Hugging Face API响应状态:', response.status);
    
    // 从响应中提取回复
    let replyText = '';
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      // 处理数组格式响应
      if (typeof response.data[0] === 'string') {
        replyText = response.data[0];
      } else if (response.data[0].generated_text) {
        replyText = response.data[0].generated_text;
      }
    } else if (typeof response.data === 'string') {
      // 处理字符串格式响应
      replyText = response.data;
    } else if (response.data && response.data.generated_text) {
      // 处理对象格式响应
      replyText = response.data.generated_text;
    }
    
    // 清理回复，只保留AI助手部分
    if (replyText.includes('AI助手:')) {
      replyText = replyText.split('AI助手:')[1].trim();
    }
    
    // 如果获取失败，使用默认回复
    if (!replyText) {
      console.log('无法从API响应中提取回复');
      replyText = `听着，"${message}"？你脑子进水了吧！这种蠢问题也能问出口？`;
    }
    
    console.log('提取的回复:', replyText.substring(0, 50) + '...');
    
    // 返回回复
    return res.status(200).json({
      reply: replyText
    });
  } catch (error) {
    console.error('API调用错误:', error.message);
    
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', 
        error.response.data ? 
        JSON.stringify(error.response.data).substring(0, 200) : 
        '无错误数据'
      );
    }
    
    // 即使出错也返回一个吵架回复
    return res.status(200).json({ 
      reply: `哼，系统出了点小问题，但肯定还是因为你的问题太奇怪了！谁让你问"${message}"这种弱智问题？`
    });
  }
}
