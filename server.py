from __future__ import annotations

import json
import hashlib
import hmac
import urllib.error
import urllib.request
import mimetypes
import os
import secrets
import socket
import threading
import time
import webbrowser
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", "8000"))
PLAYER_TTL = 38
MAX_CHAT_MESSAGES = 160
MAX_PLAYERS_PER_SERVER = 64
ACCOUNT_FILE = ROOT / "accounts.json"
CONFIG_FILE = ROOT / "server_settings.json"
AUTH_SESSIONS: dict[str, dict] = {}
ACCOUNTS: dict[str, dict] = {}
SHOP_CATALOG = {
    "compact": {"name": "NC Compact", "price": 4200, "kind": "car", "description": "Şehir içi ekonomik araç"},
    "sport": {"name": "Vortex Sport", "price": 12500, "kind": "car", "description": "Hızlı ve sportif coupe"},
    "suv": {"name": "Metro SUV", "price": 17800, "kind": "car", "description": "Geniş aile aracı"},
    "coffee": {"name": "Kahve", "price": 25, "kind": "item", "description": "Küçük bir enerji molası"},
    "burger": {"name": "Burger", "price": 60, "kind": "item", "description": "Şehir klasiği"},
    "phone": {"name": "Akıllı Telefon", "price": 350, "kind": "item", "description": "Şehirde iletişim için"},
}
DAILY_QUESTS = {
    "first-steps": {"title": "Şehre Merhaba", "description": "Şehre katıl ve ilk adımlarını at.", "reward": 150},
    "game-time": {"title": "Oyun Zamanı", "description": "Bir mini oyunu tamamla.", "reward": 220},
    "city-life": {"title": "Şehir Hayatı", "description": "Market kataloğunu incele ve alışveriş yap.", "reward": 100},
}
THREE_FILE = ROOT / "three.min.js"
THREE_URLS = (
    "https://raw.githubusercontent.com/mrdoob/three.js/r159/build/three.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js",
    "https://unpkg.com/three@0.159.0/build/three.min.js",
)


def ensure_three_engine() -> bool:
    """Install the pinned Three.js browser build locally on first run."""
    if THREE_FILE.is_file():
        try:
            existing = THREE_FILE.read_bytes()
            if len(existing) > 150_000 and b"WebGLRenderer" in existing:
                print(f"  3D motoru      : Yerel dosya hazır ({len(existing) // 1024} KB)")
                return True
        except OSError:
            pass
        print("  UYARI: Mevcut three.min.js dosyası geçersiz; yeniden indirilecek.")
        THREE_FILE.unlink(missing_ok=True)

    print("  3D motoru      : İlk açılış için Three.js indiriliyor...")
    errors = []
    for url in THREE_URLS:
        temp_file = ROOT / "three.min.js.part"
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "NEON-CITY-RP/1.0", "Accept": "*/*"},
            )
            with urllib.request.urlopen(request, timeout=10) as response:
                data = response.read(8_000_000)
            if len(data) < 150_000 or b"WebGLRenderer" not in data:
                raise ValueError(f"Beklenmeyen dosya boyutu/içerik: {len(data)} byte")
            temp_file.write_bytes(data)
            temp_file.replace(THREE_FILE)
            digest = hashlib.sha256(data).hexdigest()[:12]
            print(f"  3D motoru      : Kuruldu ({len(data) // 1024} KB, SHA256 {digest}...)")
            return True
        except Exception as exc:
            errors.append(f"{url}: {exc}")
            try:
                temp_file.unlink(missing_ok=True)
            except OSError:
                pass

    print("  UYARI: Three.js otomatik indirilemedi.")
    for error in errors:
        print(f"    - {error}")
    print("  İnternet erişimini kontrol et; GitHub Raw veya CDN erişimi gerekli.")
    return False

