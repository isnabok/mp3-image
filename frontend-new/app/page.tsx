"use client"

import { useState, useCallback } from "react"
import { Download, Sparkles, Zap, Music2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadZone } from "@/components/upload-zone"
import { CoverEditor } from "@/components/cover-editor"
import { MetadataForm, type MetadataFields } from "@/components/metadata-form"
import { ProgressBar } from "@/components/progress-bar"

const initialMetadata: MetadataFields = {
  title: "",
  artist: "",
  album: "",
  year: "",
  track: "",
  genre: "",
  composer: "",
  comment: "",
}

export default function MP3Editor() {
  const [file, setFile] = useState<File | null>(null)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<MetadataFields>(initialMetadata)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          // Simulate extracting metadata from file
          setMetadata({
            title: selectedFile.name.replace(".mp3", ""),
            artist: "",
            album: "",
            year: new Date().getFullYear().toString(),
            track: "1",
            genre: "",
            composer: "",
            comment: "",
          })
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)
  }, [])

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setCoverUrl(null)
    setCoverFile(null)
    setMetadata(initialMetadata)
    setUploadProgress(0)
    setIsUploading(false)
  }, [])

  const handleCoverChange = useCallback((coverImage: File | null) => {
    if (coverImage) {
      setCoverFile(coverImage)
      const url = URL.createObjectURL(coverImage)
      setCoverUrl(url)
    } else {
      setCoverFile(null)
      if (coverUrl) {
        URL.revokeObjectURL(coverUrl)
      }
      setCoverUrl(null)
    }
  }, [coverUrl])

  const handleMetadataChange = useCallback(
    (field: keyof MetadataFields, value: string) => {
      setMetadata((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSave = useCallback(() => {
    if (!file) return

    setIsDownloading(true)
    setDownloadProgress(0)

    // Simulate download/save progress
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            setIsDownloading(false)
            setDownloadProgress(0)
            // Create a mock download
            const blob = new Blob([file], { type: "audio/mpeg" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = metadata.title
              ? `${metadata.title}.mp3`
              : file.name
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }, 500)
          return 100
        }
        return prev + Math.random() * 12
      })
    }, 100)
  }, [file, metadata.title])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Music2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">MP3 Tag Editor</h1>
              <p className="text-xs text-muted-foreground">Редактор метаданных</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Pro Mode
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Upload Section */}
        {!file && (
          <div className="mb-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2 text-balance">
                Редактируйте теги MP3 файлов
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto text-pretty">
                Загрузите аудиофайл, измените метаданные и обложку, затем скачайте обновлённый файл
              </p>
            </div>
            <UploadZone
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              currentFile={file}
              onRemove={handleRemoveFile}
            />

            {/* Features */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Zap, title: "Быстрая обработка", desc: "Мгновенное редактирование тегов" },
                { icon: Music2, title: "8 ID3 тегов", desc: "Название, исполнитель, жанр..." },
                { icon: Sparkles, title: "Обложки альбомов", desc: "Добавляйте и меняйте арт" },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-border/50 bg-card/30 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor Section */}
        {file && !isUploading && (
          <div className="space-y-6">
            {/* File Info Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/30 p-4">
              <UploadZone
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                currentFile={file}
                onRemove={handleRemoveFile}
              />
            </div>

            {/* Main Editor Grid */}
            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              {/* Left Column - Cover Art */}
              <div className="rounded-xl border border-border/50 bg-card/30 p-5">
                <CoverEditor coverUrl={coverUrl} onCoverChange={handleCoverChange} />
              </div>

              {/* Right Column - Metadata Form */}
              <div className="rounded-xl border border-border/50 bg-card/30 p-5">
                <MetadataForm metadata={metadata} onChange={handleMetadataChange} />
              </div>
            </div>

            {/* Download Section */}
            <div className="rounded-xl border border-border/50 bg-card/30 p-5">
              {isDownloading ? (
                <ProgressBar
                  progress={Math.min(100, Math.round(downloadProgress))}
                  label="Подготовка файла к скачиванию..."
                  variant="download"
                />
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-foreground">Готово к сохранению</h3>
                    <p className="text-sm text-muted-foreground">
                      Нажмите кнопку, чтобы скачать файл с обновлёнными тегами
                    </p>
                  </div>
                  <Button
                    onClick={handleSave}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-primary-foreground gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Скачать MP3
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            MP3 Tag Editor — современный редактор метаданных аудиофайлов
          </p>
        </div>
      </footer>
    </div>
  )
}
