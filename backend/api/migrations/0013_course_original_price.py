from django.db import migrations, models

def migrate_existing_course_prices(apps, schema_editor):
    Course = apps.get_model('api', 'Course')
    for c in Course.objects.all():
        try:
            curr_price = float(c.price) if c.price else 499.0
            curr_disc = float(c.discount_price) if c.discount_price else 299.0

            # Match specific known courses or general pattern
            if c.id == 1 or 'LANDSCAPE' in str(c.title).upper():
                c.price = 299.00
                c.original_price = 499.00
                c.discount_price = 299.00
            elif c.id == 7 or 'comprehensive' in str(c.title).lower():
                c.price = 299.00
                c.original_price = 999.00
                c.discount_price = 299.00
            elif curr_price > curr_disc and curr_disc > 0:
                c.original_price = curr_price
                c.price = curr_disc
                c.discount_price = curr_disc
            else:
                c.price = 299.00
                c.original_price = 499.00
                c.discount_price = 299.00
            c.save()
        except Exception:
            pass

def reverse_migrate_prices(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_rectify_landscape_lens_spelling'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='original_price',
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                default=None,
                help_text='Strike-off price (MRP) displayed with strikethrough. If null or <= price, no strike-off is shown.',
                max_digits=10,
                null=True
            ),
        ),
        migrations.AlterField(
            model_name='course',
            name='price',
            field=models.DecimalField(
                decimal_places=2,
                default=299.0,
                help_text='Effective selling price charged at checkout.',
                max_digits=10
            ),
        ),
        migrations.AlterField(
            model_name='course',
            name='discount_price',
            field=models.DecimalField(
                decimal_places=2,
                default=299.0,
                help_text='Synchronized selling price for backward compatibility.',
                max_digits=10
            ),
        ),
        migrations.RunPython(migrate_existing_course_prices, reverse_migrate_prices),
    ]
