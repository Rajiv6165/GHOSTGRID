import websocket
import json
import time

def on_message(ws, message):
    print(f"Received: {message}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws):
    print("Connection opened successfully!")
    # Send a join room message
    ws.send(json.dumps({"type": "join_room"}))
    
    # Send a test message
    ws.send(json.dumps({"type": "test", "message": "Hello from Python client"}))
    
    # Keep connection alive
    def run(*args):
        while True:
            time.sleep(30)
            ws.send("ping")
    
    import threading
    threading.Thread(target=run).start()

if __name__ == "__main__":
    # Test with a fake board ID that matches frontend pattern
    board_id = "board-" + str(int(time.time() * 1000))
    print(f"Testing WebSocket connection with board ID: {board_id}")
    
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp(f"ws://127.0.0.1:8000/ws/board/{board_id}/",
                              on_open=on_open,
                              on_message=on_message,
                              on_error=on_error,
                              on_close=on_close)
    
    ws.run_forever()