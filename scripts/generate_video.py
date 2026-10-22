#!/usr/bin/env python3
"""
TradeSphere Demo Video Generator
Generates a 1080p 60-second institutional product showcase video with:
- Voiceover audio synthesis
- Obsidian dark terminal design (#0B0F19)
- Animated charts, live ticking order books, AI agent broker execution, and option Greeks
- Piped directly to FFmpeg for high performance H.264 MP4 export
"""

import os
import sys
import math
import subprocess
import tempfile
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Dimensions & Framerate
WIDTH, HEIGHT = 1920, 1080
FPS = 30

# Colors
BG_DARK = (11, 15, 25)         # #0B0F19
BG_CARD = (17, 24, 39)         # #111827
BG_CARD_LIGHT = (26, 34, 53)   # #1A2235
BORDER_COLOR = (37, 45, 68)    # #252D44
BORDER_BRIGHT = (55, 65, 81)   # #374151

COLOR_EMERALD = (16, 185, 129) # #10B981
COLOR_EMERALD_DIM = (6, 95, 70)# #065F46
COLOR_CRIMSON = (239, 68, 68)  # #EF4444
COLOR_CRIMSON_DIM = (127, 29, 29) # #7F1D1D
COLOR_CYAN = (6, 182, 212)     # #06B6D4
COLOR_INDIGO = (99, 102, 241)  # #6366F1
COLOR_AMBER = (245, 158, 11)   # #F59E0B

TEXT_WHITE = (255, 255, 255)
TEXT_GRAY = (156, 163, 175)    # #9CA3AF
TEXT_MUTED = (107, 114, 128)   # #6B7280

# Load Fonts
FONT_PATHS = [
    '/System/Library/Fonts/Supplemental/Arial.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
    '/System/Library/Fonts/SFNS.ttf'
]
chosen_font_path = None
for p in FONT_PATHS:
    if os.path.exists(p):
        chosen_font_path = p
        break

def get_font(size, bold=False):
    if chosen_font_path:
        try:
            return ImageFont.truetype(chosen_font_path, size)
        except Exception:
            pass
    return ImageFont.load_default()

font_hero = get_font(52, bold=True)
font_title = get_font(38, bold=True)
font_h2 = get_font(28, bold=True)
font_body = get_font(20)
font_bold = get_font(20, bold=True)
font_sub = get_font(16)
font_caption = get_font(24)

# Script Scenes Definition
SCENES = [
    {
        "id": "intro",
        "title": "Institutional Virtual Trading & AI Quant Studio",
        "subtitle": "Welcome to TradeSphere — institutional-grade market simulation and quant execution tailored for Indian equities and derivatives.",
        "voiceover": "Welcome to TradeSphere. An institutional-grade virtual trading simulator and autonomous quant execution platform designed for Indian equity and derivatives markets.",
        "duration_min": 7.0
    },
    {
        "id": "market_feed",
        "title": "NSE & BSE Real-Time Feed · Zero Financial Risk",
        "subtitle": "Live market depth with preloaded ₹1,00,000 virtual capital, sub-second quotes, and atomic transaction settlement.",
        "voiceover": "Experience real-time market depth with zero financial risk. Trade Indian equities with live tick feeds, five-best market depth, and one-click atomic transaction settlement.",
        "duration_min": 8.5
    },
    {
        "id": "terminal",
        "title": "Pro Trading Terminal · Kite-Style Order Desk",
        "subtitle": "Interactive TradingView candlesticks, MIS 5x leverage vs CNC delivery, GTT bracket Target and Stop-Loss orders.",
        "voiceover": "Master execution on our pro trading terminal. Seamlessly switch between intraday leverage and delivery, set GTT bracket orders, and inspect cumulative bid-ask volume balances.",
        "duration_min": 9.0
    },
    {
        "id": "ai_agents",
        "title": "Autonomous Multi-LLM Quant Trading Agents",
        "subtitle": "Deploy local Ollama models or ultra-fast Groq LPU and OpenAI models. AI evaluates market signals and executes real trades.",
        "voiceover": "Unleash autonomous AI trading agents. Power your quantitative strategies using offline local models via Ollama or ultra-low latency Groq and OpenAI cloud models. TradeSphere's AI agents evaluate live signals and autonomously execute trades following your exact system prompt rules.",
        "duration_min": 12.5
    },
    {
        "id": "derivatives",
        "title": "Institutional F&O Desk · Black-Scholes Greeks Engine",
        "subtitle": "Real-time option chains, Delta, Theta, Gamma, Vega, India VIX tracker, and 1-click multi-leg spread execution.",
        "voiceover": "Hedge like institutional desks. Calculate real-time option Greeks, track India VIX volatility shifts, and execute complex multi-leg option spreads in a single click.",
        "duration_min": 9.0
    },
    {
        "id": "outro",
        "title": "Zero Risk. Institutional Power. Autonomous AI.",
        "subtitle": "Start trading today at tradesphere-peach.vercel.app — Preloaded with ₹1,00,000 virtual balance.",
        "voiceover": "TradeSphere. Institutional power, zero risk. Built for the modern trader and quant developer. Start trading today.",
        "duration_min": 6.5
    }
]

