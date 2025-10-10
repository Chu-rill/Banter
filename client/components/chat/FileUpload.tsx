"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadApi } from "@/lib/api";
import { cn, formatFileSize } from "@/lib/utils";

interface FileUploadProps {
  onFileUploaded: (file: {
    url: string;
    name: string;
    size: number;
    type: string;
  }) => void;
  onClose: () => void;
}

export default function FileUpload({
  onFileUploaded,
  onClose,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError("");
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const uploadedFile = await uploadApi.uploadFile(selectedFile);

      onFileUploaded(uploadedFile);
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      console.error("Upload error:", err);
      setError(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Upload Box */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-5 z-10 bg-black">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Upload a File</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
            {error}
          </p>
        )}

        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? "Drop your file here" : "Drag and drop file here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or{" "}
            <button
              type="button"
              onClick={open}
              className="text-primary hover:underline"
            >
              browse files
            </button>
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between border p-3 rounded-md">
            <p className="text-sm truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            className=" bg-red-500 hover:bg-red-600 hover:cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            className="bg-green-500 hover:bg-green-600 hover:cursor-pointer"
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}
