from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_enrollment_confirmation_email(recipient_email, order_id, amount_cents=49900):
    """
    Sends an executive HTML enrollment confirmation email via Django SMTP service.
    """
    subject = "Welcome to Landscape Mastery - Lifetime Access Unlocked"
    amount_dollars = amount_cents / 100

    plain_message = f"""
Dear Architect,

Thank you for enrolling in Landscape Mastery!

Your order has been confirmed:
Order ID: {order_id}
Access Tier: Executive Architecture Curriculum (Lifetime Access)
Amount Paid: ${amount_dollars:.2f}

You can access your video portal dashboard anytime at:
http://localhost:3000

Best regards,
The Landscape Mastery Team
    """

    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #fcf9f8; color: #1c1b1b; padding: 20px; }}
        .card {{ background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 32px; border-radius: 16px; border: 1px solid #e5e2e1; box-shadow: 0 4px 20px rgba(6,78,59,0.06); }}
        .header {{ text-align: center; padding-bottom: 24px; border-bottom: 1px solid #f0eded; }}
        .brand {{ font-size: 24px; font-weight: bold; color: #003527; letter-spacing: -0.5px; }}
        .badge {{ display: inline-block; background-color: rgba(6,78,59,0.08); color: #064e3b; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 8px; }}
        .content {{ padding: 24px 0; line-height: 1.6; color: #404944; }}
        .order-box {{ background-color: #f6f3f2; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #bfc9c3; }}
        .button {{ display: block; width: 220px; margin: 28px auto 0; padding: 14px 0; background-color: #064e3b; color: #ffffff !important; text-align: center; font-weight: 600; text-decoration: none; border-radius: 12px; }}
        .footer {{ font-size: 12px; color: #707974; text-align: center; margin-top: 32px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">Landscape Mastery</div>
          <div class="badge">Lifetime Access Unlocked</div>
        </div>
        <div class="content">
          <p>Dear Architect,</p>
          <p>Welcome to <strong>Landscape Mastery</strong>. Your enrollment has been processed successfully via our secured gateway.</p>

          <div class="order-box">
            <div style="font-size: 14px; color: #1c1b1b; font-weight: 600; margin-bottom: 8px;">Order Summary</div>
            <div style="font-size: 13px; color: #404944;"><strong>Order ID:</strong> {order_id}</div>
            <div style="font-size: 13px; color: #404944;"><strong>Access Tier:</strong> Executive Architecture Portal</div>
            <div style="font-size: 13px; color: #404944;"><strong>Status:</strong> Active &amp; Encrypted</div>
          </div>

          <p>You can start watching your DRM-protected video modules immediately.</p>
          <a href="http://localhost:3000" class="button">Access Learning Portal</a>
        </div>
        <div class="footer">
          &copy; 2024 Landscape Mastery. All rights reserved. Secure &amp; Encrypted.
        </div>
      </div>
    </body>
    </html>
    """

    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Landscape Mastery <noreply@landscapemastery.com>')

    try:
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=from_email,
            recipient_list=[recipient_email],
            html_message=html_message,
            fail_silently=True
        )
        logger.info(f"Enrollment confirmation email sent to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send enrollment email to {recipient_email}: {str(e)}")
        return False
