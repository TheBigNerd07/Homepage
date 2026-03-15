from dataclasses import dataclass

from app.core.time import local_now
from app.schemas.dashboard import BriefingQuote, DailyBriefing
from app.schemas.reminder import ReminderRead
from app.schemas.scripture import ScriptureProgressRead
from app.schemas.settings import SettingRead

MOTIVATIONAL_MESSAGES = [
    "Momentum beats intensity when you repeat it every day.",
    "Protect the quiet work before the urgent work expands.",
    "A clean dashboard makes the next decision easier.",
    "Keep one promise to yourself before the day gets loud.",
    "Consistency compounds faster than motivation.",
]

QUOTES = [
    BriefingQuote(text="Waste no more time arguing what a good man should be. Be one.", author="Marcus Aurelius"),
    BriefingQuote(text="Well begun is half done.", author="Aristotle"),
    BriefingQuote(text="Great acts are made up of small deeds.", author="Lao Tzu"),
    BriefingQuote(text="What we do now echoes in the shape of the day.", author="Original"),
]


@dataclass(slots=True)
class BriefingContext:
    settings: SettingRead
    reminders: list[ReminderRead]
    scripture: ScriptureProgressRead


def _time_segment(hour: int) -> str:
    if hour < 12:
        return "morning"
    if hour < 18:
        return "afternoon"
    return "evening"


def _segment_intro(settings: SettingRead, segment: str) -> str:
    if segment == "morning":
        return settings.morning_intro
    if segment == "afternoon":
        return settings.afternoon_intro
    return settings.evening_intro


def build_daily_briefing(context: BriefingContext) -> DailyBriefing:
    now = local_now()
    segment = _time_segment(now.hour)
    display_name = context.settings.display_name.strip()

    greeting_prefix = {
        "morning": "Good morning",
        "afternoon": "Good afternoon",
        "evening": "Good evening",
    }[segment]
    greeting = f"{greeting_prefix}, {display_name}." if display_name else f"{greeting_prefix}."

    open_priorities = [reminder.text for reminder in context.reminders if not reminder.completed]
    priorities = open_priorities[:3]
    reading_prompt = None
    if not context.scripture.today_completed and context.scripture.suggested_next_reference:
        priorities.append(f"Read {context.scripture.suggested_next_reference}")
        reading_prompt = f"Today's reading is still open: {context.scripture.suggested_next_reference}."

    if not priorities:
        priorities = ["Keep the dashboard tidy and protect your evening."]

    focus_message = open_priorities[0] if open_priorities else context.settings.focus_message
    ordinal = now.date().toordinal()
    motivation = MOTIVATIONAL_MESSAGES[ordinal % len(MOTIVATIONAL_MESSAGES)]
    quote = QUOTES[ordinal % len(QUOTES)] if context.settings.show_quotes else None

    return DailyBriefing(
        greeting=greeting,
        segment=segment,
        day_label=now.strftime("%A, %B %d"),
        summary_text=_segment_intro(context.settings, segment),
        priorities=priorities,
        focus_message=focus_message,
        reading_prompt=reading_prompt,
        motivational_message=motivation,
        quote=quote,
    )
