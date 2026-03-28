"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { formatMessage, siteMessages } from "@/lib/i18n";

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
        className={`h-full rounded-full bg-[var(--accent)] transition-all duration-300 ${
          progress.percent === null ? "animate-pulse" : ""
        }`}
        style={{ width }}
      />
    </div>
  );
}

function HeroShapes() {
  return (
    <>
      <div className="pointer-events-none absolute right-0 top-0 z-[-1] opacity-60 dark:opacity-70">
        <svg
          width="450"
          height="556"
          viewBox="0 0 450 556"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="277" cy="63" r="225" fill="url(#heroGradientA)" />
          <circle cx="17.9997" cy="182" r="18" fill="url(#heroGradientB)" />
          <circle cx="76.9997" cy="288" r="34" fill="url(#heroGradientC)" />
          <circle
            cx="325.486"
            cy="302.87"
            r="180"
            transform="rotate(-37.6852 325.486 302.87)"
            fill="url(#heroGradientD)"
          />
          <defs>
            <linearGradient
              id="heroGradientA"
              x1="-54.5003"
              y1="-178"
              x2="222"
              y2="288"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
            <radialGradient
              id="heroGradientB"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(17.9997 182) rotate(90) scale(18)"
            >
              <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.14" />
            </radialGradient>
            <radialGradient
              id="heroGradientC"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(76.9997 288) rotate(90) scale(34)"
            >
              <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.14" />
            </radialGradient>
            <linearGradient
              id="heroGradientD"
              x1="226.775"
              y1="-66.1548"
              x2="292.157"
              y2="351.421"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 z-[-1] opacity-60 dark:opacity-70">
        <svg
          width="364"
          height="201"
          viewBox="0 0 364 201"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24"
            stroke="url(#heroLineA)"
          />
          <path
            d="M-22.1107 72.3303C5.65989 66.4798 73.3965 64.9086 122.178 105.427C183.155 156.076 201.59 162.093 236.333 166.607C271.076 171.12 309.718 183.657 334.889 212.24"
            stroke="url(#heroLineB)"
          />
          <circle cx="220" cy="63" r="43" fill="url(#heroLineC)" />
          <defs>
            <linearGradient
              id="heroLineA"
              x1="184.389"
              y1="69.2405"
              x2="184.389"
              y2="212.24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <linearGradient
              id="heroLineB"
              x1="156.389"
              y1="69.2405"
              x2="156.389"
              y2="212.24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" />
            </linearGradient>
            <radialGradient
              id="heroLineC"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(220 63) rotate(90) scale(43)"
            >
              <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
              <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.14" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </>
  );
}

