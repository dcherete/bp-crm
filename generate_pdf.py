#!/usr/bin/env python3
"""
Projeto Sovereign — PDF Presentation Generator
Brasil Paralelo | Abril 2026
Run: python3 generate_pdf.py
"""

from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.colors import Color
import math

# ---------------------------------------------------------------------------
# Design System
# ---------------------------------------------------------------------------
DARK_BG  = Color(0.051, 0.067, 0.090)
CARD_BG  = Color(0.086, 0.106, 0.133)
SURFACE  = Color(0.129, 0.149, 0.176)
RED      = Color(0.973, 0.318, 0.286)
AMBER    = Color(0.890, 0.702, 0.255)
GREEN    = Color(0.247, 0.725, 0.314)
BLUE     = Color(0.345, 0.651, 1.000)
PURPLE   = Color(0.737, 0.549, 1.000)
WHITE    = Color(0.941, 0.965, 0.988)
GRAY     = Color(0.545, 0.580, 0.620)
BLACK    = Color(0, 0, 0)

W, H = landscape(A4)  # 841.89 x 595.28 pt

OUTPUT = "/Users/davi.silva/Desktop/claude/projetos-bp/crm/projeto-sovereign-apresentacao.pdf"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def fill_background(c, color=DARK_BG):
    c.setFillColor(color)
    c.rect(0, 0, W, H, fill=1, stroke=0)


def accent_bar(c, color=AMBER, width=8, side="left"):
    c.setFillColor(color)
    if side == "left":
        c.rect(0, 0, width, H, fill=1, stroke=0)
    else:
        c.rect(W - width, 0, width, H, fill=1, stroke=0)


def draw_text(c, text, x, y, font="Helvetica", size=13, color=WHITE, align="left"):
    c.setFillColor(color)
    c.setFont(font, size)
    if align == "center":
        c.drawCentredString(x, y, text)
    elif align == "right":
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)


def draw_card(c, x, y, w, h, fill=CARD_BG, stroke_color=None, stroke_width=1.5, radius=6):
    c.setFillColor(fill)
    if stroke_color:
        c.setStrokeColor(stroke_color)
        c.setLineWidth(stroke_width)
        c.roundRect(x, y, w, h, radius, fill=1, stroke=1)
    else:
        c.setStrokeColor(CARD_BG)
        c.roundRect(x, y, w, h, radius, fill=1, stroke=0)


def draw_badge(c, x, y, w, h, label, value, label_color=WHITE, value_color=GREEN, bg=CARD_BG):
    draw_card(c, x, y, w, h, fill=bg)
    draw_text(c, value, x + w / 2, y + h * 0.55, "Helvetica-Bold", 14, value_color, "center")
    draw_text(c, label, x + w / 2, y + h * 0.25, "Helvetica", 9, GRAY, "center")


def draw_horizontal_bar(c, x, y, bar_w, bar_h, fill_color, label, amount, pct, max_w):
    # background track
    c.setFillColor(SURFACE)
    c.roundRect(x, y, max_w, bar_h, 3, fill=1, stroke=0)
    # filled portion
    filled = max(bar_w * 0.04, bar_w)
    c.setFillColor(fill_color)
    c.roundRect(x, y, filled, bar_h, 3, fill=1, stroke=0)
    # label left
    draw_text(c, label, x - 5, y + bar_h * 0.25, "Helvetica", 10, WHITE, "right")
    # amount right
    draw_text(c, amount, x + max_w + 8, y + bar_h * 0.25, "Helvetica-Bold", 10, WHITE)
    # pct inside bar if wide enough
    if filled > 40:
        draw_text(c, pct, x + filled - 4, y + bar_h * 0.25, "Helvetica", 9, DARK_BG, "right")


def draw_vertical_bar(c, x, bar_bottom, bar_w, bar_h, fill_color, label, value_text, max_h):
    # bar
    c.setFillColor(fill_color)
    c.roundRect(x, bar_bottom, bar_w, bar_h, 4, fill=1, stroke=0)
    # value above
    draw_text(c, value_text, x + bar_w / 2, bar_bottom + bar_h + 6, "Helvetica-Bold", 8, WHITE, "center")
    # label below
    draw_text(c, label, x + bar_w / 2, bar_bottom - 14, "Helvetica", 8, GRAY, "center")


def slide_number(c, n):
    draw_text(c, f"{n} / 12", W - 24, 14, "Helvetica", 8, GRAY, "right")


