from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.courses.permissions import IsInstructorOrReadOnly

from .models import Assignment, Submission
from .serializers import AssignmentSerializer, GradeSubmissionSerializer, SubmissionSerializer


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsInstructorOrReadOnly]
    filterset_fields = ['section']


class SubmitAssignmentView(APIView):
    """Talaba vazifani topshiradi (qayta topshirsa — yangilanadi)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        assignment = get_object_or_404(Assignment, pk=request.data.get('assignment'))
        submission, _ = Submission.objects.update_or_create(
            assignment=assignment,
            student=request.user,
            defaults={
                'text': request.data.get('text', ''),
                'file': request.FILES.get('file'),
                'grade': None,
                'feedback': '',
                'graded_at': None,
            },
        )
        return Response(SubmissionSerializer(submission).data, status=201)


class MySubmissionsView(generics.ListAPIView):
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Submission.objects.filter(student=self.request.user)
        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)
        return qs


class InstructorSubmissionsView(generics.ListAPIView):
    """Instructor o'z kurslariga kelgan barcha topshiriqlarni ko'radi."""

    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Submission.objects.filter(assignment__section__course__instructor=self.request.user)


class GradeSubmissionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        submission = get_object_or_404(Submission, pk=pk)
        course = submission.assignment.section.course
        if course.instructor_id != request.user.id and not request.user.is_staff:
            return Response({'detail': "Ruxsat yo'q."}, status=403)

        serializer = GradeSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submission.grade = serializer.validated_data['grade']
        submission.feedback = serializer.validated_data['feedback']
        submission.graded_at = timezone.now()
        submission.save()
        return Response(SubmissionSerializer(submission).data)
