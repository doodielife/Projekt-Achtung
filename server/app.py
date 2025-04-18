from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# Middleware CORS, aby frontend mógł się połączyć lokalnie
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Przechowuje aktywnych graczy (połączenia WebSocket)
connected_clients = {}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    player_id = id(websocket)
    connected_clients[player_id] = websocket

    # Po połączeniu, wysyłamy do gracza listę aktywnych graczy
    await send_active_players_to_all()

    try:
        while True:
            data = await websocket.receive_text()
            movement = json.loads(data)
            # Przekazywanie wiadomości do wszystkich innych graczy
            for pid, client in connected_clients.items():
                if pid != player_id:
                    await client.send_text(data)
    except WebSocketDisconnect:
        # Gracz się rozłączył - usuwamy go z listy
        del connected_clients[player_id]
        await send_active_players_to_all()


# Funkcja wysyłająca listę aktywnych graczy do wszystkich klientów
async def send_active_players_to_all():
    active_players = list(connected_clients.keys())  # Lista aktywnych graczy (po ID połączenia)
    # Wysyłamy listę graczy do każdego podłączonego klienta
    for pid, client in connected_clients.items():
        try:
            # Wysyłamy listę aktywnych graczy w formacie JSON
            await client.send_text(json.dumps({"active_players": active_players}))
        except WebSocketDisconnect:
            continue
