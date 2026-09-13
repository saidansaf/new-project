from django.db import migrations

BADGES = [
    ('first-course', 'Birinchi qadam', 'Birinchi kursni 100% tugatdingiz', '🎓'),
    ('five-courses', "5 kurs ustasi", "5 ta kursni tugatdingiz", '🏆'),
    ('week-streak', 'Haftalik g\'ayrat', "7 kun ketma-ket faol bo'ldingiz", '🔥'),
    ('month-streak', 'Oylik chempion', "30 kun ketma-ket faol bo'ldingiz", '💎'),
    ('fast-typer', 'Tez yozuvchi', "Typing testda 60+ WPM ko'rsatdingiz", '⌨️'),
    ('speed-demon', 'Tezlik ustasi', "Typing testda 100+ WPM ko'rsatdingiz", '⚡'),
    ('referrer', "Do'st chaqiruvchi", "Do'stingiz sizning havolangiz orqali ro'yxatdan o'tdi", '🤝'),
]


def create_badges(apps, schema_editor):
    Badge = apps.get_model('achievements', 'Badge')
    for code, title, description, icon in BADGES:
        Badge.objects.get_or_create(
            code=code, defaults={'title': title, 'description': description, 'icon': icon}
        )


def remove_badges(apps, schema_editor):
    Badge = apps.get_model('achievements', 'Badge')
    Badge.objects.filter(code__in=[b[0] for b in BADGES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('achievements', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_badges, remove_badges),
    ]
