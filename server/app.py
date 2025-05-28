from pickle import FALSE

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio

app = FastAPI()

# Middleware CORS, aby frontend mógł się połączyć lokalnie
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ready_players = []
# Przechowuje aktywnych graczy (połączenia WebSocket)
connected_clients = {}


async def player_ready_handler(sender_id, data):
    print(f"Gracz {sender_id} jest gotowy.")
    ready_players.append(sender_id)
    print(ready_players)
    print(connected_clients.keys)

    # Jeśli mamy trzech graczy, uruchamiamy odliczanie
    if len(ready_players) == 3:
        print("Trzech graczy gotowych, zaczynamy odliczanie!")
        await start_game_countdown()


async def player_loser_handler(sender_id, data):
    print(f"Gracz {sender_id} odpadł z gry!")
    ready_players.remove(sender_id)
    del connected_clients[sender_id]
    print(connected_clients.keys())
    print(ready_players)
    if len(ready_players) == 1:
        print(f"Gratulacje! Gracz {ready_players[0]} wygrał grę!")

        # Wyślij wiadomość o zakończeniu gry
        await broadcast_to_all(json.dumps({
            "type": "winner",
            "winner": ready_players[0]
        }))
        ready_players.clear()


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
    #gdy jest dokładnie trzecg graczy - odpala odliczanie
    # if len(connected_clients) == 6:
    #     print("Mam trzech graczy, Odliczam!")
    #     print(active_players)
    #     await start_game_countdown()



async def start_game_countdown():
    for count in [3,2,1]:
        message = json.dumps({
            "type": "countdown",
            "value": count
        })
        #print(f"Wysłano {count}")
        await broadcast_to_all(message)
        await asyncio.sleep(1)


    start_message = json.dumps({
        "type": "start_game"
    })
    await broadcast_to_all(start_message)

async def broadcast_to_all(message):
    for client in connected_clients.values():
        await client.send_text(message)



async def websocket_handler(websocket: WebSocket, on_message):
    await websocket.accept()
    player_id = id(websocket)
    connected_clients[player_id] = websocket
    await send_active_players_to_all()
    await websocket.send_json({"player_id": player_id, "type": "player_id"})

    try:
        while True:
            data = await websocket.receive_text()
            data2 = json.loads(data)
            if data2.get("type")== "player_ready":
                await player_ready_handler(player_id, data2)
            elif data2.get("type") == "player_out":
                await player_loser_handler(player_id, data2)
            else:
                await on_message(player_id, data)

    except WebSocketDisconnect:
        del connected_clients[player_id]
        if player_id in ready_players:
            ready_players.remove(player_id)
            print(f"Gracz {player_id} został usunięty z listy gotowych.")
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