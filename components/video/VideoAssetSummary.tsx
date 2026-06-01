import { Badge } from "@/components/ui/Badge";
import { HardDrive, Clock, Calendar, Film } from "lucide-react";
import { formatFileSize, formatDuration } from "@/lib/storage/videos";
import type { VideoAsset } from "@/types/database";

interface VideoAssetSummaryProps {
  asset: VideoAsset;
  className?: string;
}

const UPLOAD_STATUS_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "muted" }
> = {
  uploaded:  { label: "Uploaded",   variant: "success" },
  uploading: { label: "Uploading…", variant: "warning" },
  pending:   { label: "Pending",    variant: "muted" },
  failed:    { label: "Failed",     variant: "danger" },
};

export function VideoAssetSummary({ asset, className }: VideoAssetSummaryProps) {
  const uploadConfig =
    UPLOAD_STATUS_CONFIG[asset.uploadStatus] ??
    UPLOAD_STATUS_CONFIG.uploaded;

  const uploadedDate = new Date(asset.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-900 p-4 ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800">
          <Film className="h-5 w-5 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium text-slate-200 truncate"
            title={asset.fileName}
          >
            {asset.fileName}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
            {asset.fileSizeBytes != null && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(asset.fileSizeBytes)}
              </span>
            )}
            {asset.durationSeconds != null && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                {formatDuration(asset.durationSeconds)}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              {uploadedDate}
            </span>
          </div>
        </div>
        <Badge variant={uploadConfig.variant} className="shrink-0">
          {uploadConfig.label}
        </Badge>
      </div>

      {asset.uploadStatus === "failed" && asset.processingError && (
        <p className="mt-2 text-xs text-red-400">{asset.processingError}</p>
      )}

      <p className="mt-2 text-xs text-slate-600">
        Private — accessible via signed URL only
      </p>
    </div>
  );
}