def load_server_config() -> dict:
    defaults = {"name": "NEON CITY RP", "region": "TÜRKİYE · ANA SUNUCU", "capacity": 64, "mode": "Serbest RP", "time_of_day": "evening", "weather": "clear", "day_cycle_minutes": 0}
    try:
        if CONFIG_FILE.exists():
            raw = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
            if isinstance(raw, dict):
                defaults.update({k: raw[k] for k in defaults if k in raw})
    except Exception as exc:
        print(f"Ayar dosyası okunamadı, varsayılanlar kullanılıyor: {exc}")
    defaults["capacity"] = max(1, min(256, int(defaults.get("capacity", 64))))
    if defaults["time_of_day"] not in ("morning", "noon", "evening", "night", "cycle"):
        defaults["time_of_day"] = "evening"
    if defaults["weather"] not in ("clear", "cloudy", "rain"):
        defaults["weather"] = "clear"
    return defaults


def load_accounts() -> None:
    global ACCOUNTS
    try:
        value = json.loads(ACCOUNT_FILE.read_text(encoding="utf-8")) if ACCOUNT_FILE.exists() else {}
        ACCOUNTS = value if isinstance(value, dict) else {}
    except Exception:
        ACCOUNTS = {}


def password_record(password: str, salt: bytes | None = None) -> dict:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return {"salt": salt.hex(), "hash": digest.hex(), "iterations": 310_000}


def verify_password(password: str, record: dict) -> bool:
    try:
        salt = bytes.fromhex(record["salt"])
        expected = bytes.fromhex(record["hash"])
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(record.get("iterations", 310_000)))
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def public_account(username: str, record: dict) -> dict:
    return {"username": username, "role": record.get("role", "Vatandaş")}


def env_int(name: str, default: int, minimum: int, maximum: int) -> int:
    try:
        value = int(os.environ.get(name, str(default)))
    except (TypeError, ValueError):
        value = default
    return max(minimum, min(maximum, value))


# The directory advertises only this real Python server process. The old
# İstanbul/Sahil/Gece entries were demo cards and have intentionally been removed.
SERVER_ID = (os.environ.get("NEON_SERVER_ID", "neon-city-main").strip() or "neon-city-main")[:32]
SERVER_CONFIG = load_server_config()
SERVER = {
    "id": SERVER_ID,
    "name": (os.environ.get("NEON_SERVER_NAME", SERVER_CONFIG["name"]).strip() or "NEON CITY RP")[:40],
    "region": (os.environ.get("NEON_SERVER_REGION", SERVER_CONFIG["region"]).strip() or "TÜRKİYE · ANA SUNUCU")[:40],
    "description": "Bu bilgisayarda çalışan gerçek oyun sunucusu.",
    "capacity": env_int("NEON_SERVER_CAPACITY", SERVER_CONFIG["capacity"], 1, 256),
    "mode": (os.environ.get("NEON_SERVER_MODE", SERVER_CONFIG["mode"]).strip() or "Serbest RP")[:24],
    "accent": "cyan",
}

LOCK = threading.RLock()
PLAYERS: dict[str, dict] = {}
MESSAGES: dict[str, deque] = {SERVER_ID: deque(maxlen=MAX_CHAT_MESSAGES)}
SERVER_READY = threading.Event()
SERVER_STARTED_AT: float | None = None


def now_ms() -> int:
    return int(time.time() * 1000)


def lan_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("192.0.2.1", 80))
        return sock.getsockname()[0]
    except OSError:
        try:
            return socket.gethostbyname(socket.gethostname())
        except OSError:
            return "127.0.0.1"
    finally:
        sock.close()


def clean_text(value: object, limit: int) -> str:
    text = str(value or "").replace("\x00", "").strip()
    return text[:limit]


def server_by_id(server_id: str) -> dict | None:
    # Do not accept example or stale server IDs. Only this live process exists.
    if not SERVER_READY.is_set() or server_id != SERVER_ID:
        return None
    return SERVER


def prune_players() -> None:
    cutoff = time.time() - PLAYER_TTL
    expired = [pid for pid, player in PLAYERS.items() if player.get("seen", 0) < cutoff]
    for pid in expired:
        PLAYERS.pop(pid, None)


