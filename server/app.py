from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

rooms = {}  # room_id -> {'players': {}, 'chat': {}, 'points': {}, 'ready_players': [], 'game_start': False, 'losers': 0}
player_to_room = {}  # player_id -> room_id
connectionToUsername = {}

def find_or_create_room():
    for room_id, room in rooms.items():
        if len(room['players']) < 3 and not room['game_on']:
            return room_id
    room_id = f"room_{len(rooms)+1}"
    rooms[room_id] = {
        'players': {},
        'chat': {},
        'points': {},
        'ready_players': [],
        'game_start': False,
        'losers': 0,
        'points_list': [],
        'game_on':  False
    }
    return room_id

async def send_active_players_to_all(room_id):
    room = rooms[room_id]
    active_players = list(room['players'].keys())
    for client in room['players'].values():
        await client.send_text(json.dumps({
            "active_players": active_players,
            "type": "active_players"
        }))

async def broadcast_to_all(room_id, message):
    for client in rooms[room_id]['players'].values():
        await client.send_text(message)

async def broadcast_to_all_chat(room_id, message):
    for client in rooms[room_id]['chat'].values():
        await client.send_text(message)

async def player_ready_handler(player_id, room_id):
    room = rooms[room_id]
    room['ready_players'].append(player_id)
    if len(room['ready_players']) == 3 or room['game_start']:
        if len(room['ready_players']) == len(room['players']):
            await start_game_countdown(room_id)
            room['game_start'] = True

async def start_game_countdown(room_id):
    room = rooms[room_id]
    for count in [3, 2, 1]:
        message = json.dumps({"type": "countdown", "value": count})
        await broadcast_to_all(room_id, message)
        await asyncio.sleep(1)
    await broadcast_to_all(room_id, json.dumps({"type": "start_game"}))
    room['game_on'] = True

async def websocket_handler(websocket: WebSocket, on_message, typ, username):
    await websocket.accept()
    player_id = id(websocket)
    room_id = find_or_create_room()
    room = rooms[room_id]
    player_to_room[player_id] = room_id

    if typ == "interface":
        room['chat'][player_id] = websocket
        try:
            while True:
                data = await websocket.receive_text()
                await on_message(player_id, data)
        except WebSocketDisconnect:
            del room['chat'][player_id]

    elif typ == "ws":
        room['players'][player_id] = websocket
        room['points'][player_id] = 0
        connectionToUsername[player_id] = username
        await send_active_players_to_all(room_id)

        try:
            await websocket.send_text(json.dumps({"type": "player", "player_id": player_id}))
            while True:
                data = await websocket.receive_text()
                data2 = json.loads(data)
                if data2.get("type") == "player_ready":
                    await player_ready_handler(player_id, room_id)
                elif data2.get("type") == "loss":
                    await handle_loss(player_id, room_id)
                elif data2.get("type") == "scoreboard":
                    connectionToUsername[player_id] = data2.get("username")
                    await broadcast_scoreboard(room_id)
                else:
                    await on_message(player_id, data)
        except WebSocketDisconnect:
            await handle_disconnect(player_id, room_id)

async def handle_disconnect(player_id, room_id):
    room = rooms[room_id]
    room['players'].pop(player_id, None)
    room['chat'].pop(player_id, None)
    connectionToUsername.pop(player_id, None)
    room['points'].pop(player_id, None)
    if player_id in room['points_list']:
        room['points_list'].remove(player_id)
    if player_id in room['ready_players']:
        room['ready_players'].remove(player_id)
    # room['losers'] += 1
    await send_active_players_to_all(room_id)

    # if len(room['players']) == 2 and room['losers'] == 1:
    #     await handle_winner_logic(room_id)

async def handle_loss(player_id, room_id):
    room = rooms[room_id]
    room['losers'] += 1
    room['points_list'].append(player_id)
    for pid in room['points'].keys():
        if pid not in room['points_list']:
            room['points'][pid] += 1
            message = json.dumps({"type": "scoreboard", "scores": room['points']})
            await broadcast_to_all_chat(room_id, message)

    if len(room['players']) == 3 and room['losers'] == 2:
        await handle_winner_logic(room_id)
    elif len(room['players']) == 2 and room['losers'] == 1:
        await handle_winner_logic(room_id)

def sort_points(points_dict):
    return sorted(points_dict.items(), key=lambda x: -x[1])

async def handle_winner_logic(room_id):
    room = rooms[room_id]
 #   room['game_start'] = False
    room['losers'] = 0
    room['ready_players'] = []
    points_list = room['points_list']
    flag = False

    for pid, score in room['points'].items():
        if score >= 5:
            all_players = list(room['points'].keys())
            points_list = [pid for pid in all_players]
            flag = True
            message = json.dumps({"type": "winner", "place": "first"})
            await room['players'][pid].send_text(message)
            await asyncio.sleep(1)
            points_list.remove(pid)
            message_sec = json.dumps({"type": "winner", "place": "second"})
            message_thr = json.dumps({"type": "winner", "place": "third"})
            if len(points_list) == 2 and room['points'][points_list[0]] > room['points'][points_list[1]]:
                await room['players'][points_list[0]].send_text(message_sec)
                await room['players'][points_list[1]].send_text(message_thr)
            elif len(points_list) == 2 and room['points'][points_list[1]] > room['points'][points_list[0]]:
                await room['players'][points_list[1]].send_text(message_sec)
                await room['players'][points_list[0]].send_text(message_thr)
            else:
                for pid in points_list:
                    await room['players'][pid].send_text(message_sec)
            for pid in room['points'].keys():
                room['points'][pid] = 0
            room['points_list'] = []
            room['game_start'] = False
            room['game_on'] = False
            return

    if not flag:
        await broadcast_to_all(room_id, json.dumps({"type": "new_game"}))
        await asyncio.sleep(1)
        room['points_list'] = []

async def broadcast_scoreboard(room_id):
    room = rooms[room_id]
    scores = {connectionToUsername[pid]: room['points'][pid] for pid in room['points'].keys()}
    message = json.dumps({"type": "scoreboard", "scores": scores})
    await broadcast_to_all_chat(room_id, message)

async def broadcast_except_sender(sender_id, room_id, message):
    for pid, client in rooms[room_id]['players'].items():
        if pid != sender_id:
            await client.send_text(message)

async def broadcast_except_sender_chat(sender_id, room_id, message):
    for pid, client in rooms[room_id]['chat'].items():
        if pid != sender_id:
            await client.send_text(message)

async def chat_message_handler(sender_id, data):
    room_id = player_to_room[sender_id]
    await broadcast_except_sender_chat(sender_id, room_id, data)

async def movement_message_handler(sender_id, data):
    room_id = player_to_room[sender_id]
    movement = json.loads(data)
    movement.update({"type": "movement", "player_id": sender_id})
    await broadcast_except_sender(sender_id, room_id, json.dumps(movement))

@app.websocket("/interface")
async def websocket_chat_endpoint(websocket: WebSocket, username: str):
    await websocket_handler(websocket, chat_message_handler, "interface", username)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, username: str):
    await websocket_handler(websocket, movement_message_handler, "ws", username)
