from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification
from .tasks import send_notification_email


def send_notification(user, message: str):
    """DB'ga bildirishnoma yozadi, WebSocket orqali (agar ulangan bo'lsa) va emailga yuboradi."""
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

    if user.email:
        send_notification_email.delay(user.email, message)

    return notification
