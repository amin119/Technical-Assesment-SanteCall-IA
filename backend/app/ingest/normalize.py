"""Turn a raw Paris Open Data record into a row for our `events` table.

Everything here is a pure function (no network, no database) so it is easy to test.
"""

import hashlib
import re
from datetime import datetime
from html.parser import HTMLParser
from typing import Any

# Our own small set of categories. The source has ~35 free-form tags ("Spectacle musical",
# "Art contemporain", "Balade urbaine"...) which is too noisy for a filter bar.
# Order matters: the first rule that matches an event's tags wins.
CATEGORY_RULES: list[tuple[str, set[str]]] = [
    ("concert", {"concert", "spectacle musical"}),
    ("theatre", {"théâtre"}),
    ("spectacle", {"danse", "humour", "cirque", "festival"}),
    ("exposition", {"expo", "art contemporain", "peinture", "photo", "street-art", "bd"}),
    ("sport", {"sport"}),
    ("cinema", {"ecrans", "écrans"}),
    ("conference", {"conférence", "littérature", "histoire", "sciences"}),
    ("famille", {"enfants"}),
    ("loisirs", {"atelier", "loisirs", "balade urbaine", "nature", "gourmand", "brocante", "salon", "nuit"}),
]

CATEGORY_LABELS: dict[str, str] = {
    "concert": "Concerts",
    "theatre": "Théâtre",
    "spectacle": "Spectacles",
    "exposition": "Expositions",
    "sport": "Sport",
    "cinema": "Cinéma",
    "conference": "Conférences",
    "famille": "En famille",
    "loisirs": "Ateliers & loisirs",
    "autre": "Autres",
}

_BLOCK_TAGS = {"p", "div", "li", "ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6", "tr"}


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: Any) -> None:
        if tag == "br":
            self.parts.append("\n")
        elif tag in _BLOCK_TAGS:
            self.parts.append("\n\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in _BLOCK_TAGS:
            self.parts.append("\n\n")

    def handle_data(self, data: str) -> None:
        # Newlines inside source text are just line wrapping, not paragraph breaks.
        self.parts.append(re.sub(r"\s+", " ", data))


def html_to_text(html: str | None) -> str:
    """Strip tags, keep paragraph breaks. We never render third-party HTML in the browser."""
    if not html:
        return ""
    parser = _TextExtractor()
    parser.feed(html)
    text = "".join(parser.parts)
    text = re.sub(r"[ \t]*\n[ \t]*", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def pick_category(tags: list[str]) -> str:
    lowered = {t.strip().lower() for t in tags}
    for category, keywords in CATEGORY_RULES:
        if lowered & keywords:
            return category
    return "autre"


def arrondissement_from_zipcode(zipcode: str | None) -> int | None:
    """75009 -> 9. Anything that is not 75001..75020 is None (e.g. suburbs)."""
    if zipcode and re.fullmatch(r"750(0[1-9]|1\d|20)", zipcode):
        return int(zipcode[3:])
    return None


def synthetic_capacity(event_id: str) -> int:
    """The open data has no seat count. We derive a stable one (20..200) from the event id.

    Stable across re-ingestions, so a refresh never changes how many seats an event has.
    """
    digest = hashlib.sha256(event_id.encode()).digest()
    return 20 + int.from_bytes(digest[:4], "big") % 181


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def normalize_record(raw: dict[str, Any]) -> dict[str, Any] | None:
    """Return a dict matching the `events` columns, or None if the record is unusable."""
    event_id = str(raw.get("id") or "").strip()
    title = (raw.get("title") or "").strip()
    starts_at = _parse_dt(raw.get("date_start"))
    ends_at = _parse_dt(raw.get("date_end"))
    if not event_id or not title or starts_at is None:
        return None
    if ends_at is None or ends_at < starts_at:
        ends_at = starts_at

    tags = [t.strip() for t in (raw.get("qfap_tags") or "").split(";") if t.strip()]
    lat_lon = raw.get("lat_lon") or {}
    zipcode = raw.get("address_zipcode") or None
    price_type = (raw.get("price_type") or "").strip().lower()

    return {
        "id": event_id,
        "title": title,
        "summary": html_to_text(raw.get("lead_text")),
        "description": html_to_text(raw.get("description")),
        "category": pick_category(tags),
        "tags": tags,
        "starts_at": starts_at,
        "ends_at": ends_at,
        "when_text": html_to_text(raw.get("date_description")),
        "venue_name": raw.get("address_name") or None,
        "address": raw.get("address_street") or None,
        "zipcode": zipcode,
        "arrondissement": arrondissement_from_zipcode(zipcode),
        "lat": lat_lon.get("lat"),
        "lon": lat_lon.get("lon"),
        "price_type": price_type,
        "price_detail": html_to_text(raw.get("price_detail")),
        "is_free": price_type == "gratuit",
        "cover_url": raw.get("cover_url") or None,
        "source_url": raw.get("url") or None,
        "capacity": synthetic_capacity(event_id),
        "source_updated_at": _parse_dt(raw.get("updated_at")),
    }
