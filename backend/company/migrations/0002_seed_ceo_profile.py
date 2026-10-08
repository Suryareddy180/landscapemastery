from django.db import migrations

def seed_ceo(apps, schema_editor):
    LeaderProfile = apps.get_model('company', 'LeaderProfile')
    LeaderProfile.objects.update_or_create(
        name='K B REDDY',
        defaults={
            'title': 'Founder & Chief Executive Officer',
            'bio': 'Visionary entrepreneur and Chief Executive Officer leading 3CAPSTECH Software. Dedicated to engineering scalable software architectures, mission-critical enterprise platforms, and pioneering technology solutions that drive lasting business transformation.',
            'email': 'md.3capstech@gmail.com',
            'photo': 'leaders/kb_reddy_ceo.jpg',
            'is_active': True,
            'display_order': 1,
        }
    )

def remove_ceo(apps, schema_editor):
    LeaderProfile = apps.get_model('company', 'LeaderProfile')
    LeaderProfile.objects.filter(name='K B REDDY').delete()

class Migration(migrations.Migration):
    dependencies = [
        ('company', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_ceo, remove_ceo),
    ]
