const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://1261546255:2EIDqdkjvGH3EN6d@cluster0.7k654.mongodb.net/accounting?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'accounting';

async function checkAdmin() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('数据库连接成功');
        
        const db = client.db(DB_NAME);
        const users = db.collection('users');

        // 查找所有用户
        const allUsers = await users.find({}).toArray();
        console.log('所有用户:', allUsers);

        // 查找特定用户
        const user = await users.findOne({ username: 'LYP' });
        console.log('\n目标用户信息:', user);

        if (user && user.isAdmin === true) {
            console.log('\n✅ 用户已是管理员');
        } else {
            console.log('\n❌ 用户不是管理员');
        }

    } catch (error) {
        console.error('查询失败:', error);
    } finally {
        await client.close();
    }
}

// 立即执行
checkAdmin().catch(console.error); 