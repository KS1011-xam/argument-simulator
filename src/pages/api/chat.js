// src/pages/api/chat.js - 极其宽容的调试版
export default async function handler(req, res) {
  // 允许所有跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // 记录请求信息（但不记录敏感数据）
    console.log('请求方法:', req.method);
    console.log('请求头:', JSON.stringify({
      'content-type': req.headers['content-type'],
      'origin': req.headers['origin'],
      'referer': req.headers['referer']
    }));
    
    // 检查请求体
    let requestBody = null;
    
    if (typeof req.body === 'string') {
      try {
        requestBody = JSON.parse(req.body);
      } catch (e) {
        requestBody = { rawText: req.body };
      }
    } else {
      requestBody = req.body || {};
    }
    
    console.log('请求体类型:', typeof req.body);
    console.log('解析后请求体:', JSON.stringify(requestBody));
    
    // 尝试提取消息
    let message = '';
    if (requestBody.message) message = requestBody.message;
    else if (requestBody.text) message = requestBody.text;
    else if (requestBody.content) message = requestBody.content;
    else if (requestBody.input) message = requestBody.input;
    else if (requestBody.query) message = requestBody.query;
    
    console.log('提取的消息:', message);
    
    // 返回固定回复和调试信息
    return res.status(200).json({
      reply: message ? `你说: "${message}"? 这是一个测试回复!` : '你什么都没说，这是默认回复!',
      debug: {
        receivedMethod: req.method,
        receivedContentType: req.headers['content-type'],
        receivedBody: requestBody,
        extractedMessage: message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('处理请求时出错:', error);
    
    // 即使出错也返回200状态码和有效回复
    return res.status(200).json({
      reply: '出错了，但我还是会回复你！',
      error: true,
      debug: {
        message: error.message,
        stack: error.stack
      }
    });
  }
}
