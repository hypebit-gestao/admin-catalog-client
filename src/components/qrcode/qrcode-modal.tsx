"use client";

import React, { useEffect, useRef, useState } from "react";
import Modal from "../modal";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import { useSession } from "next-auth/react";
import { useUserService } from "@/services/user.service";
import { User } from "@/models/user";
import { Button } from "../ui/button";
import { MdQrCode2, MdDownload, MdContentCopy } from "react-icons/md";
import toast from "react-hot-toast";
import Loader from "../loader";

// ── color utils ────────────────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(full);
  return r
    ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) }
    : null;
}

function luminance(hex: string | null | undefined): number {
  if (!hex) return 0;
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
}

function contrastColor(hex: string | null | undefined): "#ffffff" | "#0f172a" {
  return luminance(hex) > 0.179 ? "#0f172a" : "#ffffff";
}

function rgba(hex: string | null | undefined, opacity: number): string {
  if (!hex) return `rgba(15,23,42,${opacity})`;
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(15,23,42,${opacity})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})`;
}

function qrFgColor(bgColor: string | null | undefined): string {
  return luminance(bgColor) < 0.18 && bgColor ? bgColor : "#0f172a";
}
// ───────────────────────────────────────────────────────────────────────────

async function toBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-cache" });
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const CATALOG_BASE_URL = "https://www.catalogoplace.com.br";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeModal = ({ isOpen, onClose }: QRCodeModalProps) => {
  const { data: session } = useSession();
  const userService = useUserService();
  const [user, setUser] = useState<User | null>(null);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setLogoSrc(null);

    userService
      .GETBYID(session?.user?.user?.id, session?.user?.accessToken)
      .then(async (data) => {
        if (!data) return;
        setUser(data);
        if (data.image_url) {
          // Pré-converte para base64 para que html2canvas capture sem CORS
          const b64 = await toBase64(data.image_url);
          setLogoSrc(b64 ?? data.image_url);
        }
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  const storeUrl = `${CATALOG_BASE_URL}/${user?.person_link ?? ""}`;
  const bgColor = user?.background_color ?? "#0f172a";
  const fg = contrastColor(bgColor);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 3,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `qrcode-${user?.person_link ?? "loja"}.png`;
      link.click();
      toast.success("QR Code baixado com sucesso!");
    } catch {
      toast.error("Erro ao gerar a imagem.");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success("Link copiado!");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      personWidth="xl:w-[480px]"
      header={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 text-green-600">
            <MdQrCode2 size={24} />
          </div>
          <h1 className="text-[#2c6e49] font-bold text-xl">QR Code da Loja</h1>
        </div>
      }
      body={
        <div className="flex flex-col items-center gap-5">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader />
            </div>
          ) : (
            <>
              {/* ── Card exportável ── */}
              <div
                ref={cardRef}
                className="w-full rounded-2xl overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                {/* Topo: logo + nome */}
                <div className="flex flex-col items-center pt-8 pb-3 px-6">
                  {logoSrc ? (
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden border-2 mb-3 flex-shrink-0"
                      style={{ borderColor: rgba(fg, 0.25) }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoSrc}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                      style={{ backgroundColor: rgba(fg, 0.12) }}
                    >
                      <MdQrCode2 size={32} style={{ color: fg }} />
                    </div>
                  )}
                  <h2
                    className="text-lg font-bold text-center"
                    style={{ color: fg }}
                  >
                    {user?.name ?? "Minha Loja"}
                  </h2>
                </div>

                {/* QR Code — fundo sempre branco para leitura garantida */}
                <div className="flex justify-center px-6 py-4">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <QRCode
                      value={storeUrl}
                      size={176}
                      fgColor={qrFgColor(bgColor)}
                      bgColor="#ffffff"
                    />
                  </div>
                </div>

                {/* CTA + URL */}
                <div className="flex flex-col items-center pb-8 pt-3 px-6 gap-1">
                  <p
                    className="text-sm font-semibold text-center"
                    style={{ color: fg }}
                  >
                    Escaneie e veja nosso catálogo
                  </p>
                  <p
                    className="text-xs text-center"
                    style={{ color: rgba(fg, 0.55) }}
                  >
                    {storeUrl.replace("https://www.", "")}
                  </p>
                </div>
              </div>

              {/* ── Ações ── */}
              <div className="flex gap-3 w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCopyLink}
                >
                  <MdContentCopy size={16} />
                  Copiar link
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2"
                  onClick={handleDownload}
                >
                  <MdDownload size={16} />
                  Baixar PNG
                </Button>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Imprima ou compartilhe o QR Code para que clientes acessem sua loja diretamente pelo celular.
              </p>
            </>
          )}
        </div>
      }
    />
  );
};

export default QRCodeModal;
