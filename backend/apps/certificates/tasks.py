import io

from celery import shared_task
from django.core.files.base import ContentFile


@shared_task
def generate_certificate_task(enrollment_id: int):
    """Kurs 100% tugagach PDF sertifikat yaratadi (Celery fon vazifasi)."""
    from apps.enrollments.models import Enrollment
    from apps.notifications.utils import send_notification

    from .models import Certificate

    enrollment = Enrollment.objects.select_related('student', 'course').get(id=enrollment_id)
    certificate, _ = Certificate.objects.get_or_create(
        student=enrollment.student, course=enrollment.course
    )

    pdf_buffer = _render_certificate_pdf(enrollment.student.get_full_name() or enrollment.student.username, enrollment.course.title)
    certificate.file.save(
        f'certificate_{enrollment.student.id}_{enrollment.course.id}.pdf',
        ContentFile(pdf_buffer.getvalue()),
        save=True,
    )

    send_notification(enrollment.student, f'"{enrollment.course.title}" kursi uchun sertifikatingiz tayyor!')
    return certificate.id


def _render_certificate_pdf(student_name: str, course_title: str) -> io.BytesIO:
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    c.setFont('Helvetica-Bold', 28)
    c.drawCentredString(width / 2, height - 120, 'SERTIFIKAT')

    c.setFont('Helvetica', 16)
    c.drawCentredString(width / 2, height - 180, 'Ushbu sertifikat quyidagi shaxsga beriladi:')

    c.setFont('Helvetica-Bold', 22)
    c.drawCentredString(width / 2, height - 220, student_name)

    c.setFont('Helvetica', 16)
    c.drawCentredString(width / 2, height - 260, f'"{course_title}" kursini muvaffaqiyatli tugatgani uchun')

    c.setFont('Helvetica-Oblique', 12)
    c.drawCentredString(width / 2, 80, 'EduNest — Online Ta\'lim Platformasi')

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer
