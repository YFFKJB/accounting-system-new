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

// API 处理函数
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

        // 检查用户名是否已存在
        const existingUser = await users.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: '用户名已存在' });
        }

        // 加密密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 创建新用户
        const newUser = {
            username,
            password: hashedPassword,
            createdAt: new Date(),
            isAdmin: false
        };

        // 保存到数据库
        const result = await users.insertOne(newUser);

        // 生成 JWT token
        const token = jwt.sign({
            userId: result.insertedId,
            username: username
        }, JWT_SECRET, {
            expiresIn: '7d'
        });

        // 返回成功响应
        res.status(200).json({
            message: '注册成功',
            token,
            user: {
                username: username
            }
        });

    } catch (error) {
        console.error('注册错误:', error);
        console.error('请求体:', req.body);
        console.error('MongoDB URI:', MONGODB_URI ? '已设置' : '未设置');
        res.status(500).json({ 
            error: '服务器错误',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        await client.close();
    }
}; 
