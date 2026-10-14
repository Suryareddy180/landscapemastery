import re
import logging

logger = logging.getLogger(__name__)

def parse_duration_to_seconds(dur_str, duration_seconds=0):
    """
    Parses various duration string formats into integer seconds.
    Examples:
      - '45 mins', '45 min', '45m', '45 minutes' -> 2700
      - '1.5 hrs', '2 hrs', '2h', '1 hr' -> 5400 / 7200 / 3600
      - '1 hr 30 mins', '1h 30m', '1 hr 15 mins' -> 5400 / 4500
      - '45:00' (MM:SS) -> 2700
      - '01:30:00' (HH:MM:SS) -> 5400
      - '24:18' -> 1458
    """
    if duration_seconds and int(duration_seconds) > 0:
        return int(duration_seconds)

    if not dur_str or not isinstance(dur_str, str):
        return 0

    raw = dur_str.strip().lower()
    if not raw:
        return 0

    # 1. Match digital format MM:SS or HH:MM:SS (e.g. "24:18", "01:30:00")
    if re.match(r'^\d{1,2}:\d{2}(:\d{2})?$', raw):
        parts = [int(p) for p in raw.split(':')]
        if len(parts) == 3:
            return parts[0] * 3600 + parts[1] * 60 + parts[2]
        elif len(parts) == 2:
            return parts[0] * 60 + parts[1]

    total_sec = 0

    # 2. Match hours: "1.5 hrs", "2 hrs", "1 hr", "2h", "1.5 hours"
    hr_match = re.search(r'([\d.]+)\s*(?:hrs?|hours?|h)(?:\b|$|[^\w])', raw)
    if hr_match:
        try:
            total_sec += int(float(hr_match.group(1)) * 3600)
        except (ValueError, TypeError):
            pass

    # 3. Match minutes: "45 mins", "45 min", "30m", "20 minutes"
    # Ensure we don't accidentally match words starting with m like 'masterclass'
    min_match = re.search(r'([\d.]+)\s*(?:mins?|minutes?|m)(?:\b|$|[^\w])', raw)
    if min_match:
        try:
            total_sec += int(float(min_match.group(1)) * 60)
        except (ValueError, TypeError):
            pass

    # 4. Match seconds: "30 secs", "30s"
    sec_match = re.search(r'([\d.]+)\s*(?:secs?|seconds?|s)(?:\b|$|[^\w])', raw)
    if sec_match:
        try:
            total_sec += int(float(sec_match.group(1)))
        except (ValueError, TypeError):
            pass

    # 5. Plain number fallback
    if total_sec == 0 and raw.isdigit():
        val = int(raw)
        total_sec = val * 60 if val <= 300 else val

    return total_sec


def format_seconds_to_duration(total_seconds):
    """
    Converts integer seconds into a human-readable duration string.
    Examples:
      - 2700s -> '45 mins'
      - 3600s -> '1 hr'
      - 5400s -> '1.5 hrs'
      - 7200s -> '2 hrs'
      - 4500s -> '1 hr 15 mins'
      - 45000s -> '12.5 hrs'
    """
    if not total_seconds or total_seconds <= 0:
        return '0 mins'

    total_seconds = int(total_seconds)
    hours = total_seconds // 3600
    remainder = total_seconds % 3600
    minutes = round(remainder / 60)

    # Adjust for rounding up to 60 mins
    if minutes == 60:
        hours += 1
        minutes = 0

    if hours == 0:
        return f"{minutes} mins"
    elif minutes == 0:
        return f"{hours} hr" if hours == 1 else f"{hours} hrs"
    elif minutes == 30:
        # e.g. 1.5 hrs, 2.5 hrs
        return f"{hours + 0.5:g} hrs"
    elif minutes in [15, 45]:
        frac = 0.25 if minutes == 15 else 0.75
        # If <= 3 hrs, e.g. 1 hr 15 mins or 1.25 hrs. "1 hr 15 mins" is very readable
        return f"{hours} hr {minutes} mins" if hours == 1 else f"{hours} hrs {minutes} mins"
    else:
        return f"{hours} hr {minutes} mins" if hours == 1 else f"{hours} hrs {minutes} mins"


def get_mp4_duration_seconds(file_obj_or_path):
    """
    Extracts duration from standard MP4/MOV moov-mvhd box in pure Python without ffmpeg.
    """
    try:
        if isinstance(file_obj_or_path, str):
            f = open(file_obj_or_path, 'rb')
            should_close = True
        else:
            f = file_obj_or_path
            pos = f.tell() if hasattr(f, 'tell') else 0
            should_close = False

        chunk_size = 128 * 1024
        data = f.read(chunk_size)
        idx = data.find(b'mvhd')
        if idx == -1:
            data2 = f.read(chunk_size)
            idx = (data + data2).find(b'mvhd')
            data = data + data2

        if should_close:
            f.close()
        elif hasattr(f, 'seek'):
            f.seek(pos)

        if idx != -1:
            version = data[idx + 4]
            if version == 0:
                timescale = int.from_bytes(data[idx + 12:idx + 16], 'big')
                duration = int.from_bytes(data[idx + 16:idx + 20], 'big')
            elif version == 1:
                timescale = int.from_bytes(data[idx + 20:idx + 24], 'big')
                duration = int.from_bytes(data[idx + 24:idx + 32], 'big')
            else:
                return 0
            if timescale > 0:
                return round(duration / timescale)
    except Exception as e:
        logger.debug("Could not parse mp4 duration: %s", e)
    return 0


def calculate_course_duration_info(course):
    """
    Calculates the exact total duration in seconds and formatted string
    for a given Course model instance based on all uploaded lessons and assets.
    """
    total_seconds = 0
    lesson_count = 0

    modules = course.modules.all().prefetch_related('lessons__assets')
    for m in modules:
        for l in m.lessons.all():
            lesson_count += 1
            sec = 0
            # 1. Check explicit duration_seconds
            if l.duration_seconds and l.duration_seconds > 0:
                sec = l.duration_seconds
            # 2. Check duration string
            elif l.duration:
                sec = parse_duration_to_seconds(l.duration)

            # 3. Check attached media assets if still 0
            if sec == 0:
                for asset in l.assets.all():
                    asset_sec = parse_duration_to_seconds(asset.duration)
                    if asset_sec > 0:
                        sec += asset_sec

            # Fallback: if lesson has a video URL or ID but unparseable duration, default to 45 mins
            if sec == 0 and (l.video_url or l.video_id):
                sec = 45 * 60

            total_seconds += sec

    formatted = format_seconds_to_duration(total_seconds) if total_seconds > 0 else '45 mins'
    return {
        'total_seconds': total_seconds,
        'formatted': formatted,
        'lesson_count': lesson_count
    }


def update_course_duration(course, save=True):
    """
    Recalculates and updates the course.duration_hrs field.
    """
    info = calculate_course_duration_info(course)
    course.duration_hrs = info['formatted']
    if save and course.pk:
        from .models import Course
        Course.objects.filter(pk=course.pk).update(duration_hrs=course.duration_hrs)
    return info['formatted']


def recalculate_all_course_durations():
    """
    Iterates through all courses and updates their duration_hrs based on current videos.
    """
    from .models import Course
    updated = {}
    for c in Course.objects.all():
        dur = update_course_duration(c, save=True)
        updated[c.id] = {'title': c.title, 'duration': dur}
    return updated
