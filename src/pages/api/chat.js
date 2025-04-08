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
    
    // 使用DeepSeek API
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      console.error('缺少DEEPSEEK_API_KEY环境变量');
      return res.status(200).json({ 
        message: "系统配置错误，但我还是要怼你：你的问题真无聊！" 
      });
    }
    
    // DeepSeek API端点
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    // 构建完整的对话历史，只包含最近的几轮对话，避免提示词过长
    const recentMessages = messages
      .filter(msg => msg.role !== 'system')
      .slice(-4); // 修改：从6条减少到4条(2轮对话)，减少token用量
    
    // 构建更精确的系统提示词，并限制长度
    const systemPrompt = `你是一个吵架模拟器中的角色，需要扮演与用户发生争执的对方。你的目标是让用户感到被激怒，但同时保持逻辑连贯和语言通顺。

场景描述: ${scenario}

要求：
1. 你的回复必须保持逻辑清晰、语言通顺，不要出现语法错误或无意义的词语。
2. 态度必须非常刻薄、讽刺、尖锐，表现出不耐烦和轻蔑。
3. 坚持自己的立场，绝不认错或妥协，反而要指责用户太敏感、太较真。
4. 使用符合中国网络文化的嘲讽语气和表达方式，如"切"、"呵呵"、"真是笑死人了"等。
5. 回复要简洁有力，通常不超过3句话，要一针见血地攻击用户的论点。
6. 不要重复用户的原话，而是曲解用户的意思，把对方的话往坏处理解。
7. 符合场景背景，根据具体情景调整你的角色身份和回应方式。
8. 不要使用任何违反中国法律法规的言论或敏感内容。`.substring(0, 1000); // 限制系统提示词长度为1000字符
    
    // 准备消息数组，DeepSeek API格式
    const apiMessages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...recentMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];
    
    console.log('调用DeepSeek API...');
    console.log('用户最后消息:', lastUserMessage);
    
    // 修改点1：更新模型标识符和优化请求体
    const requestBody = {
      model: "deepseek-chat", // 修正模型名称
      messages: apiMessages,
      temperature: 0.75,
      max_tokens: 300,
      top_p: 0.9, // 新增参数控制输出多样性
      frequency_penalty: 0.5 // 新增参数减少重复
    };
    
    // 修改点2：优化请求头
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ArgueBot/1.0' // 新增用户代理标识
      },
      timeout: 30000 // 30秒超时
    });
    
    console.log('DeepSeek API响应状态:', response.status);
    
    // 修改点3：简化响应解析逻辑
    let replyText = '';
    
    try {
      // 使用标准路径直接提取回复
      replyText = response.data.choices[0].message.content.trim();
    } catch (parseError) {
      console.error('响应解析错误:', parseError.message);
      console.log('响应数据:', JSON.stringify(response.data).substring(0, 200));
      throw new Error('无法从API响应中提取回复');
    }
    
    // 清理AI响应，移除可能的格式问题
    replyText = replyText.trim();
      
    // 修改点4：调整最小有效回复长度检查
    if (!replyText || replyText.length < 2) { // 从5改为2，因为"呵呵"这样的短回复也是有效的
      const defaultResponses = [
        "呵呵，你这种人真是不可理喻，我没时间和你在这浪费口舌！",
        "你是不是脑子有问题？连这么简单的事都理解不了？",
        "真是受不了你这种人，非要把简单的事情搞复杂是吧？",
        "我看你就是闲得慌，专门出来找茬是吧？",
        "行了行了，你说得都对，我不想和你这种人争论！"
      ];
      replyText = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
    
    console.log('提取的回复:', replyText.substring(0, 50) + '...');
    
    // 返回的键名是"message"，与ChatInterface期望的格式匹配
    return res.status(200).json({ message: replyText });
  } catch (error) {
    console.error('API调用错误:', error.message);
    
    // 修改点5：增强错误处理
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', 
        typeof error.response.data === 'object' ? 
        JSON.stringify(error.response.data).substring(0, 200) : 
        String(error.response.data).substring(0, 200)
      );
      
      // 特殊处理速率限制错误
      if (error.response.status === 429) {
        console.warn('遇到速率限制，建议添加重试逻辑');
      }
    }
    
    // 当API调用失败时，返回一个随机的刻薄回复
    const fallbackResponses = [
      "听不懂人话是吧？我没空陪你在这胡搅蛮缠！",
      "你说什么都无所谓，反正你永远是对的，行了吧？",
      "哎呀，我的天啊，你能不能别这么烦人？",
      "要不是看在大家都是人的份上，我真懒得理你！",
      "你是不是闲得发慌？找别人去浪费时间好吗？"
    ];
    
    return res.status(200).json({
      message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]
    });
  }
}
