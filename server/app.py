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
connected_clients_chat = {}
przegrani = 0
points = {}
points_list = []

connectionToUsername = {}

async def player_ready_handler(sender_id, data):
    print(f"Gracz {sender_id} jest gotowy.")
    ready_players.append(sender_id)
    print(ready_players)

    # Jeśli mamy trzech graczy, uruchamiamy odliczanie
    if len(ready_players) == 3:
        print("Trzech graczy gotowych, zaczynamy odliczanie!")
        await start_game_countdown()


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

async def broadcast_to_all_chat(message):
    for client in connected_clients_chat.values():
        await client.send_text(message)


async def websocket_handler(websocket: WebSocket, on_message, typ, username):
    await websocket.accept()
    player_id = id(websocket)

    if typ == "interface":
        connected_clients_chat[player_id] = websocket
        while True:
            try:
                data = await websocket.receive_text()
                await on_message(player_id, data)
            except WebSocketDisconnect:
                del connected_clients_chat[player_id]

    if typ == "ws":
        points[player_id] = 0

        connected_clients[player_id] = websocket
        connectionToUsername[player_id] = username  # Domyślna nazwa użytkownika
        print("Zarejestrowano gracza:", player_id)
        print("Aktualni klienci:", connected_clients.keys())
        await send_active_players_to_all()
        try:
            await connected_clients[player_id].send_text(json.dumps({"type": "player", "player_id": player_id}))
            print("Wysłano info do gracza:", player_id)

        except Exception as e:
            print(f"Błąd przy wysyłaniu do gracza {player_id}: {e}")

        try:
            while True:
                data = await websocket.receive_text()
                data2 = json.loads(data)
                #print(f"Odebrano dane z klienta: {data2}")
                if data2.get("type")== "player_ready":
                    print(data2)
                    await player_ready_handler(player_id, data2)
                elif data2.get("type") == "loss":
                    global przegrani, ready_players, points_list

                    points_list.append(player_id)
                    for i in points.keys():
                        if i not in points_list:
                            points[i] += 1
                            print(f"{i}: {points[i]}")
                            message = json.dumps({"type": "scoreboard", "scores": {pid: points[pid] for pid in points.keys()}, "scores": points})
                            await broadcast_to_all_chat(message)

                    przegrani = przegrani + 1

                    if przegrani == 2:
                        flag = False
                        przegrani = 0
                        points_list = []
                        ready_players = []

                        for i in points.keys():
                            if points[i] >= 5:
                                for a in points.keys():
                                    points_list.append(a)
                                flag = True
                                message = json.dumps({"type": "winner", "place": "first"})
                                print(f"wysyłam do {i}")
                                await connected_clients[i].send_text(message)
                                await asyncio.sleep(1)
                                print(f"Usuwam {i}")
                                points_list.remove(i)
                                print(f"Lista: {points_list}")
                                message_sec = json.dumps({"type": "winner", "place": "second"})
                                message_thr = json.dumps({"type": "winner", "place": "third"})
                                if points[points_list[0]] > points[points_list[1]]:
                                    await connected_clients[points_list[0]].send_text(message_sec)
                                    await connected_clients[points_list[1]].send_text(message_thr)
                                elif points[points_list[1]] > points[points_list[0]]:
                                    await connected_clients[points_list[1]].send_text(message_sec)
                                    await connected_clients[points_list[0]].send_text(message_thr)
                                else:
                                    await connected_clients[points_list[1]].send_text(message_sec)
                                    await connected_clients[points_list[0]].send_text(message_sec)
                                ready_players = []
                                points_list = []
                                for i in points.keys():
                                    points[i] = 0
                        if flag == False:
                            message = json.dumps({"type": "new_game"})
                            await broadcast_to_all(message)
                            await asyncio.sleep(1)
                        points_list = []

                elif data2.get("type") == "scoreboard":
                    connectionToUsername[player_id] = data2.get("username")
                    message = json.dumps({
                        "type": "scoreboard",
                        "scores": {connectionToUsername[player_id]: points[player_id] for player_id in points.keys()}
                    })
                    await broadcast_to_all_chat(message)
                else:
                    await on_message(player_id, data)

        except WebSocketDisconnect:
            del connected_clients[player_id]
            del connectionToUsername[player_id]
            if player_id in points:
                del points[player_id]
            if player_id in points_list:
                points_list.remove(player_id)
            if player_id in ready_players:
                ready_players.remove(player_id)
                print(f"Gracz {player_id} został usunięty z listy gotowych.")
            await send_active_players_to_all()

async def broadcast_except_sender(sender_id, message):
    for pid, client in connected_clients.items():
        if pid != sender_id:
            await client.send_text(message)

async def broadcast_except_sender_chat(sender_id, message):
    for pid, client in connected_clients_chat.items():
        if pid != sender_id:
            await client.send_text(message)

async def chat_message_handler(sender_id, data):
    print(f"Odebrano wiadomosc {sender_id}: {data}")
    await broadcast_except_sender(sender_id, data)

async def movement_message_handler(sender_id, data):
    movement = json.loads(data)
    movement.update({"type": "movement", "player_id": sender_id})
    await broadcast_except_sender(sender_id, json.dumps(movement))




@app.websocket("/interface")
async def websocket_chat_endpoint(websocket: WebSocket,username:str):
    await websocket_handler(websocket, chat_message_handler, "interface",username)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket,username:str):
    await websocket_handler(websocket, movement_message_handler, "ws",username) 
