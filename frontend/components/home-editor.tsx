"use client";

import { ChangeEvent, DragEvent, ReactNode, useEffect, useRef, useState } from "react";

import { AudioWavePlayer } from "@/components/audio-wave-player";
import { ContentLinks, type ContentLinkItem } from "@/components/content-links";
import { MobileContentMenu } from "@/components/mobile-content-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { trackEvent } from "@/lib/analytics";
import { formatMessage, siteMessages } from "@/lib/i18n";
import Link from "next/link";

type MetadataForm = {
  outputFilename: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  track: string;
  comment: string;
};

type MP3Metadata = Omit<MetadataForm, "outputFilename"> & {
  filename: string;
  has_cover: boolean;
  cover_mime_type: string | null;
  cover_data_url: string | null;
};

type MP3MetadataResponse = {
  metadata: MP3Metadata;
  warnings: string[];
};

type ProgressPhase = "idle" | "uploading" | "processing" | "downloading" | "completed" | "error";
type OperationProgress = {
  phase: ProgressPhase;
  percent: number | null;
  loadedBytes: number;
  totalBytes: number | null;
  resultBytes: number | null;
};

const copy = siteMessages;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/mp3";
const headerTitle = copy.header.title;
const headerSubtitle = copy.header.subtitle;
const FIELD_KEYS = [
  "outputFilename",
  "title",
  "artist",
  "album",
  "genre",
  "year",
  "track",
] as const;

const EMPTY_FORM: MetadataForm = {
  outputFilename: "",
  title: "",
  artist: "",
  album: "",
  genre: "",
  year: "",
  track: "",
  comment: "",
};

const EMPTY_PROGRESS: OperationProgress = {
  phase: "idle",
  percent: null,
  loadedBytes: 0,
  totalBytes: null,
  resultBytes: null,
};

type HomeEditorProps = {
  headerPages: ContentLinkItem[];
  footerPages: ContentLinkItem[];
  children?: ReactNode;
};

function isMissingCoverWarning(warning: string): boolean {
  const normalized = warning.trim().toLowerCase();
  return normalized === "cover art is missing." || normalized === "cover art is missing";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return copy.errors.unknown;
}

function getFilenameFromDisposition(header: string | null): string | null {
  if (!header) {
    return null;
  }

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = header.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] ?? null;
}

