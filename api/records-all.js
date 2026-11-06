const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'accounting';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

let cachedDb = null;
let cachedClient = null;

async function connectToDatabase() {
    if (cachedDb) return { db: cachedDb, client: cachedClient };
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedDb = client.db(DB_NAME);
    cachedClient = client;
    return { db: cachedDb, client };
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

function mapRecord(r) {
    return {
        _id: r._id,
        username: r.username || '未知用户',
        type: r.t === 'i' ? 'income' : 'expense',
        amount: r.a,
        description: r.d || '',
        createdAt: r.c
    };
}

module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: '只允许GET请求' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: '未授权访问' });
    }

    const decoded = verifyToken(authHeader.split(' ')[1]);
    if (!decoded) {
        return res.status(401).json({ error: '无效的token' });
    }

    try {
        const { db } = await connectToDatabase();
        const userFilter = req.query.user;
        const query = userFilter && userFilter !== 'all' ? { username: userFilter } : {};

        const [docs, users] = await Promise.all([
            db.collection('records').find(query).sort({ c: -1 }).toArray(),
            db.collection('users').find({}, { projection: { username: 1 } }).toArray()
        ]);

        const records = docs.map(mapRecord);
        const totalIncome = records.filter((r) => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
        const totalExpense = records.filter((r) => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);

        return res.status(200).json({
            total: records.length,
            records,
            summary: { totalIncome, totalExpense },
            userList: users.map((user) => user.username)
        });
    } catch (error) {
        console.error('全量记录读取失败:', error);
        return res.status(500).json({ error: '服务器错误' });
    }
};
