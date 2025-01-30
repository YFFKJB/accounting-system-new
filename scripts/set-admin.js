const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'accounting';
const USERNAME = process.argv[2]; // 通过命令行参数传入用户名

async function setAdmin() {
    if (!USERNAME) {
        console.error('请提供用户名，例如: node set-admin.js username');
        process.exit(1);
    }

    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const users = db.collection('users');

        const result = await users.updateOne(
            { username: USERNAME },
            { $set: { isAdmin: true } }
        );

        if (result.matchedCount === 0) {
            console.error('未找到用户:', USERNAME);
        } else if (result.modifiedCount === 0) {
            console.log('用户已经是管理员');
        } else {
            console.log('成功设置管理员权限');
        }
    } catch (error) {
        console.error('设置管理员失败:', error);
    } finally {
        await client.close();
    }
}

setAdmin(); 