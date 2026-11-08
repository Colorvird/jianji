> 修正版：请先阅读 [修复说明与部署.md](修复说明与部署.md)。新增本地彩色网格识别、缺失时间待确认、固定域名部署；以下原版说明中的识别顺序、HTTP schema 和地址推断以修复说明为准。

# 简集 · 扫码收集与实时汇总

简集是一个**无需注册、发链接或二维码就能收集数据**的小工具，操作方式类似金山文档收集表：

- 创建人打开网页创建表格，获得管理链接、填写二维码和汇总二维码。
- 填写人扫码进入，不注册、不登录；同一个浏览器只能提交一份。
- 创建人把填好的汇总二维码发到微信群或 QQ 群。
- 填写人在汇总表里对**自己的那一行**提交修改申请，创建人审批。
- 审批通过后，填写人修改本人数据，管理端和汇总页立即同步更新。
- 工具不绑定某个组织。谁打开首页，谁都可以创建自己的表格。

当前版本使用 Node.js 内置 SQLite，无第三方 npm 依赖，可直接运行或用 Docker 部署。

## 一、三个链接

每个表格创建后有三条独立链接，令牌完全不同：

| 链接 | 示例 | 谁能拿到 | 用途 |
| --- | --- | --- | --- |
| 管理链接 | `/manage/<adminToken>` | 只有创建人 | 编辑题目、发布汇总、审批修改、导出 CSV |
| 填写链接 | `/f/<fillToken>` | 发到群里的填写二维码 | 匿名填写；只接受一份提交 |
| 汇总链接 | `/r/<resultToken>` | 发到群里的汇总二维码 | 查看全员汇总、申请修改本人数据 |

管理链接就是创建人的凭证，服务端只保存它的 SHA-256 哈希。**链接丢失后无法从服务器反查或找回**，请收藏管理页或单独保存链接。填写令牌和汇总令牌也会出现在二维码中，不要把它们当成账号密码使用。

## 二、完整流程

1. 创建人在首页点击“创建一个表格”。
2. 设置标题、说明、截止时间、目标人数、修改权限和题目。
3. 生成后打开“二维码与链接”，先把填写二维码发到群里。
4. 收集到数据后点击“发布汇总表”，再把汇总二维码发到群里。
5. 填写人打开汇总页，找到自己的行，点击“申请修改”并说明要改什么。
6. 创建人在管理端“修改申请”中通过或拒绝。
7. 通过后，填写人只能修改自己的那一行；保存后汇总表实时刷新。

修改权限有三种：

| 模式 | 填写人的行为 | 服务端规则 |
| --- | --- | --- |
| 只读 | 只能看汇总 | 拒绝所有修改和修改申请 |
| 申请后修改 | 先提交申请 | 创建人通过后开放一次修改，保存后自动失效 |
| 自由修改 | 直接修改本人数据 | 每次保存都校验答卷归属，不能改别人的行 |

## 三、本地运行

要求 **Node.js 24 或更高版本**（使用内置 `node:sqlite`）。

```powershell
cd C:\Users\Administrator\Documents\Codex\2026-11-07\1-3\outputs
node server.js
```

然后打开 <http://localhost:8787>。数据库、上传的课程表图片都在 `data/` 目录：

```text
data/jianji.db           SQLite 数据库
data/uploads/            课程表原图
```

Windows 也可以双击 `start.cmd`。删除整个 `data/` 目录会回到全新状态。

## 四、让外网访问

只有 `http://localhost:8787` 时，其他手机或电脑无法打开。需要把服务映射到公网域名或部署到公网服务器。

### 1. 临时公网演示（适合马上发群里试）

本机保持 `node server.js` 运行，再开一个终端启动隧道。推荐 Cloudflare 临时隧道：

```powershell
cloudflared tunnel --url http://localhost:8787
```

命令会输出一个 `https://xxxx.trycloudflare.com` 地址。把这个地址配置到服务环境变量并重启服务，二维码才会写入正确域名：

```powershell
$env:PUBLIC_BASE_URL='https://xxxx.trycloudflare.com'
node server.js
```

Cloudflare 临时隧道无需账号，但地址是临时的；隧道进程或本机服务停止后，链接立即失效。也可以用免安装 SSH 隧道：

```powershell
ssh -R 80:localhost:8787 nokey@localhost.run
```

### 2. 正式部署到自己的服务器

推荐一台有公网 IP 的 Linux 服务器，绑定域名并配置 HTTPS。环境变量示例：

```bash
export PORT=8787
export HOST=0.0.0.0
export PUBLIC_BASE_URL='https://jianji.example.com'
export JIANJI_DATA_DIR=/opt/jianji/data
export OCR_PROVIDER=ocrspace
export OCR_SPACE_API_KEY='你自己的 OCR.space key'
node server.js
```

