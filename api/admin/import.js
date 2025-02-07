const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const DB_NAME = 'accounting';

module.exports = async (req, res) => {
    // 设置 CORS 头部
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
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
            // 开始导入流程
            const session = client.startSession();
            await session.withTransaction(async () => {
                // 清空现有数据
                await db.collection('records').deleteMany({});
                await db.collection('archives').deleteMany({});

                // 转换数据中的字符串ID为ObjectId
                const processedRecords = importData.data.records.map(record => ({
                    ...record,
                    _id: new ObjectId(record._id),
                    userId: new ObjectId(record.userId)
                }));

                const processedUsers = importData.data.users.map(user => ({
                    ...user,
                    _id: new ObjectId(user._id)
                }));

                const processedArchives = importData.data.archives.map(archive => ({
                    ...archive,
                    _id: new ObjectId(archive._id),
                    createdBy: new ObjectId(archive.createdBy)
                }));

                // 导入数据
                if (processedRecords.length > 0) {
                    await db.collection('records').insertMany(processedRecords);
                }
                if (processedArchives.length > 0) {
                    await db.collection('archives').insertMany(processedArchives);
                }

                // 更新现有用户而不是替换
                for (const newUser of processedUsers) {
                    await db.collection('users').updateOne(
                        { _id: newUser._id },
                        { $set: { 
                            username: newUser.username,
                            isAdmin: newUser.isAdmin,
                            createdAt: newUser.createdAt
                        }},
                        { upsert: true }
                    );
                }
            });

            return res.status(200).json({ 
                message: '导入成功',
                summary: {
                    recordCount: importData.data.records.length,
                    userCount: importData.data.users.length,
                    archiveCount: importData.data.archives.length
                }
            });

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
        return res.status(500).json({ 
            error: '导入失败',
            message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
};
