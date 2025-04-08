// src/pages/api/chat.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }
  
  try {
    // 从请求中获取场景和消息
    const { scenario, messages } = req.body;
    
    console.log('处理请求 - 场景:', scenario ? scenario.substring(0, 50) + '...' : '无');
    console.log('消息数组长度:', messages ? messages.length : 0);
    
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
    
    console.log('API密钥长度:', apiKey.length);
    
    // 根据DeepSeek官方文档修正的API端点
    const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    
    // 构建完整的对话历史，只包含最近的几轮对话，避免提示词过长
    const recentMessages = messages
      .filter(msg => msg.role !== 'system')
      .slice(-6); // 最多取最近3轮对话（用户+AI各一条）
    
    // 构建更精确的系统提示词
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
8. 不要使用任何违反中国法律法规的言论或敏感内容。`;
    
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
    console.log('API端点:', apiUrl);
    console.log('用户最后消息:', lastUserMessage);
    
    // 请求体
    const requestBody = {
      model: "'deepseek-chat-1.3',", // DeepSeek-V3，根据官方文档
      messages: apiMessages,
      temperature: 0.1,
      max_tokens: 400
      // 简化请求体，移除可能不支持的参数
    };
    
    console.log('请求体预览:', JSON.stringify(requestBody).substring(0, 200) + '...');
    
    // 发送请求到DeepSeek API
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15秒超时
    });
    
    console.log('DeepSeek API响应状态:', response.status);
    console.log('响应头部:', JSON.stringify(response.headers));
    console.log('响应数据结构:', Object.keys(response.data));
    console.log('响应数据预览:', JSON.stringify(response.data).substring(0, 300) + '...');
    
    // 从响应中提取回复文本 - 添加多个解析路径
    let replyText = '';
    
    // 尝试多种可能的响应格式
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const choice = response.data.choices[0];
      
      if (choice.message && choice.message.content) {
        // 标准OpenAI格式
        replyText = choice.message.content;
        console.log('使用标准OpenAI格式解析');
      } else if (choice.text) {
        // 可能的替代格式
        replyText = choice.text;
        console.log('使用替代格式(text)解析');
      } else if (typeof choice === 'string') {
        // 直接返回文本
        replyText = choice;
        console.log('使用字符串格式解析');
      } else {
        console.log('无法识别的choice格式:', JSON.stringify(choice));
      }
    } else if (response.data && response.data.response) {
      // 可能的替代格式
      replyText = response.data.response;
      console.log('使用response字段解析');
    } else if (response.data && typeof response.data === 'string') {
      // 可能直接返回文本
      replyText = response.data;
      console.log('使用直接字符串解析');
    } else {
      console.log('无法解析的响应格式，完整响应:', JSON.stringify(response.data));
      throw new Error('无法从API响应中提取回复');
    }
    
    // 清理AI响应，移除可能的格式问题
    replyText = replyText.trim();
      
    // 确保回复不为空且有意义
    if (!replyText || replyText.length < 5) {
      const defaultResponses = [
        "呵呵，你这种人真是不可理喻，我没时间和你在这浪费口舌！",
        "你是不是脑子有问题？连这么简单的事都理解不了？",
        "真是受不了你这种人，非要把简单的事情搞复杂是吧？",
        "我看你就是闲得慌，专门出来找茬是吧？",
        "行了行了，你说得都对，我不想和你这种人争论！"
      ];
      replyText = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
      console.log('使用默认回复');
    }
    
    console.log('最终提取的回复:', replyText);
    
    // 返回的键名是"message"，与ChatInterface期望的格式匹配
    return res.status(200).json({ message: replyText });
  } catch (error) {
    console.error('API调用错误:');
    console.error('错误消息:', error.message);
    console.error('错误名称:', error.name);
    
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误状态文本:', error.response.statusText);
      console.error('错误头部:', JSON.stringify(error.response.headers));
      console.error('错误数据:', JSON.stringify(error.response.data));
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('未收到响应:', error.request);
    } else {
      // 设置请求时发生错误
      console.error('请求设置错误:', error.message);
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