def server_snapshot() -> list[dict]:
    # A server appears only while its HTTP game process is actually serving.
    if not SERVER_READY.is_set():
        return []
    with LOCK:
        prune_players()
        count = sum(1 for p in PLAYERS.values() if p.get("serverId") == SERVER_ID)
        uptime = max(0, int(time.time() - (SERVER_STARTED_AT or time.time())))
        return [{
            **SERVER,
            "players": count,
            "status": "full" if count >= SERVER["capacity"] else "online",
            "uptime": uptime,
        }]


def account_for_token(token: str) -> tuple[str, dict] | tuple[None, None]:
    session = AUTH_SESSIONS.get(token)
    if not session:
        return None, None
    username = session.get("username", "")
    record = ACCOUNTS.get(username.casefold())
    if not record:
        return None, None
    record.setdefault("balance", 6500)
    record.setdefault("cars", [])
    record.setdefault("items", {})
    record.setdefault("claimed_quests", {})
    record.setdefault("market_buys", 0)
    return username, record

def save_accounts() -> None:
    ACCOUNT_FILE.write_text(json.dumps(ACCOUNTS, ensure_ascii=False, indent=2), encoding="utf-8")

class GameHandler(BaseHTTPRequestHandler):
    server_version = "NeonCityRP/1.0"

    def log_message(self, fmt: str, *args) -> None:
        # Keep the console readable; API errors are still returned to clients.
        if self.path.startswith("/api/") and args and str(args[1] if len(args) > 1 else "").startswith("5"):
            super().log_message(fmt, *args)

    def _send_json(self, payload: dict, status: int = 200) -> None:
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(raw)

    def _read_json(self) -> dict:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > 24_000:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return {}

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = parsed.path
        if path == "/api/me":
            token = clean_text(self.headers.get("Authorization", "").removeprefix("Bearer "), 160)
            session = AUTH_SESSIONS.get(token)
            if not session:
                self._send_json({"error": "Oturum süresi dolmuş. Yeniden giriş yap."}, 401); return
            account = ACCOUNTS.get(session["username"].casefold())
            if not account:
                self._send_json({"error": "Hesap bulunamadı."}, 404); return
            self._send_json({"ok": True, "account": public_account(session["username"], account)}); return
        if path == "/api/profile":
            token = clean_text(self.headers.get("Authorization", "").removeprefix("Bearer "), 160)
            username, account = account_for_token(token)
            if not account:
                self._send_json({"error": "Giriş yapmalısın."}, 401); return
            self._send_json({"ok": True, "profile": {"username": username, "balance": account["balance"], "cars": account["cars"], "items": account["items"], "claimedQuests": account["claimed_quests"], "marketBuys": account["market_buys"], "joinedOnce": bool(account.get("joined_once")), "miniGames": int(account.get("mini_games", 0))}, "catalog": SHOP_CATALOG, "quests": DAILY_QUESTS}); return
        if path == "/api/bootstrap":
            with LOCK:
                prune_players()
                total = len(PLAYERS)
            self._send_json({"name": "NEON CITY RP", "servers": server_snapshot(), "onlineTotal": total, "serverTime": now_ms(), "world": {"timeOfDay": SERVER_CONFIG["time_of_day"], "weather": SERVER_CONFIG["weather"], "dayCycleMinutes": SERVER_CONFIG["day_cycle_minutes"]}})
            return
        if path == "/api/state":
            query = parse_qs(parsed.query)
            server_id = clean_text(query.get("server", [SERVER_ID])[0], 32)
            since_raw = query.get("since", ["0"])[0]
            try:
                since = int(since_raw)
            except (TypeError, ValueError):
                since = 0
            with LOCK:
                prune_players()
                players = [
                    {k: p.get(k) for k in ("id", "name", "role", "x", "z", "yaw", "color")}
                    for p in PLAYERS.values()
                    if p.get("serverId") == server_id
                ]
                messages = [m for m in MESSAGES.get(server_id, []) if m["time"] > since]
                count = len(players)
            self._send_json({"players": players, "messages": messages, "count": count, "serverTime": now_ms(), "world": {"timeOfDay": SERVER_CONFIG["time_of_day"], "weather": SERVER_CONFIG["weather"], "dayCycleMinutes": SERVER_CONFIG["day_cycle_minutes"]}})
            return
        if path == "/api/ping":
            self._send_json({"ok": SERVER_READY.is_set(), "server": SERVER_ID, "time": now_ms()})
            return
        self._serve_static(path)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        data = self._read_json()
        if path in ("/api/shop/buy", "/api/quest/claim", "/api/minigame/start", "/api/minigame/finish"):
            token = clean_text(self.headers.get("Authorization", "").removeprefix("Bearer "), 160)
            username, account = account_for_token(token)
            if not account:
                self._send_json({"error": "Oturum bulunamadı. Yeniden giriş yap."}, 401); return
            with LOCK:
                if path == "/api/shop/buy":
                    item_id = clean_text(data.get("itemId"), 24)
                    item = SHOP_CATALOG.get(item_id)
                    if not item:
                        self._send_json({"error": "Ürün bulunamadı."}, 404); return
                    if item["kind"] == "car" and item_id in account["cars"]:
                        self._send_json({"error": "Bu araca zaten sahipsin."}, 409); return
                    if account["balance"] < item["price"]:
                        self._send_json({"error": "Yeterli paran yok."}, 400); return
                    account["balance"] -= item["price"]
                    if item["kind"] == "car": account["cars"].append(item_id)
                    else: account["items"][item_id] = account["items"].get(item_id, 0) + 1
                    account["market_buys"] = account.get("market_buys", 0) + 1
                    save_accounts()
                    self._send_json({"ok": True, "message": f'{item["name"]} satın alındı.', "balance": account["balance"], "cars": account["cars"], "items": account["items"], "marketBuys": account["market_buys"]}); return
                if path == "/api/quest/claim":
                    quest_id = clean_text(data.get("questId"), 32)
                    quest = DAILY_QUESTS.get(quest_id)
                    if not quest:
                        self._send_json({"error": "Görev bulunamadı."}, 404); return
                    today = time.strftime("%Y-%m-%d", time.gmtime())
                    if account["claimed_quests"].get(quest_id) == today:
                        self._send_json({"error": "Bu görevin bugünkü ödülünü zaten aldın."}, 409); return
                    completed = (quest_id == "first-steps" and account.get("joined_once")) or (quest_id == "game-time" and account.get("mini_games", 0) > 0) or (quest_id == "city-life" and account.get("market_buys", 0) > 0)
                    if not completed:
                        self._send_json({"error": "Önce görev şartını tamamla."}, 400); return
                    account["claimed_quests"][quest_id] = today; account["balance"] += quest["reward"]; save_accounts()
                    self._send_json({"ok": True, "balance": account["balance"], "reward": quest["reward"]}); return
                if path == "/api/minigame/start":
                    game_id = clean_text(data.get("gameId"), 24)
                    if game_id not in ("math", "memory", "reaction"):
                        self._send_json({"error": "Mini oyun bulunamadı."}, 404); return
                    session = AUTH_SESSIONS[token]
                    session["minigame"] = {"id": game_id, "started": time.time(), "nonce": secrets.token_urlsafe(18)}
                    self._send_json({"ok": True, "nonce": session["minigame"]["nonce"]}); return
                if path == "/api/minigame/finish":
                    session = AUTH_SESSIONS[token]
                    challenge = session.get("minigame")
                    nonce = clean_text(data.get("nonce"), 80)
                    if not challenge or not secrets.compare_digest(challenge.get("nonce", ""), nonce):
                        self._send_json({"error": "Oyun oturumu geçersiz."}, 400); return
                    elapsed = time.time() - challenge["started"]
                    if elapsed < 7:
                        self._send_json({"error": "Ödül için mini oyunda biraz daha zaman geçir."}, 400); return
                    session.pop("minigame", None)
                    reward = {"math": 90, "memory": 110, "reaction": 80}[challenge["id"]]
                    account["balance"] += reward; account["mini_games"] = account.get("mini_games", 0) + 1; save_accounts()
                    self._send_json({"ok": True, "reward": reward, "balance": account["balance"]}); return
        if path in ("/api/register", "/api/login"):
            username = clean_text(data.get("username"), 18)
            password = str(data.get("password") or "")
            key = username.casefold()
            if len(username) < 3 or not all(ch.isalnum() or ch == "_" for ch in username):
                self._send_json({"error": "Kullanıcı adı 3-18 karakter olmalı; harf, rakam ve _ kullan."}, 400); return
            if len(password) < 8 or len(password) > 128:
                self._send_json({"error": "Şifre en az 8, en fazla 128 karakter olmalı."}, 400); return
            with LOCK:
                if path == "/api/register":
                    if key in ACCOUNTS:
                        self._send_json({"error": "Bu kullanıcı adı zaten alınmış."}, 409); return
                    ACCOUNTS[key] = {**password_record(password), "username": username, "role": "Vatandaş", "balance": 6500, "cars": [], "items": {}, "claimed_quests": {}, "market_buys": 0}
                    save_accounts()
                else:
                    record = ACCOUNTS.get(key)
                    if not record or not verify_password(password, record):
                        self._send_json({"error": "Kullanıcı adı veya şifre hatalı."}, 401); return
                token = secrets.token_urlsafe(32)
                AUTH_SESSIONS[token] = {"username": ACCOUNTS[key]["username"], "created": time.time()}
            self._send_json({"ok": True, "token": token, "account": public_account(ACCOUNTS[key]["username"], ACCOUNTS[key])}); return

        if path == "/api/join":
            token = clean_text(self.headers.get("Authorization", "").removeprefix("Bearer "), 160)
            session = AUTH_SESSIONS.get(token)
            if not session:
                self._send_json({"error": "Önce hesabına giriş yapmalısın."}, 401); return
            name = session["username"]
            role = clean_text(data.get("role"), 20)
            server_id = clean_text(data.get("serverId"), 24)
            color = clean_text(data.get("color", "#57e5dc"), 16)
            if len(name) < 2:
                self._send_json({"error": "Oyuncu adın en az 2 karakter olmalı."}, 400)
                return
            server = server_by_id(server_id)
            if not server:
                self._send_json({"error": "Seçilen sunucu bulunamadı."}, 404)
                return
            with LOCK:
                prune_players()
                count = sum(1 for p in PLAYERS.values() if p.get("serverId") == server_id)
                if count >= server["capacity"]:
                    self._send_json({"error": "Bu sunucu dolu. Başka bir sunucu deneyebilirsin."}, 409)
                    return
                player_id = secrets.token_urlsafe(12)
                player = {
                    "id": player_id, "name": name, "role": role or "Vatandaş", "serverId": server_id,
                    "x": 0.0, "z": 4.0, "yaw": 0.0, "color": color, "seen": time.time(),
                }
                PLAYERS[player_id] = player
                account = ACCOUNTS.get(name.casefold())
                if account is not None and not account.get("joined_once"):
                    account["joined_once"] = True
                    save_accounts()
                welcome = {"id": secrets.token_hex(6), "name": "NEON CITY", "role": "SİSTEM", "channel": "sistem", "text": f"{name}, {server['name']} sunucusuna giriş yaptı.", "time": now_ms()}
                MESSAGES[server_id].append(welcome)
            self._send_json({"ok": True, "player": {k: player[k] for k in ("id", "name", "role", "serverId", "x", "z", "yaw", "color")}, "server": server})
            return

        if path == "/api/player":
            player_id = clean_text(data.get("id"), 80)
            with LOCK:
                player = PLAYERS.get(player_id)
                if not player:
                    self._send_json({"error": "Oturum bulunamadı. Sunucuya yeniden bağlan."}, 404)
                    return
                try:
                    player["x"] = max(-90.0, min(90.0, float(data.get("x", 0))))
                    player["z"] = max(-90.0, min(90.0, float(data.get("z", 0))))
                    player["yaw"] = float(data.get("yaw", 0)) % 6.28319
                except (TypeError, ValueError):
                    self._send_json({"error": "Konum verisi geçersiz."}, 400)
                    return
                player["seen"] = time.time()
            self._send_json({"ok": True})
            return

        if path == "/api/chat":
            player_id = clean_text(data.get("playerId"), 80)
            message = clean_text(data.get("text"), 220)
            channel = clean_text(data.get("channel", "genel"), 16)
            if not message:
                self._send_json({"error": "Boş mesaj gönderilemez."}, 400)
                return
            if channel not in ("genel", "rol"):
                channel = "genel"
            with LOCK:
                prune_players()
                player = PLAYERS.get(player_id)
                if not player:
                    self._send_json({"error": "Sohbet için önce bir sunucuya bağlan."}, 401)
                    return
                record = {
                    "id": secrets.token_hex(6), "name": player["name"], "role": player["role"],
                    "channel": channel, "text": message, "time": now_ms(),
                }
                MESSAGES[player["serverId"]].append(record)
                player["seen"] = time.time()
            self._send_json({"ok": True, "message": record})
            return

        if path == "/api/leave":
            player_id = clean_text(data.get("id"), 80)
            with LOCK:
                player = PLAYERS.pop(player_id, None)
                if player:
                    MESSAGES[player["serverId"]].append({
                        "id": secrets.token_hex(6), "name": "NEON CITY", "role": "SİSTEM", "channel": "sistem",
                        "text": f"{player['name']} şehirden ayrıldı.", "time": now_ms(),
                    })
            self._send_json({"ok": True})
            return

        self._send_json({"error": "Bilinmeyen API adresi."}, 404)

    def _serve_static(self, url_path: str) -> None:
        relative = "index.html" if url_path in ("", "/") else url_path.lstrip("/")
        candidate = (ROOT / relative).resolve()
        try:
            candidate.relative_to(ROOT)
        except ValueError:
            self.send_error(403, "Forbidden")
            return
        if not candidate.is_file():
            self.send_error(404, "Not Found")
            return
        content = candidate.read_bytes()
        content_type = mimetypes.guess_type(str(candidate))[0] or "application/octet-stream"
        if content_type.startswith("text/") or content_type in ("application/javascript", "application/json"):
            content_type += "; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(content)


