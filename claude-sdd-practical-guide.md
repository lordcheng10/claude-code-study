# Claude Code + SDD 实操落地教程

> 将 Specification-Driven Development（规格驱动开发）融入任意项目的完整工作流

---

## 一、什么是 SDD？

SDD（Spec-Driven Development）是一种**规格驱动开发**方法论，核心思想是：

**在写代码之前，先用结构化的 artifact（制品）把需求、设计、规格、任务全部定义清楚，然后让 AI 按照这些规格来生成和验证代码。**

传统开发流程：`需求 → 口头沟通 → 写代码 → 补文档`
SDD 开发流程：`需求 → Proposal → Design + Specs → Tasks → 代码 → 归档基线`

核心价值：
- **需求可追溯**：每个变更都有完整的 proposal → specs → tasks 链路
- **AI 辅助生成**：Claude Code 根据上下文自动生成各阶段 artifact
- **增量基线管理**：specs 归档后成为下次迭代的基线参考
- **任务粒度可控**：每个 task 控制在 30 分钟以内，验收标准明确

---

## 二、落地前的准备工作

### 2.1 安装工具链

```bash
# 1. 安装 Claude Code（如未安装）
npm install -g @anthropic-ai/claude-code

# 2. 初始化 OpenSpec（在项目根目录执行）
npx openspec init
```

### 2.2 理解初始化后的目录结构

```
your-project/
├── openspec/                    # OpenSpec 工作目录
│   ├── config.yaml              # 项目配置（schema、context、rules）
│   ├── changes/                 # 活跃变更目录
│   │   └── archive/             # 已归档变更
│   └── specs/                   # 基线规格（归档时同步）
├── CLAUDE.md                    # Claude Code 项目级指令（关键！）
└── .claude/
    ├── CLAUDE.md                # 可选的额外指令
    └── rules/                   # 规则文件目录
        └── *.md                 # 各种规则
```

### 2.3 配置 config.yaml（按你的项目定制）

```yaml
schema: spec-driven

context: |
  语言要求：所有 artifact 必须使用中文撰写。
  项目：<你的项目名>
  技术栈：<你的技术栈，如 React + TypeScript + Node.js>
  架构：<你的架构模式，如 组件 → Hooks → API → 后端>

rules:
  proposal:
    - 使用中文撰写
    - "Why" 部分必须说明业务背景和动机
  design:
    - 使用中文撰写
    - 必须说明分层归属
  specs:
    - 使用中文撰写
    - 接口规格必须包含：URL、Method、请求体、响应体
  tasks:
    - 使用中文撰写
    - 每个任务必须有明确的验收标准
    - 任务粒度控制在 30 分钟以内
```

> `context` 和 `rules` 是给 AI 的约束，不会出现在生成的文件中。你需要根据自己的项目实际情况定制。

### 2.4 配置 CLAUDE.md（项目级指令）

Claude Code 读取指令的优先级顺序（从 claude-code-sourcemap 源码中的 `claudemd.ts` 得出）：

```
1. /etc/claude-code/CLAUDE.md      — 全局托管指令（所有用户）
2. ~/.claude/CLAUDE.md              — 用户级私有指令（所有项目）
3. 项目根/CLAUDE.md                 — 项目级指令（提交到仓库）
   项目根/.claude/CLAUDE.md         — 项目级指令（提交到仓库）
   项目根/.claude/rules/*.md        — 项目规则文件
4. 项目根/CLAUDE.local.md           — 本地私有指令（不提交）
```

越靠后的文件优先级越高。建议在 `CLAUDE.md` 中写入：

```markdown
# 项目说明
- 这是 XXX 项目，使用 XXX 技术栈
- 架构模式：XXX

# 开发规范
- 代码风格：遵循 ESLint / Prettier 配置
- 提交规范：conventional commits
- 分支策略：feature/* → develop → main

# SDD 工作流
- 本项目使用 OpenSpec 进行规格驱动开发
- 所有功能变更必须通过 /opsx:propose 发起
- 使用 /opsx:apply 实现，/opsx:archive 归档
```

---

## 三、核心概念：Artifact 依赖关系

SDD 中的四个核心制品（artifact）有严格的依赖关系：

```
proposal (ready)              ← 第一个创建，无依赖
    ↓ unlocks
design (blocked → ready)      specs (blocked → ready)    ← 依赖 proposal，可并行
    ↓                            ↓
    └──────── tasks (blocked → ready) ────────┘           ← 依赖 design + specs
```

