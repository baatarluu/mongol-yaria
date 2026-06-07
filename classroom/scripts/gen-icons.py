#!/usr/bin/env python3
"""
PWA дүрс үүсгэгч — гадны хамаарал шаардахгүй (зөвхөн stdlib zlib).
Брэндийн градиент дэвсгэр дээр цагаан өнгийн төгсөлтийн малгай (mortarboard)
зурж, classroom/public/icons/ дотор PNG-үүд үүсгэнэ.

Ажиллуулах:  python3 scripts/gen-icons.py
"""
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

# Брэндийн өнгүүд (Tailwind brand)
TOP = (0x34, 0x77, 0xFF)   # brand-500
BOT = (0x18, 0x43, 0xE1)   # brand-700
WHITE = (255, 255, 255)
TASSEL = (0xFF, 0xD1, 0x66)  # алтлаг сэрвээ


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def point_in_poly(px, py, poly):
    """Convex/ердийн олон өнцөгт доторх цэг эсэхийг ray-casting-аар шалгана."""
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def dist_to_seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    cx, cy = ax + t * dx, ay + t * dy
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5


def make_icon(size, rounded=True):
    s = size
    r = s * 0.22  # булангийн радиус (rounded үед)
    px = bytearray()

    # Малгайн геометр (0..1 нормчилсон координат)
    board = [(0.16, 0.44), (0.50, 0.30), (0.84, 0.44), (0.50, 0.58)]
    base = [(0.355, 0.515), (0.645, 0.515), (0.60, 0.70), (0.40, 0.70)]
    btn = (0.50, 0.44)            # төвийн товч
    t0 = (0.50, 0.44)             # сэрвээний эхлэл (төв)
    t1 = (0.74, 0.50)             # баруун тийш
    t2 = (0.74, 0.70)             # доош унжина
    knob = (0.74, 0.715)          # сэрвээний бөмбөг

    for y in range(s):
        # Мөр бүрт filter байт = 0
        px.append(0)
        for x in range(s):
            # Дэвсгэр градиент
            col = list(lerp(TOP, BOT, y / max(1, s - 1)))
            a = 255

            # Дугуй булан (зөвхөн rounded үед)
            if rounded:
                cx = min(x, s - 1 - x)
                cy = min(y, s - 1 - y)
                if cx < r and cy < r:
                    dx, dy = r - cx, r - cy
                    if dx * dx + dy * dy > r * r:
                        a = 0  # булангийн гадна тал тунгалаг

            nx, ny = (x + 0.5) / s, (y + 0.5) / s

            if a != 0:
                # Сэрвээ (шугам + бөмбөг)
                on_tassel = (
                    dist_to_seg(nx, ny, *t0, *t1) < 0.012
                    or dist_to_seg(nx, ny, *t1, *t2) < 0.012
                    or ((nx - knob[0]) ** 2 + (ny - knob[1]) ** 2) ** 0.5 < 0.028
                )
                if on_tassel:
                    col = list(TASSEL)
                elif point_in_poly(nx, ny, base) or point_in_poly(nx, ny, board):
                    col = list(WHITE)
                # Төвийн товч (малгай дээрх)
                if ((nx - btn[0]) ** 2 + (ny - btn[1]) ** 2) ** 0.5 < 0.022:
                    col = list(TASSEL)

            px.extend([col[0], col[1], col[2], a])

    return bytes(px)


def write_png(path, size, raw):
    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    idat = zlib.compress(raw, 9)
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))


def main():
    os.makedirs(OUT, exist_ok=True)
    targets = [
        ("icon-192.png", 192, True),
        ("icon-512.png", 512, True),
        ("maskable-512.png", 512, False),   # full-bleed (OS өөрөө маскална)
        ("apple-touch-icon.png", 180, False),
        ("favicon-32.png", 32, True),
    ]
    for name, size, rounded in targets:
        raw = make_icon(size, rounded)
        write_png(os.path.join(OUT, name), size, raw)
        print("wrote", name, size)


if __name__ == "__main__":
    main()
