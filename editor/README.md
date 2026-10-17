# 图绎（Figlyph）

无构建依赖的浏览器图片编辑器。入口 `/editor/`（`editor/index.html`）加载 `editor/editor.css` 和 `editor/editor.js`，复用仓库已有字体与风景图片；不依赖外部 API。

## 本地运行

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory /workspace/clyfort.github.io
```

在浏览器访问服务器的 `/editor/` 路径。博客首页保持原样。需要使用 HTTP 服务加载 ES 模块。

## 功能

- 图形：选择矩形、圆角矩形、圆形、三角形、直线、块状箭头或线条箭头工具后，在画布按住鼠标拖动确定位置与尺寸；Shift 等比绘制或限定线条角度，Esc 取消。默认黑色空心，可在属性面板启用填充；箭头有块状和「直线 + V 形箭头」两种。支持反向拖动和斜向箭头；填充、渐变、描边、圆角与阴影。
- 自由画笔：颜色、粗细，可作为独立图层移动与缩放。
- 文字：点击添加文字或按 T 后，在画布单击确定位置并开始输入，Esc 可取消放置；清空全部文字（或仅剩空白）并确认后自动删除文本框，支持撤销。在选择工具下双击画布文字框内任意位置即可直接编辑，点击框外或按 Ctrl/⌘+Enter 完成；高度根据实际字形和换行自动计算，角点拖动等比缩放文字；字体、字号、字重、斜体、下划线、删除线、行距、字距、段距、对齐；选中右侧文字内容中的片段可单独设置样式。
- 字体导入：TTF、OTF、WOFF、WOFF2。字体内嵌保存到项目。
- 图片：文件上传、拖放、粘贴，取景裁切、翻转、亮度、对比度与饱和度。导入时保留原始像素宽高；空画布直接匹配原图尺寸，已有作品按需扩展画布并保留原图层，预览缩放不影响导出分辨率。
- 对象：拖动、角点缩放、旋转、画布对齐；Shift + 拖动角点保持比例。
- 多选：Ctrl/⌘ + A 选中所有可见且未锁定的元素；M 框选工具可从任意位置拖出选框，默认选中与框接触的元素，也可在工具栏切换为「完全包含」。选择工具也可从空白区域开始框选。Shift + 点击增减选择、Shift + 框选追加选择；所选元素可整体移动、复制、删除。文字输入框内的 Ctrl/⌘ + A 保持原生文字全选行为。
- 系统字体：提供等线、微软雅黑选项，使用设备已安装的字体，未安装时回退到内置思源黑体；Satoshi 主要用于西文。支持自行导入字体文件。
- 图层：顺序、显示、锁定、复制、删除；撤销与重做最多保留 60 个状态。
- 画布：自定义尺寸、预设、背景色、缩放和平移。元素面板、画布设置和区域清除面板均提供白色和黑色背景快捷选项。
- 区域清除：按 R 或点击工具栏「区域清除」，拖出矩形选区，按 Delete/Backspace（或属性面板按钮）填充为当前背景色；支持撤销、重做、项目保存和导出，背景改色时已清除的区域同步更新。V/M 仍选择和删除完整元素，输入文字时 Delete 仍编辑文字。
- 文件：PNG、JPG、WebP 导出，透明背景与分辨率选项；`.figlyph` 项目文件保存/打开，兼容旧版 `.shiguang` 文件。
- 自动保存：浏览器 localStorage。存储空间不足会提示，重要作品请另存项目文件。

所有编辑在浏览器本地进行，不会把图片上传到服务器。大图片、内嵌字体和长历史会占用内存；图片单文件上限 15 MB、字体 20 MB、画布单边最大 16384 像素、总面积最大 6400 万像素。导入的动画图片按静态帧绘制。

## 快捷键

`V` 选择、`M` 框选、`H` 平移、`B` 画笔、`T` 文字；空格临时平移；Ctrl/⌘ + 滚轮缩放。
Ctrl/⌘ + Z 撤销、Shift + Z 重做、D 复制图层、S 保存项目；方向键微调位置，Shift 加速。

## 开发回归检查

在已安装 Playwright 与 Chromium 的环境中，启动 HTTP 服务后运行：

```sh
EDITOR_TEST_URL=http://127.0.0.1:8000/editor/ node editor/tests/regressions.cjs
EDITOR_TEST_URL=http://127.0.0.1:8000/editor/ node editor/tests/shapes.cjs
EDITOR_TEST_URL=http://127.0.0.1:8000/editor/ node editor/tests/shape-style.cjs
EDITOR_TEST_URL=http://127.0.0.1:8000/editor/ node editor/tests/region.cjs
EDITOR_TEST_URL=http://127.0.0.1:8000/editor/ node editor/tests/text-edit.cjs
EDITOR_TEST_URL=http://127.0.0.1:8000/editor/ node editor/tests/text-placement.cjs
```

可用 `CHROMIUM_PATH` 指定浏览器路径。检查实际文字像素边界、换行和缩放、两种框选方式、多选操作、原图尺寸导入、导出尺寸和刷新恢复。

运行 `python3 editor/package.py` 可重新生成 `editor/downloads/figlyph.zip`，并同步旧版下载链接。