| Artifact | 内容 | 关键要素 |
|----------|------|----------|
| **Proposal** | 变更提案 | Why（动机）、What Changes（范围）、Capabilities（能力点）、Impact（影响） |
| **Design** | 技术设计 | 分层归属、架构决策、备选方案对比 |
| **Specs** | 详细规格 | Requirements（SHALL/MUST）、Scenarios（WHEN/THEN）、可直接转测试用例 |
| **Tasks** | 实施任务 | 30分钟粒度、checkbox 格式、按依赖顺序排列 |

---

## 四、标准工作流（三步走）

### 4.1 工作流总览

```
explore（可选）→ propose → apply → archive
                    ↑                  │
                    └──────────────────┘   （下一轮迭代）
```

| 阶段 | Claude Code 命令 | 做什么 |
|------|-----------------|--------|
| 探索（可选） | `/opsx:explore` | 调研代码现状，适合对代码库不熟悉时使用 |
| 提案 | `/opsx:propose` | 描述需求 → Claude 自动生成全套 artifact |
| 实现 | `/opsx:apply` | Claude 逐个执行 task，自动写代码 |
| 归档 | `/opsx:archive` | 归档变更，specs 同步为基线 |

### 4.2 对应的 OpenSpec CLI 命令

| 操作 | 命令 |
|------|------|
| 初始化项目 | `npx openspec init` |
| 新建变更 | `npx openspec new change "<名称>"` |
| 查看依赖状态 | `npx openspec status "<名称>"` |
| 查看 artifact 详情 | `npx openspec show "<名称>" --json` |
| 归档变更 | `npx openspec archive "<名称>"` |

---

## 五、实操流程详解（以任意项目为例）

### Phase 1: 基线梳理（首次使用 SDD 时必做）

**目标**：让 Claude 理解项目现状，生成基线文档。

```
你：/opsx:propose
Claude：What change do you want to work on?
你：梳理当前项目 XXX 模块的基线能力，包括已有的 API、组件、数据模型
```

Claude 会自动：
1. 创建变更目录 `openspec/changes/baseline-xxx/`
2. 启动后台 Agent 并行探索代码（前端、后端、数据层）
3. 按依赖顺序生成 proposal → design → specs → tasks
4. 输出完成摘要

完成后执行 `/opsx:archive` 归档为基线，后续迭代可引用。

> 基线梳理不涉及代码修改，只产出文档。这一步非常重要，它让 AI 有了项目的"全景地图"。

### Phase 2: 小功能开发（~30分钟）

**示例**：新增一个删除按钮

```
你：/opsx:propose 在 XXX 页面的操作列中新增删除按钮，使用逻辑删除
```

Claude 会自动调研代码，发现：
- 后端删除 API 已存在
- 前端 API 封装已就绪
- 只缺前端按钮

然后生成全套 artifact，并告知改动范围。

```
你：/opsx:apply
```

Claude 逐个执行 task：
```
Working on task 1/4: 添加组件导入
Task 1 complete.
Working on task 2/4: 添加 API 导入
Task 2 complete.
Working on task 3/4: 在操作列添加按钮
Task 3 complete.
Working on task 4/4: 代码验证
Task 4 complete.

Implementation Complete
Change: xxx-delete-button  Progress: 4/4 tasks complete
```

验证无误后：
```
你：/opsx:archive
→ 选择「同步并归档」
→ Specs 同步到 openspec/specs/ 作为基线
```

### Phase 3: 中等功能开发（~1小时）

**示例**：新增创建功能（需要改造已有组件）

```
你：/opsx:propose 在 XXX 模块添加新增功能，需要复用已有的编辑弹窗组件
```

Claude 调研后会做出设计决策（记录在 design.md）：
- 复用已有组件 vs 新建组件 → 选择复用，避免代码冗余
- 新增 mode prop 区分创建/编辑模式

apply 阶段会生成更多 task（如 12 个），按模块分组执行：
```
组件改造 (6 tasks) → 页面集成 (4 tasks) → 验证 (2 tasks)
```

### Phase 4: 复杂功能（explore 先行）

对于不熟悉的模块，先用 explore：
```
你：/opsx:explore 调研 XXX 模块的实现细节，重点关注数据流和状态管理
```

然后再 propose → apply → archive。

---

## 六、将 SDD 落地到你的项目：分步 Checklist

### Step 1: 项目初始化（一次性）

