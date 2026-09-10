from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.serializers import CourseListSerializer

from .recommend import recommend_courses_for_user


class RecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        courses = recommend_courses_for_user(request.user)
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)
