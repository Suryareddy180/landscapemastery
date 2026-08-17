import os
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from api.models import (
    Usr, Course, Module, Lesson, MediaAsset, ContentItem, Enrollment,
    PaymentRecord, Coupon, Testimonial, FAQ, Announcement, SiteSetting, AuditLog
)

class Command(BaseCommand):
    help = 'Seeds realistic masterclass curriculum, media assets, coupons, FAQs, and multi-role demo accounts'

    def handle(self, *args, **options):
        self.stdout.write("Starting Landscape Mastery database initialization...")

        # ---------------------------------------------------------------------
        # 1. SITE SETTINGS
        # ---------------------------------------------------------------------
        setting, _ = SiteSetting.objects.get_or_create(id=1)
        setting.site_name = "Landscape Mastery"
        setting.hero_title = "Master the Art of Landscape Architecture"
        setting.hero_subtitle = "Elevate your spatial vision from topographical grading to botanical scenography. Access industry-grade video masterclasses, CAD blueprints, and construction execution frameworks."
        setting.logo_url = "/lm_logo.png"
        setting.logo_size = 48
        setting.logo_fit_mode = "auto"
        setting.course_price = 499.00
        setting.contact_email = "contact@landscapemastery.com"
        setting.seo_meta_desc = "Landscape Mastery - High-End Educational Architecture Masterclass for Paid Students"
        setting.save()
        self.stdout.write(self.style.SUCCESS("[OK] Site settings configured"))

        # ---------------------------------------------------------------------
        # 2. MULTI-ROLE DEMO USERS
        # ---------------------------------------------------------------------
        demo_users = [
            {
                'email': 'admin@landscapemastery.com',
                'password': 'Admin@Landscape2026!',
                'full_name': 'Chief Architect & Director',
                'role': 'SUPER_ADMIN',
                'paid': True,
                'is_staff': True,
                'is_superuser': True,
                'phone': '+1 (555) 019-2831'
            },
            {
                'email': 'content@landscapemastery.com',
                'password': 'Content@Mastery2026!',
                'full_name': 'Curriculum & Media Director',
                'role': 'CONTENT_MANAGER',
                'paid': True,
                'is_staff': True,
                'is_superuser': False,
                'phone': '+1 (555) 019-4422'
            },
            {
                'email': 'support@landscapemastery.com',
                'password': 'Support@Mastery2026!',
                'full_name': 'Student Success & Support Lead',
                'role': 'SUPPORT_ADMIN',
                'paid': True,
                'is_staff': True,
                'is_superuser': False,
                'phone': '+1 (555) 019-7788'
            },
            {
                'email': 'student@landscapemastery.com',
                'password': 'Student@Mastery2026!',
                'full_name': 'Elena Rostova, AIA',
                'role': 'STUDENT',
                'paid': True,
                'is_staff': False,
                'is_superuser': False,
                'phone': '9876543210'
            },
            {
                'email': 'lead@landscapemastery.com',
                'password': 'Lead@Mastery2026!',
                'full_name': 'Marcus Vance (Prospective)',
                'role': 'STUDENT',
                'paid': False,
                'is_staff': False,
                'is_superuser': False,
                'phone': '9123456789'
            }
        ]

        for u_data in demo_users:
            usr, created = Usr.objects.get_or_create(email=u_data['email'])
            usr.full_name = u_data['full_name']
            usr.role = u_data['role']
            usr.paid = u_data['paid']
            usr.is_staff = u_data['is_staff']
            usr.is_superuser = u_data['is_superuser']
            usr.phone = u_data['phone']
            usr.set_password(u_data['password'])
            usr.save()
            status_txt = "Created" if created else "Updated"
            self.stdout.write(f"  * {status_txt} User: {usr.email} [{usr.role}]")

        self.stdout.write(self.style.SUCCESS("[OK] 5 Multi-role demo accounts configured"))

        # ---------------------------------------------------------------------
        # 3. FLAGSHIP COURSE & CURRICULUM
        # ---------------------------------------------------------------------
        course_title = "Executive Landscape Architecture & Site Engineering Masterclass"
        course_slug = slugify(course_title)
        
        course, created = Course.objects.get_or_create(
            slug=course_slug,
            defaults={
                'title': course_title,
                'short_desc': "Complete end-to-end masterclass covering site topography, hardscape engineering, Mediterranean ecology, and architectural water scenography.",
                'full_desc': "The definitive executive program designed for practicing architects, landscape designers, and civil engineers. Includes 14 in-depth masterclass lessons, downloadable CAD .DWG schematics, retaining wall engineering calculations, and hydrological drainage models.",
                'price': 499.00,
                'discount_price': 499.00,
                'duration_hrs': "12.5 hrs",
                'level': "Professional & Advanced",
                'status': "PUBLISHED",
                'thumbnail': "/lm_logo.png",
                'banner': "/lm_logo.png"
            }
        )
        if not created:
            course.title = course_title
            course.price = 499.00
            course.status = "PUBLISHED"
            course.save()

        # Enroll our paid demo student
        paid_student = Usr.objects.get(email='student@landscapemastery.com')
        Enrollment.objects.get_or_create(
            user=paid_student,
            course=course,
            defaults={'status': 'ACTIVE', 'access_type': 'PAID'}
        )

        # Seed realistic Payment Record for revenue analytics
        PaymentRecord.objects.get_or_create(
            order_id="order_demo_1001",
            defaults={
                'user': paid_student,
                'payment_id': 'pay_demo_verified_9921',
                'amount': 499.00,
                'currency': 'INR',
                'status': 'SUCCESS'
            }
        )

        # Curriculum Structure: 4 Modules, 14 Lessons, Media Assets
        curriculum = [
            {
                'module_title': "Module 1: Spatial Planning & Site Topography",
                'order': 1,
                'lessons': [
                    {
                        'title': "1.1 Site Analysis & Geological Contour Mapping",
                        'order': 1,
                        'duration': "45 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    },
                    {
                        'title': "1.2 Soil Mechanics & Earthwork Cut/Fill Optimization",
                        'order': 2,
                        'duration': "52 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
                    },
                    {
                        'title': "1.3 Sunlight Path & Wind Flow Microclimates",
                        'order': 3,
                        'duration': "48 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                    },
                    {
                        'title': "1.4 Master Blueprint Layout & Topographical CAD Package (.PDF / .DWG)",
                        'order': 4,
                        'duration': "Downloadable CAD",
                        'asset_type': "pdf",
                        'url': "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                    }
                ]
            },
            {
                'module_title': "Module 2: Hardscape Geometries & Stonework Masonry",
                'order': 2,
                'lessons': [
                    {
                        'title': "2.1 Stone Selection & Thermal Expansion Buffers",
                        'order': 1,
                        'duration': "58 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
                    },
                    {
                        'title': "2.2 Cantilevered Terraces & Retaining Wall Structural Engineering",
                        'order': 2,
                        'duration': "64 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
                    },
                    {
                        'title': "2.3 Exterior Hardscape Specification Sheets & Construction Details",
                        'order': 3,
                        'duration': "Downloadable Spec Sheets",
                        'asset_type': "pdf",
                        'url': "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                    }
                ]
            },
            {
                'module_title': "Module 3: Planting Ecology & Mediterranean Palettes",
                'order': 3,
                'lessons': [
                    {
                        'title': "3.1 Native Flora & Biophilic Zoning Principles",
                        'order': 1,
                        'duration': "55 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4"
                    },
                    {
                        'title': "3.2 Canopy Layering: Overstory, Understory & Groundcover Dynamics",
                        'order': 2,
                        'duration': "49 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
                    },
                    {
                        'title': "3.3 Water-Wise Drip & Sub-Surface Irrigation Schematics",
                        'order': 3,
                        'duration': "56 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
                    },
                    {
                        'title': "3.4 Specimen Tree Botanical Palette & Root Barrier Guide",
                        'order': 4,
                        'duration': "Plant Schedule PDF",
                        'asset_type': "pdf",
                        'url': "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
                    }
                ]
            },
            {
                'module_title': "Module 4: High-End Lighting & Water Scenography",
                'order': 4,
                'lessons': [
                    {
                        'title': "4.1 Nocturnal Lighting Levels: Grazing, Silhouetting & Path Optics",
                        'order': 1,
                        'duration': "54 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4"
                    },
                    {
                        'title': "4.2 Hydro-Engineering: Reflection Basins & Infinity Weirs",
                        'order': 2,
                        'duration': "56 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
                    },
                    {
                        'title': "4.3 Smart Automation & Ambient Scene Preset Controls",
                        'order': 3,
                        'duration': "50 mins",
                        'asset_type': "short_video",
                        'url': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4"
                    }
                ]
            }
        ]

        for mod_info in curriculum:
            mod, _ = Module.objects.get_or_create(
                course=course,
                title=mod_info['module_title'],
                defaults={'order': mod_info['order']}
            )
            mod.order = mod_info['order']
            mod.save()

            for les_info in mod_info['lessons']:
                les, _ = Lesson.objects.get_or_create(
                    module=mod,
                    title=les_info['title'],
                    defaults={'order': les_info['order']}
                )
                les.order = les_info['order']
                les.save()

                asset, _ = MediaAsset.objects.get_or_create(
                    lesson=les,
                    title=les_info['title'],
                    defaults={
                        'asset_type': les_info['asset_type'],
                        'url': les_info['url'],
                        'duration': les_info['duration']
                    }
                )
                asset.asset_type = les_info['asset_type']
                asset.url = les_info['url']
                asset.duration = les_info['duration']
                asset.save()

        self.stdout.write(self.style.SUCCESS("[OK] Flagship Course, 4 Modules, 14 Lessons & Assets initialized"))

        # ---------------------------------------------------------------------
        # 4. ACTIVE PROMOTIONAL COUPONS
        # ---------------------------------------------------------------------
        coupons = [
            {'code': 'MASTERY20', 'discount_pct': 20, 'max_uses': 100},
            {'code': 'EXECUTIVE10', 'discount_pct': 10, 'max_uses': 200},
            {'code': 'EARLYBIRD', 'discount_pct': 15, 'max_uses': 50}
        ]
        for c in coupons:
            Coupon.objects.update_or_create(
                code=c['code'],
                defaults={'discount_pct': c['discount_pct'], 'max_uses': c['max_uses'], 'active': True}
            )
        self.stdout.write(self.style.SUCCESS("[OK] Promotional discount coupons configured"))

        # ---------------------------------------------------------------------
        # 5. REVIEWS & TESTIMONIALS
        # ---------------------------------------------------------------------
        testimonials = [
            {
                'student_name': "Julian Vance, Principal Architect",
                'student_title': "Vance & Partners Studio",
                'content': "The retaining wall engineering and soil grading masterclasses saved our studio dozens of hours on a steep 3-acre hillside project in Provence. Exceptional practical depth.",
                'rating': 5
            },
            {
                'student_name': "Sarah Lin, Senior Landscape Planner",
                'student_title': "Terraform Design Lab",
                'content': "Finally, a course that skips generic fluff and gives you actual structural calculations, hydraulic retention schematics, and botanical zoning matrices.",
                'rating': 5
            },
            {
                'student_name': "David Moreau, Property Developer",
                'student_title': "Moreau Estates & Living",
                'content': "The lighting optics and water scenography modules completely transformed our evening property presentation standards. Worth tenfold the investment.",
                'rating': 5
            }
        ]
        Testimonial.objects.all().delete()
        for t in testimonials:
            Testimonial.objects.create(
                student_name=t['student_name'],
                student_title=t['student_title'],
                content=t['content'],
                rating=t['rating'],
                active=True
            )
        self.stdout.write(self.style.SUCCESS("[OK] Verified professional testimonials populated"))

        # ---------------------------------------------------------------------
        # 6. FAQS (EXPLICIT NO-CERTIFICATE / NO-LICENSE CLARIFICATION)
        # ---------------------------------------------------------------------
        faqs = [
            {
                'question': "Who is this Landscape Architecture Masterclass designed for?",
                'answer': "This masterclass is specifically designed for practicing architects, landscape designers, civil engineers, and passionate property creators who want to master site grading, structural hardscape engineering, hydrological drainage, and high-end botanical curation.",
                'order': 1
            },
            {
                'question': "How do I access the course and is access really lifetime?",
                'answer': "Yes! You get instant, 100% automated lifetime access immediately upon completing payment. Your email is your username and your phone number is your initial portal access password. There are zero subscriptions or recurring fees.",
                'order': 2
            },
            {
                'question': "Are the structural CAD drawings and plant schedules downloadable?",
                'answer': "Yes, absolutely. All architectural blueprint packages, CAD details (.DWG & .PDF), retaining wall calculations, drainage cross-sections, and botanical palettes are fully downloadable for immediate use in AutoCAD, Revit, SketchUp, or Vectorworks.",
                'order': 3
            },
            {
                'question': "Does this course provide government licensing or accredited certification?",
                'answer': "No. Landscape Mastery is a practical, field-tested executive masterclass and construction blueprint toolkit. It is built strictly for professional skill mastery, structural calculations, and field execution. It does not confer government licensing, academic degrees, or state board certifications.",
                'order': 4
            },
            {
                'question': "Can I watch the video masterclasses on mobile or tablet?",
                'answer': "Yes. Our high-speed DRM cloud video player works seamlessly across all devices—desktops, laptops, iPads, tablets, and smartphones—with full playback speed controls and automatic progress resumption.",
                'order': 5
            },
            {
                'question': "What if I have technical questions or need support during the course?",
                'answer': "Our dedicated architectural support team and instructors are available via email at contact@landscapemastery.com to answer your curriculum questions, provide software download guidance, and assist with any account queries.",
                'order': 6
            }
        ]
        FAQ.objects.all().delete()
        for f in faqs:
            FAQ.objects.create(
                question=f['question'],
                answer=f['answer'],
                order=f['order'],
                active=True
            )
        self.stdout.write(self.style.SUCCESS("[OK] FAQs populated (with clear non-certification guidance)"))

        # ---------------------------------------------------------------------
        # 7. AUDIT LOGS
        # ---------------------------------------------------------------------
        admin_usr = Usr.objects.get(email='admin@landscapemastery.com')
        AuditLog.objects.create(
            actor=admin_usr,
            action="SYSTEM_SEEDED",
            target="Database Initialization",
            details="Masterclass curriculum, multi-role demo accounts, and CAD blueprints seeded successfully.",
            ip_address="127.0.0.1"
        )
        self.stdout.write(self.style.SUCCESS("[OK] System audit log registered"))
        self.stdout.write(self.style.SUCCESS("\n[SUCCESS] Landscape Mastery database initialization complete!"))