def footer(c, text="Projeto Sovereign | Brasil Paralelo | Abril 2026 | Confidencial"):
    draw_text(c, text, W / 2, 12, "Helvetica", 8, GRAY, "center")


# ---------------------------------------------------------------------------
# Slide 1 — Hook
# ---------------------------------------------------------------------------
def slide_01(c):
    fill_background(c)
    accent_bar(c, AMBER, 8, "left")

    # Hero number
    draw_text(c, "R$ 10,9 Milhões por Ano.", W / 2, H * 0.64, "Helvetica-Bold", 40, WHITE, "center")
    draw_text(c, "Existe uma alternativa mais inteligente?", W / 2, H * 0.53, "Helvetica", 20, BLUE, "center")

    # 3 badges
    bw, bh = 180, 72
    gap = 24
    total = 3 * bw + 2 * gap
    sx = (W - total) / 2
    by = H * 0.28

    badges = [
        ("POC Concluída", "Mar 2026", GREEN),
        ("372 jobs/s", "Validado", BLUE),
        ("14/set/2026", "Deadline", RED),
    ]
    for i, (val, lbl, col) in enumerate(badges):
        bx = sx + i * (bw + gap)
        draw_card(c, bx, by, bw, bh, fill=CARD_BG, stroke_color=col, stroke_width=1.5)
        draw_text(c, val, bx + bw / 2, by + bh * 0.55, "Helvetica-Bold", 16, col, "center")
        draw_text(c, lbl, bx + bw / 2, by + bh * 0.22, "Helvetica", 10, GRAY, "center")

    footer(c)
    slide_number(c, 1)


# ---------------------------------------------------------------------------
# Slide 2 — Decomposição do Contrato
# ---------------------------------------------------------------------------
def slide_02(c):
    fill_background(c)
    accent_bar(c, RED, 5, "left")

    draw_text(c, "O Contrato Insider — Onde Vai o Dinheiro", W / 2, H - 48, "Helvetica-Bold", 26, WHITE, "center")
    draw_text(c, "R$ 10.854.708/ano com impostos", W / 2, H - 76, "Helvetica", 14, RED, "center")

    # Bar chart data
    data = [
        ("WhatsApp",  "R$ 7.130.025", "66%", 0.66, RED),
        ("Email",     "R$ 1.063.957", "10%", 0.10, BLUE),
        ("Architect", "R$ 441.371",   " 4%", 0.04, GRAY),
        ("WebSuite",  "R$ 441.442",   " 4%", 0.04, GRAY),
        ("SMS",       "R$ 348.165",   " 3%", 0.03, GRAY),
        ("Push",      "R$ 101.430",   " 1%", 0.01, GRAY),
    ]

    chart_left = 130
    chart_right = W - 160
    max_bar_w = chart_right - chart_left
    bar_h = 26
    gap = 10
    total_h = len(data) * (bar_h + gap)
    start_y = H * 0.55 - total_h / 2 + 20

    for i, (label, amount, pct, ratio, color) in enumerate(data):
        y = start_y + (len(data) - 1 - i) * (bar_h + gap)
        filled_w = max(ratio * max_bar_w, 6)
        # track
        c.setFillColor(SURFACE)
        c.roundRect(chart_left, y, max_bar_w, bar_h, 3, fill=1, stroke=0)
        # fill
        c.setFillColor(color)
        c.roundRect(chart_left, y, filled_w, bar_h, 3, fill=1, stroke=0)
        # label
        draw_text(c, label, chart_left - 8, y + 8, "Helvetica", 11, WHITE, "right")
        # amount
        draw_text(c, amount, chart_left + max_bar_w + 10, y + 8, "Helvetica-Bold", 11, WHITE)
        # pct inside if wide enough
        if filled_w > 50:
            draw_text(c, pct, chart_left + filled_w - 6, y + 8, "Helvetica", 9, DARK_BG, "right")

    # Insight box
    iw, ih = 480, 42
    ix = (W - iw) / 2
    iy = 30
    draw_card(c, ix, iy, iw, ih, fill=CARD_BG, stroke_color=RED, stroke_width=2)
    draw_text(c, "66% do contrato = WhatsApp. Um canal. Um fornecedor.", W / 2, iy + ih * 0.38, "Helvetica-Bold", 13, RED, "center")

    footer(c)
    slide_number(c, 2)