- [ ] 在项目根目录执行 `npx openspec init`
- [ ] 根据项目的技术栈和架构编辑 `openspec/config.yaml`
- [ ] 在 `CLAUDE.md` 中写入项目说明和 SDD 工作流约定
- [ ] 将 `openspec/` 和 `CLAUDE.md` 提交到 Git

### Step 2: 基线建立（首次）

- [ ] 用 `/opsx:propose` 对核心模块做基线梳理
- [ ] Review 生成的 specs，确认准确性
- [ ] 用 `/opsx:archive` 归档基线
- [ ] 提交归档后的 `openspec/specs/` 到 Git

### Step 3: 日常迭代（每次功能开发）

- [ ] `/opsx:propose` 描述需求
- [ ] Review 生成的 proposal、design、specs、tasks
- [ ] `/opsx:apply` 让 Claude 实现
- [ ] 手动验证功能（启动项目、测试）
- [ ] `/opsx:archive` 归档并同步基线
- [ ] Git commit & push

### Step 4: 持续优化

- [ ] 根据实际体验调整 `config.yaml` 中的 rules
- [ ] 在 `CLAUDE.md` 中补充 Claude 经常犯错的规则
- [ ] 定期 review `openspec/specs/` 确保基线准确

---

## 七、最佳实践

### 7.1 什么时候用 SDD

| 场景 | 是否使用 SDD | 原因 |
|------|-------------|------|
| 新功能开发 | 推荐 | 需求→代码全链路可追溯 |
| Bug 修复（明确原因） | 不需要 | 直接修，太轻量不值得 |
| 大规模重构 | 强烈推荐 | 降低 AI 出错概率，分步可控 |
| 探索性原型 | 不需要 | 快速试错优先 |
| 多人协作功能 | 推荐 | Specs 成为沟通契约 |

### 7.2 Proposal 写作要点

- **Why**：1-2 句说清业务动机，不要写技术细节
- **What Changes**：用 bullet list，具体到模块/文件级别
- **Capabilities**：每个独立功能点一个 capability，用 kebab-case 命名
- **Impact**：列出受影响的文件、API、依赖

### 7.3 Specs 写作要点

- 每个 Requirement 使用 `### Requirement: <name>` 格式
- 使用 `SHALL / MUST` 表达强制要求
- 每个 Requirement 至少一个 Scenario（`WHEN / THEN` 格式）
- 每个 Scenario 可直接转化为测试用例

### 7.4 Tasks 拆分原则

- 每个 task **30 分钟以内**可完成
- 使用 checkbox 格式：`- [ ] X.Y 任务描述`
- 按依赖顺序排列（先改 model，再改 service，最后改 controller/UI）
- 验证任务单独成组，放在最后

### 7.5 迭代节奏建议

```
第一轮：基线梳理（propose → archive）
  ↓
第二轮：小功能（propose → apply → archive）  ~30min
  ↓
第三轮：中等功能（propose → apply → archive） ~1h
  ↓
第四轮：复杂功能（explore → propose → apply → archive）
```

### 7.6 归档后的基线管理

归档后 specs 自动同步到 `openspec/specs/`：

```
openspec/specs/
├── user-delete/spec.md       # 删除能力基线
├── user-create/spec.md       # 创建能力基线
└── ...
```

后续迭代中如需修改已有能力：
1. 在 proposal 的 `Modified Capabilities` 中引用已有 spec 名称
2. 在 delta spec 中使用 `## MODIFIED Requirements` 标记变更部分

---

## 八、Claude Code 关键机制理解

> 以下内容来自 claude-code-sourcemap 源码分析，帮助你更好地利用 Claude Code。

### 8.1 CLAUDE.md 分层体系

Claude Code 使用 4 层 CLAUDE.md 配置，越靠后优先级越高：

| 层级 | 路径 | 用途 | 是否提交 Git |
|------|------|------|-------------|
| 托管级 | `/etc/claude-code/CLAUDE.md` | 组织统一规范 | N/A |
| 用户级 | `~/.claude/CLAUDE.md` | 个人偏好（如"用中文回复"） | 否 |
| 项目级 | `CLAUDE.md` / `.claude/CLAUDE.md` / `.claude/rules/*.md` | 项目规范 | 是 |
| 本地级 | `CLAUDE.local.md` | 个人本地调试用 | 否 |

**SDD 落地建议**：在项目级 `CLAUDE.md` 中声明 SDD 工作流，确保团队所有人共享相同指令。

### 8.2 Skills（自定义斜杠命令）

OpenSpec 的 `/opsx:propose`、`/opsx:apply`、`/opsx:archive` 就是通过 Claude Code 的 Skills 机制实现的。

