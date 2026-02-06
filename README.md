# gyl-kuaidi

## 本地运行

### 环境要求
- Node.js 18+
- PostgreSQL 13+

### 后端（NestJS + Drizzle）
1. 进入后端目录并安装依赖：
   ```bash
   cd backend
   npm install
   ```
2. 准备数据库连接：
   - 复制环境变量示例：`cp .env.example .env`
   - 修改 `DATABASE_URL` 为本地 PostgreSQL 地址
   - 创建数据库（示例）：
     ```bash
     createdb reconciliation
     ```
3. 初始化数据库表结构并写入 Mock 数据：
   ```bash
   npm run db:init
   npm run seed
   ```
4. 启动后端服务：
   ```bash
   npm run start:dev
   ```

默认 API 地址：`http://localhost:3000/api`

### 前端（React 19 + Vite）
1. 进入前端目录并安装依赖：
   ```bash
   cd frontend
   npm install
   ```
2. 配置后端地址（可选）：
   - 复制环境变量示例：`cp .env.example .env`
   - 修改 `VITE_BACKEND_URL`（默认指向 `http://localhost:3000`）
3. 启动前端开发服务器：
   ```bash
   npm run dev
   ```

默认访问地址：`http://localhost:5173`