import re
import urllib.parse

# Allowed VEED hostnames
ALLOWED_VEED_HOSTS = {'www.veed.io', 'veed.io'}

# UUID v4 pattern and general video ID pattern
VEED_ID_REGEX = re.compile(
    r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
)

def extract_veed_video_id(input_value):
    """
    Extracts and returns the canonical VEED video ID from:
    1. A raw video ID / UUID string (e.g. '8317ab9c-7a4f-4088-bdcb-06cc3b04399a')
    2. A VEED embed URL (e.g. 'https://www.veed.io/embed/8317ab9c-7a4f-4088-bdcb-06cc3b04399a?watermark=1...')
    3. A VEED view/preview URL (e.g. 'https://www.veed.io/view/8317ab9c-7a4f-4088-bdcb-06cc3b04399a')
    4. An iframe embed code snippet (e.g. '<iframe src="https://www.veed.io/embed/8317ab9c-7a4f-4088-bdcb-06cc3b04399a"...></iframe>')

    Returns the clean video ID string if valid, or None if invalid.
    """
    if not input_value or not isinstance(input_value, str):
        return None

    raw = input_value.strip()

    # Check if input is directly a UUID
    if VEED_ID_REGEX.match(raw):
        return raw.lower()

    # Check if input contains an iframe HTML snippet
    if '<iframe' in raw.lower():
        src_match = re.search(r'src=["\']([^"\']+)["\']', raw, re.IGNORECASE)
        if src_match:
            raw = src_match.group(1).strip()
        else:
            return None

    # Parse URL
    try:
        parsed = urllib.parse.urlparse(raw)
        hostname = (parsed.hostname or '').lower()
        if hostname not in ALLOWED_VEED_HOSTS:
            return None

        # Path formats: /embed/<id> or /view/<id> or /videos/<id>
        path_parts = [p for p in parsed.path.split('/') if p]
        if not path_parts:
            return None

        for part in reversed(path_parts):
            if VEED_ID_REGEX.match(part):
                return part.lower()
            # Also allow alphanumeric IDs if VEED updates ID schemas
            if re.match(r'^[0-9a-zA-Z_-]{20,50}$', part):
                return part

        return None
    except Exception:
        return None

def normalize_veed_embed_url(video_id_or_url, watermark=False, color="10b981", sharing=False, title=False):
    """
    Constructs a secured, canonical VEED embed URL for playback:
    https://www.veed.io/embed/<video_id>?watermark=0&color=10b981&sharing=0&title=0
    Strictly removes VEED tags, watermark anchors, and share buttons for content security.
    """
    video_id = extract_veed_video_id(video_id_or_url)
    if not video_id:
        return None

    wm_val = "1" if watermark else "0"
    share_val = "1" if sharing else "0"
    title_val = "1" if title else "0"

    params = [
        f"watermark={wm_val}",
        f"sharing={share_val}",
        f"title={title_val}"
    ]
    if color:
        params.append(f"color={urllib.parse.quote(color)}")

    return f"https://www.veed.io/embed/{video_id}?{'&'.join(params)}"

def validate_veed_source(input_value):
    """
    Validates user/admin input for VEED video reference.
    Returns:
    (is_valid: bool, video_id: str|None, normalized_url: str|None, error: str|None)
    """
    if not input_value or not str(input_value).strip():
        return False, None, None, "Video reference is required. Please provide a VEED embed URL, iframe code, or video ID."

    raw = str(input_value).strip()

    # Reject non-HTTP protocols, javascript:, data: URIs, script injection
    lowered = raw.lower()
    if 'javascript:' in lowered or '<script' in lowered or 'onerror=' in lowered or 'onload=' in lowered:
        return False, None, None, "Security violation: Malicious script tags or inline handlers are strictly forbidden."

    video_id = extract_veed_video_id(raw)
    if not video_id:
        return False, None, None, (
            "Invalid VEED video source. Please ensure the link is from veed.io and has the format "
            "'https://www.veed.io/embed/<video_id>' or provide a valid VEED video ID."
        )

    normalized_url = normalize_veed_embed_url(video_id)
    return True, video_id, normalized_url, None
