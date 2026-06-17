"""Generate og-image.png (1200x630) — the social share hero for presence.

Before/after frame: 1999 on the left ("three known networks · the warning"),
2026 on the right ("you cannot count them"). The whole arc of the piece
in a single share preview.

Run from the repo root:
    python generate-og-png.py

Output: og-image.png next to the script.
"""
from __future__ import annotations

import os
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
OUT = Path(__file__).with_name("og-image.png")


# ----------------- color helpers -----------------
def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# ----------------- fonts -----------------
def find_font(candidates: list[str], size: int) -> ImageFont.ImageFont:
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


WIN_FONTS = r"C:\\Windows\\Fonts"
MONO_HUGE = find_font(
    [os.path.join(WIN_FONTS, "consola.ttf"), os.path.join(WIN_FONTS, "cour.ttf")],
    size=200,
)
MONO_BIG = find_font(
    [os.path.join(WIN_FONTS, "consola.ttf"), os.path.join(WIN_FONTS, "cour.ttf")],
    size=22,
)
MONO_MED = find_font(
    [os.path.join(WIN_FONTS, "consola.ttf"), os.path.join(WIN_FONTS, "cour.ttf")],
    size=17,
)
MONO_TINY = find_font(
    [os.path.join(WIN_FONTS, "consola.ttf"), os.path.join(WIN_FONTS, "cour.ttf")],
    size=12,
)
MONO_TAG = find_font(
    [os.path.join(WIN_FONTS, "consola.ttf"), os.path.join(WIN_FONTS, "cour.ttf")],
    size=14,
)


# ----------------- canvas + matrix rain -----------------
img = Image.new("RGB", (W, H), hex_to_rgb("#03060c"))
draw = ImageDraw.Draw(img)

rain = Image.new("RGBA", (W, H), (0, 0, 0, 0))
rdraw = ImageDraw.Draw(rain)
chars = "0101010101アイウエオカキクケコサシスセソタチツテト"
random.seed(20260101)
font_rain = find_font(
    [os.path.join(WIN_FONTS, "consola.ttf"), os.path.join(WIN_FONTS, "cour.ttf")],
    size=15,
)
# Edge-heavy rain: dense at far left and far right, sparse in the middle
# so the eye lands on the year text without being fought.
for col_x in range(20, W, 20):
    near_edge = col_x < 200 or col_x > 1000
    streams = random.randint(1, 3) if near_edge else random.randint(0, 1)
    for _ in range(streams):
        length = random.randint(4, 14)
        start_y = random.randint(-30, H - 20)
        intensity = 0.55 + random.random() * 0.45
        for r_idx in range(length):
            y = start_y + r_idx * 17
            if y >= H + 20:
                break
            ch = chars[random.randint(0, len(chars) - 1)]
            if r_idx == 0:
                rdraw.text((col_x, y), ch, fill=(200, 255, 220, int(220 * intensity)), font=font_rain)
            elif r_idx <= 2:
                rdraw.text((col_x, y), ch, fill=(0, 255, 102, int(160 * intensity)), font=font_rain)
            else:
                rdraw.text((col_x, y), ch, fill=(0, 200, 80, int(110 * intensity * (1 - r_idx / length))), font=font_rain)

img = Image.alpha_composite(img.convert("RGBA"), rain).convert("RGB")
draw = ImageDraw.Draw(img)


# ----------------- vignette focus -----------------
vig = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(vig)
cx, cy = W // 2, H // 2
max_r = int((cx ** 2 + cy ** 2) ** 0.5)
for i in range(80, 0, -1):
    r = int(max_r * (i / 80))
    alpha = int(230 * (i / 80) ** 2)
    vd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=alpha)
vig = vig.filter(ImageFilter.GaussianBlur(40))
img.paste(Image.new("RGB", (W, H), (0, 0, 3)), (0, 0), vig)
draw = ImageDraw.Draw(img)


# ----------------- helpers -----------------
def text_w(text: str, font: ImageFont.ImageFont) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def draw_with_glow(xy, text, font, fill, glow_rgba, glow_radius=10):
    x, y = xy
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow_layer).text((x, y), text, fill=glow_rgba, font=font)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(glow_radius))
    img.paste(glow_layer, (0, 0), glow_layer)
    draw.text((x, y), text, fill=fill, font=font)


def draw_spaced(y, text, font, fill, spacing_px=4, glow_rgba=None, glow_radius=6, anchor_x=None):
    glyphs = list(text)
    widths = [text_w(g, font) for g in glyphs]
    total = sum(widths) + spacing_px * (len(glyphs) - 1)
    x = anchor_x - total // 2 if anchor_x is not None else (W - total) // 2
    if glow_rgba is not None:
        glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow_layer)
        cur = x
        for g, gw in zip(glyphs, widths):
            gd.text((cur, y), g, fill=glow_rgba, font=font)
            cur += gw + spacing_px
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(glow_radius))
        img.paste(glow_layer, (0, 0), glow_layer)
    cur = x
    for g, gw in zip(glyphs, widths):
        draw.text((cur, y), g, fill=fill, font=font)
        cur += gw + spacing_px


