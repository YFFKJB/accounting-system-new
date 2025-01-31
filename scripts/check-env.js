const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

function checkEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('错误: 缺少必要的环境变量:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('\n请确保已经正确配置 .env 文件或环境变量');
    process.exit(1);
  }
  
  console.log('✅ 环境变量检查通过');
}

checkEnv(); 