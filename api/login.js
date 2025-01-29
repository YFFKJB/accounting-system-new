const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: '只允许POST请求' });
    }

    const { username, password } = req.body;

    try {
        const client = await MongoClient.connect(uri);
        const db = client.db('accounting');
        const user = await db.collection('users').findOne({ username });

        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
}