# ---------------------------------------------------------------------------
# Slide 3 — Dois Caminhos
# ---------------------------------------------------------------------------
def slide_03(c):
    fill_background(c)

    draw_text(c, "Setembro 2026: Dois Caminhos", W / 2, H - 48, "Helvetica-Bold", 26, WHITE, "center")

    card_w = (W - 80) / 2 - 10
    card_h = H * 0.70
    card_y = H * 0.10

    # Left card — Insider
    lx = 30
    draw_card(c, lx, card_y, card_w, card_h, fill=CARD_BG, stroke_color=AMBER, stroke_width=2)
    draw_text(c, "Contra-Proposta Insider", lx + card_w / 2, card_y + card_h - 28, "Helvetica-Bold", 15, AMBER, "center")

    insider_items = [
        (GREEN,  True,  "R$ 8.605.572/ano (−21%)"),
        (GREEN,  True,  "Push ilimitado e gratuito"),
        (GREEN,  True,  "Preço em Reais"),
        (RED,    False, "Lock-in 24 meses"),
        (RED,    False, "R$ 540.000 upfront"),
        (RED,    False, "Ciclo se repete em set/2028"),
    ]
    for j, (col, positive, txt) in enumerate(insider_items):
        icon = "✓" if positive else "✗"
        iy2 = card_y + card_h - 65 - j * 34
        draw_text(c, icon, lx + 18, iy2, "Helvetica-Bold", 13, col)
        draw_text(c, txt, lx + 36, iy2, "Helvetica", 11, WHITE)

    # Right card — Sovereign
    rx = W / 2 + 10
    draw_card(c, rx, card_y, card_w, card_h, fill=CARD_BG, stroke_color=BLUE, stroke_width=2)
    draw_text(c, "Stack Sovereign", rx + card_w / 2, card_y + card_h - 28, "Helvetica-Bold", 15, BLUE, "center")

    sovereign_items = [
        (GREEN,  True,  "R$ 9.055.440–9.480.384/ano"),
        (GREEN,  True,  "Sem lock-in"),
        (GREEN,  True,  "Controle total dos dados"),
        (GREEN,  True,  "POC validada 372 jobs/s"),
        (AMBER,  None,  "WhatsApp: variável decisiva"),
        (GREEN,  True,  "R$ 0 upfront"),
    ]
    for j, (col, positive, txt) in enumerate(sovereign_items):
        icon = "✓" if positive is True else ("?" if positive is None else "✗")
        iy2 = card_y + card_h - 65 - j * 34
        draw_text(c, icon, rx + 18, iy2, "Helvetica-Bold", 13, col)
        draw_text(c, txt, rx + 36, iy2, "Helvetica", 11, WHITE)

    footer(c)
    slide_number(c, 3)


# ---------------------------------------------------------------------------
# Slide 4 — Quatro Cenários
# ---------------------------------------------------------------------------
def slide_04(c):
    fill_background(c)

    draw_text(c, "Quatro Cenários — Comparativo Anual", W / 2, H - 48, "Helvetica-Bold", 26, WHITE, "center")

    data = [
        ("Contrato\nAtual",      10854708, RED),
        ("Contra-\nProposta",     8605572, AMBER),
        ("Stack\n(pior caso)",    9480384, BLUE),
        ("Stack\n(WA 1,5×)",      6218676, GREEN),
    ]

    chart_bottom = 80
    chart_top = H - 110
    chart_h = chart_top - chart_bottom
    max_val = 12000000
    bar_w = 110
    total_bars = len(data)
    total_w = total_bars * bar_w + (total_bars - 1) * 40
    chart_left = (W - total_w) / 2

    for i, (label, val, color) in enumerate(data):
        bx = chart_left + i * (bar_w + 40)
        bh = (val / max_val) * chart_h
        draw_vertical_bar(c, bx, chart_bottom, bar_w, bh, color,
                          label.replace("\n", " "),
                          f"R$ {val:,.0f}".replace(",", "."),
                          chart_h)
        # Multi-line label below
        lines = label.split("\n")
        for li, ln in enumerate(lines):
            draw_text(c, ln, bx + bar_w / 2, chart_bottom - 16 - li * 14, "Helvetica", 9, GRAY, "center")

    draw_text(c, "PTAX R$ 5,70 | Firebase FCM: gratuito | SMS: descontinuado",
              W / 2, 18, "Helvetica", 9, GRAY, "center")
    slide_number(c, 4)


