# 工作室记账系统

一个简单高效的工作室财务管理系统，帮助工作室更好地管理收支记录。

## 功能特点

- 👥 用户管理
  - 账号注册
  - 安全登录
  - JWT 身份验证

- 💰 收支管理
  - 收入记录
  - 支出记录
  - 分类管理
  - 实时统计

- 📊 数据统计
  - 总收入统计
  - 总支出统计
  - 结余计算
  - 记录历史

## 技术栈

- 前端
  - HTML5
  - TailwindCSS
  - 原生 JavaScript
  - Fetch API

- 后端
  - Node.js
  - MongoDB
  - JWT 认证
  - Vercel Serverless

## 快速开始

1. 克隆项目
```bash
git clone https://github.com/YFFKJB/accounting-system-new.git
cd accounting-system-new
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```env
MONGODB_URI=你的MongoDB连接字符串
JWT_SECRET=你的JWT密钥
```

4. 本地运行
```bash
vercel dev
```

## 部署

本项目使用 Vercel 部署，自动集成了 CI/CD 流程：

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 自动部署完成

## API 文档

### 用户相关

#### 注册
- 路径: `/api/register`
- 方法: `POST`
- 参数:
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```

#### 登录
- 路径: `/api/login`
- 方法: `POST`
- 参数:
  ```json
  {
    "username": "用户名",
    "password": "密码"
  }
  ```

### 记账相关

#### 添加记录
- 路径: `/api/records`
- 方法: `POST`
- 需要认证: 是
- 参数:
  ```json
  {
    "type": "income|expense",
    "amount": 100.00,
    "category": "分类",
    "description": "描述"
  }
  ```

#### 获取记录
- 路径: `/api/records`
- 方法: `GET`
- 需要认证: 是
- 返回:
  ```json
  {
    "records": [
      {
        "type": "income",
        "amount": 100.00,
        "category": "工资",
        "description": "1月工资",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalIncome": 1000.00,
      "totalExpense": 500.00
    }
  }
  ```

## 开发计划

- [x] 基础用户系统
- [x] 记账功能
- [ ] 数据导出
- [ ] 图表统计
- [ ] 多人协作
- [ ] 预算管理

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目负责人：[YFFKJB]
- 邮箱：[your-email@example.com]
- 项目地址：[https://github.com/YFFKJB/accounting-system-new]

## 项目简介
这是一个简单易用的在线记账系统，支持多用户管理各自的收支记录。系统采用Web方式实现，使用Vercel Serverless部署。

## 技术架构
- 前端：HTML + CSS + JavaScript
- 后端：Vercel Serverless Functions
- 数据库：MongoDB Atlas
- 部署：Vercel

## 主要功能
1. 用户管理
   - 用户注册和登录
   - 密码加密存储
   - JWT token认证

2. 记账功能
   - 添加收入/支出记录
   - 记录包含：日期、类型、金额、分类、备注
   - 查看历史记录
   - 按月份统计收支情况

## 在线访问
- 项目地址：[待部署后添加]
- 测试账号：[待添加123] 
