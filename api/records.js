const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// MongoDB 连接配置
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'accounting';
const COLLECTION_NAME = 'records';

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 创建 MongoDB 客户端
const client = new MongoClient(MONGODB_URI);

// 验证 JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = async (req, res) => {
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 验证 token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权访问' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ error: '无效的token' });
    }

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const records = db.collection(COLLECTION_NAME);

        if (req.method === 'POST') {
            // 添加记录
            const { type, amount, category, description } = req.body;
            
            // 验证必填字段
            if (!type || !amount || !category) {
                return res.status(400).json({ error: '缺少必要字段' });
            }

            // 验证金额
            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({ error: '无效的金额' });
            }

            const record = {
                userId: decoded.userId,
                type,
                amount: parseFloat(amount),
                category,
                description: description || '无描述',
                createdAt: new Date()
            };

            await records.insertOne(record);
            
            // 重新计算统计数据
            const summary = await calculateSummary(records, decoded.userId);
            
            res.status(200).json({ message: '添加成功', record, summary });

        } else if (req.method === 'GET') {
            // 获取记录列表和统计数据
            const recordsList = await records
                .find({ userId: decoded.userId })
                .sort({ createdAt: -1 })
                .limit(10)
                .toArray();

            const summary = await calculateSummary(records, decoded.userId);

            res.status(200).json({
                records: recordsList,
                summary
            });

        } else {
            res.status(405).json({ error: '不支持的请求方法' });
        }

    } catch (error) {
        console.error('记录操作错误:', error);
        res.status(500).json({ error: '服务器错误' });
    } finally {
        await client.close();
    }
};

// 计算统计数据
async function calculateSummary(records, userId) {
    const pipeline = [
        { $match: { userId: userId } },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' }
            }
        }
    ];

    const results = await records.aggregate(pipeline).toArray();
    
    const summary = {
        totalIncome: 0,
        totalExpense: 0
    };

    results.forEach(result => {
        if (result._id === 'income') {
            summary.totalIncome = result.total;
        } else if (result._id === 'expense') {
            summary.totalExpense = result.total;
        }
    });

    return summary;
} 