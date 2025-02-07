# PilotsEYE工作室记账系统

## 版本 1.4.1 (2024-02-07)

### 功能特性
- 用户注册和登录
- 记账功能（收入/支出）
- 实时统计（总收入/总支出/结余）
- 最近记录实时显示
- 管理员功能
- 多用户共同记账
- 用户数据统计
- 记录权限控制
- 用户筛选功能
- 账期管理功能
  - 封存账单
  - 查看历史账期
  - 解除最近封存
  - 账期详情查看

### 最新更新
- 添加账期管理功能，支持封存和查看历史账单
- 添加解除封存功能，可恢复最近一次封存的记录
- 优化管理界面布局和交互体验
- 改进错误处理和提示信息
- 优化界面设计，采用新的 UI 风格
- 改进错误提示，现在在屏幕中央显示
- 优化用户权限控制，非管理员无法删除他人记录
- 优化输入框样式，提升用户体验
- 添加动画效果，提升交互体验
- 改进移动端适配
- 优化数据加载逻辑
- 更新品牌标识为 PilotsEYE
- 添加数据导入导出功能
  - 支持完整系统数据导出
  - 支持数据备份和恢复
  - 导入时自动处理数据关联
  - 保护用户密码等敏感信息
- 优化数据导入流程
  - 添加事务支持
  - 自动转换 ObjectId
  - 备份和回滚机制
  - 导入状态反馈

### 技术栈
- 前端：原生 JavaScript + TailwindCSS + Remix Icons
- 后端：Node.js + MongoDB
- 部署：Vercel

### API 接口
- `/api/register` - 用户注册
- `/api/login` - 用户登录
- `/api/records` - 记录管理
- `/api/admin/*` - 管理员功能
  - `/api/admin/archive` - 封存当前账期
  - `/api/admin/archives` - 获取历史账期
  - `/api/admin/unarchive` - 解除最近封存
  - `/api/admin/users` - 用户管理
  - `/api/admin/check` - 权限验证
  - `/api/admin/export` - 导出系统数据
  - `/api/admin/import` - 导入系统数据

### 数据库结构
- 用户表 (users)
  - _id: ObjectId
  - username: String
  - password: String (加密)
  - isAdmin: Boolean
- 记录表 (records)
  - _id: ObjectId
  - userId: ObjectId
  - username: String
  - t: String ('i'/'e' 代表收入/支出)
  - a: Number (金额)
  - d: String (描述)
  - c: Date (创建时间)
- 封存表 (archives)
  - _id: ObjectId
  - startDate: Date (账期开始时间)
  - endDate: Date (账期结束时间)
  - totalIncome: Number (总收入)
  - totalExpense: Number (总支出)
  - balance: Number (结余)
  - recordCount: Number (记录数量)
  - records: Array (原始记录)
  - createdAt: Date (封存时间)
  - createdBy: ObjectId (操作人ID)

### 版本历史
- v1.4.1 (2024-02-07): 添加数据导入导出功能
- v1.4.0 (2024-02-01): 添加账期管理功能
- v1.3.0 (2024-01-31): 界面优化和用户体验提升
- v1.2.0 (2024-01-31): 添加用户统计和记录权限控制
- v1.1.0 (2024-01-31): 实现实时数据更新
- v1.0.0 (2024-01-31): 初始版本

### 功能说明

#### 记录管理
- 添加收支记录（所有用户）
- 查看最近6条记录
- 按用户筛选记录
- 删除自己的记录（管理员可删除所有记录）
- 优化的输入体验

#### 数据统计
- 总收入/支出/结余实时统计
- 每个用户的收支统计
- 用户筛选功能
- 实时数据更新

#### 账期管理
- 封存当前账期记录
- 查看历史账期详情
- 解除最近一次封存
- 账期数据统计
- 账期记录详情查看

#### 权限控制
- 普通用户只能删除自己的记录
- 管理员可以删除所有记录
- 所有用户可以查看所有记录
- 只有管理员可以管理账期
- 清晰的权限提示

#### 用户体验
- 响应式设计，支持移动端
- 实时数据更新
- 优化的错误提示
- 平滑的动画效果
- 直观的操作界面

#### 数据导入导出功能

##### 数据导出
- 支持导出所有系统数据
- 导出格式为标准 JSON
- 自动过滤敏感信息
- 包含元数据和统计信息
- 导出内容包括:
  - 用户信息(不含密码)
  - 记账记录
  - 封存记录
  - 系统统计数据

##### 数据导入
- 支持完整的数据恢复
- 自动处理数据关联关系
- 保护现有用户密码
- 提供数据验证
- 具有以下特性:
  - 事务处理确保数据一致性
  - 自动备份现有数据
  - 导入失败自动回滚
  - 详细的导入状态反馈

##### 使用说明
1. 数据导出:
   - 进入管理页面
   - 点击"导出数据"按钮
   - 自动下载 JSON 格式的备份文件
   - 文件名格式: pilotseye_backup_YYYY-MM-DD.json

2. 数据导入:
   - 进入管理页面
   - 点击"导入数据"按钮
   - 选择之前导出的 JSON 文件
   - 等待导入完成提示

3. 注意事项:
   - 仅管理员可以进行导入导出操作
   - 导入会保留现有用户的密码信息
   - 建议定期导出备份数据
   - 导入前确认数据文件的完整性

### 已知问题
- 无

### 未来计划
- 添加数据导出功能
- 实现记录编辑功能
- 添加数据可视化图表
- 支持按日期范围筛选
- 添加批量操作功能
- 支持更多统计维度

### 部署说明

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 设置环境变量：
   ```
   MONGODB_URI=你的MongoDB连接地址
   JWT_SECRET=你的JWT密钥
   ```
4. 部署完成

### 本地开发

1. 克隆仓库
2. 安装依赖：`npm install`
3. 复制 `.env.example` 并重命名为 `.env`
4. 填写环境变量
5. 运行开发服务器：`vercel dev`

### 注意事项

- 请确保 MongoDB 数据库已正确配置
- 首次使用需要创建管理员账号
- 定期备份数据库
- 妥善保管 JWT 密钥

### 联系方式

- 项目负责人：[YFFKJB]
- 项目地址：[https://github.com/YFFKJB/accounting-system-new]

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

## 环境变量配置

本项目需要配置以下环境变量：

- `MONGODB_URI`: MongoDB 数据库连接字符串
- `JWT_SECRET`: JWT 令牌加密密钥

### 本地开发配置

1. 复制 `.env.example` 文件并重命名为 `.env`
2. 在 `.env` 文件中填入实际的环境变量值

### 生产环境配置

在 Vercel 部署时，请在 Vercel 项目设置的环境变量页面配置上述变量。
