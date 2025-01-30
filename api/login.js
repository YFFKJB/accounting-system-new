const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// MongoDB 连接配置
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'accounting';
const COLLECTION_NAME = 'users';

// JWT 密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 创建 MongoDB 客户端
const client = new MongoClient(MONGODB_URI);

module.exports = async (req, res) => {
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只接受 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只允许POST请求' });
    }

    try {
        // 验证请求数据
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }

        // 连接数据库
        await client.connect();
        const db = client.db(DB_NAME);
        const users = db.collection(COLLECTION_NAME);

        // 查找用户
        const user = await users.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 验证密码
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }

        // 生成 JWT token
        const token = jwt.sign({
            userId: user._id,
            username: user.username
        }, JWT_SECRET, {
            expiresIn: '7d'
        });

        // 返回成功响应
        res.status(200).json({
            message: '登录成功',
            token,
            user: {
                username: user.username
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ error: '服务器错误' });
    } finally {
        await client.close();
    }
};
