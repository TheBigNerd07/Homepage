from dataclasses import dataclass

from app.core.time import local_now
from app.schemas.dashboard import (
    DailyBriefing,
    BriefingQuote,
    DashboardMetricsRead,
    SystemSummary,
)
from app.schemas.node import NodeSummaryRead
from app.schemas.note import NoteRead
from app.schemas.reminder import ReminderRead
from app.schemas.scripture import ScriptureProgressRead
from app.schemas.service import ServiceRead
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
    nodes: list[NodeSummaryRead]
    services: list[ServiceRead]
    notes: list[NoteRead]
    metrics: DashboardMetricsRead
    system_summary: SystemSummary


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


def _service_status_line(summary: SystemSummary) -> str:
    if summary.offline_service_count:
        count = summary.offline_service_count + summary.degraded_service_count
        return f"{count} service{'s' if count != 1 else ''} need attention."
    if summary.degraded_service_count:
        return f"{summary.degraded_service_count} service{'s' if summary.degraded_service_count != 1 else ''} are degraded."
    return "All major services are healthy."


def _node_status_line(nodes: list[NodeSummaryRead]) -> str:
    unhealthy = [node for node in nodes if node.status in {"degraded", "offline"}]
    if not unhealthy:
        return "Nodes look stable."
    if len(unhealthy) == 1:
        return f"{unhealthy[0].name} needs attention."
    return f"{len(unhealthy)} nodes need attention."


def _favorite_widget_summaries(context: BriefingContext) -> list[str]:
    summaries: list[str] = []
    favorite_ids = set(context.settings.favorite_widget_ids)
    if "node_overview" in favorite_ids and context.nodes:
        online_nodes = len([node for node in context.nodes if node.status == "online"])
        summaries.append(f"{online_nodes}/{len(context.nodes)} nodes are healthy.")
    if "service_health_summary" in favorite_ids:
        summaries.append(_service_status_line(context.system_summary))
    if "reminders" in favorite_ids:
        open_count = len([reminder for reminder in context.reminders if not reminder.completed])
        summaries.append(f"{open_count} reminder{'s' if open_count != 1 else ''} remain today.")
    if "notes" in favorite_ids:
        pinned = len([note for note in context.notes if note.is_dashboard_pinned])
        summaries.append(f"{pinned} pinned note{'s' if pinned != 1 else ''} are on the dashboard.")
    if "scripture_tracker" in favorite_ids or "reading_history_heatmap" in favorite_ids:
        summaries.append(
            "Reading is complete for today." if context.scripture.today_completed else "Today's reading is still open."
        )
    return summaries[:4]


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

    open_reminders = [reminder for reminder in context.reminders if not reminder.completed]
    priorities = [reminder.text for reminder in open_reminders[:3]]

    reading_prompt = None
    if not context.scripture.today_completed and context.scripture.suggested_next_reference:
        priorities.append(f"Read {context.scripture.suggested_next_reference}")
        reading_prompt = f"Today's reading is still open: {context.scripture.suggested_next_reference}."
    elif context.scripture.today_completed:
        reading_prompt = "Today's reading is complete."

    if not priorities:
        priorities = ["Keep the dashboard calm and protect the next important task."]

    focus_message = context.settings.today_focus.strip() or (
        open_reminders[0].text if open_reminders else context.settings.focus_message
    )
    intro = _segment_intro(context.settings, segment)
    service_status_line = _service_status_line(context.system_summary)
    node_status_line = _node_status_line(context.nodes)

    if segment == "morning":
        summary_text = (
            f"{intro} {service_status_line} "
            f"You have {len(open_reminders)} reminder{'s' if len(open_reminders) != 1 else ''} today."
        )
    elif segment == "afternoon":
        summary_text = (
            f"{intro} {node_status_line} "
            f"There are {len(open_reminders)} reminder{'s' if len(open_reminders) != 1 else ''} still open."
        )
    else:
        summary_text = (
            f"{intro} {service_status_line} "
            f"Before the day ends, {len(open_reminders)} reminder{'s' if len(open_reminders) != 1 else ''} remain."
        )

    ordinal = now.date().toordinal()
    motivation = MOTIVATIONAL_MESSAGES[ordinal % len(MOTIVATIONAL_MESSAGES)] if context.settings.show_motivational_message else None
    quote = QUOTES[ordinal % len(QUOTES)] if context.settings.show_quotes else None
    scripture_of_the_day = None
    if context.settings.show_scripture_of_the_day:
        scripture_of_the_day = context.scripture.suggested_next_reference or context.scripture.current_reference

    return DailyBriefing(
        greeting=greeting,
        segment=segment,
        day_label=now.strftime("%A, %B %d"),
        summary_text=summary_text,
        priorities=priorities,
        focus_message=focus_message,
        reading_prompt=reading_prompt,
        motivational_message=motivation,
        quote=quote,
        system_status_line=f"{service_status_line} {node_status_line}",
        scripture_of_the_day=scripture_of_the_day,
        widget_summaries=_favorite_widget_summaries(context),
    )