`PUBLIC_BASE_URL` 必须写最终外网地址（带 `https://`），否则二维码里可能是局域网 IP 或错误的协议。

#### Nginx 反向代理

```nginx
server {
    listen 443 ssl http2;
    server_name jianji.example.com;

    ssl_certificate     /etc/ssl/jianji.pem;
    ssl_certificate_key /etc/ssl/jianji.key;
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header Connection '';
    }
}
```

`client_max_body_size` 要大于 12 MB；汇总页的实时更新使用 SSE，`proxy_http_version 1.1` 和 `Connection ''` 能避免代理层缓冲。

#### systemd

```ini
[Unit]
Description=Jianji
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/jianji
ExecStart=/usr/bin/node server.js
EnvironmentFile=/opt/jianji/.env
Restart=always
RestartSec=3
User=www-data

[Install]
WantedBy=multi-user.target
```

#### Docker

```bash
PUBLIC_BASE_URL=https://jianji.example.com docker compose up -d --build
```

`docker-compose.yml` 默认把 `./data` 挂载到容器 `/app/data`，重建容器不会丢数据。

## 五、课程表占用识别

### 默认：OCR.space 真实识别

设置 `OCR_PROVIDER=ocrspace`（也是代码默认值）后：

1. 填写人上传 JPG / PNG / WebP / GIF 图片。
2. 服务端把图片发送到 OCR.space，获取文字和坐标，按“星期 × 第几节”判断哪些格子有课。
3. 前端再按格子底色/内容校正，输出“周一 第11–13节”这样的有课节次，不解析课程名、教师和地点。
4. 创建者在建表时设置每节课的起止时间（如第 1 节 08:00–08:45），系统自动把有课节次换算成具体时间段。
5. 识别结果进入可编辑网格，填写人可以点击修正；系统会逐个比对创建者设置的活动时间段，标出“符合”或“有课冲突”。
6. 提交后汇总页和 CSV 只展示有课节次与换算后的时间，并随填写/修改实时更新。

默认 key 是 OCR.space 的公开测试 key `helloworld`，只适合试用，可能限流。正式使用请注册自己的 key：

```bash
export OCR_SPACE_API_KEY='你的 key'
```

注意：使用 `ocrspace` 会把课程表图片发送给第三方 OCR 服务。若图片包含敏感信息，请改用自建 OCR 接口或 `mock`。

### 自己接 OCR：`http` 适配器

```bash
export OCR_PROVIDER=http
export OCR_ENDPOINT='https://your-ocr.example.com/v1/timetable'
export OCR_API_KEY='你的 Bearer Token'
```

简集会发送：

```json
{
  "image_base64": "...",
  "mime_type": "image/png",
  "schema": "timetable-courses-v1"
}
```

期望返回：

```json
{
  "confidence": 0.91,
  "text": "可选，原始识别文字",
  "courses": [
    {
      "name": "高等数学",
      "day": "周一",
      "start": "08:00",
      "end": "09:40",
      "location": "A-101",
      "teacher": "张明",
      "confidence": 0.95
    }
  ]
}
```

### 离线演示：`mock`

```bash
export OCR_PROVIDER=mock
```

`mock` 固定返回 6 门演示课程，接口会标记 `demo: true`，只用来看交互，不会识别真实图片。

### 识别准确率说明

课程表识别不是“百分百自动完成”。手机截图、合并单元格、非标准星期表头、低分辨率图片都会影响准确率。本版保留了**人工校正步骤**：识别失败时可以手动添加课程，识别不准确时可以直接修改字段。正式使用时建议用 30–50 张真实课程表做一轮准确率验收。

## 六、实时更新

管理页和汇总页都通过 SSE（`/events`）接收 `survey-update`、`submission-created`、`submission-edited`、`request-reviewed` 等事件，同时每 5 秒轮询一次兜底。

因此：

- 填写人提交后，管理端汇总表自动出现新行。
- 创建人发布汇总后，已打开的汇总页自动进入发布状态。
- 审批通过后，填写人页面自动出现“修改我的填写”入口。
- 填写人保存修改后，管理端和汇总页自动刷新，无需手动刷新。

## 七、数据模型

完整 DDL 见 `schema.sql`。核心表：

