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
        '点击添加文字或按 T 后，在画布单击确定位置并输入；Esc 取消放置。\n'
        '清空全部文字并确认后自动删除文本框，支持撤销。\n'
        '双击文字框内任意位置即可编辑文字；点击框外或按 Ctrl/⌘+Enter 完成。\n'
        '使用「文件 → 保存项目文件」备份 .figlyph 项目；也能打开旧版 .shiguang 文件。\n'
    ).encode())

# Keep already-shared download links working with the same current contents.
copyfile(output, output.with_name('shiguang-studio.zip'))
with ZipFile(output) as archive:
    assert archive.testzip() is None
    print(f'Figlyph archive verified: {len(archive.namelist())} files, {output.stat().st_size} bytes')
