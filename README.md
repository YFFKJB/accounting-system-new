# 工作室记账系统

一个简单的工作室记账系统，支持多用户管理、收支记录和数据统计。

## 功能特点

- 用户管理
  - 用户注册/登录
  - 管理员权限控制
  - 用户删除功能
- 记账功能
  - 收入/支出记录
  - 金额统计
  - 实时更新
- 数据管理
  - 记录删除
  - 数据统计
  - 历史记录查看

## 技术栈

- 前端：HTML + TailwindCSS + JavaScript
- 后端：Node.js + MongoDB + JWT
- 部署：Vercel Serverless + MongoDB Atlas

## 目录结构

```
├── api/                # API 接口
│   ├── admin/         # 管理员接口
│   │   ├── check.js   # 权限检查
│   │   └── users.js   # 用户管理
│   ├── login.js       # 登录接口
│   ├── records.js     # 记录管理
│   └── register.js    # 注册接口
├── public/            # 静态文件
│   ├── admin.html     # 管理员页面
│   ├── dashboard.html # 主面板
│   ├── index.html     # 登录页面
│   └── register.html  # 注册页面
├── .env              # 环境变量
├── vercel.json       # Vercel 配置
└── README.md         # 项目说明
```

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
        "description": "工资",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "summary": {
      "totalIncome": 1000.00,
      "totalExpense": 500.00
    }
  }
  ```

### 管理员相关

#### 获取用户列表
- 路径: `/api/admin/users`
- 方法: `GET`
- 需要认证: 是（管理员）

#### 删除用户
- 路径: `/api/admin/users/:userId`
- 方法: `DELETE`
- 需要认证: 是（管理员）

## 部署说明

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 设置环境变量：
   ```
   MONGODB_URI=你的MongoDB连接地址
   JWT_SECRET=你的JWT密钥
   ```
4. 部署完成

## 注意事项

- 管理员可以管理所有用户
- 普通用户只能管理自己的记录
- 删除用户会同时删除该用户的所有记录

## 联系方式

- 项目负责人：[YFFKJB]
- 项目地址：[https://github.com/YFFKJB/accounting-system-new]