GREEN = hex_to_rgb("#00ff66")
GREEN_GLOW = (0, 255, 102, 200)
WHITE = (255, 255, 255)
WHITE_DIM = (244, 237, 225)


# ----------------- TOP TAGLINE -----------------
draw_spaced(
    66,
    "RIGHT NOW · AI PROMPTS ANSWERED EVERY SECOND",
    MONO_TINY,
    fill=GREEN,
    spacing_px=2,
    glow_rgba=GREEN_GLOW,
    glow_radius=5,
)


# ----------------- LEFT PANEL: 1999 -----------------
left_cx = 320

# small label above
draw_spaced(
    122,
    "THE WARNING",
    MONO_BIG,
    fill=GREEN,
    spacing_px=4,
    glow_rgba=GREEN_GLOW,
    glow_radius=6,
    anchor_x=left_cx,
)

# big "1999"
big_text = "1999"
big_w = text_w(big_text, MONO_HUGE)
big_x = left_cx - big_w // 2
big_y = 160
glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow_layer).text((big_x, big_y), big_text, fill=(255, 255, 255, 140), font=MONO_HUGE)
glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(22))
img.paste(glow_layer, (0, 0), glow_layer)
draw.text((big_x, big_y), big_text, fill=WHITE, font=MONO_HUGE)

# line(s) under
left_lines = [
    "the matrix premieres",
    "NVIDIA invents the GPU",
    "three known networks",
]
ly = 388
for line in left_lines:
    tw = text_w(line, MONO_MED)
    draw.text((left_cx - tw // 2, ly), line, fill=WHITE_DIM, font=MONO_MED)
    ly += 28


# ----------------- DIVIDER ARROW -----------------
# subtle vertical dotted line + arrow in the center
for y in range(180, 460, 10):
    draw.ellipse([W // 2 - 1, y, W // 2 + 1, y + 2], fill=(244, 237, 225, 90))
# arrow chevron pointing right at midline
mid_y = 320
chev_color = GREEN
chev_glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(chev_glow)
cd.line([(W // 2 - 8, mid_y - 14), (W // 2 + 8, mid_y), (W // 2 - 8, mid_y + 14)], fill=GREEN_GLOW, width=4)
chev_glow = chev_glow.filter(ImageFilter.GaussianBlur(6))
img.paste(chev_glow, (0, 0), chev_glow)
draw.line([(W // 2 - 8, mid_y - 14), (W // 2 + 8, mid_y), (W // 2 - 8, mid_y + 14)], fill=chev_color, width=3)


# ----------------- RIGHT PANEL: 2026 -----------------
right_cx = 880

draw_spaced(
    122,
    "NOW",
    MONO_BIG,
    fill=GREEN,
    spacing_px=4,
    glow_rgba=GREEN_GLOW,
    glow_radius=6,
    anchor_x=right_cx,
)

big_text2 = "2026"
big_w2 = text_w(big_text2, MONO_HUGE)
big_x2 = right_cx - big_w2 // 2
big_y2 = 160
glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow_layer).text((big_x2, big_y2), big_text2, fill=(255, 255, 255, 140), font=MONO_HUGE)
glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(22))
img.paste(glow_layer, (0, 0), glow_layer)
draw.text((big_x2, big_y2), big_text2, fill=WHITE, font=MONO_HUGE)

right_lines = [
    "~80,000 AI prompts",
    "every second",
    "you cannot count them",
]
ly = 388
for i, line in enumerate(right_lines):
    if i == 2:
        # the punchline glows green
        tw = text_w(line, MONO_MED)
        draw_with_glow((right_cx - tw // 2, ly), line, MONO_MED, fill=GREEN, glow_rgba=GREEN_GLOW, glow_radius=6)
    else:
        tw = text_w(line, MONO_MED)
        draw.text((right_cx - tw // 2, ly), line, fill=WHITE_DIM, font=MONO_MED)
    ly += 28


# ----------------- FOOTER BAR -----------------
draw.line([(100, 540), (W - 100, 540)], fill=(244, 237, 225, 50), width=1)
draw.text((100, 555), "PRESENCE", fill=WHITE_DIM, font=MONO_BIG)
draw.text((100, 587), "a live map of the AI already on Earth", fill=(244, 237, 225, 130), font=MONO_TINY)
draw.text((100, 603), "an Accelerant project", fill=(244, 237, 225, 115), font=MONO_TINY)

# right side: WATCH →
watch = "WATCH →"
tw = text_w(watch, MONO_TAG)
draw_with_glow((W - 100 - tw, 580), watch, MONO_TAG, fill=GREEN, glow_rgba=GREEN_GLOW, glow_radius=6)


# ----------------- save -----------------
img.save(OUT, "PNG", optimize=True)
size_kb = OUT.stat().st_size / 1024
print(f"wrote {OUT} ({size_kb:.1f} KB)")