def synthesize_audio():
    """Synthesizes speech per scene using macOS 'say' and combines them into master audio using wave & numpy."""
    temp_dir = tempfile.mkdtemp()
    durations = []
    pcm_chunks = []
    sample_rate = 44100
    
    print("[1/5] Synthesizing Voiceover Audio with macOS 'say'...")
    for idx, scene in enumerate(SCENES):
        aiff_path = os.path.join(temp_dir, f"scene_{idx}.aiff")
        wav_path = os.path.join(temp_dir, f"scene_{idx}.wav")
        text = scene["voiceover"]
        
        # Try voice Samantha, fallback to system voice if not available
        try:
            subprocess.run(["say", "-v", "Samantha", "-r", "175", "-o", aiff_path, text], check=True)
        except Exception:
            subprocess.run(["say", "-r", "175", "-o", aiff_path, text], check=True)
            
        # Convert AIFF to 44.1kHz mono WAV
        subprocess.run(["ffmpeg", "-y", "-i", aiff_path, "-ar", "44100", "-ac", "1", wav_path], 
                       check=True, stderr=subprocess.DEVNULL)
        
        with wave.open(wav_path, "rb") as wf:
            frames = wf.readframes(wf.getnframes())
            data = np.frombuffer(frames, dtype=np.int16)
            
        dur = len(data) / sample_rate
        target_dur = max(dur + 0.8, scene["duration_min"])
        durations.append(target_dur)
        
        target_samples = int(target_dur * sample_rate)
        padded = np.zeros(target_samples, dtype=np.int16)
        padded[:len(data)] = data
        pcm_chunks.append(padded)
        print(f"  Scene {idx+1} ({scene['id']}): Voice {dur:.2f}s -> Scene {target_dur:.2f}s")
        
    master_voice = np.concatenate(pcm_chunks)
    total_samples = len(master_voice)
    total_duration = total_samples / sample_rate
    
    # Generate subtle ambient synth background (harmonic pad)
    t = np.linspace(0, total_duration, total_samples, endpoint=False)
    pad = (0.018 * np.sin(2 * np.pi * 110 * t) +
           0.012 * np.sin(2 * np.pi * 164.81 * t) +
           0.008 * np.sin(2 * np.pi * 220 * t))
    pad = (pad * 32767).astype(np.int16)
    
    # Mix voice + pad
    mixed = np.clip(master_voice.astype(np.float32) + pad.astype(np.float32), -32768, 32767).astype(np.int16)
    
    master_audio = os.path.join(temp_dir, "master_audio.wav")
    with wave.open(master_audio, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(mixed.tobytes())
        
    print(f"  ✓ Master Audio generated ({total_duration:.2f}s total)")
    return master_audio, durations, temp_dir

def draw_top_nav(draw, frame_idx):
    """Draws consistent sticky header with live ticking market indices."""
    draw.rectangle([0, 0, WIDTH, 64], fill=BG_CARD)
    draw.line([0, 64, WIDTH, 64], fill=BORDER_COLOR, width=1)
    
    # Brand logo & Title
    draw.rounded_rectangle([28, 14, 64, 50], radius=8, fill=COLOR_EMERALD)
    draw.text((37, 18), "TS", fill=BG_DARK, font=font_bold)
    draw.text((76, 20), "TradeSphere", fill=TEXT_WHITE, font=font_bold)
    
    # Market status pill
    pulse_green = COLOR_EMERALD if (frame_idx // 15) % 2 == 0 else (52, 211, 153)
    draw.rounded_rectangle([220, 20, 310, 44], radius=12, fill=COLOR_EMERALD_DIM, outline=COLOR_EMERALD)
    draw.ellipse([230, 29, 238, 37], fill=pulse_green)
    draw.text((246, 23), "NSE LIVE", fill=COLOR_EMERALD, font=font_sub)
    
    # Market Tickers (NIFTY 50, SENSEX, BANK NIFTY)
    osc = math.sin(frame_idx * 0.1) * 3.5
    nifty_val = 24845.20 + osc
    draw.text((340, 22), f"NIFTY 50: {nifty_val:.2f}", fill=TEXT_WHITE, font=font_sub)
    draw.text((505, 22), "+0.42%", fill=COLOR_EMERALD, font=font_sub)
    
    draw.text((600, 22), "SENSEX: 81,410.75", fill=TEXT_WHITE, font=font_sub)
    draw.text((760, 22), "+0.38%", fill=COLOR_EMERALD, font=font_sub)
    
    draw.text((850, 22), "INDIA VIX: 13.82", fill=COLOR_AMBER, font=font_sub)
    
    # Right-hand stats: Virtual Balance & User Profile
    draw.rounded_rectangle([WIDTH - 360, 16, WIDTH - 160, 48], radius=8, fill=BG_CARD_LIGHT, outline=BORDER_BRIGHT)
    draw.text((WIDTH - 345, 23), "VIRTUAL BAL: ₹1,00,000", fill=COLOR_EMERALD, font=font_sub)
    
    draw.rounded_rectangle([WIDTH - 140, 16, WIDTH - 28, 48], radius=8, fill=COLOR_INDIGO)
    draw.text((WIDTH - 122, 23), "QUANT PRO", fill=TEXT_WHITE, font=font_sub)

def draw_subtitle_banner(draw, text):
    """Draws bottom subtitle bar for clear viewing without sound."""
    banner_w = 1500
    banner_h = 70
    x0 = (WIDTH - banner_w) // 2
    y0 = HEIGHT - 100
    draw.rounded_rectangle([x0, y0, x0 + banner_w, y0 + banner_h], radius=16, fill=(17, 24, 39, 230), outline=COLOR_CYAN, width=2)
    # Accent indicator
    draw.rectangle([x0 + 16, y0 + 16, x0 + 20, y0 + banner_h - 16], fill=COLOR_CYAN)
    draw.text((x0 + 36, y0 + 20), text[:110], fill=TEXT_WHITE, font=font_caption)

# ==================== SCENE RENDERERS ====================

def render_scene_intro(draw, progress, frame_idx):
    # Central hero hexagon/card
    cx, cy = WIDTH // 2, HEIGHT // 2 - 20
    card_w, card_h = 1000, 520
    x0, y0 = cx - card_w // 2, cy - card_h // 2
    
    # Glowing border effect
    glow_color = COLOR_EMERALD if (frame_idx // 10) % 2 == 0 else COLOR_CYAN
    draw.rounded_rectangle([x0 - 4, y0 - 4, x0 + card_w + 4, y0 + card_h + 4], radius=24, outline=glow_color, width=3)
    draw.rounded_rectangle([x0, y0, x0 + card_w, y0 + card_h], radius=20, fill=BG_CARD)
    
    # Large Logo Emblem
    logo_y = y0 + 60
    draw.rounded_rectangle([cx - 48, logo_y, cx + 48, logo_y + 96], radius=20, fill=COLOR_EMERALD)
    draw.text((cx - 30, logo_y + 22), "TS", fill=BG_DARK, font=font_hero)
    
    # Title
    t1 = "TRADESPHERE"
    draw.text((cx - 180, logo_y + 120), t1, fill=TEXT_WHITE, font=font_hero)
    
    # Tagline
    tag = "Institutional Virtual Trading Simulator & Autonomous Multi-LLM Quant Studio"
    draw.text((cx - 420, logo_y + 195), tag, fill=COLOR_CYAN, font=font_h2)
    
    # Features Pill Grid
    pills = [
        ("₹1,00,000 Virtual Capital", COLOR_EMERALD),
        ("NSE & BSE Real-Time Depth", COLOR_CYAN),
        ("Autonomous AI Agents (Ollama / Groq)", COLOR_INDIGO),
        ("Black-Scholes Derivatives Greeks", COLOR_AMBER)
    ]
    pill_w = 420
    pill_h = 44
    for i, (txt, col) in enumerate(pills):
        px = cx - 440 + (i % 2) * 460
        py = logo_y + 265 + (i // 2) * 60
        draw.rounded_rectangle([px, py, px + pill_w, py + pill_h], radius=10, fill=BG_CARD_LIGHT, outline=col, width=1)
        draw.ellipse([px + 16, py + 16, px + 26, py + 26], fill=col)
        draw.text((px + 38, py + 11), txt, fill=TEXT_WHITE, font=font_sub)

def render_scene_market_feed(draw, progress, frame_idx):
    # Left: Explore Market Scrip Grid
    # Right: Level 2 Depth Order Book
    left_w = 1100
    x0, y0 = 60, 100
    
    draw.rounded_rectangle([x0, y0, x0 + left_w, y0 + 780], radius=16, fill=BG_CARD, outline=BORDER_COLOR, width=2)
    draw.text((x0 + 30, y0 + 26), "EXPLORE MARKET · NSE HIGH-LIQUIDITY EQUITIES", fill=TEXT_WHITE, font=font_h2)
    draw.text((x0 + 30, y0 + 64), "Sub-second tick updates with zero financial risk", fill=TEXT_GRAY, font=font_sub)
    
    stocks = [
        ("RELIANCE", "Reliance Industries Ltd", 2985.40, 0.85, 2960.00, 3010.00, "14.2M"),
        ("TCS", "Tata Consultancy Services", 3940.10, -0.42, 3920.00, 3975.00, "6.8M"),
        ("HDFCBANK", "HDFC Bank Limited", 1682.50, 1.15, 1665.00, 1690.00, "22.5M"),
        ("INFY", "Infosys Limited", 1875.30, 0.62, 1855.00, 1888.00, "9.1M"),
        ("ICICIBANK", "ICICI Bank Ltd", 1245.80, -0.28, 1238.00, 1255.00, "15.4M"),
        ("TATAMOTORS", "Tata Motors Limited", 965.20, 2.45, 942.00, 972.00, "18.9M"),
    ]
    
    row_y = y0 + 110
    for i, (sym, name, price, chg, low, high, vol) in enumerate(stocks):
        is_pos = chg >= 0
        tick_osc = math.sin(frame_idx * 0.15 + i) * 1.2
        curr_price = price + tick_osc
        col = COLOR_EMERALD if is_pos else COLOR_CRIMSON
        
        # Scrip card
        draw.rounded_rectangle([x0 + 24, row_y, x0 + left_w - 24, row_y + 90], radius=12, fill=BG_CARD_LIGHT, outline=BORDER_COLOR)
        
        # Symbol & Name
        draw.text((x0 + 44, row_y + 18), sym, fill=TEXT_WHITE, font=font_bold)
        draw.text((x0 + 44, row_y + 48), name, fill=TEXT_GRAY, font=font_sub)
        
        # Price & Change
        draw.text((x0 + 420, row_y + 18), f"₹{curr_price:.2f}", fill=TEXT_WHITE, font=font_bold)
        chg_sign = "+" if is_pos else ""
        draw.text((x0 + 420, row_y + 48), f"{chg_sign}{chg:.2f}%", fill=col, font=font_bold)
        
        # Range Bar
        draw.text((x0 + 600, row_y + 18), f"L: ₹{low:.0f}   H: ₹{high:.0f}", fill=TEXT_MUTED, font=font_sub)
        draw.rounded_rectangle([x0 + 600, row_y + 48, x0 + 780, row_y + 58], radius=5, fill=BORDER_BRIGHT)
        fill_pct = (curr_price - low) / (high - low)
        draw.rounded_rectangle([x0 + 600, row_y + 48, x0 + 600 + int(180 * fill_pct), row_y + 58], radius=5, fill=col)
        
        # Volume
        draw.text((x0 + 840, row_y + 30), f"Vol: {vol}", fill=TEXT_GRAY, font=font_sub)
        
        # Quick Buy Pill
        draw.rounded_rectangle([x0 + 960, row_y + 24, x0 + 1040, row_y + 64], radius=8, fill=COLOR_EMERALD)
        draw.text((x0 + 980, row_y + 32), "TRADE", fill=BG_DARK, font=font_sub)
        
        row_y += 105

    # Right: Level 2 Depth Order Book Card
    rx = x0 + left_w + 30
    rw = WIDTH - rx - 60
    draw.rounded_rectangle([rx, y0, rx + rw, y0 + 780], radius=16, fill=BG_CARD, outline=BORDER_COLOR, width=2)
    draw.text((rx + 24, y0 + 26), "LEVEL 2 MARKET DEPTH", fill=TEXT_WHITE, font=font_h2)
    draw.text((rx + 24, y0 + 64), "Cumulative Bid vs Ask Flow (RELIANCE)", fill=COLOR_CYAN, font=font_sub)
    
    # 5 Best Bids / Asks Table
    draw.text((rx + 24, y0 + 110), "BID QTY", fill=TEXT_MUTED, font=font_sub)
    draw.text((rx + 140, y0 + 110), "BID (₹)", fill=COLOR_EMERALD, font=font_sub)
    draw.text((rx + 280, y0 + 110), "ASK (₹)", fill=COLOR_CRIMSON, font=font_sub)
    draw.text((rx + 420, y0 + 110), "ASK QTY", fill=TEXT_MUTED, font=font_sub)
    
    bids = [(1450, 2985.20), (2800, 2985.00), (5100, 2984.80), (1200, 2984.50), (8400, 2984.00)]
    asks = [(1820, 2985.60), (3400, 2985.80), (4200, 2986.00), (9500, 2986.50), (11200, 2987.00)]
    
    table_y = y0 + 150
    for b, a in zip(bids, asks):
        draw.text((rx + 24, table_y), str(b[0]), fill=TEXT_GRAY, font=font_sub)
        draw.text((rx + 140, table_y), f"₹{b[1]:.2f}", fill=COLOR_EMERALD, font=font_bold)
        draw.text((rx + 280, table_y), f"₹{a[1]:.2f}", fill=COLOR_CRIMSON, font=font_bold)
        draw.text((rx + 420, table_y), str(a[0]), fill=TEXT_GRAY, font=font_sub)
        table_y += 50
        
    # Depth Balance Gauge
    draw.text((rx + 24, table_y + 40), "CUMULATIVE ORDER BALANCE", fill=TEXT_WHITE, font=font_bold)
    draw.rounded_rectangle([rx + 24, table_y + 80, rx + rw - 24, table_y + 110], radius=8, fill=COLOR_CRIMSON)
    draw.rounded_rectangle([rx + 24, table_y + 80, rx + int((rw - 48) * 0.58), table_y + 110], radius=8, fill=COLOR_EMERALD)
    draw.text((rx + 36, table_y + 86), "BIDS 58%", fill=BG_DARK, font=font_sub)
    draw.text((rx + rw - 130, table_y + 86), "ASKS 42%", fill=TEXT_WHITE, font=font_sub)

def render_scene_terminal(draw, progress, frame_idx):
    # Left: Pro Candlestick Trading Desk
    # Right: Zerodha Kite-style Order Desk
    cw = 1180
    x0, y0 = 60, 100
    
    draw.rounded_rectangle([x0, y0, x0 + cw, y0 + 780], radius=16, fill=BG_CARD, outline=BORDER_COLOR, width=2)
    # Chart Header
    draw.text((x0 + 30, y0 + 24), "RELIANCE · 1D CANDLESTICK · TRADINGVIEW ENGINE", fill=TEXT_WHITE, font=font_h2)
    draw.text((x0 + 30, y0 + 64), "EMA(9): 2,972.40   EMA(21): 2,955.10   RSI(14): 64.2 Bullish", fill=COLOR_CYAN, font=font_sub)
    
    # Draw Simulated Candlesticks
    chart_x = x0 + 50
    chart_y = y0 + 130
    chart_w = cw - 100
    chart_h = 420
    
    # Grid lines
    for i in range(5):
        gy = chart_y + i * (chart_h // 4)
        draw.line([chart_x, gy, chart_x + chart_w, gy], fill=BORDER_COLOR, width=1)
        draw.text((chart_x + chart_w + 10, gy - 8), f"₹{3020 - i*25}", fill=TEXT_MUTED, font=font_sub)
        
    candles_count = 28
    candle_w = chart_w // candles_count
    
    np.random.seed(42)
    base_price = 2940.0
    prices = [base_price]
    for i in range(candles_count):
        change = np.random.normal(2.5, 8.0)
        prices.append(prices[-1] + change)
        
    for i in range(min(candles_count, int(progress * candles_count * 1.5) + 5)):
        o = prices[i]
        c = prices[i+1]
        h = max(o, c) + abs(np.random.normal(3, 3))
        l = min(o, c) - abs(np.random.normal(3, 3))
        
        is_green = c >= o
        col = COLOR_EMERALD if is_green else COLOR_CRIMSON
        cx_pos = chart_x + i * candle_w + candle_w // 2
        
        # Normalize to height
        scale = chart_h / 120.0
        y_high = chart_y + chart_h - int((h - 2910) * scale)
        y_low = chart_y + chart_h - int((l - 2910) * scale)
        y_open = chart_y + chart_h - int((o - 2910) * scale)
        y_close = chart_y + chart_h - int((c - 2910) * scale)
        
        # Wick
        draw.line([cx_pos, y_high, cx_pos, y_low], fill=col, width=2)
        # Body
        top = min(y_open, y_close)
        bot = max(y_open, y_close)
        draw.rectangle([cx_pos - 8, top, cx_pos + 8, max(bot, top + 2)], fill=col)
        
    # MACD Subplot
    macd_y = chart_y + chart_h + 30
    draw.text((chart_x, macd_y), "MACD (12, 26, 9) Histogram", fill=TEXT_MUTED, font=font_sub)
    draw.line([chart_x, macd_y + 50, chart_x + chart_w, macd_y + 50], fill=BORDER_COLOR, width=1)
    for i in range(25):
        hist_val = math.sin(i * 0.4) * 25
        hcol = COLOR_EMERALD if hist_val >= 0 else COLOR_CRIMSON
        bx = chart_x + i * candle_w + 12
        y_top = min(macd_y + 50, macd_y + 50 - int(hist_val))
        y_bot = max(macd_y + 50, macd_y + 50 - int(hist_val))
        draw.rectangle([bx, y_top, bx + 10, max(y_bot, y_top + 1)], fill=hcol)
        
    # Right: Zerodha Kite-style Order Desk
    rx = x0 + cw + 30
    rw = WIDTH - rx - 60
    draw.rounded_rectangle([rx, y0, rx + rw, y0 + 780], radius=16, fill=BG_CARD, outline=BORDER_COLOR, width=2)
    
    draw.text((rx + 24, y0 + 26), "ORDER SLIP · KITE DESK", fill=TEXT_WHITE, font=font_h2)
    
    # MIS vs CNC Pills
    draw.rounded_rectangle([rx + 24, y0 + 70, rx + 220, y0 + 115], radius=10, fill=COLOR_EMERALD_DIM, outline=COLOR_EMERALD, width=2)
    draw.text((rx + 44, y0 + 82), "MIS (5x Leverage)", fill=COLOR_EMERALD, font=font_sub)
    
    draw.rounded_rectangle([rx + 240, y0 + 70, rx + 430, y0 + 115], radius=10, fill=BG_CARD_LIGHT, outline=BORDER_COLOR)
    draw.text((rx + 260, y0 + 82), "CNC (1x Delivery)", fill=TEXT_GRAY, font=font_sub)
    
    # Order Form fields
    fields = [
        ("QUANTITY (SHARES)", "25 Shares", "Lot Size: 1"),
        ("PRICE TYPE", "MARKET ORDER", "Limit / SL / SL-M"),
        ("GTT TARGET", "₹3,050.00 (+2.16%)", "Bracket Target"),
        ("GTT STOP LOSS", "₹2,955.00 (-1.02%)", "Risk:Reward 1 : 2.1")
    ]
    
    fy = y0 + 140
    for label, val, hint in fields:
        draw.text((rx + 24, fy), label, fill=TEXT_MUTED, font=font_sub)
        draw.rounded_rectangle([rx + 24, fy + 26, rx + rw - 24, fy + 76], radius=10, fill=BG_CARD_LIGHT, outline=BORDER_COLOR)
        draw.text((rx + 40, fy + 40), val, fill=TEXT_WHITE, font=font_bold)
        draw.text((rx + 320, fy + 42), hint, fill=COLOR_CYAN, font=font_sub)
        fy += 95
        
    # Margin & Capital Check
    draw.text((rx + 24, fy + 15), "Required Margin: ₹14,927.00 (5x MIS)", fill=COLOR_AMBER, font=font_sub)
    draw.text((rx + 24, fy + 45), "Virtual Capital Available: ₹1,00,000", fill=COLOR_EMERALD, font=font_sub)
    
    # Big Buy / Sell Buttons
    btn_y = fy + 90
    draw.rounded_rectangle([rx + 24, btn_y, rx + 240, btn_y + 60], radius=12, fill=COLOR_EMERALD)
    draw.text((rx + 65, btn_y + 18), "BUY (Shift+B)", fill=BG_DARK, font=font_bold)
    
    draw.rounded_rectangle([rx + 260, btn_y, rx + rw - 24, btn_y + 60], radius=12, fill=COLOR_CRIMSON)
    draw.text((rx + 310, btn_y + 18), "SELL (Shift+S)", fill=TEXT_WHITE, font=font_bold)

def render_scene_ai_agents(draw, progress, frame_idx):
    # Left: AI Studio Model Config & System Prompt Editor
    # Right: Autonomous Broker Execution Ticket
    cw = 1100
    x0, y0 = 60, 100
    
    draw.rounded_rectangle([x0, y0, x0 + cw, y0 + 780], radius=16, fill=BG_CARD, outline=BORDER_COLOR, width=2)
    draw.text((x0 + 30, y0 + 26), "AUTONOMOUS QUANT AGENT COCKPIT", fill=TEXT_WHITE, font=font_h2)
    draw.text((x0 + 30, y0 + 64), "Multi-LLM strategy execution with custom System Prompts", fill=COLOR_CYAN, font=font_sub)
    
    # Model Selector Pills
    models = [
        ("Ollama Gemma 3 (Local)", COLOR_EMERALD, True),
        ("Groq LPU (500+ tok/s)", COLOR_CYAN, False),
        ("DeepSeek-R1 (Local)", COLOR_INDIGO, False),
        ("OpenAI GPT-4o", COLOR_AMBER, False)
    ]
    mx = x0 + 30
    for name, col, active in models:
        bg = COLOR_EMERALD_DIM if active else BG_CARD_LIGHT
        out = col if active else BORDER_COLOR
        draw.rounded_rectangle([mx, y0 + 100, mx + 230, y0 + 145], radius=10, fill=bg, outline=out, width=2 if active else 1)
        draw.ellipse([mx + 15, y0 + 118, mx + 23, y0 + 126], fill=col)
        draw.text((mx + 32, y0 + 112), name[:18], fill=TEXT_WHITE if active else TEXT_GRAY, font=font_sub)
        mx += 245
        
    # System Prompt & Strategy Rules Box
    draw.text((x0 + 30, y0 + 175), "SYSTEM PROMPT & QUANT DECISION RULES", fill=TEXT_MUTED, font=font_sub)
    draw.rounded_rectangle([x0 + 30, y0 + 205, x0 + cw - 30, y0 + 480], radius=12, fill=BG_DARK, outline=BORDER_COLOR)
    
    prompt_lines = [
        "1: ROLE: You are an Autonomous Indian Equity Quantitative Broker.",
        "2: OBJECTIVE: Maximize risk-adjusted alpha on NIFTY 50 constituents.",
        "3: RULES FOR EXECUTION:",
        "4:   - IF 14-day RSI < 35 AND Price > 21-EMA THEN Signal BUY.",
        "5:   - Target Profit: +2.5% | Stop Loss: -1.2% (1:2.08 Risk/Reward).",
        "6:   - IF 14-day RSI > 70 OR Trend reverses THEN Signal SELL.",
        "7:   - Position Sizing: Maximum 15% of Virtual Balance per trade."
    ]
    py = y0 + 225
    for pline in prompt_lines:
        col = COLOR_EMERALD if "BUY" in pline else (COLOR_CRIMSON if "SELL" in pline else TEXT_GRAY)
        draw.text((x0 + 50, py), pline, fill=col, font=font_sub)
        py += 34
        
    # Execution Button with Animated Pulse
    btn_col = COLOR_EMERALD if (frame_idx // 12) % 2 == 0 else (52, 211, 153)
    draw.rounded_rectangle([x0 + 30, y0 + 520, x0 + cw - 30, y0 + 590], radius=14, fill=btn_col)
    draw.text((x0 + 340, y0 + 540), "⚡ RUN AI AGENT (AUTONOMOUS EXECUTION)", fill=BG_DARK, font=font_bold)
    
    # Right: Live Broker Ticket & Output
    rx = x0 + cw + 30
    rw = WIDTH - rx - 60
    draw.rounded_rectangle([rx, y0, rx + rw, y0 + 780], radius=16, fill=BG_CARD, outline=BORDER_COLOR, width=2)
    draw.text((rx + 24, y0 + 26), "BROKER AUDIT TICKET", fill=TEXT_WHITE, font=font_h2)
    draw.text((rx + 24, y0 + 64), "Real-time Autonomous Fill", fill=COLOR_EMERALD, font=font_sub)
    
    # Ticket Card
    draw.rounded_rectangle([rx + 20, y0 + 110, rx + rw - 20, y0 + 680], radius=14, fill=BG_CARD_LIGHT, outline=COLOR_EMERALD, width=2)
    
    ticket_fields = [
        ("EXECUTION STATUS", "FILLED · COMPLETED", COLOR_EMERALD),
        ("DECISION ACTION", "BUY (CNC DELIVERY)", COLOR_EMERALD),
        ("SYMBOL", "RELIANCE.NS (NSE)", TEXT_WHITE),
        ("QUANTITY", "15 SHARES", TEXT_WHITE),
        ("FILL PRICE", "₹2,985.40", COLOR_CYAN),
        ("TOTAL VALUE", "₹44,781.00", TEXT_WHITE),
        ("AI MODEL", "Ollama Gemma 3 Local", COLOR_INDIGO),
        ("LATENCY", "142 ms (Atomic Tx)", COLOR_AMBER),
        ("REASONING", "RSI at 32.4 oversold, confirmed MACD crossover above zero.", TEXT_GRAY)
    ]
    
    ty = y0 + 130
    for label, val, c in ticket_fields:
        draw.text((rx + 40, ty), label, fill=TEXT_MUTED, font=font_sub)
        draw.text((rx + 40, ty + 24), val, fill=c, font=font_bold if label != "REASONING" else font_sub)
        ty += 58

def render_scene_derivatives(draw, progress, frame_idx):
    # Left: Option Chain Table & Strategy Builder
    # Right: Greeks Radar & India VIX Gauge
    cw = 1180
    x0, y0 = 60, 100
    
    draw.rounded_rectangle([x0, y0, x0 + cw, y0 + 780], radius=16, fill=BG_CARD, outline=BORDER_COLOR, width=2)
    draw.text((x0 + 30, y0 + 26), "INSTITUTIONAL F&O DESK · NIFTY 50 DERIVATIVES", fill=TEXT_WHITE, font=font_h2)
    draw.text((x0 + 30, y0 + 64), "Black-Scholes Greek Pricing Engine · Put-Call Ratio: 1.18", fill=COLOR_CYAN, font=font_sub)
    
    # Option Chain Table
    table_x = x0 + 30
    table_y = y0 + 110
    
    # Table Header
    headers = ["CALL OI", "CALL IV", "CALL LTP", "STRIKE", "PUT LTP", "PUT IV", "PUT OI"]
    hw = (cw - 60) // 7
    for i, h in enumerate(headers):
        draw.text((table_x + i * hw + 10, table_y), h, fill=COLOR_CYAN if h == "STRIKE" else TEXT_MUTED, font=font_sub)
        
    draw.line([table_x, table_y + 30, table_x + cw - 60, table_y + 30], fill=BORDER_COLOR, width=1)
    
    strikes_data = [
        ("1.8M", "13.2%", "₹285.50", "24,600", "₹45.20", "14.8%", "0.9M"),
        ("2.4M", "12.8%", "₹210.00", "24,700", "₹68.40", "14.2%", "1.4M"),
        ("3.9M", "12.4%", "₹142.10", "24,800", "₹102.50", "13.6%", "2.8M"),
        ("5.1M", "12.1%", "₹85.30", "24,900 (ATM)", "₹145.80", "13.1%", "4.2M"),
        ("3.2M", "11.8%", "₹48.20", "25,000", "₹208.10", "12.9%", "3.1M"),
        ("1.9M", "11.5%", "₹24.00", "25,100", "₹285.40", "12.5%", "1.6M")
    ]
    
    sy = table_y + 45
    for row in strikes_data:
        is_atm = "ATM" in row[3]
        if is_atm:
            draw.rounded_rectangle([table_x, sy - 5, table_x + cw - 60, sy + 35], radius=6, fill=BG_CARD_LIGHT)
        for i, val in enumerate(row):
            col = COLOR_AMBER if is_atm and i == 3 else (COLOR_EMERALD if i == 2 else (COLOR_CRIMSON if i == 4 else TEXT_GRAY))
            draw.text((table_x + i * hw + 10, sy), val, fill=col, font=font_bold if i in [2,3,4] else font_sub)
        sy += 48
        
    # Strategy Builder Box (Bull Call Spread / Iron Condor)
    draw.text((x0 + 30, sy + 25), "QUANTITATIVE STRATEGY BUILDER", fill=TEXT_WHITE, font=font_h2)
    
    strategies = [
        ("Bull Call Spread (24,800 CE / 25,000 CE)", "Max Profit: ₹4,850 · Max Loss: ₹2,150 · RR 1:2.25", COLOR_EMERALD),
        ("Iron Condor (Delta Neutral Contango)", "Max Profit: ₹6,200 · Probability: 78% · Daily Theta: +₹680", COLOR_INDIGO)
    ]
    
    strat_y = sy + 70
    for title, desc, col in strategies:
        draw.rounded_rectangle([x0 + 30, strat_y, x0 + cw - 30, strat_y + 80], radius=12, fill=BG_CARD_LIGHT, outline=col)
        draw.text((x0 + 50, strat_y + 15), title, fill=TEXT_WHITE, font=font_bold)
        draw.text((x0 + 50, strat_y + 45), desc, fill=col, font=font_sub)
        # Execute Basket Button
        draw.rounded_rectangle([x0 + cw - 220, strat_y + 18, x0 + cw - 50, strat_y + 62], radius=8, fill=col)
        draw.text((x0 + cw - 200, strat_y + 28), "1-CLICK EXECUTE", fill=BG_DARK, font=font_sub)
        strat_y += 95

    # Right: Real-time Greeks Dashboard
    rx = x0 + cw + 30
    rw = WIDTH - rx - 60
    draw.rounded_rectangle([rx, y0, rx + rw, y0 + 780], radius=16, fill=BG_CARD, outline=BORDER_COLOR, width=2)
    draw.text((rx + 24, y0 + 26), "BLACK-SCHOLES GREEKS", fill=TEXT_WHITE, font=font_h2)
    draw.text((rx + 24, y0 + 64), "Real-time Sensitivities", fill=COLOR_AMBER, font=font_sub)
    
    greeks = [
        ("DELTA (Δ)", "+0.524", "Directional risk per ₹1 move in spot", COLOR_EMERALD),
        ("THETA (θ)", "-₹14.80/day", "Daily time decay loss per contract", COLOR_CRIMSON),
        ("GAMMA (Γ)", "+0.0034", "Rate of change of delta", COLOR_CYAN),
        ("VEGA (ν)", "+₹28.50", "P&L sensitivity per 1% IV change", COLOR_INDIGO)
    ]
    
    gy = y0 + 120
    for name, val, desc, c in greeks:
        draw.rounded_rectangle([rx + 24, gy, rx + rw - 24, gy + 100], radius=12, fill=BG_CARD_LIGHT, outline=BORDER_COLOR)
        draw.text((rx + 40, gy + 16), name, fill=TEXT_MUTED, font=font_sub)
        draw.text((rx + 40, gy + 42), val, fill=c, font=font_bold)
        draw.text((rx + 40, gy + 72), desc, fill=TEXT_GRAY, font=font_sub)
        gy += 120
        
    # India VIX Gauge
    draw.rounded_rectangle([rx + 24, gy + 10, rx + rw - 24, gy + 120], radius=12, fill=BG_DARK, outline=COLOR_AMBER)
    draw.text((rx + 40, gy + 26), "INDIA VIX: 13.82 (COOLING)", fill=COLOR_AMBER, font=font_bold)
    draw.text((rx + 40, gy + 56), "Market Regime: Contango / Low Volatility", fill=TEXT_WHITE, font=font_sub)
    draw.text((rx + 40, gy + 82), "Favors: Option Sellers / Credit Spreads", fill=COLOR_EMERALD, font=font_sub)

def render_scene_outro(draw, progress, frame_idx):
    # Grand finale call to action
    cx, cy = WIDTH // 2, HEIGHT // 2 - 20
    card_w, card_h = 1100, 560
    x0, y0 = cx - card_w // 2, cy - card_h // 2
    
    draw.rounded_rectangle([x0 - 4, y0 - 4, x0 + card_w + 4, y0 + card_h + 4], radius=24, outline=COLOR_EMERALD, width=3)
    draw.rounded_rectangle([x0, y0, x0 + card_w, y0 + card_h], radius=20, fill=BG_CARD)
    
    # TS Logo
    draw.rounded_rectangle([cx - 40, y0 + 50, cx + 40, y0 + 130], radius=18, fill=COLOR_EMERALD)
    draw.text((cx - 24, y0 + 68), "TS", fill=BG_DARK, font=font_hero)
    
    draw.text((cx - 180, y0 + 155), "TRADESPHERE", fill=TEXT_WHITE, font=font_hero)
    draw.text((cx - 360, y0 + 225), "Zero Financial Risk · Institutional Execution · Autonomous AI", fill=COLOR_CYAN, font=font_h2)
    
    # 4 Key Pillars
    pillars = [
        ("₹1,00,000 Starting Virtual Capital", "Practice risk-free with atomic execution"),
        ("Autonomous AI Quant Cockpit", "Run local Ollama or cloud models"),
        ("NSE / BSE Real-Time Feed", "Sub-second tick updates & Level 2 depth"),
        ("Institutional F&O Derivatives", "Black-Scholes Greeks & Strategy Builder")
    ]
    
    px = cx - 480
    py = y0 + 290
    for i, (title, sub) in enumerate(pillars):
        col_x = px + (i % 2) * 500
        row_y = py + (i // 2) * 80
        draw.ellipse([col_x, row_y + 10, col_x + 12, row_y + 22], fill=COLOR_EMERALD)
        draw.text((col_x + 24, row_y + 6), title, fill=TEXT_WHITE, font=font_bold)
        draw.text((col_x + 24, row_y + 34), sub, fill=TEXT_GRAY, font=font_sub)
        
    # Big Live Link & Button
    btn_y = y0 + 470
    draw.rounded_rectangle([cx - 260, btn_y, cx + 260, btn_y + 64], radius=14, fill=COLOR_EMERALD)
    draw.text((cx - 180, btn_y + 18), "TRADE ON TRADESPHERE NOW", fill=BG_DARK, font=font_bold)

def render_frame(scene_idx, frame_in_scene, total_frames_in_scene, global_frame):
    """Renders a single 1920x1080 frame."""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    scene = SCENES[scene_idx]
    progress = frame_in_scene / float(total_frames_in_scene)
    
    # Top Navigation Header
    draw_top_nav(draw, global_frame)
    
    # Render Specific Scene
    sid = scene["id"]
    if sid == "intro":
        render_scene_intro(draw, progress, global_frame)
    elif sid == "market_feed":
        render_scene_market_feed(draw, progress, global_frame)
    elif sid == "terminal":
        render_scene_terminal(draw, progress, global_frame)
    elif sid == "ai_agents":
        render_scene_ai_agents(draw, progress, global_frame)
    elif sid == "derivatives":
        render_scene_derivatives(draw, progress, global_frame)
    elif sid == "outro":
        render_scene_outro(draw, progress, global_frame)
        
    # Bottom Subtitle Banner
    draw_subtitle_banner(draw, scene["subtitle"])
    
    return img

def main():
    print("=" * 60)
    print("TradeSphere Institutional Video Generator")
    print("=" * 60)
    
    output_mp4 = "public/tradesphere_demo.mp4"
    output_copy = "public/tradesphere_showcase.mp4"
    
    # Step 1: Synthesize voice audio
    master_audio, durations, temp_dir = synthesize_audio()
    
    # Step 2: Compute scene frame counts
    scene_frame_counts = [int(dur * FPS) for dur in durations]
    total_frames = sum(scene_frame_counts)
    print(f"\n[2/5] Rendering {total_frames} Frames @ {FPS}fps (1080p)...")
    
    # Step 3: Start FFmpeg pipe
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",               # Video from stdin pipe
        "-i", master_audio,      # Audio from file
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        output_mp4
    ]
    
    proc = subprocess.Popen(ffmpeg_cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    global_frame = 0
    for scene_idx, scene in enumerate(SCENES):
        frames_in_scene = scene_frame_counts[scene_idx]
        print(f"  Rendering Scene {scene_idx+1}/{len(SCENES)}: {scene['title']} ({frames_in_scene} frames)...")
        for f in range(frames_in_scene):
            frame_img = render_frame(scene_idx, f, frames_in_scene, global_frame)
            proc.stdin.write(frame_img.tobytes())
            global_frame += 1
            if f % 90 == 0:
                print(f"    Progress: frame {global_frame}/{total_frames} ({(global_frame/total_frames)*100:.1f}%)")
                
    proc.stdin.close()
    proc.wait()
    
    if proc.returncode != 0:
        print("❌ FFmpeg encoding failed!")
        sys.exit(1)
        
    # Also copy to showcase path
    import shutil
    shutil.copyfile(output_mp4, output_copy)
    
    # Clean temp dir
    shutil.rmtree(temp_dir, ignore_errors=True)
    
    file_size_mb = os.path.getsize(output_mp4) / (1024 * 1024)
    print("\n" + "=" * 60)
    print(f"✅ Video Generated Successfully!")
    print(f"📍 Output 1: {output_mp4} ({file_size_mb:.2f} MB)")
    print(f"📍 Output 2: {output_copy}")
    print("=" * 60)

if __name__ == "__main__":
    main()