# ---------------------------------------------------------------------------
# Slide 5 — Contra-Proposta Insider
# ---------------------------------------------------------------------------
def slide_05(c):
    fill_background(c)
    accent_bar(c, AMBER, 5, "left")

    draw_text(c, "Contra-Proposta: O Que Está Na Mesa", W / 2, H - 48, "Helvetica-Bold", 26, WHITE, "center")
    draw_text(c, "−R$ 2.249.136/ano (−21%)", W / 2, H - 76, "Helvetica-Bold", 22, AMBER, "center")

    # Table left
    table_x = 40
    table_y = H * 0.15
    table_w = 370
    col_widths = [170, 100, 100]
    row_h = 34
    headers = ["Item", "Antes", "Depois"]
    rows = [
        ("WhatsApp", "R$ 594.169", "R$ 465.696"),
        ("Email",    "R$ 88.663",  "R$ 84.971"),
        ("Push",     "R$ 45.240",  "R$ 0"),
        ("SMS",      "R$ 29.014",  "R$ 22.748"),
        ("Total/mês","R$ 904.559", "R$ 717.131"),
    ]

    def draw_table_row(row_data, y, is_header=False, is_last=False):
        bg = SURFACE if is_header else (CARD_BG if not is_last else Color(0.12, 0.22, 0.12))
        x_cursor = table_x
        for ci, (text, cw) in enumerate(zip(row_data, col_widths)):
            c.setFillColor(bg)
            c.rect(x_cursor, y, cw, row_h, fill=1, stroke=0)
            color = AMBER if is_last else (GRAY if is_header else WHITE)
            font = "Helvetica-Bold" if is_header or is_last else "Helvetica"
            draw_text(c, text, x_cursor + 8, y + 10, font, 11, color)
            x_cursor += cw

    draw_table_row(headers, table_y + len(rows) * row_h, is_header=True)
    for ri, row in enumerate(rows):
        ry = table_y + (len(rows) - 1 - ri) * row_h
        draw_table_row(row, ry, is_last=(ri == len(rows) - 1))

    # Red card right
    rc_x = W / 2 + 20
    rc_y = H * 0.15
    rc_w = W - rc_x - 30
    rc_h = H * 0.62
    draw_card(c, rc_x, rc_y, rc_w, rc_h, fill=CARD_BG, stroke_color=RED, stroke_width=2)
    draw_text(c, "O Custo Oculto", rc_x + rc_w / 2, rc_y + rc_h - 30, "Helvetica-Bold", 15, RED, "center")

    hidden = [
        "Lock-in: 24 meses",
        "Upfront: R$ 540.000",
        "Diluído: +R$ 22.500/mês efetivo",
        "Set/2028: mesmo ciclo se repete",
    ]
    for j, txt in enumerate(hidden):
        draw_text(c, f"• {txt}", rc_x + 16, rc_y + rc_h - 65 - j * 38, "Helvetica", 12, WHITE)

    footer(c)
    slide_number(c, 5)


# ---------------------------------------------------------------------------
# Slide 6 — Stack Sovereign
# ---------------------------------------------------------------------------
def slide_06(c):
    fill_background(c)
    accent_bar(c, GREEN, 5, "left")

    draw_text(c, "Stack Sovereign — O Que Construímos", W / 2, H - 48, "Helvetica-Bold", 26, WHITE, "center")

    # Green badge
    bw, bh = 560, 36
    bx = (W - bw) / 2
    by = H - 98
    draw_card(c, bx, by, bw, bh, fill=Color(0.05, 0.18, 0.08), stroke_color=GREEN, stroke_width=1.5)
    draw_text(c, "POC Validada: 372 jobs/s  |  Necessário: 280/s  |  Margem: +33%",
              W / 2, by + 12, "Helvetica-Bold", 12, GREEN, "center")

    # 3x2 grid of cost cards
    cards = [
        ("Amazon SES",     "R$ 66.987/mês",      BLUE),
        ("Firebase FCM",   "R$ 0  GRATUITO",      GREEN),
        ("MongoDB Atlas",  "R$ 2.857–3.068/mês",  BLUE),
        ("PostHog Cloud",  "R$ 19.882–56.083/mês",AMBER),
        ("Infra AWS",      "R$ 4.894/mês",        BLUE),
        ("WhatsApp Meta",  "R$ 660.000/mês",      RED),
    ]
    cw, ch = 220, 80
    cols = 3
    gap_x = (W - 60 - cols * cw) / (cols - 1)
    grid_left = 30
    grid_top = H * 0.63

    for i, (name, cost, color) in enumerate(cards):
        col_i = i % cols
        row_i = i // cols
        cx = grid_left + col_i * (cw + gap_x)
        cy = grid_top - row_i * (ch + 12)
        draw_card(c, cx, cy, cw, ch, fill=CARD_BG, stroke_color=color, stroke_width=1.5)
        draw_text(c, name, cx + cw / 2, cy + ch * 0.62, "Helvetica-Bold", 12, color, "center")
        draw_text(c, cost, cx + cw / 2, cy + ch * 0.28, "Helvetica", 11, WHITE, "center")

    # Total bottom
    draw_text(c, "Total: R$ 754.620–790.032/mês  |  R$ 9.055.440–9.480.384/ano",
              W / 2, 20, "Helvetica-Bold", 12, WHITE, "center")
    slide_number(c, 6)