export default function Home() {
  const mp3InputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MetadataForm>(EMPTY_FORM);
  const [mp3File, setMp3File] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
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

  const previewUrl = localCoverPreviewUrl ?? metadata?.cover_data_url ?? null;
  const hasLoadedFile = Boolean(mp3File && metadata);

  const resetCoverPreview = () => {
    if (localCoverPreviewUrl) {
      URL.revokeObjectURL(localCoverPreviewUrl);
      setLocalCoverPreviewUrl(null);
    }
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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
    setLocalCoverPreviewUrl(nextPreviewUrl);
    setError("");
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

      setStatus(copy.status.saved);
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
    <main className="overflow-hidden">
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

      <section className="relative z-10 overflow-hidden pb-18 pt-6 md:pb-24 md:pt-8 xl:pb-28">
        <HeroShapes />

        <div className="container-shell">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-[var(--muted)]">
                {copy.header.eyebrow}
              </p>
            </div>
            <ThemeToggle label={copy.actions.toggleTheme} />
          </div>

          <div className="mx-auto mt-12 max-w-[920px] text-center md:mt-16">
            <h1 className="text-4xl font-bold leading-tight text-[var(--foreground)] md:text-6xl md:leading-tight xl:text-7xl xl:leading-tight">
              {copy.hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-[760px] text-base leading-8 text-[var(--muted)] md:text-lg">
              {copy.hero.description}
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-[980px]">
            <button
              type="button"
              onClick={() => mp3InputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`group relative flex min-h-[340px] w-full flex-col items-center justify-center overflow-hidden rounded-[28px] border border-dashed px-8 py-12 text-center transition duration-300 ${
                isDragging
                  ? "border-[var(--accent)] bg-[color:rgba(74,108,247,0.08)]"
                  : "border-[var(--border)] bg-[var(--surface)] shadow-[0_20px_60px_rgba(13,24,45,0.08)] dark:shadow-none"
              }`}
            >
              <div className="absolute inset-0 opacity-40">
                <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-[color:rgba(74,108,247,0.1)] blur-3xl" />
                <div className="absolute bottom-6 right-10 h-32 w-32 rounded-full bg-[color:rgba(74,108,247,0.1)] blur-3xl" />
              </div>

              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-[var(--border)] bg-white text-xl font-semibold text-[var(--accent)] shadow-[0_10px_30px_rgba(74,108,247,0.12)] dark:bg-slate-900 dark:shadow-none">
                MP3
              </div>
              <h2 className="relative z-10 mt-8 text-3xl font-semibold md:text-4xl">
                {isReading ? copy.hero.dropzoneReading : copy.hero.dropzoneIdle}
              </h2>
              <p className="relative z-10 mt-4 max-w-[680px] text-base leading-7 text-[var(--muted)] md:text-lg">
                {copy.hero.dropzoneDescription}
              </p>
              <span className="relative z-10 mt-8 inline-flex rounded-sm bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white transition duration-300 group-hover:bg-[var(--accent-strong)]">
                {copy.actions.selectMp3}
              </span>

              {mp3File || readProgress.phase !== "idle" ? (
                <div className="relative z-10 mt-8 w-full max-w-[620px] rounded-[22px] border border-[var(--border)] bg-[var(--surface)]/90 px-5 py-4 text-left backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                      {copy.progress.uploadPanelTitle}
                    </p>
                    <p className="text-sm font-medium text-[var(--foreground)]">
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
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--muted)]">
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

            <div className="mx-auto mt-8 max-w-[800px] text-center">
              <p className="text-sm leading-7 text-[var(--muted)] md:text-base">
                {copy.hero.steps.map((step, index) => (
                  <span key={step}>
                    {index + 1}. {step}
                    {index < copy.hero.steps.length - 1 ? <br /> : null}
                  </span>
                ))}
              </p>
            </div>

            <div className="mx-auto mt-8 grid max-w-[980px] gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  {copy.status.panelTitle}
                </p>
                <p className="mt-2 text-base font-medium">{status}</p>
                {mp3File ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {formatMessage(copy.status.currentFile, { filename: mp3File.name })}
                  </p>
                ) : null}
                {error ? <p className="mt-3 text-sm text-[var(--danger)]">{error}</p> : null}
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  {copy.warnings.panelTitle}
                </p>
                {warnings.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {warnings.map((warning) => (
                      <p key={warning} className="text-sm text-[var(--muted)]">
                        {warning}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--muted)]">{copy.warnings.empty}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasLoadedFile ? (
        <section className="pb-14 md:pb-20">
          <div className="container-shell">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(13,24,45,0.05)] dark:shadow-none">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                  {copy.cover.panelTitle}
                </p>

                <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                  <div className="flex aspect-square max-w-[320px] items-center justify-center overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)]">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt={copy.cover.previewAlt}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="px-8 text-center text-sm leading-6 text-[var(--muted)]">
                        {copy.cover.empty}
                      </div>
                    )}
                  </div>

                  <div className="flex min-h-full flex-col justify-start">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        className="rounded-sm border border-[var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        {copy.actions.selectCover}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          {copy.cover.mime}
                        </p>
                        <p className="mt-2 text-sm">
                          {metadata?.cover_mime_type ?? coverFile?.type ?? copy.cover.none}
                        </p>
                      </div>
                      <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          {copy.cover.newImage}
                        </p>
                        <p className="mt-2 text-sm break-all">
                          {coverFile?.name ?? copy.cover.notSelected}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(13,24,45,0.05)] dark:shadow-none">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                  {copy.metadata.panelTitle}
                </p>
                <h2 className="mt-3 text-3xl font-semibold">{copy.metadata.title}</h2>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {FIELD_KEYS.map((fieldKey) => (
                    <label
                      key={fieldKey}
                      className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"
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
                        className="mt-3 w-full rounded-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                      />
                    </label>
                  ))}

                  <label className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 md:col-span-2">
                    <span className="text-sm font-medium text-[var(--muted)]">
                      {copy.metadata.commentLabel}
                    </span>
                    <input
                      type="text"
                      name="comment"
                      value={form.comment}
                      onChange={handleFieldChange}
                      placeholder={copy.metadata.commentPlaceholder}
                      className="mt-3 w-full rounded-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] px-6 py-5 text-center shadow-[0_18px_40px_rgba(13,24,45,0.05)] dark:shadow-none">
                {saveProgress.phase !== "idle" ? (
                  <div className="mx-auto max-w-[720px]">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        {copy.progress.savePanelTitle}
                      </p>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {saveProgress.percent === null
                          ? copy.progress.unknownPercent
                          : formatMessage(copy.progress.percent, {
                              value: Math.round(saveProgress.percent),
                            })}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-medium">{getSaveProgressLabel(saveProgress)}</p>
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
                  className={`mx-auto rounded-sm bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 ${
                    saveProgress.phase !== "idle" ? "mt-5" : "mt-0"
                  }`}
                >
                  {isSaving ? copy.actions.saving : copy.actions.save}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
