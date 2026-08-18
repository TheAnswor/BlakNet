"use client";

import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string | null;
  onChange: (dataUri: string | null) => void;
  label?: string;
  aspect?: "square" | "wide";
  className?: string;
  maxMb?: number;
}

export function ImageUpload({
  value,
  onChange,
  label = "Upload image",
  aspect = "square",
  className,
  maxMb = 2.5,
}: ImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > maxMb * 1_000_000) {
      toast({
        title: "Image too large",
        description: `Choose an image under ${maxMb}MB.`,
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      const dataUri = await fileToDataUri(file);
      onChange(dataUri);
    } catch {
      toast({ title: "Could not read file", variant: "destructive" });
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted",
          aspect === "square" ? "h-16 w-16" : "h-16 w-28",
        )}
      >
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground/20">
            <Camera className="h-5 w-5" />
          </div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-cream backdrop-blur-sm transition-colors hover:bg-ink"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
            </>
          ) : value ? (
            "Change"
          ) : (
            <>
              <Camera className="h-3.5 w-3.5" /> {label}
            </>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground">JPG/PNG up to {maxMb}MB</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