# ---------------------------------------------------------------------------
# Slide 7 — Breakeven WhatsApp (CLIMAX)
# ---------------------------------------------------------------------------
def slide_07(c):
    fill_background(c)

    draw_text(c, "A Variável Que Decide Tudo", W / 2, H - 46, "Helvetica-Bold", 28, WHITE, "center")
    draw_text(c, "Ponto de equilíbrio: 1,42 mensagens por conversa",
              W / 2, H - 76, "Helvetica", 15, PURPLE, "center")

    # Chart area
    cx_left = 80
    cx_right = W - 60
    cy_bottom = 130
    cy_top = H - 110
    chart_w = cx_right - cx_left
    chart_h = cy_top - cy_bottom

    # Axes
    c.setStrokeColor(SURFACE)
    c.setLineWidth(1)
    c.line(cx_left, cy_bottom, cx_right, cy_bottom)
    c.line(cx_left, cy_bottom, cx_left, cy_top)

    # X axis ticks: 1.0, 1.42, 2.0, 3.0
    x_vals = [1.0, 1.42, 2.0, 3.0]
    x_min, x_max = 1.0, 3.0

    def x_to_px(v):
        return cx_left + (v - x_min) / (x_max - x_min) * chart_w

    # Y axis: min/max
    y_min = 5000000
    y_max = 20000000

    def y_to_py(v):
        return cy_bottom + (v - y_min) / (y_max - y_min) * chart_h

    # Grid lines
    for yv in [6000000, 9000000, 12000000, 15000000, 18000000]:
        py = y_to_py(yv)
        c.setStrokeColor(SURFACE)
        c.setLineWidth(0.5)
        c.line(cx_left, py, cx_right, py)
        draw_text(c, f"R$ {yv/1e6:.0f}M", cx_left - 8, py - 4, "Helvetica", 7, GRAY, "right")

    # X axis labels
    for xv in x_vals:
        px = x_to_px(xv)
        c.setStrokeColor(SURFACE)
        c.setLineWidth(0.5)
        c.line(px, cy_bottom, px, cy_top)
        draw_text(c, str(xv).replace(".", ","), px, cy_bottom - 14, "Helvetica", 9, GRAY, "center")

    # Line 1 — Contra-Proposta (AMBER, flat) at ~17.751.144 (24m) -> annual ~8.875.572
    # Using annual values for the chart: Insider = 8.605.572 fixed
    insider_y = 8605572
    py_insider = y_to_py(insider_y)
    c.setStrokeColor(AMBER)
    c.setLineWidth(2.5)
    c.line(x_to_px(1.0), py_insider, x_to_px(3.0), py_insider)
    draw_text(c, "Contra-Proposta Insider", x_to_px(3.0) + 4, py_insider - 3, "Helvetica-Bold", 9, AMBER)

    # Line 2 — Stack Interna (BLUE, decreasing)
    # At x=1.0: WhatsApp R$660K/mês + fixed ~R$94.620 = R$754.620/mês * 12 = R$9.055.440
    # At x=1.42: breakeven
    # At x=2.0: WhatsApp ~R$330K + R$94.620 = R$424.620/mês * 12 = R$5.095.440 + fixed overhead
    # Simplified linear model based on WA cost/msgs
    def stack_annual(ratio):
        # WhatsApp cost scales inversely with ratio (more msgs per conv = fewer convs)
        wa_base = 660000  # at ratio 1.0
        wa_cost = wa_base / ratio
        fixed = 94620  # SES + Mongo + PostHog + Infra
        return (wa_cost + fixed) * 12

    stack_points = [(xv, stack_annual(xv)) for xv in [1.0, 1.2, 1.42, 1.6, 2.0, 2.5, 3.0]]
    c.setStrokeColor(BLUE)
    c.setLineWidth(2.5)
    path = c.beginPath()
    path.moveTo(x_to_px(stack_points[0][0]), y_to_py(stack_points[0][1]))
    for xv, yv in stack_points[1:]:
        path.lineTo(x_to_px(xv), y_to_py(yv))
    c.drawPath(path, stroke=1, fill=0)
    draw_text(c, "Stack Interna", x_to_px(3.0) + 4, y_to_py(stack_annual(3.0)) - 3, "Helvetica-Bold", 9, BLUE)

    # Breakeven point
    bx_pt = x_to_px(1.42)
    by_pt = y_to_py(insider_y)
    c.setFillColor(PURPLE)
    c.circle(bx_pt, by_pt, 7, fill=1, stroke=0)
    draw_text(c, "1,42", bx_pt - 2, by_pt + 12, "Helvetica-Bold", 9, PURPLE, "center")

    # Insight box
    iw, ih = W - 60, 56
    ix = 30
    iy = 14
    draw_card(c, ix, iy, iw, ih, fill=CARD_BG, stroke_color=PURPLE, stroke_width=2)
    draw_text(c, "Insider cobra por DISPARO. Meta API cobra por CONVERSA (janela 24h).",
              W / 2, iy + ih * 0.67, "Helvetica-Bold", 11, WHITE, "center")
    draw_text(c, "Broadcasts puros = ratio 1,0 → Insider vence.  |  Templates interativos = ratio 1,5+ → Stack vence por milhões.",
              W / 2, iy + ih * 0.30, "Helvetica", 10, GRAY, "center")

    slide_number(c, 7)


