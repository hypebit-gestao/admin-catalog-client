"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { TiDelete } from "react-icons/ti";
import { LuMoveLeft, LuMoveRight } from "react-icons/lu";
import { IoMdAdd } from "react-icons/io";
import { MdCloudUpload } from "react-icons/md";

export type ImagePreviewItem =
  | string
  | { file: File; preview: string };

function getSrc(item: ImagePreviewItem): string {
  return typeof item === "string" ? item : item.preview;
}

interface ImageDropzoneProps {
  id?: string;
  previews: ImagePreviewItem[];
  onAdd: (files: File[]) => void;
  onDelete: (index: number) => void;
  onMoveLeft: (index: number) => void;
  onMoveRight: (index: number) => void;
}

export function ImageDropzone({
  id = "image-dropzone",
  previews,
  onAdd,
  onDelete,
  onMoveLeft,
  onMoveRight,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onAdd(Array.from(files).filter((f) => f.type.startsWith("image/")));
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
      {/* Hidden file input */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
      />

      {/* Drop zone */}
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
            <p className="font-semibold text-green-primary text-lg">
              Solte as imagens aqui
            </p>
          </div>
        )}

        {previews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-gray-400 py-4">
            <MdCloudUpload size={40} />
            <p className="text-sm font-medium">
              Arraste imagens aqui ou{" "}
              <span className="text-green-primary underline underline-offset-2">
                clique para selecionar
              </span>
            </p>
            <p className="text-xs">PNG, JPG, WEBP</p>
          </div>
        ) : (
          <div className="flex flex-row flex-wrap gap-4">
            {previews.map((item, index) => (
              <div key={index} className="relative w-[100px]">
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
                <div className="flex flex-col items-center">
                  <Image
                    className="w-[100px] h-[100px] object-cover border border-gray-200 rounded-md"
                    src={getSrc(item)}
                    alt={`Imagem ${index + 1}`}
                    width={100}
                    height={100}
                  />
                  <div className="flex gap-1 mt-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveLeft(index);
                        }}
                        title="Mover para esquerda"
                      >
                        <LuMoveLeft size={20} color="#2c6e49" />
                      </button>
                    )}
                    {index < previews.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveRight(index);
                        }}
                        title="Mover para direita"
                      >
                        <LuMoveRight size={20} color="#2c6e49" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add more button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="w-[100px] h-[100px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-green-primary hover:bg-green-primary/5 transition-colors"
            >
              <IoMdAdd size={28} color="#2c6e49" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
