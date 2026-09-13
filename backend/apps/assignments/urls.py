from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AssignmentViewSet, GradeSubmissionView, InstructorSubmissionsView,
    MySubmissionsView, SubmitAssignmentView,
)

router = DefaultRouter()
router.register('', AssignmentViewSet, basename='assignment')

urlpatterns = [
    path('submit/', SubmitAssignmentView.as_view(), name='assignment-submit'),
    path('my-submissions/', MySubmissionsView.as_view(), name='my-submissions'),
    path('instructor-submissions/', InstructorSubmissionsView.as_view(), name='instructor-submissions'),
    path('submissions/<int:pk>/grade/', GradeSubmissionView.as_view(), name='grade-submission'),
] + router.urls
