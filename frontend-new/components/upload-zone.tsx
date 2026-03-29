"use client"

import { useCallback, useState } from "react"
import { Upload, Music2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
  uploadProgress: number
  currentFile: File | null
  onRemove: () => void
}

export function UploadZone({
  onFileSelect,
  isUploading,
  uploadProgress,
  currentFile,
  onRemove,
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file && file.type === "audio/mpeg") {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  if (currentFile) {
    return (
      <div className="relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
            <Music2 className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{currentFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={onRemove}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary hover:bg-destructive/20 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Загрузка...</span>
              <span className="text-primary font-medium">{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all cursor-pointer group",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-card/50"
      )}
    >
      <input
        type="file"
        accept="audio/mpeg,.mp3"
        onChange={handleFileInput}
        className="sr-only"
      />
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4 transition-transform group-hover:scale-110",
          isDragOver && "scale-110"
        )}
      >
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <p className="text-lg font-medium text-foreground mb-1">
        Перетащите MP3 файл сюда
      </p>
      <p className="text-sm text-muted-foreground">
        или нажмите для выбора файла
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-full bg-secondary/50 px-4 py-2">
        <Music2 className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">Поддерживается: MP3</span>
      </div>
    </label>
  )
}