# ---------------------------------------------------------------------------
# Slide 8 — Projeção 24 Meses
# ---------------------------------------------------------------------------
def slide_08(c):
    fill_background(c)

    draw_text(c, "24 Meses — Onde Cada Caminho Leva", W / 2, H - 48, "Helvetica-Bold", 26, WHITE, "center")

    data = [
        ("Contrato\nAtual",    21709416, RED),
        ("Contra-\nProposta",  17751144, AMBER),
        ("Stack\nInterna",     18110880, BLUE),
    ]

    chart_bottom = 100
    chart_top = H - 110
    chart_h = chart_top - chart_bottom
    max_val = 24000000
    bar_w = 130
    gap = 80
    total_w = len(data) * bar_w + (len(data) - 1) * gap
    chart_left = (W - total_w) / 2

    for i, (label, val, color) in enumerate(data):
        bx = chart_left + i * (bar_w + gap)
        bh = (val / max_val) * chart_h
        c.setFillColor(color)
        c.roundRect(bx, chart_bottom, bar_w, bh, 5, fill=1, stroke=0)
        # value above
        draw_text(c, f"R$ {val/1e6:.2f}M".replace(".", ","), bx + bar_w / 2,
                  chart_bottom + bh + 8, "Helvetica-Bold", 11, WHITE, "center")
        # label below multi-line
        lines = label.split("\n")
        for li, ln in enumerate(lines):
            draw_text(c, ln, bx + bar_w / 2, chart_bottom - 18 - li * 14, "Helvetica", 10, GRAY, "center")

    # Note
    draw_text(c, "R$ 540K upfront incluído na contra-proposta",
              W / 2, 72, "Helvetica", 10, GRAY, "center")

    # Callout
    cw2, ch2 = 580, 38
    cx2 = (W - cw2) / 2
    cy2 = 26
    draw_card(c, cx2, cy2, cw2, ch2, fill=CARD_BG, stroke_color=AMBER, stroke_width=1.5)
    draw_text(c, "Custo efetivo mensal contra-proposta: R$ 739.631  vs  Stack: R$ 754.620  — diferença de apenas R$ 14.989/mês",
              W / 2, cy2 + 12, "Helvetica", 9, WHITE, "center")

    slide_number(c, 8)


