#!/usr/bin/env python3
"""Normalize alpha character frames to a shared baseline and pack a PNG strip."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def normalized_frame(path: Path, cell: int, baseline: int) -> Image.Image:
    source = Image.open(path).convert("RGBA")
    alpha = source.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError(f"No opaque pixels: {path}")

    subject = source.crop(bounds)
    max_width = cell - 20
    max_height = min(baseline - 12, cell - 20)
    scale = min(max_width / subject.width, max_height / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)

    frame = Image.new("RGBA", (cell, cell))
    x = (cell - subject.width) // 2
    y = baseline - subject.height
    frame.alpha_composite(subject, (x, y))
    return frame


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cell", type=int, required=True)
    parser.add_argument("--baseline", type=int, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("frames", nargs="+", type=Path)
    args = parser.parse_args()

    if not 0 < args.baseline < args.cell:
        raise ValueError("baseline must be inside the cell")

    strip = Image.new("RGBA", (args.cell * len(args.frames), args.cell))
    for index, frame_path in enumerate(args.frames):
        strip.alpha_composite(normalized_frame(frame_path, args.cell, args.baseline), (index * args.cell, 0))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    strip.save(args.out)


if __name__ == "__main__":
    main()
