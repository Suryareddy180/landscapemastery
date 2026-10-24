from django.db import migrations

def rectify_landscape_spelling(apps, schema_editor):
    Course = apps.get_model('api', 'Course')
    
    # Rectify title and slug for LANSCAPE -> LANDSCAPE
    for c in Course.objects.all():
        updated = False
        if c.title and ('LANSCAPE' in c.title or 'lanscape' in c.title):
            c.title = c.title.replace('LANSCAPE', 'LANDSCAPE').replace('lanscape', 'landscape')
            updated = True
        if c.slug and 'lanscape' in c.slug:
            c.slug = c.slug.replace('lanscape', 'landscape')
            updated = True
        if updated:
            c.save()

    # Specifically ensure 'LANSCAPE LENS' becomes 'LANDSCAPE LENS' and slug becomes 'landscape-lens'
    Course.objects.filter(title__iexact='lanscape lens').update(
        title='LANDSCAPE LENS',
        slug='landscape-lens'
    )
    Course.objects.filter(slug='lanscape-lens').update(
        slug='landscape-lens'
    )

def reverse_rectify(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_communitychannel_communitymemberprofile_and_more'),
    ]

    operations = [
        migrations.RunPython(rectify_landscape_spelling, reverse_rectify),
    ]
