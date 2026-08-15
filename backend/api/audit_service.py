from .models import AuditLog

def log_admin_action(usr, action, target="", details="", ip=""):
    try:
        AuditLog.objects.create(
            actor=usr if usr and usr.is_authenticated else None,
            action=action,
            target=str(target),
            details=str(details),
            ip_address=str(ip)
        )
    except Exception as e:
        pass
