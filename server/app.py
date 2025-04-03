from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uuid  # Generowanie unikalnych ID dla graczy
app = FastAPI()

# Lista aktywnych połączeń
connected_clients = {}  # Słownik {gracz_id: websocket}
players = {}  # Słownik {gracz_id: {"x": int, "y": int, "angle": float}}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    player_id = str(uuid.uuid4())  # Tworzymy unikalne ID dla gracza
    connected_clients[player_id] = websocket
    players[player_id] = {"x": 400, "y": 300, "angle": 0}  # Startowa pozycja

    print(f"Nowy gracz połączony: {player_id}")

    try:
        while True:
            data = await websocket.receive_json()
            if "x" in data and "y" in data and "angle" in data:
                players[player_id] = data  # Aktualizacja pozycji gracza

                # Wysyłanie pozycji do wszystkich klientów
                for pid, client in connected_clients.items():
                    await client.send_json({"players": players})



    except WebSocketDisconnect:
        del connected_clients[player_id]
        del players[player_id]
        print(f"Gracz {player_id} rozłączony")

@app.get("/")
async def root():
    return {"message": "Serwer działa"}
