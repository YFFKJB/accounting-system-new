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

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    
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

            // 获取用户信息
            const users = db.collection('users');
            const user = await users.findOne({ _id: new ObjectId(decoded.userId) });
            
            if (!user) {
                return res.status(404).json({ error: '用户不存在' });
            }

            const record = {
                userId: new ObjectId(decoded.userId),
                username: user.username,
                t: type === 'income' ? 'i' : 'e',
                a: parseFloat(amount),
                d: description,
                c: new Date()
            };

            await records.insertOne(record);
            
            // 获取最近6条记录用于显示
            const recentRecords = await records
                .find({})
                .sort({ c: -1 })
                .limit(6)
                .toArray();

            // 获取所有记录用于统计
            const allRecords = await records
                .find({})
                .toArray();

            // 使用所有记录计算用户统计
            const userStats = await calculateUserStats(allRecords);

            // 使用所有记录计算总收支
            const totalIncome = allRecords
                .filter(r => r.t === 'i')
                .reduce((sum, r) => sum + r.a, 0);
            
            const totalExpense = allRecords
                .filter(r => r.t === 'e')
                .reduce((sum, r) => sum + r.a, 0);

            return res.status(200).json({
                message: '添加成功',
                records: recentRecords.map(r => ({
                    _id: r._id,
                    username: r.username || '未知用户',
                    type: r.t === 'i' ? 'income' : 'expense',
                    amount: r.a,
                    description: r.d,
                    createdAt: r.c
                })),
                summary: { totalIncome, totalExpense },
                userStats
            });

        } else if (req.method === 'GET') {
            const userFilter = req.query.user;  // 获取用户筛选参数
            
            // 构建查询条件
            const query = userFilter && userFilter !== 'all' 
                ? { username: userFilter }
                : {};

            // 获取记录
            const recentRecords = await records
                .find(query)
                .sort({ c: -1 })
                .limit(6)
                .toArray();

            // 获取所有记录用于统计
            const allRecords = await records
                .find({})
                .toArray();

            // 使用所有记录计算用户统计
            const userStats = await calculateUserStats(allRecords);

            // 使用所有记录计算总收支
            const totalIncome = allRecords
                .filter(r => r.t === 'i')
                .reduce((sum, r) => sum + r.a, 0);
            
            const totalExpense = allRecords
                .filter(r => r.t === 'e')
                .reduce((sum, r) => sum + r.a, 0);

            return res.status(200).json({
                records: recentRecords.map(r => ({
                    _id: r._id,
                    username: r.username || '未知用户',
                    type: r.t === 'i' ? 'income' : 'expense',
                    amount: r.a,
                    description: r.d,
                    createdAt: r.c
                })),
                summary: { totalIncome, totalExpense },
                userStats
            });

        } else if (req.method === 'DELETE') {
            const recordId = req.url.split('/').pop();
            if (!recordId) {
                return res.status(400).json({ error: '缺少记录ID' });
            }

            try {
                const record = await records.findOne({
                    _id: new ObjectId(recordId)
                });

                if (!record) {
                    return res.status(404).json({ error: '记录不存在' });
                }

                // 检查权限：只有管理员或记录创建者可以删除
                const users = db.collection('users');
                const user = await users.findOne({ _id: new ObjectId(decoded.userId) });
                const isAdmin = user.isAdmin === true;

                if (!isAdmin && record.userId.toString() !== decoded.userId) {
                    return res.status(403).json({ error: '没有权限删除此记录' });
                }

                await records.deleteOne({ _id: new ObjectId(recordId) });
                
                // 获取最新数据
                const allRecords = await records
                    .find({})
                    .toArray();

                const recentRecords = await records
                    .find({})
                    .sort({ c: -1 })
                    .limit(6)
                    .toArray();

                const userStats = await calculateUserStats(allRecords);

                const totalIncome = allRecords
                    .filter(r => r.t === 'i')
                    .reduce((sum, r) => sum + r.a, 0);
                
                const totalExpense = allRecords
                    .filter(r => r.t === 'e')
                    .reduce((sum, r) => sum + r.a, 0);

                return res.status(200).json({
                    message: '删除成功',
                    records: recentRecords.map(r => ({
                        _id: r._id,
                        username: r.username || '未知用户',
                        type: r.t === 'i' ? 'income' : 'expense',
                        amount: r.a,
                        description: r.d,
                        createdAt: r.c
                    })),
                    summary: { totalIncome, totalExpense },
                    userStats
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

// 修改用户统计计算函数
async function calculateUserStats(records) {
    const userStats = {};
    
    records.forEach(record => {
        const username = record.username || '未知用户';
        if (!userStats[username]) {
            userStats[username] = {
                username: username,
                totalIncome: 0,
                totalExpense: 0
            };
        }
        
        if (record.t === 'i') {
            userStats[username].totalIncome += record.a;
        } else {
            userStats[username].totalExpense += record.a;
        }
    });
    
    return Object.values(userStats);
} 