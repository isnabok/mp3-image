"use client";

import { ChangeEvent, DragEvent, ReactNode, useEffect, useRef, useState } from "react";

import { AudioWavePlayer } from "@/components/audio-wave-player";
import { ContentLinks, type ContentLinkItem } from "@/components/content-links";
import { MobileContentMenu } from "@/components/mobile-content-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatMessage, siteMessages } from "@/lib/i18n";
import Link from "next/link";

type BatchMetadataForm = {
  outputFilename: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: string;
  track: string;
  comment: string;
};

type BatchItem = {
  id: string;
  file: File;
  form: BatchMetadataForm;
  coverFile: File | null;
  coverPreviewUrl: string | null;
  status: string;
  isExpanded: boolean;
};

type BatchEditorProps = {
  headerPages: ContentLinkItem[];
  footerPages: ContentLinkItem[];
};

const copy = siteMessages;
const FIELD_KEYS = [
  "outputFilename",
  "title",
  "artist",
  "album",
  "genre",
  "year",
  "track",
] as const;

const batchCopy =
  copy.lang === "ru"
    ? {
        eyebrow: "Batch editor",
        title: "Пакетное редактирование нескольких MP3",
        description:
          "Это фронтовый прототип отдельной страницы мультизагрузки. Здесь можно проверить сценарий очереди, раскрывающихся блоков, локальной обложки и индивидуального скачивания без подключения batch-backend.",
        backToSingle: "К редактору одного файла",
        dropzoneIdle: "Перетащите несколько MP3 сюда",
        dropzoneDescription:
          "Можно загрузить сразу несколько файлов и посмотреть, как будет работать пакетный режим: очередь, раскрытие карточек, локальная обложка и отдельное скачивание.",
        dropzoneSupport: "Поддерживается множественная загрузка MP3",
        prototypeTitle: "Frontend prototype",
        prototypeDescription:
          "На этой странице пока нет реальной пакетной обработки на backend. Метаданные и сохранение работают как интерфейсная симуляция для настройки UX.",
        queueTitle: "Очередь файлов",
        queueDescription:
          "У каждого MP3 свой раскрывающийся блок с метаданными, локальной обложкой, плеером и отдельным действием скачивания.",
        emptyTitle: "Очередь пока пустая",
        emptyDescription:
          "Добавьте несколько MP3, чтобы проверить пакетный интерфейс и порядок блоков.",
        countLabel: "Файлов в очереди",
        addMore: "Добавить еще MP3",
        clearAll: "Очистить очередь",
        expand: "Развернуть",
        collapse: "Свернуть",
        removeFromQueue: "Убрать из очереди",
        readyStatus: "Файл готов для редактирования в пакетном режиме.",
        currentFile: "Файл в очереди: {filename}",
        prototypeStatus: "Frontend-only preview. Поля и обложка пока живут только в интерфейсе.",
        coverLocalOnly: "Обложка выбрана локально. Batch-сохранение на backend пока не подключено.",
        coverRemoved: "Локальная обложка удалена из карточки.",
        mockSaved: "Mock download started. Пакетный backend пока не подключен."
      }
    : {
        eyebrow: "Batch editor",
        title: "Batch-edit multiple MP3 files",
        description:
          "This is a frontend-only prototype of the multi-upload page. Use it to validate the queue, accordion cards, local cover flow, and per-file download action before batch backend processing is connected.",
        backToSingle: "Back to single-file editor",
        dropzoneIdle: "Drop multiple MP3 files here",
        dropzoneDescription:
          "Upload several files at once to test the intended batch workflow: queue management, expandable cards, local cover preview, and per-file download controls.",
        dropzoneSupport: "Supports multiple MP3 uploads",
        prototypeTitle: "Frontend prototype",
        prototypeDescription:
          "This page does not call a batch backend yet. Metadata and saving are simulated so we can tune the UX and interaction model first.",
        queueTitle: "Batch queue",
        queueDescription:
          "Each MP3 gets its own expandable block with metadata fields, local cover controls, a player, and an individual download action.",
        emptyTitle: "The queue is empty",
        emptyDescription:
          "Add a few MP3 files to inspect the batch interface and the per-file editing flow.",
        countLabel: "Files in queue",
        addMore: "Add more MP3s",
        clearAll: "Clear queue",
        expand: "Expand",
        collapse: "Collapse",
        removeFromQueue: "Remove from queue",
        readyStatus: "File is ready for editing in batch mode.",
        currentFile: "Queued file: {filename}",
        prototypeStatus: "Frontend-only preview. Fields and cover changes are currently local to the interface.",
        coverLocalOnly: "Cover image is selected locally. Batch backend saving is not connected yet.",
        coverRemoved: "Local cover preview removed from this card.",
        mockSaved: "Mock download started. Batch backend processing is not connected yet."
      };

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function getBaseName(filename: string) {
  return filename.replace(/\.mp3$/i, "").trim() || filename;
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

function createInitialForm(file: File): BatchMetadataForm {
  const baseName = getBaseName(file.name);

  return {
    outputFilename: `${baseName}-updated.mp3`,
    title: baseName,
    artist: "",
    album: "",
    genre: "",
    year: "",
    track: "",
    comment: "",
  };
}

function SectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={joinClasses(
        "rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_48px_var(--surface-shadow)] backdrop-blur-xl md:p-7",
        className,
      )}
    >
      {children}
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

function MusicIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={joinClasses(className, "fill-none stroke-current")} strokeWidth="1.8">
      <circle cx="8" cy="18" r="4" />
      <path d="M12 18V2l7 4" />
    </svg>
  );
}

function UploadIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={joinClasses(className, "fill-none stroke-current")} strokeWidth="1.9">
      <path d="M12 15V4.5" strokeLinecap="round" />
      <path d="m7.5 9 4.5-4.5L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 17.5v1a1.5 1.5 0 0 0 1.5 1.5h9a1.5 1.5 0 0 0 1.5-1.5v-1" strokeLinecap="round" />
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

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M6 6 18 18" strokeLinecap="round" />
      <path d="M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={joinClasses("h-5 w-5 fill-none stroke-current transition-transform", open && "rotate-180")}
      strokeWidth="1.8"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BatchEditor({ headerPages, footerPages }: BatchEditorProps) {
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<BatchItem[]>([]);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        if (item.coverPreviewUrl) {
          URL.revokeObjectURL(item.coverPreviewUrl);
        }
      }
    };
  }, []);

  const appendFiles = (fileList: FileList | File[]) => {
    const nextFiles = Array.from(fileList).filter(
      (file) => file.name.toLowerCase().endsWith(".mp3") || file.type === "audio/mpeg",
    );

    if (nextFiles.length === 0) {
      return;
    }

    setItems((current) => {
      const shouldAutoExpand = current.length === 0;

      return [
        ...current,
        ...nextFiles.map((file, index) => ({
          id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
          file,
          form: createInitialForm(file),
          coverFile: null,
          coverPreviewUrl: null,
          status: batchCopy.readyStatus,
          isExpanded: shouldAutoExpand && index === 0,
        })),
      ];
    });
  };

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      appendFiles(event.target.files);
      event.target.value = "";
    }
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (event.dataTransfer.files?.length) {
      appendFiles(event.dataTransfer.files);
    }
  };

  const updateItem = (itemId: string, updater: (item: BatchItem) => BatchItem) => {
    setItems((current) =>
      current.map((item) => (item.id === itemId ? updater(item) : item)),
    );
  };

  const handleFieldChange = (
    itemId: string,
    field: keyof BatchMetadataForm,
    value: string,
  ) => {
    updateItem(itemId, (item) => ({
      ...item,
      form: {
        ...item.form,
        [field]: value,
      },
    }));
  };

  const toggleExpanded = (itemId: string) => {
    updateItem(itemId, (item) => ({
      ...item,
      isExpanded: !item.isExpanded,
    }));
  };

  const removeItem = (itemId: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === itemId);
      if (target?.coverPreviewUrl) {
        URL.revokeObjectURL(target.coverPreviewUrl);
      }

      return current.filter((item) => item.id !== itemId);
    });
  };

  const clearAll = () => {
    for (const item of itemsRef.current) {
      if (item.coverPreviewUrl) {
        URL.revokeObjectURL(item.coverPreviewUrl);
      }
    }

    setItems([]);
  };

  const handleCoverSelect = (itemId: string, file: File | null) => {
    if (!file) {
      return;
    }

    updateItem(itemId, (item) => {
      if (item.coverPreviewUrl) {
        URL.revokeObjectURL(item.coverPreviewUrl);
      }

      return {
        ...item,
        coverFile: file,
        coverPreviewUrl: URL.createObjectURL(file),
        status: batchCopy.coverLocalOnly,
      };
    });
  };

  const handleCoverRemove = (itemId: string) => {
    updateItem(itemId, (item) => {
      if (item.coverPreviewUrl) {
        URL.revokeObjectURL(item.coverPreviewUrl);
      }

      return {
        ...item,
        coverFile: null,
        coverPreviewUrl: null,
        status: batchCopy.coverRemoved,
      };
    });
  };

  const handleMockDownload = async (item: BatchItem) => {
    const objectUrl = URL.createObjectURL(item.file);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = item.form.outputFilename.trim() || item.file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);

    updateItem(item.id, (current) => ({
      ...current,
      status: batchCopy.mockSaved,
    }));
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.14),transparent_36%),var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-surface)] backdrop-blur-xl">
        <div className="container-shell flex h-[70px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))] text-[var(--accent-contrast)] shadow-[0_10px_24px_var(--accent-glow)]"
              aria-label={copy.header.title}
            >
              <MusicIcon className="h-4.5 w-4.5" />
            </Link>
            <Link href="/" className="block transition hover:text-[var(--accent)]">
              <p className="text-[0.95rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.15rem]">
                {copy.header.title}
              </p>
              <p className="mt-0.5 text-[0.68rem] text-[var(--muted)] md:text-[0.74rem]">
                {copy.header.subtitle}
              </p>
            </Link>
          </div>

          <div className="flex items-center justify-end gap-3">
            <ThemeToggle label={copy.actions.toggleTheme} />
            <MobileContentMenu pages={headerPages} />
          </div>
        </div>
      </header>

      <section className="relative py-10 md:py-12">
        <div className="container-shell">
          <div className="mx-auto max-w-[1180px] space-y-6">
            <div className="space-y-4 text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                {batchCopy.eyebrow}
              </p>
              <h1 className="mx-auto max-w-[900px] text-[2rem] font-semibold tracking-[-0.04em] text-[var(--foreground)] md:text-[3.15rem]">
                {batchCopy.title}
              </h1>
              <p className="mx-auto max-w-[820px] text-[0.98rem] leading-8 text-[var(--muted)] md:text-[1.05rem]">
                {batchCopy.description}
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-[0.82rem] font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {batchCopy.backToSingle}
                </Link>
                <span className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-[0.82rem] text-[var(--muted)]">
                  {batchCopy.countLabel}: {items.length}
                </span>
              </div>
            </div>

            <SectionCard className="border-[var(--warning-soft)]/80 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--warning-soft)_58%,transparent),var(--surface))]">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)]">
                  <TagsIcon />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                    {batchCopy.prototypeTitle}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                    {batchCopy.prototypeDescription}
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".mp3,audio/mpeg"
                multiple
                className="hidden"
                onChange={handleUploadChange}
              />

              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={joinClasses(
                  "upload-dropzone relative w-full overflow-hidden rounded-[30px] border border-[var(--border)] bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--accent-glow)_45%,transparent),transparent_34%),var(--surface)] px-6 py-10 text-left transition",
                  isDragging && "is-dragging",
                )}
                data-dragging={isDragging}
              >
                <div className="relative z-[1] flex min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="flex h-[88px] w-[88px] items-center justify-center rounded-[24px] border border-[color:var(--accent-glow)] bg-[var(--accent-glow)] text-[var(--accent)] shadow-[0_18px_40px_var(--accent-glow)]">
                    <UploadIcon className="h-9 w-9" />
                  </div>

                  <h2 className="mt-6 text-[1.55rem] font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[1.9rem]">
                    {batchCopy.dropzoneIdle}
                  </h2>
                  <p className="mt-4 max-w-[760px] text-[0.95rem] leading-8 text-[var(--muted)]">
                    {batchCopy.dropzoneDescription}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-[0.78rem] text-[var(--muted)]">
                    <MusicIcon className="h-4 w-4" />
                    {batchCopy.dropzoneSupport}
                  </span>
                </div>
              </button>
            </SectionCard>

            {items.length > 0 ? (
              <SectionCard>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                      {batchCopy.queueTitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {batchCopy.queueDescription}
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                    <button
                      type="button"
                      onClick={() => uploadInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--accent-glow)]"
                    >
                      <UploadIcon />
                      {batchCopy.addMore}
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-[linear-gradient(135deg,var(--danger),color-mix(in_oklab,var(--danger)_78%,black))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_var(--danger-soft)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--danger-soft)]"
                    >
                      <CloseIcon />
                      {batchCopy.clearAll}
                    </button>
                  </div>
                </div>
              </SectionCard>
            ) : (
              <SectionCard className="text-center">
                <p className="text-[1.1rem] font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                  {batchCopy.emptyTitle}
                </p>
                <p className="mx-auto mt-3 max-w-[660px] text-sm leading-7 text-[var(--muted)]">
                  {batchCopy.emptyDescription}
                </p>
              </SectionCard>
            )}

            <div className="space-y-5">
              {items.length > 0
                ? items.map((item, index) => {
                    const coverMimeType = item.coverFile?.type ?? copy.cover.none;
                    const coverName = item.coverFile?.name ?? copy.cover.notSelected;

                    return (
                      <SectionCard key={item.id} className="p-5 md:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="flex min-w-0 items-center gap-4">
                            <IconWrap>
                              <FileIcon />
                            </IconWrap>
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                                #{index + 1} · {copy.file.readyTitle}
                              </p>
                              <h2 className="mt-1 truncate text-[1.05rem] font-semibold tracking-[-0.02em] text-[var(--foreground)] md:text-[1.2rem]">
                                {item.file.name}
                              </h2>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-[0.74rem] text-[var(--muted)]">
                                  {copy.file.size}: {formatBytes(item.file.size)}
                                </span>
                                <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-[0.74rem] text-[var(--muted)]">
                                  MP3
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                            <button
                              type="button"
                              onClick={() => toggleExpanded(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            >
                              <ChevronIcon open={item.isExpanded} />
                              {item.isExpanded ? batchCopy.collapse : batchCopy.expand}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)] transition hover:bg-[color:color-mix(in_oklab,var(--danger-soft)_82%,transparent)]"
                            >
                              <CloseIcon />
                              {batchCopy.removeFromQueue}
                            </button>
                          </div>
                        </div>

                        {item.isExpanded ? (
                          <div className="mt-6 space-y-6">
                            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                              <div className="flex items-center gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-glow)] text-[var(--accent)]">
                                  <TagsIcon />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                                    {copy.status.panelTitle}
                                  </p>
                                  <p className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
                                    {item.status}
                                  </p>
                                  <p className="mt-2 text-sm text-[var(--muted)]">
                                    {formatMessage(batchCopy.currentFile, { filename: item.file.name })}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--warning-soft)] text-[var(--warning)]">
                                  <CoverIcon />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                                    {copy.warnings.panelTitle}
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                                    {item.coverFile ? batchCopy.coverLocalOnly : batchCopy.prototypeStatus}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
                              <div className="space-y-4">
                                <div className="group relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface-soft)] lg:mx-0 lg:max-w-none">
                                  {item.coverPreviewUrl ? (
                                    <>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={item.coverPreviewUrl}
                                        alt={copy.cover.previewAlt}
                                        className="h-full w-full object-cover"
                                      />
                                      <div className="pointer-events-none absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                                      <button
                                        type="button"
                                        onClick={() => handleCoverRemove(item.id)}
                                        className="absolute inset-x-4 bottom-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-[var(--danger)] bg-black/20 px-4 py-2 text-sm font-medium text-[var(--danger)] opacity-0 backdrop-blur-sm transition group-hover:opacity-100 hover:bg-black/28"
                                      >
                                        <CloseIcon />
                                        {copy.actions.removeCover}
                                      </button>
                                    </>
                                  ) : (
                                    <div className="px-8 text-center text-sm leading-6 text-[var(--muted)]">
                                      {copy.cover.empty}
                                    </div>
                                  )}
                                </div>

                                <AudioWavePlayer file={item.file} />
                              </div>

                              <div className="space-y-6">
                                <div className="grid gap-3 xl:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,1fr)]">
                                  <div className="flex flex-col gap-3">
                                    <input
                                      id={`cover-input-${item.id}`}
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp"
                                      className="hidden"
                                      onChange={(event) =>
                                        handleCoverSelect(item.id, event.target.files?.[0] ?? null)
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        document.getElementById(`cover-input-${item.id}`)?.click()
                                      }
                                      className="inline-flex min-h-[78px] items-center justify-center gap-2 rounded-2xl border border-transparent bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--accent-glow)] xl:min-h-[86px]"
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
                                      {coverMimeType}
                                    </p>
                                  </div>

                                  <div className="flex min-h-[78px] flex-col justify-center rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 xl:min-h-[86px]">
                                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                      {copy.cover.newImage}
                                    </p>
                                    <p className="mt-2 break-all text-sm text-[var(--foreground)]">
                                      {coverName}
                                    </p>
                                  </div>
                                </div>

                                <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                                  <p className="text-[0.76rem] leading-5 text-[var(--muted)]">
                                    {copy.cover.instructions}
                                  </p>
                                </div>

                                <div>
                                  <div className="flex items-center gap-3">
                                    <IconWrap>
                                      <TagsIcon />
                                    </IconWrap>
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                                        {copy.metadata.panelTitle}
                                      </p>
                                      <h3 className="mt-1 text-[1.18rem] font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                                        {copy.metadata.title}
                                      </h3>
                                    </div>
                                  </div>

                                  <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                                          value={item.form[fieldKey]}
                                          onChange={(event) =>
                                            handleFieldChange(item.id, fieldKey, event.target.value)
                                          }
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
                                        value={item.form.comment}
                                        onChange={(event) =>
                                          handleFieldChange(item.id, "comment", event.target.value)
                                        }
                                        placeholder={copy.metadata.commentPlaceholder}
                                        className="mt-3 h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)]"
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)] p-5 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm leading-6 text-[var(--muted)]">
                                {batchCopy.prototypeStatus}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  void handleMockDownload(item);
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-6 py-3.5 text-sm font-semibold text-[var(--accent-contrast)] shadow-[0_16px_32px_var(--accent-glow)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_36px_var(--accent-glow)]"
                              >
                                <DownloadIcon />
                                {copy.actions.save}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </SectionCard>
                    );
                  })
                : null}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]/50 py-6">
        <div className="container-shell flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-[var(--muted)]">{copy.footer.text}</p>
          <ContentLinks pages={footerPages} linkClassName="text-xs" />
        </div>
      </footer>
    </main>
  );
}
