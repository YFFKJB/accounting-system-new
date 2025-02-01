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

        // 获取最新的封存记录
        const latestArchive = await archives
            .find({})
            .sort({ createdAt: -1 })
            .limit(1)
            .toArray();

        if (latestArchive.length === 0) {
            return res.status(400).json({ error: '没有可解除的封存记录' });
        }

        // 将封存的记录恢复到当前记录中
        await records.insertMany(latestArchive[0].records);

        // 删除这条封存记录
        await archives.deleteOne({ _id: latestArchive[0]._id });

        // 获取更新后的封存记录列表
        const allArchives = await archives
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return res.status(200).json({
            message: '解除封存成功',
            archives: allArchives
        });

    } catch (error) {
        console.error('解除封存错误:', error);
        return res.status(500).json({ error: '服务器错误' });
    } finally {
        await client.close();
    }
}; 