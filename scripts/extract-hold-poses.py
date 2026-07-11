"""Deterministically extract the approved dash and climb pose cells from demo.png."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "art-src" / "refs" / "demo.png"
OUTPUT_DIR = ROOT / "public" / "assets" / "char"
CANVAS_SIZE = 256
FOOT_BASELINE = 232


def remove_connected_background(image: Image.Image) -> Image.Image:
    """Remove only pale pixels connected to the crop boundary; preserve the white coat."""
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def is_pale_background(x: int, y: int) -> bool:
        red, green, blue, _ = pixels[x, y]
        return red >= 222 and green >= 222 and blue >= 218 and max(red, green, blue) - min(red, green, blue) <= 24

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if not visited[index] and is_pale_background(x, y):
            visited[index] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (*pixels[x, y][:3], 0)
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= next_x < width and 0 <= next_y < height:
                enqueue(next_x, next_y)

    return rgba


def erase_climb_ladder(image: Image.Image) -> None:
    """Erase the brown ladder at the left of the crop without touching the character."""
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if alpha and 12 <= x <= 54:
                pixels[x, y] = (red, green, blue, 0)


def erase_dash_speed_lines(image: Image.Image) -> None:
    """Remove only the desaturated motion lines left of the dash character."""
    pixels = image.load()
    for y in range(image.height):
        for x in range(min(62, image.width)):
            red, green, blue, alpha = pixels[x, y]
            saturation = max(red, green, blue) - min(red, green, blue)
            if alpha and saturation <= 55:
                pixels[x, y] = (red, green, blue, 0)


def retain_largest_component(image: Image.Image) -> None:
    """Discard detached source-sheet residue after the targeted cleanup passes."""
    alpha = image.getchannel("A")
    width, height = image.size
    visited = bytearray(width * height)
    largest: list[int] = []

    for start_y in range(height):
        for start_x in range(width):
            start = start_y * width + start_x
            if visited[start] or alpha.getpixel((start_x, start_y)) == 0:
                continue

            visited[start] = 1
            queue: deque[tuple[int, int]] = deque([(start_x, start_y)])
            component = [start]
            while queue:
                x, y = queue.popleft()
                for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    index = next_y * width + next_x
                    if 0 <= next_x < width and 0 <= next_y < height and not visited[index] and alpha.getpixel((next_x, next_y)):
                        visited[index] = 1
                        queue.append((next_x, next_y))
                        component.append(index)
            if len(component) > len(largest):
                largest = component

    pixels = image.load()
    keep = set(largest)
    for y in range(height):
        for x in range(width):
            if y * width + x not in keep:
                red, green, blue, _ = pixels[x, y]
                pixels[x, y] = (red, green, blue, 0)


def create_pose(name: str, crop_box: tuple[int, int, int, int], scale: float, erase_ladder: bool = False, erase_speed_lines: bool = False) -> None:
    crop = SOURCE_IMAGE.crop(crop_box)
    cutout = remove_connected_background(crop)
    if erase_ladder:
        erase_climb_ladder(cutout)
    if erase_speed_lines:
        erase_dash_speed_lines(cutout)

    width = round(cutout.width * scale)
    height = round(cutout.height * scale)
    resized = cutout.resize((width, height), Image.Resampling.LANCZOS)
    alpha = resized.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError(f"{name} extraction contains no opaque pixels")

    canvas = Image.new("RGBA", (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    content_bottom = bbox[3]
    content_width = bbox[2] - bbox[0]
    paste_x = (CANVAS_SIZE - content_width) // 2 - bbox[0]
    paste_y = FOOT_BASELINE - content_bottom
    canvas.alpha_composite(resized, (paste_x, paste_y))
    canvas.save(OUTPUT_DIR / f"neon_{name}.png")


SOURCE_IMAGE = Image.open(SOURCE)
create_pose("dash", (404, 895, 579, 1053), 1.48, erase_speed_lines=True)
create_pose("wall_slide", (40, 890, 195, 1055), 1.42, erase_ladder=True)
