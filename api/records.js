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
        compressors: ['zlib'],
        zlibCompressionLevel: 9
    });
    await client.connect();
    const db = client.db(DB_NAME);
    
    // 优化索引策略
    const records = db.collection(COLLECTION_NAME);
    // 创建复合索引，减少索引数量
    await records.createIndex({ 
        userId: 1, 
        createdAt: -1,
        type: 1 
    });

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
    try {
        const { db } = await connectToDatabase();
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
            const { type, amount, description } = req.body;
            
            if (!type || !amount) {
                return res.status(400).json({ error: '缺少必要字段' });
            }

            if (isNaN(amount) || amount <= 0) {
                return res.status(400).json({ error: '无效的金额' });
            }

            const record = {
                userId: new ObjectId(decoded.userId),
                t: type.charAt(0),  // 使用 'i' 代替 'income', 'e' 代替 'expense'
                a: parseFloat(amount),  // 简化字段名
                d: description || '',
                c: new Date()
            };

            await records.insertOne(record);
            
            // 获取最新的统计数据
            const summary = await calculateSummary(records, decoded.userId);
            
            // 获取最新的记录列表
            const recordsList = await records
                .find({ userId: new ObjectId(decoded.userId) })
                .project({
                    type: { $cond: { if: { $eq: ["$t", "i"] }, then: "income", else: "expense" } },
                    amount: "$a",
                    description: "$d",
                    createdAt: "$c"
                })
                .sort({ c: -1 })
                .limit(10)
                .toArray();

            return res.status(200).json({ 
                message: '添加成功', 
                record,
                summary,
                records: recordsList
            });

        } else if (req.method === 'GET') {
            // 获取记录列表和统计数据
            const recordsList = await records
                .find({ userId: new ObjectId(decoded.userId) })
                .project({
                    type: { $cond: { if: { $eq: ["$t", "i"] }, then: "income", else: "expense" } },
                    amount: "$a",
                    description: "$d",
                    createdAt: "$c"
                })
                .sort({ c: -1 })
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
                    userId: new ObjectId(decoded.userId)
                });

                if (!record) {
                    return res.status(404).json({ error: '记录不存在' });
                }

                await records.deleteOne({ _id: new ObjectId(recordId) });
                
                // 获取最新的统计数据
                const summary = await calculateSummary(records, decoded.userId);
                
                // 获取最新的记录列表
                const recordsList = await records
                    .find({ userId: new ObjectId(decoded.userId) })
                    .project({
                        type: { $cond: { if: { $eq: ["$t", "i"] }, then: "income", else: "expense" } },
                        amount: "$a",
                        description: "$d",
                        createdAt: "$c"
                    })
                    .sort({ c: -1 })
                    .limit(10)
                    .toArray();

                return res.status(200).json({ 
                    message: '删除成功',
                    summary,
                    records: recordsList
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
        { 
            $match: { 
                userId: new ObjectId(userId) 
            } 
        },
        {
            $group: {
                _id: '$t',  // 使用新的字段名 t
                total: { $sum: '$a' }  // 使用新的字段名 a
            }
        }
    ];

    const results = await records.aggregate(pipeline).toArray();
    
    const summary = {
        totalIncome: 0,
        totalExpense: 0
    };

    results.forEach(result => {
        if (result._id === 'i') {  // 检查新的类型标识
            summary.totalIncome = result.total;
        } else if (result._id === 'e') {
            summary.totalExpense = result.total;
        }
    });

    return summary;
} 