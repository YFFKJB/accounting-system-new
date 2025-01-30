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
    
    // 验证管理员权限
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
        const users = db.collection('users');
        const records = db.collection('records');

        // 只在必要字段上建立索引
        await users.createIndex({ username: 1 }, { unique: true });
        await records.createIndex({ userId: 1 });

        if (req.method === 'GET') {
            // 获取用户列表
            const usersList = await users.find({ _id: { $ne: new ObjectId(admin.userId) } }).toArray();
            
            // 获取每个用户的记录数
            const usersWithCounts = await Promise.all(usersList.map(async (user) => {
                const recordCount = await records.countDocuments({ userId: user._id.toString() });
                return { ...user, recordCount };
            }));

            return res.status(200).json({ users: usersWithCounts });

        } else if (req.method === 'DELETE') {
            // 删除用户
            const userId = req.url.split('/').pop();
            
            if (!userId) {
                return res.status(400).json({ error: '缺少用户ID' });
            }

            // 删除用户的所有记录
            await records.deleteMany({ userId });
            
            // 删除用户
            const result = await users.deleteOne({ _id: new ObjectId(userId) });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: '用户不存在' });
            }

            return res.status(200).json({ message: '用户删除成功' });

        } else {
            return res.status(405).json({ error: '不支持的请求方法' });
        }
    } catch (error) {
        console.error('用户管理错误:', error);
        return res.status(500).json({ error: '服务器错误' });
    } finally {
        await client.close();
    }
}; 