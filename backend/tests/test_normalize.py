from app.ingest.normalize import (
    arrondissement_from_zipcode,
    html_to_text,
    normalize_record,
    pick_category,
    synthetic_capacity,
)
from tests.conftest import raw_record


def test_html_is_converted_to_plain_text_with_paragraphs() -> None:
    html = "<p>Premier\nparagraphe</p><p>Second <b>gras</b><br>ligne</p><script>x()</script>"
    text = html_to_text(html)
    assert text.startswith("Premier paragraphe\n\nSecond gras\nligne")
    assert "<" not in text


def test_html_to_text_handles_empty_values() -> None:
    assert html_to_text(None) == ""
    assert html_to_text("") == ""


def test_category_uses_first_matching_rule() -> None:
    assert pick_category(["Enfants", "Concert"]) == "concert"  # concert outranks famille
    assert pick_category(["Enfants"]) == "famille"
    assert pick_category(["Photo", "Atelier"]) == "exposition"
    assert pick_category(["Jardinage"]) == "autre"
    assert pick_category([]) == "autre"


def test_arrondissement_only_for_paris_zipcodes() -> None:
    assert arrondissement_from_zipcode("75009") == 9
    assert arrondissement_from_zipcode("75020") == 20
    assert arrondissement_from_zipcode("75116") is None  # old Paris 16e annex code
    assert arrondissement_from_zipcode("92100") is None  # suburb
    assert arrondissement_from_zipcode(None) is None


def test_capacity_is_stable_and_in_range() -> None:
    assert synthetic_capacity("abc") == synthetic_capacity("abc")
    assert all(20 <= synthetic_capacity(str(i)) <= 200 for i in range(500))


def test_normalize_maps_a_full_record() -> None:
    row = normalize_record(raw_record("42", price_type="gratuit"))
    assert row is not None
    assert row["id"] == "42"
    assert row["category"] == "concert"
    assert row["is_free"] is True
    assert row["arrondissement"] == 18
    assert row["summary"] == "Une belle soirée."
    assert row["when_text"] == "Le samedi\nde 20h à 22h"
    assert (row["lat"], row["lon"]) == (48.8823, 2.3402)


def test_normalize_rejects_unusable_records() -> None:
    assert normalize_record(raw_record("1", title="")) is None
    assert normalize_record(raw_record("1", date_start=None)) is None
    assert normalize_record(raw_record("", title="x")) is None


def test_end_before_start_is_repaired() -> None:
    row = normalize_record(raw_record("1", date_end="2000-01-01T00:00:00+00:00"))
    assert row is not None
    assert row["ends_at"] == row["starts_at"]
