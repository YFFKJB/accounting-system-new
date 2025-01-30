const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://1261546255:2EIDqdkjvGH3EN6d@cluster0.7k654.mongodb.net/accounting?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'accounting';

async function setAdmin() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('数据库连接成功');
        
        const db = client.db(DB_NAME);
        const users = db.collection('users');

        // 先查找用户
        const user = await users.findOne({ username: 'LYP' });
        console.log('找到用户:', user);

        if (!user) {
            console.error('未找到用户: LYP');
            return;
        }

        const result = await users.updateOne(
            { _id: user._id },  // 使用 _id 更准确
            { 
                $set: { 
                    isAdmin: true,
                    updatedAt: new Date()
                } 
            }
        );

        if (result.modifiedCount === 0) {
            console.log('用户已经是管理员');
        } else {
            console.log('成功设置管理员权限');
        }

        // 验证更新
        const updatedUser = await users.findOne({ _id: user._id });
        console.log('更新后的用户信息:', updatedUser);

    } catch (error) {
        console.error('设置管理员失败:', error);
    } finally {
        await client.close();
    }
}

setAdmin(); 