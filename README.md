# DSH Skin Prompt Packages

EAC 与 AIO 自定义客户端皮肤的 AI Prompt 包集合。

## 内容

- `skin-prompts/schema/manifest.schema.json`：Prompt 包清单 Schema。
- `skin-prompts/inventory.json`：EAC/AIO 皮肤来源清单。
- `skin-prompts/packages/`：每套皮肤的 `manifest.json`、`prompt.md` 和说明。
- `DESIGN.md`：目录结构、字段和验证设计。
- `skin-prompt-pack.test.ts`：Prompt 包契约测试。

## 验证

需要 Node.js 24 或更高版本：

```powershell
node --test skin-prompt-pack.test.ts
```

Prompt 包是设计和来源记录，不是可直接安装的 DSH 插件，不会改变现有
Cordis 皮肤的加载、安装或切换逻辑。
