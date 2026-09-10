from rest_framework import permissions


class IsInstructorOrReadOnly(permissions.BasePermission):
    """Faqat instructor/admin yozishi mumkin, boshqalar uchun faqat o'qish."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or getattr(request.user, 'is_instructor', False))
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        owner = getattr(obj, 'instructor', None) or getattr(getattr(obj, 'course', None), 'instructor', None)
        return request.user.is_staff or owner == request.user
