"use client";

import { useState, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Film, Upload, CheckCircle2, XCircle, Trash2, AlertTriangle } from "lucide-react";
import {
  validateVideoFile,
  buildGameVideoStoragePath,
  extractVideoDuration,
  formatFileSize,
  sanitizeFileName,
} from "@/lib/storage/videos";
import {
  ALLOWED_VIDEO_EXTENSIONS,
  GAME_VIDEO_BUCKET,
  MAX_VIDEO_UPLOAD_SIZE_LABEL,
} from "@/lib/constants/video";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { saveVideoAssetAction, deleteVideoAssetAction } from "@/lib/actions/video";
import type { VideoAsset } from "@/types/database";

type UploadState =
  | "idle"
  | "selected"
  | "uploading"
  | "saving"
  | "success"
  | "error";

interface VideoUploadCardProps {
  teamId: string;
  gameId: string;
  canEdit: boolean;
  existingAsset?: VideoAsset | null;
}

export function VideoUploadCard({
  teamId,
  gameId,
  canEdit,
  existingAsset,
}: VideoUploadCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>(
    existingAsset ? "success" : "idle"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<VideoAsset | null>(
    existingAsset ?? null
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPendingDelete, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();
  const isConfigured = supabase !== null;

  function resetToIdle() {
    setUploadState("idle");
    setSelectedFile(null);
    setUploadError(null);
    setConfirmDelete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelect(file: File) {
    setUploadError(null);
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error ?? "Invalid file.");
      setUploadState("idle");
      return;
    }
    setSelectedFile(file);
    setUploadState("selected");
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    []
  );

  async function handleUpload() {
    if (!selectedFile || !supabase) return;

    setUploadState("uploading");
    setUploadError(null);

    try {
      const storagePath = buildGameVideoStoragePath(teamId, gameId, selectedFile.name);
      const durationSeconds = await extractVideoDuration(selectedFile);

      const { error: uploadError } = await supabase.storage
        .from(GAME_VIDEO_BUCKET)
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Storage upload succeeded — create the DB record via server action.
      setUploadState("saving");

      const result = await saveVideoAssetAction({
        teamId,
        gameId,
        storageBucket: GAME_VIDEO_BUCKET,
        storagePath,
        fileName: sanitizeFileName(selectedFile.name),
        fileSizeBytes: selectedFile.size,
        mimeType: selectedFile.type,
        durationSeconds: durationSeconds ?? undefined,
      });

      if ("error" in result) {
        throw new Error(result.error);
      }

      setCurrentAsset(result.data);
      setUploadState("success");

      // Refresh the page so the server-fetched video player replaces this component.
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setUploadError(message);
      setUploadState("error");
    }
  }

  function handleDelete() {
    if (!currentAsset) return;
    setDeleteError(null);
    startDelete(async () => {
      const result = await deleteVideoAssetAction(
        teamId,
        gameId,
        currentAsset.id,
        currentAsset.storageBucket,
        currentAsset.storagePath
      );
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setCurrentAsset(null);
        setConfirmDelete(false);
        setUploadState("idle");
        router.refresh();
      }
    });
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
        <p className="text-sm text-amber-400 font-medium mb-1">
          Supabase not configured
        </p>
        <p className="text-xs text-slate-500">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
          enable video upload.
        </p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
        <Film className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-slate-500">
          Only coaches and analysts can upload video.
        </p>
      </div>
    );
  }

  // Success state (video just uploaded or already existed from server fetch)
  if (uploadState === "success" && currentAsset) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-slate-200">
            Video uploaded successfully
          </p>
        </div>
        <p className="text-xs text-slate-500">
          {currentAsset.fileName}
          {currentAsset.fileSizeBytes
            ? ` · ${formatFileSize(currentAsset.fileSizeBytes)}`
            : ""}
        </p>
        {canEdit && (
          <div className="pt-1">
            {!confirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-red-400"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove video
              </Button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-sm text-slate-300 flex-1">
                  Remove this video from the game?
                </p>
                <div className="flex gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={isPendingDelete}
                    disabled={isPendingDelete}
                    onClick={handleDelete}
                  >
                    Remove
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {deleteError && (
              <p className="text-xs text-red-400 mt-2">{deleteError}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  const isUploading = uploadState === "uploading" || uploadState === "saving";

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors
          ${isDragOver ? "border-sky-500 bg-sky-500/5" : "border-slate-700 bg-slate-900/40"}
          ${isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload video file"
        onKeyDown={(e) => e.key === "Enter" && !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_VIDEO_EXTENSIONS.join(",")}
          onChange={onInputChange}
          className="sr-only"
          aria-hidden="true"
        />

        {isUploading ? (
          <div>
            <Upload className="h-8 w-8 text-sky-400 mx-auto mb-3 animate-bounce" />
            <p className="text-sm font-medium text-slate-300">
              {uploadState === "uploading" ? "Uploading video…" : "Saving record…"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Please do not close this page</p>
          </div>
        ) : uploadState === "error" ? (
          <div>
            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-400 mb-1">Upload failed</p>
            <p className="text-xs text-slate-400 mb-3">{uploadError}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => { e.stopPropagation(); resetToIdle(); }}
            >
              Try again
            </Button>
          </div>
        ) : selectedFile ? (
          <div>
            <Film className="h-8 w-8 text-sky-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-200 mb-1 truncate max-w-xs mx-auto">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              {formatFileSize(selectedFile.size)}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleUpload(); }}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload video
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); resetToIdle(); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Film className="h-8 w-8 text-slate-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300 mb-1">
              Drop video file or click to browse
            </p>
            <p className="text-xs text-slate-500">
              Supports MP4, MOV, WebM, AVI · Max {MAX_VIDEO_UPLOAD_SIZE_LABEL}
            </p>
          </div>
        )}
      </div>

      {/* Validation error below the drop zone */}
      {uploadState === "idle" && uploadError && (
        <p className="text-xs text-red-400">{uploadError}</p>
      )}

      <p className="text-xs text-slate-600 text-center">
        Upload the game or practice film that future timestamps and AI reports
        will reference.
      </p>
    </div>
  );
}
