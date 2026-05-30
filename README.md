# GapmapAI

GapmapAI 是一个本地运行的 AI 知识路径导航器。它面向“我想学会/理解/完成某件事，但不知道自己缺什么”的场景，帮助用户从目标出发，生成知识树、诊断知识盲区，并整理出更短的学习路径。

转载需标明出处。

## 核心能力

- 输入目标：描述你想学习、理解或完成的事情。
- 生成知识树：按目标拆出必须学、有帮助、可暂时跳过的知识模块。
- AI 追问诊断：像知识面试官一样逐轮追问，判断你是真懂还是只听过。
- 盲区报告：整理已掌握、模糊理解、严重缺口、错误理解和下一步重点。
- 最小学习路径：不生成大而全课程，只给当前目标最需要补的路径。
- 概念卡片：针对知识树、报告、路径中的概念生成目标相关解释。
- Markdown 导出：把当前目标的完整结果导出为 Markdown 文件。

## 支持的 AI Provider

GapmapAI 不使用自建服务器，用户需要填写自己的 API 信息。

当前支持：

- OpenAI / GPT
- Gemini
- DeepSeek
- 千问 / Qwen / 阿里云百炼 DashScope
- 硅基流动 / SiliconFlow
- 本地 Ollama
- 自定义 OpenAI-Compatible API

所有业务功能都通过统一的 AI Client 调用，页面层不会直接请求某个平台接口。

## 数据与隐私

- 核心业务数据保存在本地 SQLite。
- API Key 使用系统凭据存储保存，不写死在代码里，也不明文保存在普通业务数据里。
- Windows 版使用系统凭据能力保存 API Key。
- AI 请求会直接从本机发往用户配置的 Provider，项目本身不提供中转服务器。

## 下载与运行

如果你只是想使用软件，可以下载发布页里的免安装版 zip，解压后运行里面的 `GapmapAI.exe`。

Windows 10 / Windows 11 通常已内置 WebView2 Runtime。如果无法启动，请先安装 Microsoft Edge WebView2 Runtime。

