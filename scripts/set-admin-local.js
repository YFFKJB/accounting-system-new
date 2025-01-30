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

        // 先列出所有用户
        const allUsers = await users.find({}).toArray();
        console.log('所有用户:', allUsers);

        // 查找目标用户
        const user = await users.findOne({ username: 'LYP' });
        console.log('\n目标用户当前状态:', user);

        if (!user) {
            console.error('错误: 未找到用户 LYP');
            return;
        }

        // 直接使用 _id 更新
        const result = await users.updateOne(
            { _id: user._id },
            { 
                $set: { 
                    isAdmin: true,
                    updatedAt: new Date()
                } 
            }
        );

        console.log('\n更新结果:', result);

        // 再次验证
        const updatedUser = await users.findOne({ _id: user._id });
        console.log('\n更新后状态:', updatedUser);

        if (updatedUser && updatedUser.isAdmin === true) {
            console.log('\n✅ 成功设置管理员权限');
        } else {
            console.error('\n❌ 设置失败，请检查数据库权限');
        }

    } catch (error) {
        console.error('设置管理员失败:', error);
    } finally {
        await client.close();
    }
}

// 立即执行
setAdmin().catch(console.error); 