"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Music,
  User,
  Disc,
  Calendar,
  Hash,
  Layers,
  Tag,
  FileText,
} from "lucide-react"

export interface MetadataFields {
  title: string
  artist: string
  album: string
  year: string
  track: string
  genre: string
  composer: string
  comment: string
}

interface MetadataFormProps {
  metadata: MetadataFields
  onChange: (field: keyof MetadataFields, value: string) => void
}

const fields: {
  key: keyof MetadataFields
  label: string
  placeholder: string
  icon: React.ElementType
}[] = [
  { key: "title", label: "Название трека", placeholder: "Введите название", icon: Music },
  { key: "artist", label: "Исполнитель", placeholder: "Имя исполнителя", icon: User },
  { key: "album", label: "Альбом", placeholder: "Название альбома", icon: Disc },
  { key: "year", label: "Год", placeholder: "2024", icon: Calendar },
  { key: "track", label: "Номер трека", placeholder: "1", icon: Hash },
  { key: "genre", label: "Жанр", placeholder: "Pop, Rock, Jazz...", icon: Layers },
  { key: "composer", label: "Композитор", placeholder: "Имя композитора", icon: Tag },
  { key: "comment", label: "Комментарий", placeholder: "Добавьте заметку", icon: FileText },
]

export function MetadataForm({ metadata, onChange }: MetadataFormProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Tag className="h-4 w-4 text-primary" />
        ID3 Теги
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, placeholder, icon: Icon }) => (
          <div key={key} className="space-y-2">
            <Label
              htmlFor={key}
              className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Label>
            <div className="relative">
              <Input
                id={key}
                value={metadata[key]}
                onChange={(e) => onChange(key, e.target.value)}
                placeholder={placeholder}
                className="h-11 bg-secondary/50 border-border/50 focus:border-primary focus:bg-secondary/80 transition-all pl-4"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
