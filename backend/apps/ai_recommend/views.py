from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.serializers import CourseListSerializer

from .chat import GroqError, ask_groq
from .recommend import recommend_courses_for_user


class RecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        courses = recommend_courses_for_user(request.user)
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)


class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    history = serializers.ListField(child=serializers.DictField(), required=False, default=list)


class ChatView(APIView):
    """AI chat vidjeti uchun — foydalanuvchi xabarini Groq'ga yuboradi (kalit faqat backend'da)."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reply = ask_groq(serializer.validated_data['message'], serializer.validated_data.get('history'))
        except GroqError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({'reply': reply})
