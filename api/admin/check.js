const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'accounting';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async (req, res) => {
    console.log('开始验证管理员权限');
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('未提供token');
        return res.status(401).json({ error: '未授权访问' });
    }

    let client;
    try {
        const token = authHeader.split(' ')[1];
        console.log('收到的token:', token);
        
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('解析的token:', decoded);

        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('数据库连接成功');
        
        const db = client.db(DB_NAME);
        const users = db.collection('users');

        // 先列出所有用户
        const allUsers = await users.find({}).toArray();
        console.log('数据库中的所有用户:', allUsers);

        // 查找当前用户
        const user = await users.findOne({
            _id: new ObjectId(decoded.userId)
        });

        console.log('当前用户信息:', user);

        if (!user) {
            console.log('未找到用户');
            return res.status(404).json({ error: '用户不存在' });
        }

        if (!user.isAdmin) {
            console.log('用户不是管理员，isAdmin:', user.isAdmin);
            return res.status(403).json({ error: '需要管理员权限' });
        }

        console.log('验证管理员成功');
        return res.status(200).json({ 
            message: '验证成功',
            user: {
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('验证管理员权限失败:', error);
        return res.status(500).json({ 
            error: '服务器错误', 
            details: error.message,
            stack: error.stack
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
}; 