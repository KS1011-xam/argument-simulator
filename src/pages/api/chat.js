// src/pages/api/chat.js
export default function handler(req, res) {
  try {
    // 允许跨域请求
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // 从请求中获取消息（如果有的话）
    let message = '';
    if (req.body && typeof req.body === 'object' && 'message' in req.body) {
      message = req.body.message;
    }
    
    // 返回固定格式的回复
    return res.status(200).json({
      reply: message 
        ? `哼！"${message}"？你这种问题也好意思问我？别逗了！` 
        : "你什么都没说就想让我回复？做梦吧你！"
    });
  } catch (error) {
    console.error('处理请求时出错:', error);
    return res.status(200).json({
      reply: "哎呀！出了点小问题，但我还是要怼你一下：你的问题太蠢了！"
    });
  }
}
