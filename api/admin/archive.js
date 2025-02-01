const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'accounting';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 验证管理员权限
async function verifyAdmin(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const user = await db.collection('users').findOne({
            _id: new ObjectId(decoded.userId),
            isAdmin: true
        });
        
        await client.close();
        return user ? decoded : null;
    } catch (error) {
        return null;
    }
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '方法不允许' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权访问' });
    }

    const token = authHeader.split(' ')[1];
    const admin = await verifyAdmin(token);
    if (!admin) {
        return res.status(403).json({ error: '需要管理员权限' });
    }

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const records = db.collection('records');
        const archives = db.collection('archives');

        // 获取所有当前记录
        const currentRecords = await records.find({}).toArray();

        if (currentRecords.length === 0) {
            return res.status(400).json({ error: '没有可封存的记录' });
        }

        // 计算统计数据
        const totalIncome = currentRecords
            .filter(r => r.t === 'i')
            .reduce((sum, r) => sum + r.a, 0);
        
        const totalExpense = currentRecords
            .filter(r => r.t === 'e')
            .reduce((sum, r) => sum + r.a, 0);

        // 创建封存记录
        const archive = {
            startDate: new Date(Math.min(...currentRecords.map(r => new Date(r.c)))),
            endDate: new Date(Math.max(...currentRecords.map(r => new Date(r.c)))),
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            recordCount: currentRecords.length,
            records: currentRecords,
            createdAt: new Date(),
            createdBy: admin.userId
        };

        // 保存封存记录
        await archives.insertOne(archive);

        // 清空当前记录
        await records.deleteMany({});

        // 获取所有封存记录用于返回
        const allArchives = await archives.find({})
            .sort({ createdAt: -1 })
            .toArray();

        return res.status(200).json({
            message: '封账成功',
            archives: allArchives
        });

    } catch (error) {
        console.error('封账错误:', error);
        return res.status(500).json({ error: '服务器错误' });
    } finally {
        await client.close();
    }
}; 