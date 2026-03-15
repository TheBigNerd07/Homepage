from dataclasses import dataclass


BOOK_OF_MORMON_STRUCTURE: list[tuple[str, int]] = [
    ("1 Nephi", 22),
    ("2 Nephi", 33),
    ("Jacob", 7),
    ("Enos", 1),
    ("Jarom", 1),
    ("Omni", 1),
    ("Words of Mormon", 1),
    ("Mosiah", 29),
    ("Alma", 63),
    ("Helaman", 16),
    ("3 Nephi", 30),
    ("4 Nephi", 1),
    ("Mormon", 9),
    ("Ether", 15),
    ("Moroni", 10),
]


@dataclass(frozen=True, slots=True)
class ScriptureSeed:
    order_index: int
    book: str
    chapter_number: int
    reference: str


def build_scripture_seed() -> list[ScriptureSeed]:
    seeds: list[ScriptureSeed] = []
    order_index = 1
    for book, chapter_count in BOOK_OF_MORMON_STRUCTURE:
        for chapter_number in range(1, chapter_count + 1):
            seeds.append(
                ScriptureSeed(
                    order_index=order_index,
                    book=book,
                    chapter_number=chapter_number,
                    reference=f"{book} {chapter_number}",
                )
            )
            order_index += 1
    return seeds


TOTAL_BOOK_OF_MORMON_CHAPTERS = sum(chapters for _, chapters in BOOK_OF_MORMON_STRUCTURE)
