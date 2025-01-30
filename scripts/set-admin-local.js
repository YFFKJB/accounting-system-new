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
        const existingUser = await users.findOne({ username: 'LYP' });
        console.log('当前用户状态:', existingUser);

        if (!existingUser) {
            console.error('错误: 未找到用户 LYP');
            return;
        }

        // 强制更新为管理员
        const result = await users.findOneAndUpdate(
            { username: 'LYP' },
            { 
                $set: { 
                    isAdmin: true,
                    updatedAt: new Date()
                } 
            },
            { 
                returnDocument: 'after',  // 返回更新后的文档
                upsert: false  // 不创建新文档
            }
        );

        console.log('更新操作结果:', result);

        // 再次验证
        const updatedUser = await users.findOne({ username: 'LYP' });
        console.log('更新后的用户状态:', updatedUser);

        if (updatedUser && updatedUser.isAdmin === true) {
            console.log('✅ 成功设置管理员权限');
        } else {
            console.error('❌ 设置失败，请检查数据库权限');
        }

    } catch (error) {
        console.error('设置管理员失败:', error);
    } finally {
        await client.close();
    }
}

// 立即执行
setAdmin().catch(console.error); 