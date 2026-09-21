# 有数 tydlig-android

仿 iOS 画布计算器《有数》（Tydlig）的 Android 应用。数字像卡片一样摆在无限画布上，
用运算符把它们连起来，结果实时联动更新——改任何一个输入，下游所有结果立刻重算。

> 灵感来自 iOS 应用《有数》(Tydlig)。本仓库是独立仿制实现，与原作者无关。

## 特性（随版本迭代增加）

- v0.0.1：无限画布（拖动平移 / 双指与滚轮缩放）、数字卡片、+ − × ÷ ^、
  链式连线结果、实时联动重算、替换式编辑、除零等错误显示为红色「—」、
  拖动节点连线跟随、待定运算提示条、桌面浏览器键鼠支持

## 构建 APK（Windows / Git Bash）

```bash
export PATH="/d/zcode/jdk/jdk-17.0.20.1+1/bin:$PATH"
export ANDROID_HOME=D:/zcode/android-sdk
bash apk/build-windows.sh
```

产物：`tydlig-v{版本}.apk`（debug 签名，versionName 取自最新 git tag，
可用 `TYDLIG_VERSION=vX.Y.Z` 覆盖）。

## 目录结构

```
apk/
  AndroidManifest.xml          单 Activity，minSdk 21 / target 34
  assets/tydlig.html           全部应用逻辑（单文件，无依赖，离线可用）
  src/io/github/pokem0n2/tydlig/MainActivity.java   WebView 壳 + 分享/Toast 桥
  res/                         图标（脚本生成）与字符串
scripts/make-icon.js           生成 mipmap 图标（node scripts/make-icon.js）
tests/                         自测记录与脚本
```

## 许可

MIT
