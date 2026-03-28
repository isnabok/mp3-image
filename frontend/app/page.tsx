"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";

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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

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

const FIELD_CONFIG: Array<{
  key: keyof Pick<
    MetadataForm,
    "outputFilename" | "title" | "artist" | "album" | "genre" | "year" | "track"
  >;
  label: string;
  placeholder: string;
}> = [
  { key: "outputFilename", label: "Имя файла", placeholder: "artist-title.mp3" },
  { key: "title", label: "Название", placeholder: "Например, Midnight Drive" },
  { key: "artist", label: "Исполнитель", placeholder: "Имя артиста" },
  { key: "album", label: "Альбом", placeholder: "Название альбома" },
  { key: "genre", label: "Жанр", placeholder: "House, Pop, Rock..." },
  { key: "year", label: "Год", placeholder: "2026" },
  { key: "track", label: "Трек", placeholder: "1/12" },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Произошла неизвестная ошибка.";
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
  const [status, setStatus] = useState(
    "Перетащите MP3 в область ниже или выберите файл с компьютера.",
  );
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localCoverPreviewUrl, setLocalCoverPreviewUrl] = useState<string | null>(null);

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
    resetCoverPreview();
    setIsReading(true);
    setStatus(`Читаем теги из ${selectedFile.name}...`);

    try {
      const payload = new FormData();
      payload.append("mp3_file", selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/v1/mp3/read`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail ?? "Не удалось прочитать MP3-файл.");
      }

      const data = (await response.json()) as MP3MetadataResponse;
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
      setStatus("Файл загружен. Можно редактировать теги и обложку.");
    } catch (readError) {
      setMp3File(null);
      setMetadata(null);
      setForm(EMPTY_FORM);
      setError(getErrorMessage(readError));
      setStatus("Не удалось загрузить метаданные.");
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
    setStatus(`Новая обложка выбрана: ${selectedFile.name}`);
    event.target.value = "";
  };

  const handleSave = async () => {
    if (!mp3File) {
      setError("Сначала выберите MP3-файл.");
      return;
    }

    setIsSaving(true);
    setError("");
    setStatus("Сохраняем обновленный файл...");

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

      const response = await fetch(`${API_BASE_URL}/api/v1/mp3/update`, {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail ?? "Не удалось сохранить обновленный MP3.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const disposition = response.headers.get("content-disposition");
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

      setStatus("Готово. Обновленный MP3 скачивается.");
    } catch (saveError) {
      setError(getErrorMessage(saveError));
      setStatus("Не удалось сохранить обновленный файл.");
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
                MP3 Cover Editor
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div className="mx-auto mt-12 max-w-[920px] text-center md:mt-16">
            <h1 className="text-4xl font-bold leading-tight text-[var(--foreground)] md:text-6xl md:leading-tight xl:text-7xl xl:leading-tight">
              Загружайте MP3, редактируйте ID3-теги и добавляйте новую обложку.
            </h1>
            <p className="mx-auto mt-6 max-w-[760px] text-base leading-8 text-[var(--muted)] md:text-lg">
              Интерфейс построен на визуальной основе шаблона `startup-nextjs-main`,
              но заточен под одну задачу: быстро открыть MP3, изменить метаданные и
              скачать обновленный файл под новым именем.
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
                {isReading ? "Читаем метаданные..." : "Перетащите MP3 сюда"}
              </h2>
              <p className="relative z-10 mt-4 max-w-[680px] text-base leading-7 text-[var(--muted)] md:text-lg">
                Или нажмите на эту область, чтобы выбрать файл на компьютере.
                После загрузки ниже откроются все поля редактирования.
              </p>
              <span className="relative z-10 mt-8 inline-flex rounded-sm bg-[var(--accent)] px-8 py-4 text-base font-semibold text-white transition duration-300 group-hover:bg-[var(--accent-strong)]">
                Выбрать MP3
              </span>
            </button>

            <div className="mx-auto mt-8 max-w-[800px] text-center">
              <p className="text-sm leading-7 text-[var(--muted)] md:text-base">
                1. Загрузите один MP3-файл.
                <br />
                2. Дождитесь чтения текущих тегов.
                <br />
                3. Измените имя файла, метаданные и обложку.
                <br />
                4. Скачайте готовый MP3.
              </p>
            </div>

            <div className="mx-auto mt-8 grid max-w-[980px] gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Статус
                </p>
                <p className="mt-2 text-base font-medium">{status}</p>
                {mp3File ? (
                  <p className="mt-2 text-sm text-[var(--muted)]">Текущий файл: {mp3File.name}</p>
                ) : null}
                {error ? (
                  <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
                ) : null}
              </div>
              <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  Предупреждения
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
                  <p className="mt-2 text-sm text-[var(--muted)]">Пока все чисто.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasLoadedFile ? (
        <section className="pb-14 md:pb-20">
          <div className="container-shell">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(13,24,45,0.05)] dark:shadow-none">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                  Обложка
                </p>
                <div className="mt-5 flex aspect-square max-w-[320px] items-center justify-center overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--surface-soft)]">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="MP3 cover preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="px-8 text-center text-sm leading-6 text-[var(--muted)]">
                      В этом файле пока нет встроенной обложки.
                    </div>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="rounded-sm border border-[var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Выбрать новую обложку
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-sm bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Сохранение..." : "Сохранить и скачать"}
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      MIME
                    </p>
                    <p className="mt-2 text-sm">
                      {metadata?.cover_mime_type ?? coverFile?.type ?? "нет"}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Новая картинка
                    </p>
                    <p className="mt-2 text-sm">{coverFile?.name ?? "не выбрана"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(13,24,45,0.05)] dark:shadow-none">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--muted)]">
                  Метаданные
                </p>
                <h2 className="mt-3 text-3xl font-semibold">Редактирование тегов</h2>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {FIELD_CONFIG.map((field) => (
                    <label
                      key={field.key}
                      className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                    >
                      <span className="text-sm font-medium text-[var(--muted)]">{field.label}</span>
                      <input
                        type="text"
                        name={field.key}
                        value={form[field.key]}
                        onChange={handleFieldChange}
                        placeholder={field.placeholder}
                        className="mt-3 w-full rounded-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                      />
                    </label>
                  ))}

                  <label className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 md:col-span-2">
                    <span className="text-sm font-medium text-[var(--muted)]">Комментарий</span>
                    <textarea
                      rows={5}
                      name="comment"
                      value={form.comment}
                      onChange={handleFieldChange}
                      placeholder="Текст комментария для ID3-тега COMM"
                      className="mt-3 w-full resize-none rounded-sm border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
