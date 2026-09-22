xCalc v0.4.6 · 修复 APK 闪退（重要）+ 数字居中修正

## ⚠️ 重要：请更新到此版本

此前所有版本的 APK 安装到手机后会**无提示闪退**，本版本彻底修复：

- **闪退根因**：构建脚本的 d8 打包步骤只传入了 `MainActivity.class` 一个类文件，
  而 MainActivity 含内部类（JS 桥 `Bridge`、返回键回调等，编译产物共 4 个 class）。
  缺失的内部类导致应用启动时抛出 `NoClassDefFoundError`，直接闪退。
  现已打包全部 class，并已重建全部历史版本的 APK（对应 Release 附件已替换）
- **数字在线框内的居中修正**：测量文字墨迹（actualBoundingBox*）前未钉死
  `textBaseline`，导致测量结果随 canvas 基线状态漂移（清空画布后的首帧
  处于 middle 状态，必然偏移）。现已于测量与绘制前统一钉死基线；
  同时上下边距与左右分离（左右 3 / 上下 9，最小缩放下约 3px）

感谢用户反馈与亲手定位修复建议。

安装：下载 APK 直接安装（debug 签名，Android 5.0+，零权限）。
