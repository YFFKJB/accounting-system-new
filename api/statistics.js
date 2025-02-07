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

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let client;
    try {
        // 验证用户权限
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: '未授权访问' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);

        // 获取时间范围
        const period = req.query.period || 'all';
        let startDate = new Date(0);
        if (period === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
        }

        // 获取用户记录
        const records = await db.collection('records')
            .find({
                userId: new ObjectId(decoded.userId),
                c: { $gte: startDate }
            })
            .toArray();

        // 计算总收支
        const totalIncome = records
            .filter(r => r.t === 'i')
            .reduce((sum, r) => sum + r.a, 0);
        
        const totalExpense = records
            .filter(r => r.t === 'e')
            .reduce((sum, r) => sum + r.a, 0);

        // 计算趋势数据
        const trend = [];
        const dateMap = new Map();
        records.forEach(record => {
            const date = new Date(record.c).toLocaleDateString();
            if (!dateMap.has(date)) {
                dateMap.set(date, { income: 0, expense: 0 });
            }
            if (record.t === 'i') {
                dateMap.get(date).income += record.a;
            } else {
                dateMap.get(date).expense += record.a;
            }
        });

        Array.from(dateMap.entries()).forEach(([date, data]) => {
            trend.push({
                date,
                income: data.income,
                expense: data.expense
            });
        });

        // 按日期排序
        trend.sort((a, b) => new Date(a.date) - new Date(b.date));

        // 计算月度统计
        const monthlyStats = new Map();
        records.forEach(record => {
            const month = new Date(record.c).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
            if (!monthlyStats.has(month)) {
                monthlyStats.set(month, { income: 0, expense: 0 });
            }
            if (record.t === 'i') {
                monthlyStats.get(month).income += record.a;
            } else {
                monthlyStats.get(month).expense += record.a;
            }
        });

        const monthlyData = Array.from(monthlyStats.entries()).map(([month, data]) => ({
            month,
            ...data
        }));

        return res.status(200).json({
            totalIncome,
            totalExpense,
            trend,
            monthlyData
        });

    } catch (error) {
        console.error('获取统计数据失败:', error);
        return res.status(500).json({
            error: '获取统计数据失败',
            message: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
}; 