| 表 | 用途 |
| --- | --- |
| `surveys` | 表格、状态、截止时间、修改权限、三种令牌和发布状态 |
| `questions` | 题目、题型、必填、排序 |
| `question_options` | 单选、多选、时间段选项 |
| `submissions` | 答卷；用浏览器本地匿名令牌的哈希识别“本人” |
| `answers` | 每题回答，JSON 文本 |
| `edit_requests` | 修改申请、审批状态、使用时间 |
| `timetable_imports` | 课程表原图、OCR 原始响应、有课节次 |
| `audit_logs` | 创建、修改、审批等操作日志 |

服务端不保存填写人的姓名、手机号作为账号；姓名只是答卷内容。修改权限依赖填写设备浏览器中的随机令牌，换浏览器或清空本地存储后，需要“复制修改回执”链接才能恢复本人身份。

从旧登录版数据库升级时，`src/db.js` 会自动把旧库重命名为 `jianji.db.legacy-时间戳`，不会直接写入旧结构；本版是令牌制新库。

## 八、接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/runtime` | 对外地址、OCR 提供方、是否演示 |
| `POST` | `/api/surveys` | 创建表格，返回三种令牌和链接 |
| `GET` | `/api/surveys/admin/:adminToken` | 管理端数据 |
| `PUT` | `/api/surveys/admin/:adminToken` | 保存设置与题目 |
| `GET` | `/api/surveys/admin/:adminToken/export.csv` | 导出 CSV |
| `GET` | `/api/surveys/admin/:adminToken/qr/fill` | 填写二维码 SVG |
| `GET` | `/api/surveys/admin/:adminToken/qr/result` | 汇总二维码 SVG |
| `GET` | `/api/surveys/admin/:adminToken/events` | 管理端 SSE |
| `POST` | `/api/surveys/admin/:adminToken/edit-requests/:id/approve` | 通过修改申请 |
| `POST` | `/api/surveys/admin/:adminToken/edit-requests/:id/reject` | 拒绝修改申请 |
| `GET` | `/api/surveys/fill/:fillToken` | 获取填写页数据 |
| `POST` | `/api/surveys/fill/:fillToken/submissions` | 提交答卷 |
| `POST` | `/api/surveys/fill/:fillToken/ocr` | 上传并识别课程表 |
| `GET` | `/api/surveys/result/:resultToken` | 获取汇总数据 |
| `GET` | `/api/surveys/result/:resultToken/events` | 汇总页 SSE |
| `POST` | `/api/surveys/result/:resultToken/edit-requests` | 提交修改申请 |
| `PUT` | `/api/submissions/:submissionId` | 修改本人答卷 |
| `GET` | `/api/uploads/:filename?token=...` | 鉴权读取课程表原图 |

前端使用 `X-Respondent-Token` 请求头携带浏览器本地身份；这个身份只在本地生成，不是登录账号。

## 九、环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `8787` | 监听端口 |
| `HOST` | `0.0.0.0` | 监听地址 |
| `PUBLIC_BASE_URL` | 请求 Host | 分享链接和二维码使用的对外地址，正式部署必须设置 |
| `JIANJI_DATA_DIR` | `./data` | 数据库和上传目录 |
| `OCR_PROVIDER` | `ocrspace` | `ocrspace` / `http` / `mock` |
| `OCR_SPACE_API_KEY` | `helloworld` | OCR.space key；正式使用请替换 |
| `OCR_SPACE_ENDPOINT` | OCR.space 官方地址 | 可替换为兼容服务 |
| `OCR_SPACE_LANGUAGE` | `chs` | OCR 语言 |
| `OCR_ENDPOINT` | 空 | `OCR_PROVIDER=http` 时的识别服务地址 |
| `OCR_API_KEY` | 空 | 自建 OCR 服务的 Bearer Token |

可以复制 `.env.example` 为 `.env`，用 Node 24 读取：

```bash
node --env-file=.env server.js
```

## 十、安全与限制

- 管理令牌 192 位随机数，填写/汇总令牌 144 位；数据库只存管理令牌哈希。
- 所有修改接口都在服务端校验答卷归属，不能通过前端参数改别人的行。
- 上传只接受 JPG / PNG / WebP / GIF，校验文件头，单张上限 8 MB；前端会把大图压缩后再送 OCR。
- 响应设置 CSP、`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy` 等安全头。
- 写请求校验 `Origin`，数据库访问使用预编译语句。
- 当前没有账号体系，管理链接就是创建人凭证；请勿把管理链接发到群里。
- 当前“本人”是浏览器本地身份，同一人换设备可以再次填写。需要强身份去重时，需要在现有令牌模型上增加手机号验证或登录。
- 公开创建接口没有验证码和复杂限流。面向公网大规模开放时，建议在反向代理层增加 IP 限流、验证码和文件清理策略。
- OCR.space 免费通道有额度和图片大小限制；正式服务应使用自己的 key 或自建 OCR。

