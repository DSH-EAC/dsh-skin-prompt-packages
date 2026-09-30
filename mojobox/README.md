# Mojobox 目录元数据适配

本目录将已发布的 `skin-prompts/community-metadata.json` 转换为
[Mojobox](https://github.com/DSH-EAC/dsh-mojobox) 当前接受的插件目录记录。
原始元数据保持原始字节，适配清单记录其 SHA-256。

## 产物与覆盖范围

| 来源项目 | Mojobox 记录 | 发布状态 |
| --- | --- | --- |
| 鲸鱼娘系列 | 管理器、深海女仆工坊、虎鲸链路，三条 Plugin Manifest | 三个精确 npm 产物及 SHA-256 已核验 |
| 滑动变阻器 | 一条 Plugin Manifest | GitHub Release 已发布，API 提供 SHA-256；完整本地下载核验待完成 |
| 鲸鱼娘昼夜工坊 | 一条 Plugin Manifest | GitHub Release 已发布，API 提供 SHA-256；完整本地下载核验待完成 |
| 终末地官网风格 | 一条 Plugin Manifest | `unpublished`，固定 GitHub 来源 |
| 美女系列 | `source-only/beauty-skins.json` | 源码覆盖项目，无根插件，保留完整来源记录 |

`catalog/plugins/*.json` 可放入 Mojobox 的同名目录，共六条新增记录。
它们使用 `dsh-std 0.15`，目录代维护标记为 `registry-maintained`。
作者、简介、预览、安装限制及来源摘要保存在许可的 `x-` 扩展中。
`facets.host.entry` 来自真实 Cordis 包入口；`v1alpha1` 使用目录约定，
不代表插件已实现 dsh-std 运行时协商。

官方皮肤注入器复用 Mojobox 已有的 `dev.eac.ui-skin-loader` 记录，不重复
建立同名插件。上游皮肤对该注入器的注册接口尚未验证；目录适配不会改变它们
的加载逻辑，也不签发安装或运行 Evidence。

## 文件

- `adapter.config.json`：映射配置与实测 artifact 摘要。
- `sources/`：上游 package.json 元数据快照及来源说明。
- `catalog/plugins/`：生成并提交的 Mojobox 目录事实源。
- `source-only/`：当前无法表示为可安装插件的项目来源。
- `import-report.json`：五组来源映射、Manifest 摘要及完整 Pack 的缺项。
- `vendor/`：固定 Mojobox revision 的 Schema 与原许可证。
- `scripts/build-catalog.mjs`：无网络、无插件执行的可重复生成器。
- `tests/`：来源完整性、摘要、确定性和协议拒绝行为验证。

## 构建与验证

```powershell
npm --prefix mojobox ci --ignore-scripts
npm --prefix mojobox run build
npm --prefix mojobox test
node --test skin-prompt-pack.test.ts
```

协议固定在
`DSH-EAC/dsh-mojobox@13e72e1066d1d0cbf6a4d72c85d016257e7100b1`。
已把六条目录记录合入该版本的临时源码副本，并运行未经修改的
`scripts/validate.mjs`：53 条插件、5 个 Pack、5 个 Lock、19 条 Evidence、
6 个正例、5 个反例通过。新增适配测试五项通过，原有 Prompt 测试三项通过。
临时副本与下载缓存不提交，验证结果不冒充生产运行 Evidence。

## 完整整合包状态

本次完成的是目录元数据适配。完整五选 Pack/Lock 暂时缺少以下事实：

- 滑动变阻器与昼夜工坊对应精确版本的 npm 来源；GitHub Release 不能替代 npm source。
- 终末地对应精确版本的发布产物。
- 美女系列符合宿主规范的独立插件包。
- 官方注入器 `@dsh-eac/ui-skin-loader@1.1.0` 的 npm 发布版本。
- 上游皮肤与官方注入器的注册集成验证。

当前 PackLock 仅接受精确的 `npm:包名@版本`，不能用 GitHub 地址替代。
因此不会生成无法满足协议的 Pack/Lock 或把源码覆盖项目伪装成插件。
原 MD 的 EAC Feature Pack v1 薄包与当前 Mojobox Pack v1alpha1 是不同格式。

此目录尚未提交到 `dsh-mojobox` 收录，也没有发布新的 `.dshpack`。
此工作区此前的 `pack.json`、`submission.template.json` 和根目录运行时适配
属于本地实验，未纳入本次提交；当前构建只读取上述来源元数据和映射配置。

## 许可

原创目录适配工具使用本目录 `LICENSE` 的 MIT。
鲸鱼美术的非商业和相同方式共享要求、滑动变阻器的 `NOASSERTION`、
游戏素材与壁纸的第三方权利继续有效。元数据清单的许可不扩大这些权利。
