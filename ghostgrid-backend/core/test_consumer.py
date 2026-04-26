from channels.generic.websocket import WebsocketConsumer
import json

class TestConsumer(WebsocketConsumer):
    def connect(self):
        print("Test WebSocket connection received")
        self.accept()
        print("Test WebSocket connection accepted")
        self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Test WebSocket connected successfully'
        }))

    def disconnect(self, close_code):
        print("Test WebSocket disconnected")

    def receive(self, text_data):
        print(f"Test WebSocket received: {text_data}")
        self.send(text_data=json.dumps({
            'type': 'echo',
            'message': f'Received: {text_data}'
        }))