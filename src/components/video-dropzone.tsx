"use client";

import React, { useRef, useState } from "react";
import { TiDelete } from "react-icons/ti";
import { IoMdAdd } from "react-icons/io";
import { MdCloudUpload } from "react-icons/md";

export type VideoPreviewItem = string | { file: File; preview: string };

function getVideoSrc(item: VideoPreviewItem): string {
  return typeof item === "string" ? item : item.preview;
}

interface VideoDropzoneProps {
  previews: VideoPreviewItem[];
  onAdd: (files: File[]) => void;
  onDelete: (index: number) => void;
}

export function VideoDropzone({ previews, onAdd, onDelete }: VideoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onAdd(Array.from(files).filter((f) => f.type.startsWith("video/")));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => previews.length === 0 && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-colors
          ${isDragging
            ? "border-green-primary bg-green-primary/5"
            : "border-gray-200 bg-gray-50 hover:border-green-primary/50 hover:bg-green-primary/5"
          }
          ${previews.length === 0 ? "cursor-pointer" : ""}
        `}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-green-primary/10 z-10 pointer-events-none">
            <p className="font-semibold text-green-primary text-lg">Solte os vídeos aqui</p>
          </div>
        )}

        {previews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-gray-400 py-4">
            <MdCloudUpload size={40} />
            <p className="text-sm font-medium">
              Arraste vídeos aqui ou{" "}
              <span className="text-green-primary underline underline-offset-2">
                clique para selecionar
              </span>
            </p>
            <p className="text-xs">MP4, MOV, WEBM</p>
          </div>
        ) : (
          <div className="flex flex-row flex-wrap gap-4">
            {previews.map((item, index) => (
              <div key={index} className="relative w-[160px]">
                <button
                  type="button"
                  className="absolute top-0 right-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(index);
                  }}
                >
                  <TiDelete color="red" size={24} />
                </button>
                <video
                  src={getVideoSrc(item)}
                  className="w-[160px] h-[100px] object-cover border border-gray-200 rounded-md bg-black"
                  muted
                  playsInline
                  preload="metadata"
                />
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {typeof item === "string"
                    ? item.split("/").pop()
                    : item.file.name}
                </p>
              </div>
            ))}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="w-[160px] h-[100px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-green-primary hover:bg-green-primary/5 transition-colors"
            >
              <IoMdAdd size={28} color="#2c6e49" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
