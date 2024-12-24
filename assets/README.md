# App Icons

To create app icons for MacOS, we leverage the work of Aljoscha Brell from [macos-icon-generator](https://github.com/qwertzalcoatl/macos-icon-generator).  This modified script generates a rounded icon from a square input image.

To setup, navigate to this directory, install `uv` and run the following commands:

```bash
pip install uv
uv run macos_icon_generator.py ./original.png
```

Using GIMP, scale the generated image to 924x924px and add 100px of transparent padding on all sides. Save it as `app-icon.png`. Run the following command to create all of the icons:

```bash
yarn tauri icon
```

Remove unused icons:

```bash
rm -rf StoreLogo.png Square* ios/ android/ 128* 32*
```