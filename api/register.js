const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB 连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://1261546255:2EIDqdkjvGH3EN6d@cluster0.7k654.mongodb.net/accounting?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'accounting';
const COLLECTION_NAME = 'users';

// 创建一个新的 MongoClient 实例
const client = new MongoClient(MONGODB_URI);

// API 处理函数
module.exports = async (req, res) => {
    // 设置 CORS 和响应头
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
        return res.status(405).json({ error: 'Method not allowed' });
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

        // 创建新用户
        const hashedPassword = await bcrypt.hash(password, 10);
        await users.insertOne({
            username,
            password: hashedPassword,
            createdAt: new Date()
        });

        // 返回成功响应
        res.status(201).json({ message: '注册成功' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: '服务器错误' });
    } finally {
        await client.close();
    }
}; 
