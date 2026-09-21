# 有数 tydlig-android

仿 iOS 画布计算器《有数》（Tydlig）的 Android 应用。数字像卡片一样摆在无限画布上，
用运算符把它们连起来，结果实时联动更新——改任何一个输入，下游所有结果立刻重算。

> 灵感来自 iOS 应用《有数》(Tydlig)。本仓库是独立仿制实现，与原作者无关。

## 特性（v0.3.2）

- **无限画布**：拖动空白平移、双指/滚轮缩放、工具栏一键适应视图
- **数字卡片**：键盘输入即在画布生成数字，随手拖动整理；双击重新编辑（首键替换）
- **链式运算**：选中数字 → 点 `＋ − × ÷ ^` → 点另一个数字，结果自动连线生成；
  结果可继续参加运算，长按可「断开连接」变回普通数字
- **实时联动**：改动任意输入，下游结果全部立刻重算；除零、负数开方等显示红色「—」
- **科学函数**：`fx` 展开科学键盘 —— x² xʸ √ 1/x % sin cos tan ln log π e（三角函数弧度制）
- **撤销/重做**：创建、连线、编辑、拖动、删除、清空全部可撤销（最多 100 步）
- **自动保存**：画布实时存入本机 localStorage，重开应用继续上次计算；数据不出设备
- **导入/导出**：画布数据 JSON 导出（Android 上调起系统分享）、粘贴导入，格式校验
- **长按菜单**：复制数值 / 断开连接 / 删除（下游级联删除，可撤销）
- **深色模式**：跟随系统，画布、键盘、面板全套配色
- **首次引导**：三步上手说明；「使用帮助」随时可查
- **零权限**：APK 不申请任何 Android 权限；WebView 单文件实现，完全离线可用

## 下载

见 [Releases](https://github.com/Pokem0n2/tydlig-android/releases) —— 每个版本附带
`tydlig-vX.Y.Z.apk`（debug 签名，直接安装）。

## 构建 APK（Windows / Git Bash）

```bash
export PATH="/d/zcode/jdk/jdk-17.0.20.1+1/bin:$PATH"
export ANDROID_HOME=D:/zcode/android-sdk
bash apk/build-windows.sh
```

产物：`tydlig-v{版本}.apk`。versionName 取自最新 git tag（可用 `TYDLIG_VERSION=vX.Y.Z`
覆盖），无 Gradle 依赖，仅需 JDK 17 + Android build-tools 34 / platform 34。

## 目录结构

```
apk/
  AndroidManifest.xml          单 Activity，minSdk 21 / target 34，零权限
  assets/tydlig.html           全部应用逻辑（单文件，无依赖，离线可用）
  src/io/github/pokem0n2/tydlig/MainActivity.java   WebView 壳 + 分享/Toast 桥
  res/                         图标（脚本生成）与字符串
  build-windows.sh             无 Gradle 构建流水线（javac→d8→aapt2→zipalign→apksigner）
scripts/make-icon.js           生成 mipmap 图标（node scripts/make-icon.js，零依赖）
tests/                         测试记录
```

## 版本迭代

遵循小步提交：每个功能/修复单独提交并递增版本号（功能 v0.x.0，修复 v0.x.y），
最终版本打 tag 并发布 Release。历史：

- v0.0.1 画布计算器核心：数字、四则/幂、链式实时联动、平移缩放拖拽
- v0.1.0 撤销/重做、自动保存恢复、级联删除、适应视图、工具栏
- v0.2.0 科学函数键盘、长按菜单、首次引导、Android 返回键接管
- v0.3.0 主菜单（导出/导入/清空/帮助/关于）、深色模式、分享桥、连线端点
- v0.3.1 修复交叉编译 lambda 导致 APK 无法编译
- v0.3.2 节点放置防叠压、适应视图精确适配可视带

## 许可

MIT
