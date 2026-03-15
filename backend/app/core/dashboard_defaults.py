from copy import deepcopy


def default_service_categories() -> list[str]:
    return ["Operations", "Media", "Observability", "Study", "General"]


def default_dashboard_sections() -> list[dict[str, object]]:
    return [
        {
            "id": "spotlight",
            "label": "Spotlight",
            "description": "Primary widgets for the day.",
            "enabled": True,
        },
        {
            "id": "operations",
            "label": "Operations",
            "description": "Services, nodes, and control workflows.",
            "enabled": True,
        },
        {
            "id": "routines",
            "label": "Routines",
            "description": "Daily reminders, notes, and reading progress.",
            "enabled": True,
        },
        {
            "id": "insights",
            "label": "Insights",
            "description": "Diagnostics, trends, and supporting widgets.",
            "enabled": True,
        },
    ]


def default_widget_layout() -> list[dict[str, object]]:
    return [
        {"widget_id": "daily_briefing", "section_id": "spotlight", "order": 1, "size": "hero", "enabled": True},
        {"widget_id": "node_overview", "section_id": "spotlight", "order": 2, "size": "half", "enabled": True},
        {"widget_id": "service_launcher", "section_id": "operations", "order": 1, "size": "wide", "enabled": True},
        {"widget_id": "system_overview", "section_id": "operations", "order": 2, "size": "half", "enabled": True},
        {"widget_id": "service_health_summary", "section_id": "operations", "order": 3, "size": "half", "enabled": True},
        {"widget_id": "quick_actions", "section_id": "operations", "order": 4, "size": "half", "enabled": True},
        {"widget_id": "reminders", "section_id": "routines", "order": 1, "size": "half", "enabled": True},
        {"widget_id": "notes", "section_id": "routines", "order": 2, "size": "half", "enabled": True},
        {"widget_id": "scripture_tracker", "section_id": "routines", "order": 3, "size": "wide", "enabled": True},
        {"widget_id": "reading_history_heatmap", "section_id": "insights", "order": 1, "size": "half", "enabled": True},
        {"widget_id": "navidrome_stats", "section_id": "insights", "order": 2, "size": "half", "enabled": True},
        {"widget_id": "recent_albums", "section_id": "insights", "order": 3, "size": "half", "enabled": True},
        {"widget_id": "diagnostics_summary", "section_id": "insights", "order": 4, "size": "half", "enabled": True},
    ]


def default_favorite_widget_ids() -> list[str]:
    return ["daily_briefing", "node_overview", "service_health_summary"]


def default_favorite_command_keys() -> list[str]:
    return ["docker_ps", "disk_usage", "app_logs"]


def clone_dashboard_sections() -> list[dict[str, object]]:
    return deepcopy(default_dashboard_sections())


def clone_widget_layout() -> list[dict[str, object]]:
    return deepcopy(default_widget_layout())
