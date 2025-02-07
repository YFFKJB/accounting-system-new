const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
    try {
        // 验证管理员权限
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '未授权访问' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db('accounting');

        // 验证是否是管理员
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: '需要管理员权限' });
        }

        // 获取所有数据
        const records = await db.collection('records').find({}).toArray();
        const users = await db.collection('users').find({}).toArray();
        const archives = await db.collection('archives').find({}).toArray();

        // 导出数据
        const exportData = {
            metadata: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportedBy: user.username
            },
            data: {
                records,
                users,
                archives
            }
        };

        res.status(200).json(exportData);
    } catch (error) {
        console.error('导出失败:', error);
        res.status(500).json({ error: '导出失败' });
    }
};
