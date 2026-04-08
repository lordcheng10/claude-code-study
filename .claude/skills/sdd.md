---
name: sdd
description: "SDD 规格驱动开发：输入需求描述，自动完成 propose → apply → archive 全流程"
user-invocable: true
argument-hint: "<用自然语言描述你的需求>"
arguments:
  - requirement
when_to_use: "Use when the user wants to develop a feature using SDD (Spec-Driven Development), or says 'sdd', '规格驱动', '按 SDD 流程开发', 'propose and implement', or describes a feature they want built with structured artifact flow."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
---

# SDD — 规格驱动开发全自动流程

用户输入一句需求描述，自动完成从提案到归档的完整 SDD 流程。

## Inputs
- `$requirement`: 用自然语言描述的需求（例如："在用户列表页添加批量删除功能"）

## Goal
根据用户需求，自动完成 SDD 全流程：调研代码 → 生成 proposal/design/specs/tasks → 逐个实现 task → 归档为基线。最终产出：可工作的代码 + 完整的 artifact 文档链路。

## Steps

### 1. 读取项目配置

读取 `openspec/config.yaml` 获取项目的 schema、context、rules 配置。如果文件不存在，先执行 `npx openspec init` 初始化，然后提示用户需要配置 config.yaml。

读取 `openspec/specs/` 下已有的基线 specs，了解项目已有能力。

**Success criteria**: 已获取项目配置和已有基线信息。

### 2. 调研代码（Explore）

根据用户需求 `$requirement`，使用 Agent（Explore 类型）并行调研相关代码：

- 识别需求涉及的模块、文件、API、组件
- 找出已有的可复用代码（避免重复造轮子）
- 确认哪些部分已有、哪些需要新建、哪些需要改造

**Success criteria**: 已掌握需求涉及的所有代码上下文。

### 3. 生成 Proposal

运行 `npx openspec new change "<change-name>"` 创建变更目录。

在 `openspec/changes/<change-name>/proposal.md` 中生成提案，包含：

```markdown
# Proposal: <change-name>

## Why
<1-2 句业务动机>

## What Changes
- <具体到模块/文件级别的变更列表>

## New Capabilities
- <capability-name>: <描述>

## Impact
- Files: <受影响的文件列表>
- APIs: <受影响的 API>
- Dependencies: <依赖变更>
```

遵循 config.yaml 中 `rules.proposal` 的约束。

**Success criteria**: proposal.md 已创建，内容完整。

### 4. 生成 Design

在 `openspec/changes/<change-name>/design.md` 中生成技术设计，包含：

- 分层归属（哪些改动在哪一层）
- 架构决策（复用 vs 新建，选择理由）
- 备选方案对比

遵循 config.yaml 中 `rules.design` 的约束。

**Success criteria**: design.md 已创建。

### 5. 生成 Specs

在 `openspec/changes/<change-name>/specs/<capability-name>/spec.md` 中为每个 capability 生成详细规格：

```markdown
# Spec: <capability-name>

## Requirements

### Requirement: <name>
<capability> SHALL/MUST <behavior>

#### Scenario: <scenario-name>
- WHEN: <条件>
- THEN: <期望结果>
```

遵循 config.yaml 中 `rules.specs` 的约束。每个 Requirement 至少一个 Scenario。

**Success criteria**: 所有 capability 的 spec.md 已创建。

### 6. 生成 Tasks

在 `openspec/changes/<change-name>/tasks.md` 中生成实施任务清单：

```markdown
# Tasks: <change-name>

## Group 1: <模块名>
- [ ] 1.1 <任务描述> — 验收：<验收标准>
- [ ] 1.2 ...

## Group 2: <模块名>
- [ ] 2.1 ...

## Group N: 验证
- [ ] N.1 代码验证
- [ ] N.2 功能验证
```

规则：
- 每个 task 30 分钟以内可完成
- 按依赖顺序排列
- 验证任务单独成组放最后

遵循 config.yaml 中 `rules.tasks` 的约束。

**Success criteria**: tasks.md 已创建，任务粒度合理。

### 7. 逐个实现 Task

按 tasks.md 中的顺序，逐个实现每个 task：

1. 读取当前 task 的描述和验收标准
2. 根据 specs 中的规格要求编写代码
3. 完成后在 tasks.md 中将 `- [ ]` 改为 `- [x]`
4. 输出进度：`Task X/N complete: <任务描述>`

如果某个 task 涉及多文件修改，先改底层（model/types），再改上层（service/component），最后改入口（controller/page）。

**Success criteria**: 所有 task 标记为完成，代码已修改。

### 8. 归档

将变更归档：

1. 将 specs 复制到 `openspec/specs/<capability-name>/spec.md` 作为基线
2. 将整个变更目录移动到 `openspec/changes/archive/<date>-<change-name>/`
3. 输出归档摘要

如果 `npx openspec archive` 可用则使用它，否则手动执行文件操作。

**Success criteria**: 变更已归档，specs 已同步到基线目录。

### 9. 总结报告

输出完成摘要：

```
✅ SDD 流程完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
变更: <change-name>
Artifact 链路:
  📋 Proposal: openspec/changes/archive/<date>-<change-name>/proposal.md
  🏗️ Design:   openspec/changes/archive/<date>-<change-name>/design.md
  📐 Specs:    openspec/specs/<capability>/spec.md (已同步基线)
  ✅ Tasks:    <N>/<N> 完成

修改的文件:
  - <file1>
  - <file2>

下一步: 请手动验证功能，然后 git commit & push
```

**Success criteria**: 用户收到完整的总结报告。
