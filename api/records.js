const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

// MongoDB 连接配置
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'accounting';
const COLLECTION_NAME = 'records';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 创建全局数据库连接
let cachedDb = null;
let cachedClient = null;

async function connectToDatabase() {
    if (cachedDb) {
        return { db: cachedDb, client: cachedClient };
    }

    const client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        // 优化连接池配置
        maxPoolSize: 1,  // 减少连接数
        minPoolSize: 1,  // 保持最小连接
        maxIdleTimeMS: 120000,  // 增加空闲时间
        connectTimeoutMS: 5000,  // 连接超时时间
        socketTimeoutMS: 5000    // 操作超时时间
    });

    await client.connect();
    const db = client.db(DB_NAME);
    
    // 创建索引
    const records = db.collection(COLLECTION_NAME);
    await records.createIndex({ userId: 1, createdAt: -1 });
    await records.createIndex({ userId: 1, type: 1 });
    
    cachedDb = db;
    cachedClient = client;
    
    return { db, client };
}

// 验证 JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

module.exports = async (req, res) => {
    let client;
    try {
        // 获取数据库连接
        const { db, client: dbClient } = await connectToDatabase();
        client = dbClient;
        const records = db.collection(COLLECTION_NAME);

        // 设置响应头
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
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
                userId: new ObjectId(decoded.userId),
                type: req.body.type,
                amount: parseFloat(req.body.amount),
                description: req.body.description,
                createdAt: new Date()
            };

            await records.insertOne(record);
            
            // 重新计算统计数据
            const summary = await calculateSummary(records, decoded.userId);
            
            return res.status(200).json({ message: '添加成功', record, summary });

        } else if (req.method === 'GET') {
            // 获取记录列表和统计数据
            const recordsList = await records
                .find(
                    { userId: decoded.userId },
                    { 
                        projection: {
                            type: 1,
                            amount: 1,
                            description: 1,
                            category: 1,
                            createdAt: 1,
                            username: 1
                        }
                    }
                )
                .sort({ createdAt: -1 })
                .limit(10)
                .toArray();

            const summary = await calculateSummary(records, decoded.userId);

            return res.status(200).json({
                records: recordsList,
                summary
            });

        } else if (req.method === 'DELETE') {
            const recordId = req.url.split('/').pop();
            if (!recordId) {
                return res.status(400).json({ error: '缺少记录ID' });
            }

            try {
                const record = await records.findOne({
                    _id: new ObjectId(recordId),
                    userId: decoded.userId
                });

                if (!record) {
                    return res.status(404).json({ error: '记录不存在' });
                }

                await records.deleteOne({ _id: new ObjectId(recordId) });
                
                // 重新计算统计数据
                const summary = await calculateSummary(records, decoded.userId);
                
                return res.status(200).json({ 
                    message: '删除成功',
                    summary 
                });
            } catch (error) {
                console.error('删除记录失败:', error);
                return res.status(500).json({ error: '删除记录失败' });
            }

        } else {
            return res.status(405).json({ error: '不支持的请求方法' });
        }

    } catch (error) {
        console.error('记录操作错误:', error);
        return res.status(500).json({ error: '服务器错误' });
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