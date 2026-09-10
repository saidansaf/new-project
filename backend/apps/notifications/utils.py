from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification


def send_notification(user, message: str):
    """DB'ga bildirishnoma yozadi va (agar ulangan bo'lsa) WebSocket orqali real-time yuboradi."""
    notification = Notification.objects.create(user=user, message=message)

    channel_layer = get_channel_layer()
    if channel_layer is not None:
        async_to_sync(channel_layer.group_send)(
            f'user_{user.id}',
            {
                'type': 'notify',
                'data': {
                    'id': notification.id,
                    'message': notification.message,
                    'created_at': notification.created_at.isoformat(),
                },
            },
        )
    return notification
