"""Generate og-image.png (1200x630) — the social-card hero for presence.

Recreates the same composition as og-image.svg but as a raster PNG so
Twitter/X, Facebook, LinkedIn etc. (which don't accept SVG og:images)
have a real preview image to render.

Run from the repo root:
    python generate-og-png.py

Output: og-image.png next to the script.
"""
from __future__ import annotations

import os
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
OUT = Path(__file__).with_name("og-image.png")


# ----------------- color helpers -----------------
def hex_to_rgba(h: str, a: int = 255) -> tuple[int, int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


# ----------------- font loading -----------------
def find_font(candidates: list[str], size: int) -> ImageFont.ImageFont:
    """Try a sequence of font files; fall back to PIL default if none found."""
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()


WIN_FONTS = r"C:\\Windows\\Fonts"
SERIF_ITALIC = find_font(
    [
        os.path.join(WIN_FONTS, "georgiai.ttf"),    # Georgia italic
        os.path.join(WIN_FONTS, "timesi.ttf"),      # Times italic
        os.path.join(WIN_FONTS, "cambriai.ttf"),    # Cambria italic
    ],
    size=58,
)
MONO_BIG = find_font(
    [
        os.path.join(WIN_FONTS, "consola.ttf"),
        os.path.join(WIN_FONTS, "cour.ttf"),
    ],
    size=168,
)
MONO_MED = find_font(
    [
        os.path.join(WIN_FONTS, "consola.ttf"),
        os.path.join(WIN_FONTS, "cour.ttf"),
    ],
    size=20,
)
MONO_SMALL = find_font(
    [
        os.path.join(WIN_FONTS, "consola.ttf"),
        os.path.join(WIN_FONTS, "cour.ttf"),
    ],
    size=15,
)
MONO_TINY = find_font(
    [
        os.path.join(WIN_FONTS, "consola.ttf"),
        os.path.join(WIN_FONTS, "cour.ttf"),
    ],
    size=12,
)


# ----------------- canvas + background -----------------
img = Image.new("RGB", (W, H), hex_to_rgba("#03060c")[:3])
draw = ImageDraw.Draw(img)


# Matrix code-rain hint — sparse columns of green characters at low alpha.
# Drawn in a separate alpha layer so we get true transparency over the bg.
rain_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
rain_draw = ImageDraw.Draw(rain_layer)
CHARS = "0101010101アイウエオカキクケコサシスセソタチツテトナニ"
random.seed(20260101)  # deterministic so reruns produce identical output

# Build columns; clear the center area so text isn't fighting the rain.
col_step = 18
font_rain = find_font(
    [
        os.path.join(WIN_FONTS, "consola.ttf"),
        os.path.join(WIN_FONTS, "cour.ttf"),
    ],
    size=16,
)
center_x_min, center_x_max = 240, 960  # carve a quiet middle band
center_y_min, center_y_max = 70, 540
for col_x in range(20, W, col_step):
    in_center_x = center_x_min <= col_x <= center_x_max
    streams = 1 + random.randint(0, 2)
    for _ in range(streams):
        length = random.randint(4, 14)
        start_y = random.randint(-40, H - 20)
        intensity = 0.45 + random.random() * 0.55
        for r_idx in range(length):
            y = start_y + r_idx * 17
            if y >= H + 20:
                break
            # leave center band quieter
            if in_center_x and center_y_min < y < center_y_max and random.random() < 0.85:
                continue
            ch = CHARS[random.randint(0, len(CHARS) - 1)]
            if r_idx == 0:
                rain_draw.text((col_x, y), ch, fill=(200, 255, 220, int(190 * intensity)), font=font_rain)
            elif r_idx <= 2:
                rain_draw.text((col_x, y), ch, fill=(0, 255, 102, int(140 * intensity * (1 - r_idx / length))), font=font_rain)
            else:
                rain_draw.text((col_x, y), ch, fill=(0, 200, 80, int(105 * intensity * (1 - r_idx / length))), font=font_rain)

img = Image.alpha_composite(img.convert("RGBA"), rain_layer).convert("RGB")
draw = ImageDraw.Draw(img)


# Radial vignette — darken corners so the eye lands on center text.
# We draw a radial gradient onto an alpha layer using concentric ellipses.
vig = Image.new("L", (W, H), 0)
vig_draw = ImageDraw.Draw(vig)
cx, cy = W // 2, H // 2
max_r = int((cx ** 2 + cy ** 2) ** 0.5)
steps = 80
for i in range(steps, 0, -1):
    r = int(max_r * (i / steps))
    alpha = int(220 * (i / steps) ** 2)  # quadratic — dark only near edges
    vig_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=alpha)
vig = vig.filter(ImageFilter.GaussianBlur(40))
black = Image.new("RGB", (W, H), (0, 0, 3))
img.paste(black, (0, 0), vig)
draw = ImageDraw.Draw(img)


# ----------------- helpers for centered, glowing text -----------------
def text_w(text: str, font: ImageFont.ImageFont) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def draw_centered(y: int, text: str, font: ImageFont.ImageFont, fill: tuple, glow_rgba: tuple | None = None, glow_radius: int = 8):
    x = (W - text_w(text, font)) // 2
    if glow_rgba is not None:
        glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(glow_layer).text((x, y), text, fill=glow_rgba, font=font)
        glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(glow_radius))
        img.paste(glow_layer, (0, 0), glow_layer)
    draw.text((x, y), text, fill=fill, font=font)


