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
async def websocket_handler(websocket: WebSocket, on_message):
    await websocket.accept()
    player_id = id(websocket)
    connected_clients[player_id] = websocket
    await send_active_players_to_all()
    await websocket.send_json({"player_id": player_id, "type": "player_id"})

    try:
        while True:
            data = await websocket.receive_text()
            await on_message(player_id, data)
    except WebSocketDisconnect:
        del connected_clients[player_id]
        await send_active_players_to_all()

async def broadcast_except_sender(sender_id, message):
    for pid, client in connected_clients.items():
        if pid != sender_id:
            await client.send_text(message)

async def chat_message_handler(sender_id, data):
    print(f"Odebrano wiadomosc {sender_id}: {data}")
    await broadcast_except_sender(sender_id, json.dumps(data))

async def movement_message_handler(sender_id, data):
    movement = json.loads(data)
    movement.update({"type": "movement", "player_id": sender_id})
    await broadcast_except_sender(sender_id, json.dumps(movement))

@app.websocket("/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    await websocket_handler(websocket, chat_message_handler)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_handler(websocket, movement_message_handler)

async def send_active_players_to_all():
    active_players = list(connected_clients.keys())
    for client in connected_clients.values():
        try:
            await client.send_text(json.dumps({
                "active_players": active_players,
                "type": "active_players"
            }))
        except WebSocketDisconnect:
            continue