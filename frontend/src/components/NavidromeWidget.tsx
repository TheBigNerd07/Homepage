import { ExternalLink, Music4, PlayCircle } from "lucide-react";
import type { NavidromeWidget as NavidromeWidgetData } from "../types";
import { Card } from "./Card";

export function NavidromeWidget({ widget }: { widget: NavidromeWidgetData }) {
  const libraryStats = [
    { label: "Artists", value: widget.library.artist_count },
    { label: "Albums", value: widget.library.album_count },
    { label: "Songs", value: widget.library.song_count },
  ];

  return (
    <Card
      title="Navidrome Activity"
      eyebrow="Media"
      action={
        widget.base_url ? (
          <a
            href={widget.base_url}
            target="_blank"
            rel="noreferrer"
            className="button-secondary"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Navidrome
          </a>
        ) : null
      }
    >
      {!widget.enabled ? (
        <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-5 py-8 text-sm text-slate-400">
          {widget.message ?? "Navidrome integration is disabled."}
        </div>
      ) : !widget.available ? (
        <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-5 py-8 text-sm text-slate-400">
          {widget.message ?? "Navidrome is currently unavailable."}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {libraryStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-4"
              >
                <div className="label">{stat.label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{stat.value ?? "N/A"}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Music4 className="h-4 w-4 text-accent/80" />
                <span className="label">Recently Added Albums</span>
              </div>
              {widget.newest_albums.length ? (
                <div className="space-y-3">
                  {widget.newest_albums.map((album) => (
                    <div
                      key={`${album.id}-${album.name}`}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-white">{album.name}</div>
                      <div className="mt-1 text-sm text-slate-400">{album.artist}</div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {[album.year, album.song_count ? `${album.song_count} tracks` : null].filter(Boolean).join(" • ")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400">No recent album data available.</div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
              <div className="mb-3 flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-accent/80" />
                <span className="label">Now Playing</span>
              </div>
              {widget.now_playing.length ? (
                <div className="space-y-3">
                  {widget.now_playing.map((entry) => (
                    <div
                      key={`${entry.id}-${entry.title}`}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="text-sm font-semibold text-white">{entry.title}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {[entry.artist, entry.album].filter(Boolean).join(" • ")}
                      </div>
                      <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                        {[entry.user, entry.duration_seconds ? `${Math.round(entry.duration_seconds / 60)} min` : null]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-400">Nothing is playing right now.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