# ---------------------------------------------------------------------------
# Slide 9 — Sensibilidade
# ---------------------------------------------------------------------------
def slide_09(c):
    fill_background(c)

    draw_text(c, "Sensibilidade WhatsApp — 4 Cenários", W / 2, H - 48, "Helvetica-Bold", 26, WHITE, "center")
    draw_text(c, "Custo total da stack em 24 meses por ratio de msgs/conversa",
              W / 2, H - 76, "Helvetica", 13, GRAY, "center")

    rows = [
        ("1,0 (broadcasts)",   "R$ 660.000", "R$ 18.110.880", "+R$ 359.736",   RED,    "❌"),
        ("1,42 (breakeven)",   "R$ 464.789", "R$ 13.425.336", "Igual",          AMBER,  "⚖️"),
        ("2,0 (interativo)",   "R$ 330.000", "R$ 10.190.880", "−R$ 7.560.264",  GREEN,  "✅"),
        ("3,0 (sequências)",   "R$ 220.000", "R$  7.550.880", "−R$ 10.200.264", GREEN,  "✅"),
    ]
    headers = ["Ratio", "Meta API/mês", "Stack 24m", "vs Contra-Proposta"]
    col_widths = [170, 140, 160, 220]
    row_h = 48
    table_w = sum(col_widths)
    table_x = (W - table_w) / 2
    table_y = H * 0.16

    # Header row
    x_cur = table_x
    for hi, (hdr, cw) in enumerate(zip(headers, col_widths)):
        c.setFillColor(SURFACE)
        c.rect(x_cur, table_y + len(rows) * row_h, cw, row_h, fill=1, stroke=0)
        draw_text(c, hdr, x_cur + 10, table_y + len(rows) * row_h + 16, "Helvetica-Bold", 11, GRAY)
        x_cur += cw

    # Data rows
    for ri, (ratio, api, stack, vs, col, icon) in enumerate(rows):
        ry = table_y + (len(rows) - 1 - ri) * row_h
        bg = Color(0.10, 0.10, 0.10) if ri % 2 == 0 else CARD_BG
        x_cur = table_x
        for ci, (text, cw) in enumerate(zip([ratio, api, stack, f"{vs} {icon}"], col_widths)):
            c.setFillColor(bg)
            c.rect(x_cur, ry, cw, row_h, fill=1, stroke=0)
            txt_color = col if ci == 3 else WHITE
            draw_text(c, text, x_cur + 10, ry + 16, "Helvetica", 11, txt_color)
            x_cur += cw

    # Caption
    draw_text(c, "Ação: puxar do histórico operacional o ratio médio de msgs/conversa",
              W / 2, 18, "Helvetica", 10, AMBER, "center")
    slide_number(c, 9)


# ---------------------------------------------------------------------------
# Slide 10 — Vantagens Estratégicas
# ---------------------------------------------------------------------------
def slide_10(c):
    fill_background(c)

    draw_text(c, "Além do Custo: Soberania Tecnológica", W / 2, H - 48, "Helvetica-Bold", 26, WHITE, "center")

    cards = [
        (GREEN,  "Sem Lock-in",          "Flexibilidade total.\nSair ou ajustar a qualquer momento."),
        (BLUE,   "Controle dos Dados",   "Dados de CRM na infraestrutura própria.\nZero dependência."),
        (PURPLE, "Poder de Barganha",    "Stack pronta = Insider sem\nalavancagem em set/2028."),
        (AMBER,  "Integração BigQuery",  "Modelos preditivos e analytics\navançado nativos."),
        (GREEN,  "SMS Eliminado",        "R$ 272.980/ano economizados\nvs contra-proposta."),
        (BLUE,   "R$ 0 Upfront",         "Sem desembolso de\nR$ 540.000 imediato."),
    ]

    cols = 3
    cw, ch = 228, 108
    gap_x = (W - 60 - cols * cw) / (cols - 1)
    grid_left = 30
    grid_top = H * 0.76

    for i, (color, title, desc) in enumerate(cards):
        col_i = i % cols
        row_i = i // cols
        cx = grid_left + col_i * (cw + gap_x)
        cy = grid_top - row_i * (ch + 14)
        draw_card(c, cx, cy, cw, ch, fill=CARD_BG, stroke_color=color, stroke_width=2)
        draw_text(c, title, cx + 14, cy + ch - 28, "Helvetica-Bold", 13, color)
        for li, line in enumerate(desc.split("\n")):
            draw_text(c, line, cx + 14, cy + ch - 50 - li * 18, "Helvetica", 10, WHITE)

    footer(c)
    slide_number(c, 10)


