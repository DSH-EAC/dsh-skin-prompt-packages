# DSH Skin Prompt Packages

EAC 与 AIO 自定义客户端皮肤的 AI Prompt 包与社区来源元数据集合。

## 内容

- `skin-prompts/schema/manifest.schema.json`：Prompt 包清单 Schema。
- `skin-prompts/inventory.json`：原有十套 EAC/AIO 皮肤来源。
- `skin-prompts/packages/`：每套皮肤的 `manifest.json`、`prompt.md` 和说明。
- [`skin-prompts/community-metadata.json`](skin-prompts/community-metadata.json)：新增五组社区皮肤的独立元数据。
- [`mojobox/`](mojobox/README.md)：保留原始元数据并生成 Mojobox 目录记录、来源映射与校验报告。
- `DESIGN.md`：Prompt 包结构与字段设计。
- `skin-prompt-pack.test.ts`：原有 Prompt 包契约测试。

## 社区皮肤元数据

| 皮肤项目 | 来源 | 上游安装形式 |
| --- | --- | --- |
| 鲸鱼娘系列 | [Small-tailqwq/dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) | npm：管理器、女仆工坊、虎鲸链路 |
| 滑动变阻器 | [kingOfSoySauce/dsh-liang-skin](https://github.com/kingOfSoySauce/dsh-liang-skin) | GitHub 插件 |
| 鲸鱼娘昼夜工坊 | [GGBond2424648901/deep-whale-day-night-theme](https://github.com/GGBond2424648901/deep-whale-day-night-theme) | GitHub 插件 |
| 终末地官网风格 | [ymh0000123/dsh-theme-endfield](https://github.com/ymh0000123/dsh-theme-endfield) | GitHub 插件 |
| 美女系列皮肤 | [XieRW/dsh-beauty-skins](https://github.com/XieRW/dsh-beauty-skins) | 源码覆盖，尚无可直接安装的根插件 |

元数据记录名称、作者、简介、标签、仓库、固定提交、预览、许可证、插件引用及
已知安装限制。另记录用户指定的
[dsh-ui-skin-loader](https://github.com/DSH-EAC/dsh-ui-skin-loader) 来源，集成状态为未验证。

本次发布范围为元数据。上游皮肤是否可由注入器加载、与当前宿主是否兼容，应由
插件维护者和宿主验证。滑动变阻器未声明许可证；鲸鱼美术具有非商业及相同方式
共享要求；软件许可证不覆盖第三方角色和壁纸。

## 验证

需要 Node.js 24 或更高版本：

```powershell
node --test skin-prompt-pack.test.ts
npm --prefix mojobox ci --ignore-scripts
npm --prefix mojobox run build
npm --prefix mojobox test
```

Prompt 包与来源元数据不是可直接安装的 DSH 插件，不改变现有 Cordis 皮肤的
加载、安装或切换逻辑。
