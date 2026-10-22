"""Build the standalone Figlyph archive with Python's standard library."""
from pathlib import Path
from shutil import copyfile
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parent.parent
output = root / 'editor/downloads/figlyph.zip'
output.parent.mkdir(exist_ok=True)

with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
    def add(name, data):
        info = ZipInfo('figlyph/' + name, date_time=(2020, 1, 1, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, data)

    add('index.html', (root / 'editor/index.html').read_bytes())
    add('start.py', (root / 'editor/start.py').read_bytes())
    for folder in ('editor', 'fonts', 'images'):
        for path in sorted((root / folder).rglob('*')):
            relative = path.relative_to(root)
            if path.is_file() and not {'downloads', '__pycache__'}.intersection(relative.parts):
                add(relative.as_posix(), path.read_bytes())
    add('使用说明.txt', (
        '图绎（Figlyph）图片编辑器\n\n'
        '解压后安装 Python 3，运行 start.py 自动打开编辑器。\n'
        '选择基础图形后，在画布按住鼠标拖动确定位置和大小；Shift 等比绘制或限定角度，Esc 取消。\n'
        '基础图形默认黑色空心，可在属性面板启用填充。箭头有块状、线条加 V 形两种。\n'
        'M 框选，Ctrl+A 全选，Shift+点击增减选择。文字输入框内 Ctrl+A 只选文字。\n'
        'R 区域清除：拖动框选后按 Delete，用当前背景色填充区域；可撤销，手机端可点击属性面板的填充按钮。\n'
        '背景颜色提供白色和黑色快捷选项。图片导入保留原始像素尺寸，文字框高度自动适配内容。\n'
        '选中图片后，在属性面板选择图片滤镜，可预览原图、鲜活、柔光、淡雅、电影、黑白、明亮和浓郁；应用后可继续微调，支持撤销。\n'
        '滤镜不叠加；选择原图恢复亮度、对比度和饱和度，不改变裁切、翻转和其他外观。\n'
        '点击添加文字或按 T 后，在画布单击确定位置并输入；Esc 取消放置。\n'
        '普通添加文字沿用上次的字体、字号、颜色、行距等样式，刷新后仍保留；文字预设采用各自字号和粗体设置。\n'
        '清空全部文字并确认后自动删除文本框，支持撤销。\n'
        '双击文字框内任意位置即可编辑文字；点击框外或按 Ctrl/⌘+Enter 完成。\n'
        '在画布文字编辑框或右侧文字内容中选中片段，可连续调整该片段的字体、字号、颜色和粗体等样式；画布会持续高亮所选片段。\n'
        '画布文字编辑支持混合字体、字号、粗体和颜色，选中时保持原样；支持换行、纯文本粘贴和编辑中撤销。\n'
        'AI 助手：翻译、润色、精简和生成标题，支持预览后替换选区或新增文字图层，可撤销。\n'
        '连接设置支持 OpenAI、DeepSeek 和自定义 OpenAI 兼容服务；填入自己的基础地址、模型和 API Key。\n'
        'AI 只发送确认的原文，不发送图片。密钥仅留在当前页面，刷新后需重新填写；API 额度与聊天订阅独立。\n'
        '使用「文件 → 保存项目文件」备份 .figlyph 项目；也能打开旧版 .shiguang 文件。\n'
    ).encode())

# Keep already-shared download links working with the same current contents.
copyfile(output, output.with_name('shiguang-studio.zip'))
with ZipFile(output) as archive:
    assert archive.testzip() is None
    print(f'Figlyph archive verified: {len(archive.namelist())} files, {output.stat().st_size} bytes')
