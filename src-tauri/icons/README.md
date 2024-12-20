# App Icons

To create app icons for MacOS, we leverage the work of Aljoscha Brell from [macos-icon-generator](https://github.com/qwertzalcoatl/macos-icon-generator) and [png-to-icns](https://github.com/BenSouchet/png-to-icns).  This script generates a set of icons based on the image you provide.

To setup, navigate to this directory, install `uv` and run the following commands:

```bash
pip install uv
uv run macos_icon_generator.py ./original.png
```

Create the icon from the output with the following command:

```bash
./png_to_icns.sh -i icon_1024x1024.png
```
