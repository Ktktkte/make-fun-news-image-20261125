#!/usr/bin/env python3
"""Draw the 25 November 2026 world-news front page (1024x1024 PNG).

Six stories, verified live by the parent on 2026-11-25. The script is fully
deterministic: same inputs always produce the same PNG bytes.
"""
import os
import textwrap
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "entry.png")

W, H = 1024, 1024
PAPER = (247, 243, 234)      # warm off-white
NAVY = (20, 33, 61)          # header band / headlines
AMBER = (232, 163, 23)       # accent
INK = (30, 30, 30)           # body text
GREY = (90, 88, 82)          # secondary text
CARD = (255, 255, 255)
BORDER = (214, 208, 194)

FONT_CANDIDATES = [
    ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
     "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ("/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
     "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"),
    ("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
     "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
]


def load_fonts():
    for bold_path, reg_path in FONT_CANDIDATES:
        if os.path.exists(bold_path) and os.path.exists(reg_path):
            return bold_path, reg_path
    raise SystemExit("no usable TTF fonts found")


BOLD_PATH, REG_PATH = load_fonts()


def bold(size):
    return ImageFont.truetype(BOLD_PATH, size)


def regular(size):
    return ImageFont.truetype(REG_PATH, size)


def wrap(draw, text, font, max_width):
    """Greedy word wrap measured with the real font."""
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = (current + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


STORIES = [
    ("UKRAINE HIT A RUSSIAN SHIP",
     "Zelenskiy confirmed Kyiv's drone strike on a Russian cargo ship "
     "in the Gulf of Finland; Norway urged caution.",
     "ship"),
    ("HOUTHIS STRIKE RIYADH TOWER",
     "The PIF Tower was hit for the second time in less than a week; "
     "at least 11 people wounded, Saudi Civil Defense said.",
     "tower"),
    ("TRUMP HONOURS GIULIANI",
     "Donald Trump awarded former New York mayor Rudy Giuliani "
     "the Presidential Medal of Freedom.",
     "medal"),
    ("HUAWEI CONVICTED IN U.S. TRIAL",
     "Huawei was found guilty of stealing trade secrets over its "
     "Iran business; acquitted of racketeering.",
     "chip"),
    ("TURKEYS SPARED FOR THANKSGIVING",
     "Trump spared turkeys Freedom and Feathers from their "
     "Thanksgiving fate at the annual pardon.",
     "turkey"),
    ("TANKERS HIT IN HORMUZ STRAIT",
     "Iran's Revolutionary Guard Navy claimed three oil tankers "
     "were hit by naval mines in the strait.",
     "tanker"),
]


def draw_ship(d, cx, cy, s):
    # Hull, mast, flag and waves — a cargo ship seen side-on.
    d.polygon([(cx - 34, cy + 6), (cx + 34, cy + 6), (cx + 24, cy + 22),
               (cx - 24, cy + 22)], fill=NAVY)
    d.line([(cx, cy - 26), (cx, cy + 6)], fill=NAVY, width=4)
    d.polygon([(cx, cy - 26), (cx + 18, cy - 19), (cx, cy - 12)], fill=AMBER)
    d.rectangle([cx - 16, cy - 8, cx + 12, cy + 6], outline=NAVY, width=3)
    d.arc([cx - 38, cy + 26, cx + 38, cy + 38], 0, 180, fill=AMBER, width=3)


def draw_tower(d, cx, cy, s):
    d.rectangle([cx - 16, cy - 30, cx + 16, cy + 28], outline=NAVY, width=4)
    d.line([(cx, cy - 44), (cx, cy - 30)], fill=NAVY, width=4)
    for wy in (-18, -4, 10):
        for wx in (-9, 3):
            d.rectangle([cx + wx, cy + wy, cx + wx + 5, cy + wy + 5], fill=AMBER)
    d.line([(cx + 22, cy - 40), (cx + 34, cy - 28)], fill=AMBER, width=3)
    d.line([(cx + 34, cy - 40), (cx + 22, cy - 28)], fill=AMBER, width=3)


def draw_medal(d, cx, cy, s):
    d.polygon([(cx - 16, cy - 34), (cx - 4, cy - 10), (cx + 4, cy - 10),
               (cx + 16, cy - 34)], fill=AMBER)
    d.ellipse([cx - 24, cy - 12, cx + 24, cy + 36], outline=NAVY, width=4)
    d.ellipse([cx - 14, cy - 2, cx + 14, cy + 26], fill=AMBER)
    d.text((cx, cy + 12), "*", font=bold(30), fill=NAVY, anchor="mm")


def draw_chip(d, cx, cy, s):
    d.rectangle([cx - 22, cy - 22, cx + 22, cy + 22], outline=NAVY, width=4)
    d.rectangle([cx - 10, cy - 10, cx + 10, cy + 10], fill=AMBER)
    for i in (-14, 0, 14):
        d.line([(cx + i, cy - 34), (cx + i, cy - 22)], fill=NAVY, width=3)
        d.line([(cx + i, cy + 22), (cx + i, cy + 34)], fill=NAVY, width=3)
        d.line([(cx - 34, cy + i), (cx - 22, cy + i)], fill=NAVY, width=3)
        d.line([(cx + 22, cy + i), (cx + 34, cy + i)], fill=NAVY, width=3)


def draw_turkey(d, cx, cy, s):
    for ang in (-50, -25, 0, 25, 50):
        d.arc([cx - 34, cy - 34, cx + 34, cy + 10], 180 + ang - 12,
              180 + ang + 12, fill=AMBER, width=4)
    d.ellipse([cx - 20, cy - 6, cx + 20, cy + 30], fill=NAVY)
    d.ellipse([cx + 6, cy - 24, cx + 24, cy - 6], fill=NAVY)
    d.polygon([(cx + 24, cy - 16), (cx + 32, cy - 12), (cx + 24, cy - 8)],
              fill=AMBER)


def draw_tanker(d, cx, cy, s):
    d.rectangle([cx - 38, cy + 2, cx + 38, cy + 18], fill=NAVY)
    d.rectangle([cx + 14, cy - 20, cx + 34, cy + 2], outline=NAVY, width=3)
    d.line([(cx + 24, cy - 30), (cx + 24, cy - 20)], fill=NAVY, width=3)
    d.arc([cx - 40, cy + 22, cx + 40, cy + 34], 0, 180, fill=AMBER, width=3)


ICONS = {"ship": draw_ship, "tower": draw_tower, "medal": draw_medal,
         "chip": draw_chip, "turkey": draw_turkey, "tanker": draw_tanker}


def main():
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)

    # ---- header band ----
    d.rectangle([0, 0, W, 150], fill=NAVY)
    d.text((36, 26), "THE WORLD IN ONE PAGE", font=bold(30), fill=AMBER)
    d.text((36, 66), "WEDNESDAY 25 NOVEMBER 2026", font=bold(46), fill=(255, 255, 255))
    d.rectangle([0, 150, W, 156], fill=AMBER)

    # ---- six story rows ----
    row_h, gap, top = 128, 8, 168
    head_font = bold(29)
    fact_font = regular(23)
    for i, (headline, fact, icon) in enumerate(STORIES):
        y0 = top + i * (row_h + gap)
        y1 = y0 + row_h
        d.rounded_rectangle([36, y0, W - 36, y1], radius=10,
                            fill=CARD, outline=BORDER, width=2)
        # numbered badge
        bx, by = 62, y0 + row_h // 2
        d.ellipse([bx - 27, by - 27, bx + 27, by + 27], fill=AMBER)
        d.text((bx, by - 1), str(i + 1), font=bold(30), fill=NAVY, anchor="mm")
        # headline + fact
        tx = 108
        d.text((tx, y0 + 14), headline, font=head_font, fill=NAVY)
        lines = wrap(d, fact, fact_font, 742)
        ly = y0 + 56
        for line in lines[:2]:
            d.text((tx, ly), line, font=fact_font, fill=INK)
            ly += 30
        # icon on the right
        ICONS[icon](d, 928, y0 + row_h // 2, 1)

    # ---- footer ----
    d.text((36, 988), "make.fun  ·  news-image-20261125  ·  All six stories reported 24–25 November 2026",
           font=regular(20), fill=GREY)

    img.save(OUT, "PNG", optimize=True)
    print("wrote", OUT, img.size, os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