# A reusable letterspaced text helper — Pillow has no native letter-spacing.
def draw_centered_spaced(y: int, text: str, font: ImageFont.ImageFont, fill: tuple, spacing_px: int = 4, glow_rgba: tuple | None = None, glow_radius: int = 6):
    glyphs = list(text)
    widths = [text_w(g, font) for g in glyphs]
    total_w = sum(widths) + spacing_px * (len(glyphs) - 1)
    x = (W - total_w) // 2
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


GREEN = hex_to_rgba("#00ff66")
GREEN_GLOW = (0, 255, 102, 180)
TEXT = hex_to_rgba("#f4ede1")


# ----------------- the quote block (top) -----------------
# Render quote marks in green; rest of the line in cream italic.
def draw_quote_line(y: int, before_q: str, body: str, after_q: str):
    body_font = SERIF_ITALIC
    # measure widths
    bf_w = text_w(body, body_font)
    qm_font = find_font(
        [
            os.path.join(WIN_FONTS, "georgia.ttf"),
            os.path.join(WIN_FONTS, "times.ttf"),
            os.path.join(WIN_FONTS, "cambria.ttf"),
        ],
        size=58,
    )
    bq_w = text_w(before_q, qm_font) if before_q else 0
    aq_w = text_w(after_q, qm_font) if after_q else 0
    total = bq_w + bf_w + aq_w
    x = (W - total) // 2

    if before_q:
        # green glow + green text
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(glow).text((x, y), before_q, fill=GREEN_GLOW, font=qm_font)
        glow = glow.filter(ImageFilter.GaussianBlur(8))
        img.paste(glow, (0, 0), glow)
        draw.text((x, y), before_q, fill=GREEN, font=qm_font)
        x += bq_w

    draw.text((x, y), body, fill=TEXT, font=body_font)
    x += bf_w

    if after_q:
        glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(glow).text((x, y), after_q, fill=GREEN_GLOW, font=qm_font)
        glow = glow.filter(ImageFilter.GaussianBlur(8))
        img.paste(glow, (0, 0), glow)
        draw.text((x, y), after_q, fill=GREEN, font=qm_font)


draw_quote_line(60, "“", "Humankind is a virus.", "")
draw_quote_line(124, "", "You are a plague.", "”")

# attribution
draw_centered_spaced(
    200,
    "— AGENT SMITH · THE MATRIX · 1999",
    MONO_SMALL,
    fill=GREEN,
    spacing_px=3,
    glow_rgba=GREEN_GLOW,
    glow_radius=4,
)

# thin divider
draw.line([(W // 2 - 60, 245), (W // 2 + 60, 245)], fill=(244, 237, 225, 51), width=1)

# small green label above number
draw_centered_spaced(
    272,
    "RIGHT NOW · GLOBALLY",
    MONO_SMALL,
    fill=GREEN,
    spacing_px=4,
    glow_rgba=GREEN_GLOW,
    glow_radius=4,
)


# ----------------- the big number -----------------
big = "~80,000"
# warm glow halo behind it
big_w = text_w(big, MONO_BIG)
big_x = (W - big_w) // 2
big_y = 296

glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow_layer)
gd.text((big_x, big_y), big, fill=(255, 255, 255, 110), font=MONO_BIG)
glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(18))
img.paste(glow_layer, (0, 0), glow_layer)
draw.text((big_x, big_y), big, fill=(255, 255, 255), font=MONO_BIG)

# label under big number
draw_centered_spaced(
    480,
    "AI PROMPTS · EVERY SECOND",
    MONO_MED,
    fill=TEXT,
    spacing_px=4,
)

# citation
cite = "est. from public usage of ChatGPT · Gemini · Claude · Copilot · Meta AI · DeepSeek"
draw_centered(
    520,
    cite,
    MONO_TINY,
    fill=(244, 237, 225, 115),
)


# ----------------- footer bar -----------------
draw.line([(100, 568), (W - 100, 568)], fill=(244, 237, 225, 38), width=1)

# brand left
draw.text((100, 575), "PRESENCE", fill=(244, 237, 225), font=MONO_MED)
draw.text((100, 598), "a live map of the AI already on Earth", fill=(244, 237, 225, 140), font=MONO_TINY)
# quiet parent-brand attribution
draw.text((100, 614), "an Accelerant project", fill=(244, 237, 225, 115), font=MONO_TINY)

# watch arrow right
watch_text = "WATCH →"
watch_w = text_w(watch_text, MONO_MED)
glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow_layer).text((W - 100 - watch_w, 595), watch_text, fill=GREEN_GLOW, font=MONO_MED)
glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(6))
img.paste(glow_layer, (0, 0), glow_layer)
draw.text((W - 100 - watch_w, 595), watch_text, fill=GREEN, font=MONO_MED)


# ----------------- save -----------------
img.save(OUT, "PNG", optimize=True)
size_kb = OUT.stat().st_size / 1024
print(f"wrote {OUT} ({size_kb:.1f} KB)")
