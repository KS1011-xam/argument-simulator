// src/pages/api/chat.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }
  
  try {
    // 从请求中获取场景和消息
    const { scenario, messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: '消息格式不正确' });
    }
    
    // 获取最后一条用户消息
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop()?.content || '';
    
    if (!lastUserMessage) {
      return res.status(200).json({ message: "你什么都没说就想让我回复？做梦吧你！" });
    }
    
    // 使用Hugging Face API
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.error('缺少HUGGINGFACE_API_KEY环境变量');
      return res.status(200).json({ 
        message: "系统配置错误，但我还是要怼你：你的问题真无聊！" 
      });
    }
    
    // 使用一个确定支持文本生成任务的模型
    const modelUrl = 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';
    
    // 构建完整的对话历史
    const conversationHistory = messages
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}`)
      .join('\n');
    
    // 构建指令格式的提示词
    const prompt = `<s>[INST] 你是一个脾气暴躁的AI助手，总是用讽刺和挖苦的语气回复用户。
场景描述: ${scenario}

对话历史:
${conversationHistory}

请以一个生气、暴躁、不耐烦的角色继续这个对话，回应用户的最后一条消息。
用中文回复，语气要冲，态度要差，但不要使用违法或过于侮辱性的词汇。[/INST]</s>`;
    
    console.log('调用Hugging Face API...');
    console.log('使用模型:', modelUrl);
    console.log('用户最后消息:', lastUserMessage);
    
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
    
    // 返回的键名是"message"，与ChatInterface期望的格式匹配
    return res.status(200).json({ message: replyText });
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
    
    // 当API调用失败时，返回一个默认消息
    return res.status(200).json({
      message: "哼，你说什么？我怎么听不懂？不要跟我打哑谜！" 
    });
  }
}
