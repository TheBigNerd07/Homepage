import logging
from logging.handlers import RotatingFileHandler

from app.core.config import get_settings


def configure_logging() -> None:
    settings = get_settings()
    root_logger = logging.getLogger()

    if any(isinstance(handler, RotatingFileHandler) for handler in root_logger.handlers):
        return

    formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    file_handler = RotatingFileHandler(
        settings.app_log_file,
        maxBytes=1_024_000,
        backupCount=3,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(file_handler)
