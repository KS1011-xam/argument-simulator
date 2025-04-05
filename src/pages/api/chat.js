// API Key验证工具
import axios from 'axios';

/**
 * 验证Hugging Face API Key的有效性
 * @param {string} apiKey - 要验证的API Key
 * @returns {Promise<Object>} 验证结果
 */
export async function validateHuggingFaceAPIKey(apiKey) {
  if (!apiKey) {
    return {
      isValid: false,
      error: 'API Key为空'
    };
  }

  try {
    // 方法1：使用推理API验证
    const inferenceResponse = await axios.post(
      'https://api-inference.huggingface.co/models/gpt2', 
      { inputs: 'Test input' },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒超时
      }
    );

    // 方法2：使用用户信息端点（如果可用）
    const userInfoResponse = await axios.get('https://huggingface.co/api/whoami', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 10000
    });

    return {
      isValid: true,
      details: {
        inferenceStatus: inferenceResponse.status,
        userInfo: userInfoResponse.data
      }
    };

  } catch (error) {
    // 详细的错误分析
    let errorDetails = {
      isValid: false,
      error: error.message
    };

    // 分析具体的错误类型
    if (error.response) {
      // 服务器返回错误
      errorDetails.statusCode = error.response.status;
      
      switch (error.response.status) {
        case 401:
          errorDetails.errorType = 'Unauthorized';
          errorDetails.message = 'API Key无效或已过期';
          break;
        case 403:
          errorDetails.errorType = 'Forbidden';
          errorDetails.message = '没有足够的权限';
          break;
        case 429:
          errorDetails.errorType = 'RateLimited';
          errorDetails.message = '请求次数超限';
          break;
        default:
          errorDetails.errorType = 'Unknown';
          errorDetails.message = '未知的API错误';
      }

      // 记录更多错误细节
      errorDetails.responseData = JSON.stringify(error.response.data).substring(0, 500);
    } else if (error.request) {
      // 请求发出但没有收到响应
      errorDetails.errorType = 'NoResponse';
      errorDetails.message = '无法连接到Hugging Face服务';
    }

    return errorDetails;
  }
}

// 独立的测试函数，可以在命令行直接运行
async function testAPIKey() {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  console.log('开始验证API Key...');
  
  try {
    const validationResult = await validateHuggingFaceAPIKey(apiKey);
    
    console.log('API Key验证结果:', validationResult);
    
    if (validationResult.isValid) {
      console.log('✅ API Key有效');
      if (validationResult.details) {
        console.log('用户信息:', validationResult.details.userInfo);
      }
    } else {
      console.error('❌ API Key验证失败');
      console.error('错误详情:', validationResult);
    }
  } catch (error) {
    console.error('验证过程发生错误:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testAPIKey();
}

// 在API路由中使用示例
export default async function handler(req, res) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  try {
    // 验证API Key
    const keyValidation = await validateHuggingFaceAPIKey(apiKey);

    if (!keyValidation.isValid) {
      console.error('API Key验证失败:', keyValidation);
      return res.status(401).json({
        error: 'API Key验证失败',
        details: keyValidation
      });
    }

    // 继续正常的API调用逻辑
    // ...
  } catch (error) {
    console.error('API调用错误:', error);
    return res.status(500).json({
      error: '服务器内部错误'
    });
  }
}