function formatBytes(bytes: number | null): string {
  if (!bytes || bytes < 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const fractionDigits = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(fractionDigits)} ${units[unitIndex]}`;
}

function getExtensionFromMimeType(mimeType: string | null | undefined): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

async function extractErrorDetail(xhr: XMLHttpRequest, fallback: string): Promise<string> {
  try {
    const bodyText =
      xhr.response instanceof Blob
        ? await xhr.response.text()
        : typeof xhr.responseText === "string"
          ? xhr.responseText
          : "";

    if (!bodyText) {
      return fallback;
    }

    const parsed = JSON.parse(bodyText) as { detail?: string };
    return parsed.detail ?? fallback;
  } catch {
    return fallback;
  }
}

function sendFormDataRequest(
  url: string,
  formData: FormData,
  options: {
    responseType?: XMLHttpRequestResponseType;
    onUploadProgress?: (loaded: number, total: number | null) => void;
    onUploadComplete?: () => void;
    onDownloadProgress?: (loaded: number, total: number | null) => void;
  } = {},
): Promise<XMLHttpRequest> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = options.responseType ?? "text";

    xhr.upload.onprogress = (event) => {
      options.onUploadProgress?.(event.loaded, event.lengthComputable ? event.total : null);
    };

    xhr.upload.onload = () => {
      options.onUploadComplete?.();
    };

    xhr.onprogress = (event) => {
      options.onDownloadProgress?.(event.loaded, event.lengthComputable ? event.total : null);
    };

    xhr.onerror = () => {
      reject(new Error("Network error"));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr);
        return;
      }

      void (async () => {
        reject(new Error(await extractErrorDetail(xhr, `Request failed with status ${xhr.status}`)));
      })();
    };

    xhr.send(formData);
  });
}

function getReadProgressLabel(progress: OperationProgress): string {
  switch (progress.phase) {
    case "uploading":
      return copy.progress.uploading;
    case "processing":
      return copy.progress.processingMetadata;
    case "completed":
      return copy.progress.metadataReady;
    default:
      return copy.progress.uploadPanelTitle;
  }
}

function getSaveProgressLabel(progress: OperationProgress): string {
  switch (progress.phase) {
    case "uploading":
      return copy.progress.uploadingChanges;
    case "processing":
      return copy.progress.preparingDownload;
    case "downloading":
      return copy.progress.downloading;
    case "completed":
      return copy.progress.downloadReady;
    default:
      return copy.progress.savePanelTitle;
  }
}

function ProgressBar({ progress }: { progress: OperationProgress }) {
  const width = progress.percent === null ? "45%" : `${progress.percent}%`;

  return (
    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--surface-soft)]">
      <div
        className={`relative h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))] transition-all duration-300 ${
          progress.percent === null ? "animate-pulse" : ""
        }`}
        style={{ width }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.24),transparent)] opacity-70" />
      </div>
    </div>
  );
}

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)]">
      {children}
    </div>
  );
}

function MusicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <circle cx="8" cy="18" r="4" />
      <path d="M12 18V2l7 4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="1.9">
      <path d="M12 15V4.5" strokeLinecap="round" />
      <path d="m7.5 9 4.5-4.5L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 17.5v1a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-1" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

function CoverIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="2" />
      <path d="m21 16-5-5-7 7" />
    </svg>
  );
}

function TagsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M20 10 10 20 3 13V4h9l8 6Z" />
      <circle cx="7.5" cy="8.5" r="1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M12 4v10" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M6 6 18 18" strokeLinecap="round" />
      <path d="M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2">
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </svg>
  );
}

function FeatureIcon({ index }: { index: number }) {
  if (index === 0) {
    return <BoltIcon />;
  }

  if (index === 1) {
    return <TagsIcon />;
  }

  return <CoverIcon />;
}

function SectionCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_48px_var(--surface-shadow)] backdrop-blur-xl md:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomeEditor({ headerPages, footerPages, children }: HomeEditorProps) {
  const mp3InputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MetadataForm>(EMPTY_FORM);
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [removeCoverRequested, setRemoveCoverRequested] = useState(false);
  const [metadata, setMetadata] = useState<MP3Metadata | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState(copy.status.idle);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localCoverPreviewUrl, setLocalCoverPreviewUrl] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState<OperationProgress>(EMPTY_PROGRESS);
  const [saveProgress, setSaveProgress] = useState<OperationProgress>(EMPTY_PROGRESS);

  useEffect(() => {
    return () => {
      if (localCoverPreviewUrl) {
        URL.revokeObjectURL(localCoverPreviewUrl);
      }
    };
  }, [localCoverPreviewUrl]);

  const previewUrl = removeCoverRequested ? null : localCoverPreviewUrl ?? metadata?.cover_data_url ?? null;
  const hasLoadedFile = Boolean(mp3File && metadata);
  const shouldShowPreloadFeedback = !hasLoadedFile && (Boolean(mp3File) || readProgress.phase !== "idle" || Boolean(error));
  const hasPendingCoverChanges = Boolean(coverFile) && saveProgress.phase !== "completed";
  const visibleWarnings = hasPendingCoverChanges
    ? [
        ...warnings.filter((warning) => !isMissingCoverWarning(warning)),
        copy.warnings.coverPending,
      ]
    : warnings;
  const warningTone = visibleWarnings.length === 0 ? "success" : hasPendingCoverChanges ? "warning" : "danger";
  const statusTone = error || removeCoverRequested ? "danger" : "default";

  const resetEditor = () => {
    setMp3File(null);
    setCoverFile(null);
    setRemoveCoverRequested(false);
    setMetadata(null);
    setWarnings([]);
    setForm(EMPTY_FORM);
    setError("");
    setStatus(copy.status.idle);
    setIsDragging(false);
    setIsReading(false);
    setIsSaving(false);
    setReadProgress(EMPTY_PROGRESS);
    setSaveProgress(EMPTY_PROGRESS);
    resetCoverPreview();
  };

  const resetCoverPreview = () => {
    if (localCoverPreviewUrl) {
      URL.revokeObjectURL(localCoverPreviewUrl);
      setLocalCoverPreviewUrl(null);
    }
  };

  const handleCoverDownload = async () => {
    if (!previewUrl || !mp3File) {
      return;
    }

    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const extension = coverFile
        ? getExtensionFromMimeType(coverFile.type)
        : getExtensionFromMimeType(metadata?.cover_mime_type);
      const baseName = mp3File.name.replace(/\.mp3$/i, "");
      const filename = coverFile?.name || `${baseName}-cover.${extension}`;
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError(copy.errors.saveFailed);
    }
  };

  const handleCoverRemove = () => {
    if (!coverFile && !metadata?.has_cover) {
      return;
    }

    resetCoverPreview();
    setCoverFile(null);
    setRemoveCoverRequested(true);
    setError("");
    setStatus(copy.status.coverRemoved);
  };

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const readMP3File = async (selectedFile: File) => {
    setMp3File(selectedFile);
    setMetadata(null);
    setWarnings([]);
    setError("");
    setCoverFile(null);
    setRemoveCoverRequested(false);
    setSaveProgress(EMPTY_PROGRESS);
    resetCoverPreview();
    setIsReading(true);
    setStatus(formatMessage(copy.status.reading, { filename: selectedFile.name }));
    setReadProgress({
      ...EMPTY_PROGRESS,
      phase: "uploading",
      percent: 0,
      totalBytes: selectedFile.size,
    });

    try {
      const payload = new FormData();
      payload.append("mp3_file", selectedFile);

      const xhr = await sendFormDataRequest(`${API_BASE_URL}/read`, payload, {
        onUploadProgress: (loaded, total) => {
          setReadProgress({
            phase: "uploading",
            loadedBytes: loaded,
            totalBytes: total,
            percent: total ? Math.min(100, (loaded / total) * 100) : null,
            resultBytes: null,
          });
        },
        onUploadComplete: () => {
          setReadProgress((current) => ({
            ...current,
            phase: "processing",
            percent: null,
          }));
        },
      });

      const data = JSON.parse(xhr.responseText) as MP3MetadataResponse;
      setMetadata(data.metadata);
      setWarnings(data.warnings);
      setForm({
        outputFilename: data.metadata.filename ?? selectedFile.name,
        title: data.metadata.title ?? "",
        artist: data.metadata.artist ?? "",
        album: data.metadata.album ?? "",
        genre: data.metadata.genre ?? "",
        year: data.metadata.year ?? "",
        track: data.metadata.track ?? "",
        comment: data.metadata.comment ?? "",
      });
      trackEvent("track_uploaded", {
        file_extension: "mp3",
        file_size_bytes: selectedFile.size,
        had_embedded_cover: data.metadata.has_cover,
      });
      setStatus(copy.status.loaded);
      setReadProgress({
        phase: "completed",
        percent: 100,
        loadedBytes: selectedFile.size,
        totalBytes: selectedFile.size,
        resultBytes: null,
      });
    } catch (readError) {
      setMp3File(null);
      setMetadata(null);
      setForm(EMPTY_FORM);
      setError(getErrorMessage(readError));
      setStatus(copy.status.loadFailed);
      setReadProgress({
        ...EMPTY_PROGRESS,
        phase: "error",
      });
    } finally {
      setIsReading(false);
    }
  };

  const handleMP3Select = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    await readMP3File(selectedFile);
    event.target.value = "";
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const selectedFile = event.dataTransfer.files?.[0];
    if (!selectedFile) {
      return;
    }

    await readMP3File(selectedFile);
  };

  const handleCoverSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    resetCoverPreview();
    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setCoverFile(selectedFile);
    setRemoveCoverRequested(false);
    setLocalCoverPreviewUrl(nextPreviewUrl);
    setError("");
    trackEvent("cover_selected", {
      image_type: selectedFile.type || "unknown",
      image_size_bytes: selectedFile.size,
    });
    setStatus(formatMessage(copy.status.coverSelected, { filename: selectedFile.name }));
    event.target.value = "";
  };

  const handleSave = async () => {
    if (!mp3File) {
      setError(copy.status.selectFileFirst);
      return;
    }

    setIsSaving(true);
    setError("");
    setStatus(copy.status.saving);
    setSaveProgress({
      ...EMPTY_PROGRESS,
      phase: "uploading",
      percent: 0,
      totalBytes: mp3File.size,
    });

    try {
      const payload = new FormData();
      payload.append("mp3_file", mp3File);
      payload.append("output_filename", form.outputFilename);
      payload.append("title", form.title);
      payload.append("artist", form.artist);
      payload.append("album", form.album);
      payload.append("genre", form.genre);
      payload.append("year", form.year);
      payload.append("track", form.track);
      payload.append("comment", form.comment);
      payload.append("remove_cover", removeCoverRequested ? "true" : "false");

      if (coverFile) {
        payload.append("cover_image", coverFile);
      }

      const xhr = await sendFormDataRequest(`${API_BASE_URL}/update`, payload, {
        responseType: "blob",
        onUploadProgress: (loaded, total) => {
          setSaveProgress({
            phase: "uploading",
            loadedBytes: loaded,
            totalBytes: total,
            percent: total ? Math.min(100, (loaded / total) * 100) : null,
            resultBytes: null,
          });
        },
        onUploadComplete: () => {
          setSaveProgress((current) => ({
            ...current,
            phase: "processing",
            percent: null,
          }));
        },
        onDownloadProgress: (loaded, total) => {
          setSaveProgress({
            phase: "downloading",
            loadedBytes: loaded,
            totalBytes: total,
            percent: total ? Math.min(100, (loaded / total) * 100) : null,
            resultBytes: null,
          });
        },
      });

      const blob = xhr.response as Blob;
      const objectUrl = URL.createObjectURL(blob);
      const disposition = xhr.getResponseHeader("content-disposition");
      const downloadName =
        getFilenameFromDisposition(disposition) ??
        (form.outputFilename || `${mp3File.name.replace(/\.mp3$/i, "")}-updated.mp3`);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);

      trackEvent("mp3_downloaded", {
        file_size_bytes: blob.size,
        had_new_cover: Boolean(coverFile),
      });
      setStatus(copy.status.saved);
      if (coverFile) {
        setWarnings((current) => current.filter((warning) => !isMissingCoverWarning(warning)));
        setMetadata((current) =>
          current
            ? {
                ...current,
                has_cover: true,
                cover_mime_type: coverFile.type || current.cover_mime_type,
              }
            : current,
        );
      }
      if (removeCoverRequested) {
        setWarnings(["Cover art is missing."]);
        setMetadata((current) =>
          current
            ? {
                ...current,
                has_cover: false,
                cover_mime_type: null,
                cover_data_url: null,
              }
            : current,
        );
      }
      setCoverFile(null);
      setRemoveCoverRequested(false);
      resetCoverPreview();
      setSaveProgress({
        phase: "completed",
        percent: 100,
        loadedBytes: blob.size,
        totalBytes: blob.size,
        resultBytes: blob.size,
      });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
      setStatus(copy.status.saveFailed);
      setSaveProgress({
        ...EMPTY_PROGRESS,
        phase: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,var(--hero-orb),transparent_30%),var(--background)]">
      <input
        ref={mp3InputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        className="hidden"
        onChange={handleMP3Select}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleCoverSelect}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,var(--hero-orb),transparent_60%)]" />
      <div className="pointer-events-none absolute left-[12%] top-28 h-32 w-32 rounded-full bg-[var(--accent-glow)] blur-3xl" />
      <div className="pointer-events-none absolute right-[10%] top-44 h-40 w-40 rounded-full bg-[var(--hero-orb)] blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-surface)] backdrop-blur-xl">
        <div className="container-shell flex h-[70px] items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] text-[var(--accent-contrast)] shadow-[0_10px_24px_var(--accent-glow)]">
              <MusicIcon />
            </div>
            <Link href="/" className="block transition hover:text-[var(--accent)]">
              <p className="text-[0.95rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.15rem] md:leading-none">
                {headerTitle}
              </p>
              <p className="mt-0.5 text-[0.68rem] text-[var(--muted)] md:text-[0.74rem]">{headerSubtitle}</p>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3.5 py-1.5 text-xs font-medium text-[var(--accent)] sm:inline-flex">
              <SparklesIcon />
              {copy.header.badge}
            </span>
            <ThemeToggle label={copy.actions.toggleTheme} />
            <MobileContentMenu pages={headerPages} />
          </div>
        </div>
      </header>

      <section className="relative py-8 md:py-10">
        <div className="container-shell">
          {!hasLoadedFile ? (
            <div className="mx-auto text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted)] md:text-xs">
                {copy.header.eyebrow}
              </p>
              <h1 className="mt-4 text-[1.7rem] font-bold leading-[1.08] text-[var(--foreground)] md:text-[2rem]">
                {copy.hero.title}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
                {copy.hero.description}
              </p>
              <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/batch"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-[0.82rem] font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Batch editor
                </Link>
              </div>
            </div>
          ) : null}

          <div className={`mx-auto ${hasLoadedFile ? "mt-0" : "mt-10"} space-y-6`}>
            {shouldShowPreloadFeedback ? (
              <SectionCard className="p-5">
                <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        error
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : "bg-[var(--accent-glow)] text-[var(--accent)]"
                      }`}
                    >
                      {error ? <AlertIcon /> : <CheckIcon />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        {copy.status.panelTitle}
                      </p>
                      <p className="mt-2 text-base font-medium leading-7 text-[var(--foreground)]">
                        {status}
                      </p>
                      {mp3File ? (
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {formatMessage(copy.status.currentFile, { filename: mp3File.name })}
                        </p>
                      ) : null}
                      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        warningTone === "danger"
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : warningTone === "warning"
                            ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                            : "bg-[var(--success-soft)] text-[var(--success)]"
                      }`}
                    >
                      {warningTone === "success" ? <CheckIcon /> : <AlertIcon />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        {copy.warnings.panelTitle}
                      </p>
                      {visibleWarnings.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {visibleWarnings.map((warning) => (
                            <p
                              key={warning}
                              className={`text-sm ${
                                warningTone === "warning"
                                  ? "text-[var(--warning)]"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              {warning}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[var(--muted)]">{copy.warnings.empty}</p>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : null}

            {!hasLoadedFile ? (
              <SectionCard className="overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => mp3InputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-dragging={isDragging}
                  className={`upload-dropzone group relative flex min-h-[400px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-transparent px-8 py-8 text-center transition-all duration-200 ${
                    isDragging
                      ? "scale-[1.01] bg-[var(--dropzone-hover)]"
                      : "bg-transparent hover:bg-[var(--dropzone-hover)]"
                  }`}
                >
                  <div className="absolute inset-0 opacity-50">
                    <div className="absolute left-16 top-10 h-36 w-36 rounded-full bg-[var(--accent-glow)] blur-3xl" />
                    <div className="absolute bottom-8 right-16 h-36 w-36 rounded-full bg-[var(--hero-orb)] blur-3xl" />
                  </div>

                  <div className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-4 py-5">
                    <div className={`flex h-20 w-20 items-center justify-center rounded-[18px] border border-[var(--border)] bg-[color:var(--accent-panel)] text-[var(--accent)] transition-transform duration-200 group-hover:scale-110 ${isDragging ? "scale-110" : ""}`}>
                      <UploadIcon />
                    </div>
                    <h2 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--foreground)] md:text-[1.7rem]">
                      {isReading ? copy.hero.dropzoneReading : copy.hero.dropzoneIdle}
                    </h2>
                    <p className="max-w-xl text-sm leading-7 text-[var(--muted)] md:text-base">
                      {copy.hero.dropzoneDescription}
                    </p>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-1.5 text-[11px] text-[var(--muted)]">
                      <MusicIcon />
                      {copy.hero.dropzoneSupport}
                    </span>
                  </div>

                  {mp3File || readProgress.phase !== "idle" ? (
                    <div className="relative z-10 mt-5 w-full max-w-[660px] rounded-[26px] border border-[var(--border)] bg-[var(--surface-strong)] px-5 py-5 text-left backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                          {copy.progress.uploadPanelTitle}
                        </p>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {readProgress.percent === null
                            ? copy.progress.unknownPercent
                            : formatMessage(copy.progress.percent, {
                                value: Math.round(readProgress.percent),
                              })}
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                        {getReadProgressLabel(readProgress)}
                      </p>
                      <ProgressBar progress={readProgress} />
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--muted)]">
                        {mp3File ? (
                          <span>
                            {copy.progress.selectedFile}: {mp3File.name}
                          </span>
                        ) : null}
                        {mp3File ? (
                          <span>
                            {copy.progress.fileSize}: {formatBytes(mp3File.size)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </button>
              </SectionCard>
            ) : (
              <SectionCard>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-4">
                    <IconWrap>
                      <FileIcon />
                    </IconWrap>
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                        {copy.file.readyTitle}
                      </p>
                      <h2 className="mt-1 truncate text-[1.12rem] font-semibold tracking-[-0.02em] text-[var(--foreground)] md:text-[1.28rem]">
                        {mp3File?.name}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">{copy.file.readyDescription}</p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:max-w-[320px] lg:w-auto lg:max-w-none lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
                    <span className="w-full rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-center text-sm text-[var(--muted)] lg:w-auto lg:text-left">
                      {copy.file.size}: {formatBytes(mp3File?.size ?? null)}
                    </span>
                    <button
                      type="button"
                      onClick={() => mp3InputRef.current?.click()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--accent-glow)] lg:w-auto"
                    >
                      <UploadIcon />
                      {copy.actions.changeMp3}
                    </button>
                    <button
                      type="button"
                      onClick={resetEditor}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-transparent bg-[linear-gradient(135deg,var(--danger),color-mix(in_oklab,var(--danger)_78%,black))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_var(--danger-soft)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--danger-soft)] lg:w-auto"
                    >
                      <CloseIcon />
                      {copy.actions.removeMp3}
                    </button>
                  </div>
                </div>
              </SectionCard>
            )}

            {!hasLoadedFile ? (
              <div className="grid gap-4 md:grid-cols-3">
                {copy.features.items.map((feature, index) => (
                  <SectionCard key={feature.title} className="p-5">
                    <div className="flex items-start gap-4">
                      <IconWrap>
                        <FeatureIcon index={index} />
                      </IconWrap>
                      <div>
                        <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--foreground)] md:text-[1.05rem]">
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </SectionCard>
                ))}
              </div>
            ) : null}

            {hasLoadedFile ? (
              <SectionCard className="p-5">
                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="flex h-full items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        statusTone === "danger"
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : "bg-[var(--accent-glow)] text-[var(--accent)]"
                      }`}
                    >
                      {statusTone === "danger" ? <AlertIcon /> : <CheckIcon />}
                    </div>
                    <div className="min-w-0 self-center">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        {copy.status.panelTitle}
                      </p>
                      <p
                        className={`mt-2 text-base font-medium leading-7 ${
                          statusTone === "danger"
                            ? "text-[var(--danger)]"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {status}
                      </p>
                      {mp3File ? (
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {formatMessage(copy.status.currentFile, { filename: mp3File.name })}
                        </p>
                      ) : null}
                      {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
                    </div>
                  </div>

                  <div className="flex h-full items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        warningTone === "danger"
                          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                          : warningTone === "warning"
                            ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                            : "bg-[var(--success-soft)] text-[var(--success)]"
                      }`}
                    >
                      {warningTone === "success" ? <CheckIcon /> : <AlertIcon />}
                    </div>
                    <div className="min-w-0 self-center">
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        {copy.warnings.panelTitle}
                      </p>
                      {visibleWarnings.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {visibleWarnings.map((warning) => (
                            <p
                              key={warning}
                              className={`text-sm ${
                                warningTone === "warning"
                                  ? "text-[var(--warning)]"
                                  : "text-[var(--muted)]"
                              }`}
                            >
                              {warning}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[var(--muted)]">{copy.warnings.empty}</p>
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>
            ) : null}

            {hasLoadedFile ? (
              <div className="space-y-6">
                <SectionCard>
                  <div className="flex items-center gap-3">
                    <IconWrap>
                      <CoverIcon />
                    </IconWrap>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                      {copy.cover.panelTitle}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
                    <div className="group relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] lg:mx-0 lg:max-w-none">
                      {previewUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt={copy.cover.previewAlt}
                            className="h-full w-full object-cover"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                          <div className="absolute inset-x-4 bottom-4 flex flex-col gap-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                void handleCoverDownload();
                              }}
                              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[color:var(--accent)] bg-black/20 px-4 py-2 text-sm font-medium text-[var(--accent)] backdrop-blur-sm transition hover:bg-black/28"
                            >
                              <DownloadIcon />
                              {copy.actions.downloadCover}
                            </button>
                            <button
                              type="button"
                              onClick={handleCoverRemove}
                              disabled={!coverFile && !metadata?.has_cover}
                              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--danger)] bg-black/20 px-4 py-2 text-sm font-medium text-[var(--danger)] backdrop-blur-sm transition hover:bg-black/28 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                              <CloseIcon />
                              {copy.actions.removeCover}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-8 text-center text-sm leading-6 text-[var(--muted)]">
                          {copy.cover.empty}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 lg:pt-3">
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch">
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            onClick={() => coverInputRef.current?.click()}
                            className="inline-flex min-h-[78px] items-center justify-center gap-2 rounded-2xl border border-transparent bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--accent-glow)] xl:min-h-[86px] xl:self-stretch"
                          >
                            <CoverIcon />
                            {copy.actions.selectCover}
                          </button>
                        </div>

                        <div className="flex min-h-[78px] flex-col justify-center rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 xl:min-h-[86px]">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            {copy.cover.mime}
                          </p>
                          <p className="mt-2 text-sm text-[var(--foreground)]">
                            {coverFile?.type ?? metadata?.cover_mime_type ?? copy.cover.none}
                          </p>
                        </div>
                        <div className="flex min-h-[78px] flex-col justify-center rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 xl:min-h-[86px]">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            {copy.cover.newImage}
                          </p>
                          <p className="mt-2 text-sm text-[var(--foreground)] break-all">
                            {coverFile?.name ?? copy.cover.notSelected}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                        <p className="text-[0.76rem] leading-5 text-[var(--muted)]">
                          {copy.cover.instructions}
                        </p>
                      </div>

                      <AudioWavePlayer file={mp3File!} />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard>
                  <div className="flex items-center gap-3">
                    <IconWrap>
                      <TagsIcon />
                    </IconWrap>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                        {copy.metadata.panelTitle}
                      </p>
                      <h2 className="mt-1 text-[1.55rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.8rem]">
                        {copy.metadata.title}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {FIELD_KEYS.map((fieldKey) => (
                      <label
                        key={fieldKey}
                        className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5"
                      >
                        <span className="text-sm font-medium text-[var(--muted)]">
                          {copy.metadata.fields[fieldKey].label}
                        </span>
                        <input
                          type="text"
                          name={fieldKey}
                          value={form[fieldKey]}
                          onChange={handleFieldChange}
                          placeholder={copy.metadata.fields[fieldKey].placeholder}
                          className="mt-3 h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                        />
                      </label>
                    ))}

                    <label className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                      <span className="text-sm font-medium text-[var(--muted)]">
                        {copy.metadata.commentLabel}
                      </span>
                      <input
                        type="text"
                        name="comment"
                        value={form.comment}
                        onChange={handleFieldChange}
                        placeholder={copy.metadata.commentPlaceholder}
                        className="mt-3 h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                      />
                    </label>
                  </div>
                </SectionCard>

                <SectionCard className="text-center">
                  {saveProgress.phase !== "idle" ? (
                    <div className="mx-auto max-w-[720px]">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          {copy.progress.savePanelTitle}
                        </p>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {saveProgress.percent === null
                            ? copy.progress.unknownPercent
                            : formatMessage(copy.progress.percent, {
                                value: Math.round(saveProgress.percent),
                              })}
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                        {getSaveProgressLabel(saveProgress)}
                      </p>
                      <ProgressBar progress={saveProgress} />
                      <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
                        <span>
                          {copy.progress.fileSize}: {formatBytes(mp3File?.size ?? null)}
                        </span>
                        {saveProgress.resultBytes ? (
                          <span>
                            {copy.progress.downloadSize}: {formatBytes(saveProgress.resultBytes)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`mx-auto inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-60 ${
                      saveProgress.phase !== "idle" ? "mt-5" : ""
                    }`}
                  >
                    <DownloadIcon />
                    {isSaving ? copy.actions.saving : copy.actions.save}
                  </button>
                </SectionCard>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {children}

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]/50 py-6">
        <div className="container-shell flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-[var(--muted)]">{copy.footer.text}</p>
          <ContentLinks pages={footerPages} linkClassName="text-xs" />
        </div>
      </footer>
    </main>
  );
}
