import { ExternalLink, Music4 } from "lucide-react";
import type { NavidromeWidget } from "../types";
import { Card } from "./Card";

export function RecentAlbumsWidget({ widget }: { widget: NavidromeWidget }) {
  return (
    <Card
      title="Recently Added Albums"
      eyebrow="Navidrome"
      action={
        widget.base_url ? (
          <a href={widget.base_url} target="_blank" rel="noreferrer" className="button-secondary">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Navidrome
          </a>
        ) : null
      }
    >
      {widget.enabled && widget.available && widget.newest_albums.length ? (
        <div className="space-y-3">
          {widget.newest_albums.map((album) => (
            <div
              key={album.id}
              className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{album.name}</div>
                  <div className="mt-1 text-sm text-slate-400">{album.artist}</div>
                </div>
                <Music4 className="h-4 w-4 text-accent/80" />
              </div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                {[album.year, album.song_count ? `${album.song_count} tracks` : null].filter(Boolean).join(" • ")}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
          Recent album data will appear when Navidrome is connected.
        </div>
      )}
    </Card>
  );
}
