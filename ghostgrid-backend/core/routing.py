from django.urls import re_path
from . import consumers
from . import test_consumer

websocket_urlpatterns = [
    re_path(r'ws/board/(?P<board_id>[\w-]+)/$', consumers.BoardConsumer.as_asgi()),
    re_path(r'ws/test/$', test_consumer.TestConsumer.as_asgi()),
]