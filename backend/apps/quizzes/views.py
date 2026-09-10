from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Answer, Question, Quiz, QuizResult
from .serializers import QuizSerializer, QuizSubmitSerializer


class QuizViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Quiz.objects.prefetch_related('questions__answers')
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ['section']


class QuizSubmitView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        quiz = Quiz.objects.prefetch_related('questions__answers').get(pk=pk)
        serializer = QuizSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        submitted = serializer.validated_data['answers']

        questions = list(quiz.questions.all())
        total = len(questions)
        correct = 0
        for question in questions:
            correct_ids = set(
                Answer.objects.filter(question=question, is_correct=True).values_list('id', flat=True)
            )
            given_ids = set(submitted.get(str(question.id), []))
            if given_ids == correct_ids:
                correct += 1

        score = round((correct / total) * 100) if total else 0
        result = QuizResult.objects.create(
            student=request.user, quiz=quiz, score=score, passed=score >= 60
        )
        return Response(
            {'score': result.score, 'passed': result.passed, 'correct': correct, 'total': total},
            status=status.HTTP_201_CREATED,
        )
