# PostgreSQL 数据库配置说明

## 项目已配置完成

您的 Match-CV 项目现在已经配置好了本地 PostgreSQL 数据库。

### 当前配置

- **数据库类型**: PostgreSQL 15
- **数据库名**: match_cv
- **用户名**: admin
- **密码**: password
- **端口**: 5432
- **连接URL**: postgresql://admin:password@localhost:5432/match_cv

### 启动和停止数据库

#### 启动数据库
```bash
docker-compose up -d
```

#### 停止数据库
```bash
docker-compose down
```

#### 查看数据库状态
```bash
docker-compose ps
```

### 数据库操作

#### 运行数据库迁移
```bash
DATABASE_URL=postgresql://admin:password@localhost:5432/match_cv npm run db:migrate
```

#### 生成新的迁移文件
```bash
DATABASE_URL=postgresql://admin:password@localhost:5432/match_cv npm run db:generate
```

#### 打开 Drizzle Studio（数据库管理界面）
```bash
DATABASE_URL=postgresql://admin:password@localhost:5432/match_cv npm run db:studio
```

#### 推送 schema 到数据库
```bash
DATABASE_URL=postgresql://admin:password@localhost:5432/match_cv npm run db:push
```

### 数据库连接

您的 `.env.local` 文件已经更新，包含以下配置：
```
DATABASE_URL=postgresql://admin:password@localhost:5432/match_cv
```

### 启动开发服务器

现在您可以启动开发服务器：
```bash
npm run dev
```

### 数据持久化

数据库数据存储在 Docker volume `postgres_data` 中，即使重启容器数据也不会丢失。

### 故障排除

1. **端口冲突**: 如果 5432 端口被占用，请修改 `docker-compose.yml` 中的端口映射
2. **连接失败**: 确保 Docker 容器正在运行
3. **权限问题**: 确保 Docker 有足够的权限访问数据卷

### 生产环境

在生产环境中，建议：
- 使用更强的密码
- 配置 SSL 连接
- 设置适当的数据库权限
- 定期备份数据库

---

✅ **数据库配置完成！** 您现在可以开始使用 Match-CV 项目了。
```bash
npm run db:generate
```

### 2. 运行迁移
```bash
npm run db:migrate
```

### 3. 推送schema到数据库（开发时使用）
```bash
npm run db:push
```

### 4. 打开Drizzle Studio（数据库管理界面）
```bash
npm run db:studio
```

## 常用命令

- 启动开发服务器：`npm run dev`
- 查看数据库状态：`docker-compose ps`
- 查看数据库日志：`docker-compose logs postgres`
- 重启数据库：`docker-compose restart postgres`

## 数据库连接信息

- **主机**: localhost
- **端口**: 5432
- **数据库名**: match_cv
- **用户名**: admin
- **密码**: password

## 故障排除

1. **端口冲突**：如果5432端口被占用，修改`docker-compose.yml`中的端口映射
2. **权限问题**：确保Docker有足够的权限访问数据卷
3. **连接失败**：检查数据库是否正在运行：`docker-compose ps`