def main() -> None:
    load_accounts()
    if not CONFIG_FILE.exists():
        CONFIG_FILE.write_text(json.dumps(SERVER_CONFIG, ensure_ascii=False, indent=2), encoding="utf-8")
    ensure_three_engine()
    httpd = ThreadingHTTPServer((HOST, PORT), GameHandler)
    httpd.daemon_threads = True
    global SERVER_STARTED_AT
    SERVER_STARTED_AT = time.time()
    SERVER_READY.set()
    ip = lan_ip()
    print("\n" + "=" * 60)
    print(f"  {SERVER['name']}  |  GERÇEK OYUN SUNUCUSU")
    print("=" * 60)
    print(f"  Bu bilgisayarda : http://127.0.0.1:{PORT}")
    print(f"  Yerel ağ (LAN)  : http://{ip}:{PORT}")
    print(f"  Sunucu kimliği  : {SERVER_ID}")
    print(f"  Oyuncu kapasite : {SERVER['capacity']}")
    print(f"  Saat / hava     : {SERVER_CONFIG['time_of_day']} / {SERVER_CONFIG['weather']}")
    print(f"  Ayarlar dosyası : {CONFIG_FILE.name}")
    print("  Durdurmak için  : CTRL + C")
    print("=" * 60)
    print("  Not: Arkadaşların aynı Wi-Fi/ağdaysa LAN adresini kullanabilir.")
    print("  İnternete açık sunucu olarak kullanmak için güvenlik ve barındırma ayarı gerekir.\n")
    # Open the HTTP address only after the socket is ready. This avoids users
    # opening index.html directly from file:/// by mistake.
    threading.Timer(1.0, lambda: webbrowser.open(f"http://127.0.0.1:{PORT}")).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nSunucu kapatılıyor...")
    finally:
        SERVER_READY.clear()
        httpd.server_close()


if __name__ == "__main__":
    main()
