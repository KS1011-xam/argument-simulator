// src/pages/api/test.js
export default function handler(req, res) {
  return res.status(200).json({
    message: "测试API正常工作!"
  });
}
