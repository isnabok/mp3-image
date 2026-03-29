"use client"

import { useCallback, useRef, useState } from "react"
import { ImagePlus, Trash2, RefreshCw } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface CoverEditorProps {
  coverUrl: string | null
  onCoverChange: (file: File | null) => void
}

export function CoverEditor({ coverUrl, onCoverChange }: CoverEditorProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
      if (file && file.type.startsWith("image/")) {
        onCoverChange(file)
      }
    },
    [onCoverChange]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onCoverChange(file)
      }
    },
    [onCoverChange]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Обложка альбома</h3>
        {coverUrl && (
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Заменить
            </button>
            <button
              onClick={() => onCoverChange(null)}
              className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Удалить
            </button>
          </div>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !coverUrl && inputRef.current?.click()}
        className={cn(
          "relative aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden transition-all",
          !coverUrl && "cursor-pointer",
          isDragOver ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
          !coverUrl && "border-2 border-dashed border-border hover:border-primary/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="sr-only"
        />

        {coverUrl ? (
          <div className="relative w-full h-full group">
            <Image
              src={coverUrl}
              alt="Album cover"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-3">
              <ImagePlus className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Добавить обложку</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG до 5MB</p>
          </div>
        )}
      </div>
    </div>
  )
}