# ---------------------------------------------------------------------------
# Slide 11 — Recomendação
# ---------------------------------------------------------------------------
def slide_11(c):
    fill_background(c)
    accent_bar(c, GREEN, 5, "left")

    draw_text(c, "Recomendação Estratégica", W / 2, H - 48, "Helvetica-Bold", 28, WHITE, "center")

    # Hero
    draw_text(c, "Continue o deploy — independente da decisão.",
              W / 2, H - 100, "Helvetica-Bold", 20, GREEN, "center")

    # Explanation
    expl = ("A contra-proposta exige 24 meses. Em setembro/2028, o ciclo se repete. "
            "Ter a stack pronta remove o poder de barganha da Insider para sempre.")
    # Wrap manually
    words = expl.split()
    lines = []
    line = ""
    for w in words:
        test = line + (" " if line else "") + w
        if len(test) * 7 > W - 100:
            lines.append(line)
            line = w
        else:
            line = test
    if line:
        lines.append(line)

    for li, ln in enumerate(lines):
        draw_text(c, ln, W / 2, H - 138 - li * 20, "Helvetica", 13, GRAY, "center")

    # 3 action cards
    action_cards = [
        (AMBER, "1. Confirme a contra-proposta",
         "se histórico WhatsApp < 1,42 msgs/conv"),
        (BLUE,  "2. Adote a stack",
         "se histórico WhatsApp > 1,42 msgs/conv"),
        (GREEN, "3. Continue o deploy",
         "em qualquer cenário — é o ativo estratégico permanente"),
    ]
    cw, ch = 220, 90
    gap = 20
    total_w = len(action_cards) * cw + (len(action_cards) - 1) * gap
    sx = (W - total_w) / 2
    sy = H * 0.12

    for i, (color, title, sub) in enumerate(action_cards):
        ax = sx + i * (cw + gap)
        draw_card(c, ax, sy, cw, ch, fill=CARD_BG, stroke_color=color, stroke_width=2)
        draw_text(c, title, ax + cw / 2, sy + ch * 0.62, "Helvetica-Bold", 11, color, "center")
        # wrap sub
        words2 = sub.split()
        sub_lines = []
        sl = ""
        for w2 in words2:
            t2 = sl + (" " if sl else "") + w2
            if len(t2) * 6.5 > cw - 16:
                sub_lines.append(sl)
                sl = w2
            else:
                sl = t2
        if sl:
            sub_lines.append(sl)
        for li2, ln2 in enumerate(sub_lines):
            draw_text(c, ln2, ax + cw / 2, sy + ch * 0.38 - li2 * 14, "Helvetica", 9, WHITE, "center")

    footer(c)
    slide_number(c, 11)


# ---------------------------------------------------------------------------
# Slide 12 — Call to Action
# ---------------------------------------------------------------------------
def slide_12(c):
    fill_background(c)
    accent_bar(c, PURPLE, 8, "left")

    draw_text(c, "A Pergunta Que Resolve Tudo", W / 2, H - 50, "Helvetica-Bold", 28, WHITE, "center")

    # Big question — multi-line
    q1 = "Qual é a média de mensagens enviadas por usuário"
    q2 = "dentro da mesma janela de 24 horas no WhatsApp?"
    draw_text(c, q1, W / 2, H * 0.60, "Helvetica-Bold", 18, PURPLE, "center")
    draw_text(c, q2, W / 2, H * 0.53, "Helvetica-Bold", 18, PURPLE, "center")

    # 3 action steps
    steps = [
        (AMBER, "1. Puxe do histórico",
         "Extraia o ratio médio dos últimos 90 dias"),
        (BLUE,  "2. Compare com 1,42",
         "Abaixo: contra-proposta. Acima: stack."),
        (GREEN, "3. Continue o deploy",
         "Em qualquer cenário: Sovereign é o ativo permanente."),
    ]

    cw, ch = 210, 88
    gap = 22
    total_w = len(steps) * cw + (len(steps) - 1) * gap
    sx = (W - total_w) / 2
    sy = H * 0.13

    for i, (color, title, sub) in enumerate(steps):
        ax = sx + i * (cw + gap)
        draw_card(c, ax, sy, cw, ch, fill=CARD_BG, stroke_color=color, stroke_width=2.5)
        draw_text(c, title, ax + cw / 2, sy + ch * 0.62, "Helvetica-Bold", 12, color, "center")
        draw_text(c, sub, ax + cw / 2, sy + ch * 0.28, "Helvetica", 9, WHITE, "center")

    draw_text(c, "Projeto Sovereign | Brasil Paralelo | Abril 2026",
              W / 2, 14, "Helvetica", 9, GRAY, "center")
    slide_number(c, 12)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    c = canvas.Canvas(OUTPUT, pagesize=(W, H))
    c.setTitle("Projeto Sovereign — Brasil Paralelo")
    c.setAuthor("Brasil Paralelo")
    c.setSubject("Análise Financeira CRM — Abril 2026")

    slides = [
        slide_01, slide_02, slide_03, slide_04,
        slide_05, slide_06, slide_07, slide_08,
        slide_09, slide_10, slide_11, slide_12,
    ]

    for fn in slides:
        fn(c)
        c.showPage()

    c.save()
    print(f"PDF gerado: {OUTPUT}")
    print(f"Total: {len(slides)} slides")


if __name__ == "__main__":
    main()