Skills 是 `.md` 文件，放在 `.claude/skills/` 目录，支持 frontmatter 定义参数。Claude Code 加载后变成斜杠命令。你也可以自定义 skill 来封装常用操作。

### 8.3 Agent 子代理机制

Claude Code 内置多种子代理类型：

| 类型 | 用途 |
|------|------|
| `general-purpose` | 通用多步任务 |
| `Explore` | 快速代码库探索（支持 quick/medium/very thorough） |
| `Plan` | 架构设计和实现规划 |

SDD 的 propose 阶段大量使用 Agent 并行探索代码库。

### 8.4 Memory 持久记忆

Claude Code 支持自动记忆系统（`~/.claude/projects/<project>/memory/`），跨会话保留：
- 用户偏好（feedback 类型）
- 项目上下文（project 类型）
- 外部引用（reference 类型）

这与 SDD 的 specs 基线形成互补：Memory 记住"怎么做"，Specs 记住"做了什么"。

### 8.5 Hooks（自动化钩子）

可在 `settings.json` 中配置 hooks，实现自动化行为。例如：
- 每次 commit 后自动运行 lint
- 文件保存后自动格式化

---

## 九、不同项目类型的 config.yaml 模板

### 前端项目（React/Vue）

```yaml
schema: spec-driven
context: |
  项目：XXX 管理后台
  技术栈：React 18 + TypeScript + Ant Design + Zustand
  架构：Pages → Components → Hooks → API → Types
rules:
  proposal:
    - 使用中文撰写
    - 说明影响的页面和组件
  specs:
    - 组件规格包含：Props 接口、事件、状态
    - API 规格包含：URL、请求体、响应体
  tasks:
    - 先改 Types，再改 API，再改 Components，最后改 Pages
    - 每个 task 30 分钟以内
```

### 后端项目（Go/Java/Python）

```yaml
schema: spec-driven
context: |
  项目：XXX 微服务
  技术栈：Go 1.23 + Gin + GORM + Wire + PostgreSQL
  架构：Controller → Service → DAO → Model 四层架构
rules:
  proposal:
    - 使用中文撰写
    - 必须说明 API 变更和数据库变更
  design:
    - 必须说明分层归属（Controller/Service/DAO/Model）
  specs:
    - 接口规格：URL、Method、请求体、响应体、错误码
    - 数据模型：表结构、字段类型、约束
  tasks:
    - 先改 Model，再改 DAO，再改 Service，最后改 Controller
    - 数据库迁移单独一个 task
```

### 全栈项目

```yaml
schema: spec-driven
context: |
  项目：XXX 平台
  前端：Next.js 14 + TypeScript + Tailwind
  后端：Node.js + Prisma + PostgreSQL
  架构：前端 Pages → API Routes → Services → Prisma Models
rules:
  proposal:
    - 使用中文撰写
    - 分别说明前端和后端的改动范围
  specs:
    - 前后端接口必须定义 TypeScript 类型
  tasks:
    - 后端先行：Model → Service → API Route
    - 前端跟进：Types → Hooks → Components → Pages
    - 集成验证放最后
```

---

## 十、快速参考卡片

### 日常开发三步曲

```bash
# 1. 提案：描述你想做什么
/opsx:propose <用自然语言描述需求>

# 2. 实现：Claude 自动写代码
/opsx:apply

# 3. 归档：保存为基线
/opsx:archive
```

### 遇到问题时

| 情况 | 怎么做 |
|------|--------|
| Claude 生成的 spec 不准确 | 手动编辑 spec 文件后重新 apply |
| Task 执行失败 | 检查错误，手动修复后继续 |
| 需要修改已归档的能力 | 新 propose 中引用已有 spec |
| 对代码不熟悉 | 先用 `/opsx:explore` 调研 |
| 第一次在项目用 SDD | 先做基线梳理（Phase 1） |

---

## 总结

SDD + Claude Code 的本质是**用结构化的文档驱动 AI 编码**，而不是直接让 AI 自由发挥。这套方法的威力在于：

1. **约束 AI 的行为边界** — config.yaml 的 rules 和 CLAUDE.md 限定了 AI 的行为框架
2. **分解复杂度** — proposal → design → specs → tasks 逐步细化，每一步都可 review
3. **积累项目知识** — specs 归档为基线，越用越精准
4. **可复现可追溯** — 每个变更都有完整的文档链路

从今天开始，对你的下一个功能需求，试试 `/opsx:propose`。
