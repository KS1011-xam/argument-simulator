import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { scenarios } from '../data/scenarios';

// 获取用户的历史对话
export const getUserConversations = async (userId, maxResults = 10) => {
  if (!userId) return [];

  try {
    const q = query(
      collection(db, "conversations"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching user conversations:", error);
    return [];
  }
};

// 分析用户的偏好类型
export const analyzeUserPreferences = async (userId) => {
  // 获取用户的历史对话
  const conversations = await getUserConversations(userId, 20);
  
  if (conversations.length === 0) {
    return {
      favoriteScenarios: [],
      keywords: [],
      preferredContentType: 'general'
    };
  }
  
  // 统计最频繁使用的场景
  const scenarioCounts = {};
  let customScenarioCount = 0;
  
  // 收集所有消息的内容，用于关键词分析
  let allMessages = [];
  
  conversations.forEach(conv => {
    // 计算场景使用频率
    if (conv.scenario && conv.scenario !== "自定义场景") {
      scenarioCounts[conv.scenario] = (scenarioCounts[conv.scenario] || 0) + 1;
    } else {
      customScenarioCount++;
    }
    
    // 收集用户消息内容
    if (conv.messages && Array.isArray(conv.messages)) {
      const userMessages = conv.messages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content);
      
      allMessages = [...allMessages, ...userMessages];
    }
  });
  
  // 找出最常用的场景
  const favoriteScenarios = Object.entries(scenarioCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(item => item[0]);
  
  // 简单的关键词提取（这里仅做示范，真实应用可能需要更复杂的NLP）
  const keywordExtraction = (messages) => {
    // 常见的停用词
    const stopWords = ['的', '了', '是', '在', '我', '你', '他', '她', '它', '们', '有', '和', '就', '不', '也', '这', '那', '都', '而', '但', '又', '所', '如', '到', '去', '说', '要', '可以', '能', '会', '很', '啊', '吧', '呢', '吗', '嗯', '哦'];
    
    // 将所有消息合并，并分词（这里用空格简单分割，实际应用可能需要中文分词库）
    const allText = messages.join(' ');
    const words = allText.split(/\s+|，|。|！|？|,|\.|!|\?/)
      .filter(word => word.length > 1) // 过滤单字符词
      .filter(word => !stopWords.includes(word)); // 过滤停用词
    
    // 统计词频
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // 返回频率最高的几个词
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(item => item[0]);
  };
  
  const keywords = keywordExtraction(allMessages);
  
  // 确定用户偏好的内容类型
  const preferredContentType = customScenarioCount > Object.keys(scenarioCounts).length
    ? 'custom'  // 用户更喜欢自定义场景
    : 'preset'; // 用户更喜欢预设场景
  
  return {
    favoriteScenarios,
    keywords,
    preferredContentType
  };
};

// 基于用户偏好生成推荐场景
export const generateRecommendations = async (userId, count = 3) => {
  try {
    // 分析用户偏好
    const preferences = await analyzeUserPreferences(userId);
    
    // 如果用户历史不足，返回默认推荐
    if (preferences.favoriteScenarios.length === 0) {
      // 随机返回几个预设场景
      return scenarios
        .sort(() => 0.5 - Math.random())
        .slice(0, count)
        .map(s => ({
          ...s,
          isRecommended: true
        }));
    }
    
    // 找出用户最喜欢的场景类型
    const favoriteScenarioTitles = preferences.favoriteScenarios;
    
    // 找出匹配的预设场景
    const matchingScenarios = scenarios.filter(s => 
      favoriteScenarioTitles.includes(s.title)
    );
    
    // 基于关键词寻找相关场景
    const keywordMatchScenarios = scenarios.filter(s => 
      !matchingScenarios.includes(s) && // 排除已匹配的场景
      preferences.keywords.some(keyword => 
        s.title.includes(keyword) || s.description.includes(keyword)
      )
    );
    
    // 组合推荐结果
    let recommendations = [...matchingScenarios, ...keywordMatchScenarios];
    
    // 如果推荐不足，随机添加一些场景
    if (recommendations.length < count) {
      const remainingScenarios = scenarios.filter(s => 
        !recommendations.includes(s)
      );
      
      const randomScenarios = remainingScenarios
        .sort(() => 0.5 - Math.random())
        .slice(0, count - recommendations.length);
      
      recommendations = [...recommendations, ...randomScenarios];
    }
    
    // 限制返回数量
    return recommendations.slice(0, count).map(s => ({
      ...s,
      isRecommended: true
    }));
  } catch (error) {
    console.error("Error generating recommendations:", error);
    // 出错时返回随机推荐
    return scenarios
      .sort(() => 0.5 - Math.random())
      .slice(0, count)
      .map(s => ({
        ...s,
        isRecommended: true
      }));
  }
};