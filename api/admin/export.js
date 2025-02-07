const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res) => {
    let client;
    try {
        // 验证管理员权限
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '未授权访问' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db('accounting');

        // 验证是否是管理员
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: '需要管理员权限' });
        }

        // 分批获取数据
        const records = await db.collection('records')
            .find({})
            .project({ password: 0 }) // 排除敏感信息
            .limit(1000) // 限制记录数
            .toArray();

        const users = await db.collection('users')
            .find({})
            .project({ password: 0 }) // 排除密码字段
            .toArray();

        const archives = await db.collection('archives')
            .find({})
            .limit(100) // 限制归档记录数
            .toArray();

        // 处理数据，移除敏感信息和MongoDB特定字段
        const sanitizeData = (data) => {
            return JSON.parse(JSON.stringify(data, (key, value) => {
                if (key === '_id') {
                    return value.toString();
                }
                if (key === 'userId') {
                    return value.toString();
                }
                return value;
            }));
        };

        // 导出数据
        const exportData = {
            metadata: {
                version: '1.0',
                exportDate: new Date().toISOString(),
                exportedBy: user.username,
                systemName: 'PilotsEYE工作室记账系统'
            },
            data: {
                records: sanitizeData(records),
                users: sanitizeData(users),
                archives: sanitizeData(archives)
            }
        };

        return res.status(200).json(exportData);
    } catch (error) {
        console.error('导出失败:', error);
        return res.status(500).json({ 
            error: '导出失败',
            message: error.message 
        });
    } finally {
        if (client) {
            await client.close().catch(console.error);
        }
    }
};
