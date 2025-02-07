const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_NAME = 'accounting';

module.exports = async (req, res) => {
    // 设置 CORS 头部
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 只允许 GET 请求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: '方法不允许' });
    }

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
        const db = client.db(DB_NAME);

        // 验证是否是管理员
        const user = await db.collection('users').findOne({
            _id: new ObjectId(decoded.userId)
        });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: '需要管理员权限' });
        }

        // 获取所有数据
        const [records, users, archives] = await Promise.all([
            db.collection('records').find({}).toArray(),
            db.collection('users').find({}, { projection: { password: 0 } }).toArray(),
            db.collection('archives').find({}).toArray()
        ]);

        // 处理数据，转换 ObjectId
        const sanitizeData = (data) => {
            return JSON.parse(JSON.stringify(data, (key, value) => {
                if (value instanceof ObjectId) {
                    return value.toString();
                }
                if (key === 'password') {
                    return undefined; // 排除密码字段
                }
                return value;
            }));
        };

        // 构建导出数据
        const exportData = {
            metadata: {
                version: '1.4.0',
                exportDate: new Date().toISOString(),
                exportedBy: user.username,
                systemName: 'PilotsEYE工作室记账系统'
            },
            data: {
                records: sanitizeData(records),
                users: sanitizeData(users),
                archives: sanitizeData(archives)
            },
            summary: {
                recordCount: records.length,
                userCount: users.length,
                archiveCount: archives.length,
                totalIncome: records.filter(r => r.t === 'i').reduce((sum, r) => sum + r.a, 0),
                totalExpense: records.filter(r => r.t === 'e').reduce((sum, r) => sum + r.a, 0)
            }
        };

        return res.status(200).json(exportData);

    } catch (error) {
        console.error('导出数据失败:', error);
        return res.status(500).json({
            error: '导出失败',
            message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
};
