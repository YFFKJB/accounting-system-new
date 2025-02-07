const { MongoClient, ObjectId } = require('mongodb');
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

        const importData = req.body;

        // 验证导入数据的格式
        if (!importData.metadata || !importData.data) {
            return res.status(400).json({ error: '无效的导入数据格式' });
        }

        // 备份现有数据
        const backupData = {
            records: await db.collection('records').find({}).toArray(),
            users: await db.collection('users').find({}).toArray(),
            archives: await db.collection('archives').find({}).toArray()
        };

        try {
            // 清空现有数据
            await db.collection('records').deleteMany({});
            await db.collection('archives').deleteMany({});

            // 导入新数据
            if (importData.data.records.length > 0) {
                await db.collection('records').insertMany(importData.data.records);
            }
            if (importData.data.archives.length > 0) {
                await db.collection('archives').insertMany(importData.data.archives);
            }

            res.status(200).json({ message: '导入成功' });
        } catch (error) {
            // 如果导入失败，恢复备份数据
            await db.collection('records').deleteMany({});
            await db.collection('archives').deleteMany({});
            
            if (backupData.records.length > 0) {
                await db.collection('records').insertMany(backupData.records);
            }
            if (backupData.archives.length > 0) {
                await db.collection('archives').insertMany(backupData.archives);
            }

            throw error;
        }
    } catch (error) {
        console.error('导入失败:', error);
        res.status(500).json({ error: '导入失败' });
    }
};
