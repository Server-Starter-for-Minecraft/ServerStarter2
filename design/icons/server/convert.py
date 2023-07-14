from pathlib import Path
from PIL import Image

SERVER_IMAGE_SIZE = 64

here = Path(__file__).parent

x16 = here / "x16"
x64 = here / "x64"

for path in x16.iterdir():
    if path.suffix != ".png":
        continue

    img = Image.open(path)

    if img.size != (16, 16):
        continue

    target = x64 / path.name

    img.resize((SERVER_IMAGE_SIZE, SERVER_IMAGE_SIZE), Image.NEAREST).save(target)
