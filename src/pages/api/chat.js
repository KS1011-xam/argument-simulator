// src/pages/api/chat.js - 修复的Hugging Face API版本
import axios from 'axios';

export default async function handler(req, res) {
  try {
    // 获取用户消息
    let userMessage = '';
    if (req.body && typeof req.body === 'object' && 'message' in req.body) {
      userMessage = req.body.message;
    }
    
    if (!userMessage) {
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
    
    // 使用一个确定支持文本生成任务的模型
    const modelUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
    
    // 构建指令格式的提示词
    const prompt = `<s>[INST] 你是一个脾气暴躁的AI助手，总是用讽刺和挖苦的语气回复用户。你说话简短有力，充满情绪，使用中文网络流行语和俏皮话。无论用户说什么，你都要表现得不耐烦和暴躁。请用中文回复以下消息：${userMessage} [/INST]</s>`;
    
    console.log('调用Hugging Face API...');
    console.log('使用模型:', modelUrl);
    console.log('用户消息:', userMessage);
    
    // 发送请求到Hugging Face API
    const response = await axios.post(modelUrl, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 150,
        temperature: 0.9,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false
      }
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000 // 20秒超时
    });
    
    console.log('Hugging Face API响应状态:', response.status);
    
    // 从响应中提取回复文本
    let replyText = '';
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      if (typeof response.data[0] === 'object' && response.data[0].generated_text) {
        replyText = response.data[0].generated_text;
      } else {
        replyText = String(response.data[0]);
      }
    } else if (typeof response.data === 'object' && response.data.generated_text) {
      replyText = response.data.generated_text;
    } else if (typeof response.data === 'string') {
      replyText = response.data;
    } else {
      console.log('无法识别的响应格式:', JSON.stringify(response.data).substring(0, 200));
      throw new Error('无法从API响应中提取回复');
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
        typeof error.response.data === 'object' ? 
        JSON.stringify(error.response.data).substring(0, 200) : 
        String(error.response.data).substring(0, 200)
      );
    }
    
    // 当API调用失败时，告知用户
    return res.status(200).json({
      reply: "服务暂时不可用，请稍后再试。(API调用失败: " + error.message + ")"
    });
  }
}
