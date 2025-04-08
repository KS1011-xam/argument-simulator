// src/pages/api/chat.js
import axios from 'axios';

// 配置常量
const API_CONFIG = {
  MODEL: 'deepseek-chat-1.3', // 使用最新版模型
  API_ENDPOINT: 'https://api.deepseek.com/v1/chat/completions',
  MAX_RETRIES: 2, // 请求重试次数
  TIMEOUT: 15000, // 15秒超时
  MAX_HISTORY: 4, // 保留最近2轮对话
  SYSTEM_PROMPT_MAX_LENGTH: 1200 // 系统提示词长度限制
};

// 辅助函数：生成结构化日志
function logEvent(eventType, details) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: eventType,
    ...details
  }));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    const { scenario = '未指定场景', messages = [] } = req.body;

    // 结构化日志记录
    logEvent('REQUEST_START', {
      scenario: scenario.substring(0, 30),
      messageCount: messages.length
    });

    // 验证消息结构
    if (!Array.isArray(messages) {
      logEvent('VALIDATION_ERROR', { error: '消息格式错误' });
      return res.status(400).json({ error: '消息格式不正确' });
    }

    // 获取最后有效用户消息
    const lastUserMessage = messages
      .filter(msg => msg.role === 'user')
      .pop()?.content || '';

    if (!lastUserMessage.trim()) {
      logEvent('EMPTY_MESSAGE');
      return res.status(200).json({ 
        message: "你什么都没说就想让我回复？做梦吧你！"
      });
    }

    // 验证API密钥
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey?.startsWith('ds-')) {
      logEvent('CONFIG_ERROR', { keyLength: apiKey?.length });
      return res.status(500).json({ 
        message: "系统配置错误，但我还是要怼你：你的问题真无聊！"
      });
    }

    // 构建系统提示词
    const systemPrompt = `
      你是一个专业吵架模拟器，需要以刻薄、讽刺的方式回应用户。保持以下原则：
      1. 使用中文网络流行语（如"就这？"、"不会吧不会吧"）
      2. 每次回复不超过2句话
      3. 绝不道歉或让步
      场景：${scenario}
    `.substring(0, API_CONFIG.SYSTEM_PROMPT_MAX_LENGTH);

    // 构建消息历史
    const recentMessages = messages
      .filter(msg => msg.role !== 'system')
      .slice(-API_CONFIG.MAX_HISTORY)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content.substring(0, 500) // 限制单条消息长度
      }));

    // 构造API请求体
    const requestBody = {
      model: API_CONFIG.MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentMessages
      ],
      temperature: 0.85,
      max_tokens: 120,
      top_p: 0.95,
      frequency_penalty: 0.6
    };

    logEvent('API_REQUEST', {
      messagePreview: lastUserMessage.substring(0, 50),
      messageCount: requestBody.messages.length
    });

    // 发送API请求（带重试机制）
    let attempts = 0;
    while (attempts <= API_CONFIG.MAX_RETRIES) {
      try {
        const response = await axios.post(
          API_CONFIG.API_ENDPOINT,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'User-Agent': 'ArgueBot/1.0'
            },
            timeout: API_CONFIG.TIMEOUT
          }
        );

        // 解析标准响应格式
        const replyText = response.data.choices[0].message.content
          .trim()
          .replace(/[\r\n]+/g, ' ') // 清理换行符
          .substring(0, 300); // 限制响应长度

        logEvent('API_SUCCESS', {
          status: response.status,
          replyPreview: replyText.substring(0, 30)
        });

        return res.status(200).json({ message: replyText });
      } catch (error) {
        attempts++;
        
        // 处理速率限制
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 3;
          await new Promise(resolve => 
            setTimeout(resolve, retryAfter * 1000)
          );
          continue;
        }

        throw error; // 非429错误直接抛出
      }
    }

    throw new Error(`请求失败，重试${API_CONFIG.MAX_RETRIES}次后仍不成功`);

  } catch (error) {
    // 统一错误处理
    logEvent('API_FAILURE', {
      error: error.message,
      code: error.code,
      status: error.response?.status
    });

    // 生成随机回退响应
    const fallbackResponses = [
      "你是不是网络不好啊？连句话都传不过来！",
      "就这？连个正常回复都收不到，真可怜～",
      "呵呵，系统都懒得理你了，自己心里没点数吗？",
      "我这边好得很，有问题的是你那边吧？",
      "重试这么多次都不行，你手机是土豆做的吗？"
    ];

    return res.status(200).json({
      message: fallbackResponses[
        Math.floor(Math.random() * fallbackResponses.length)
      ]
    });
  }
}
