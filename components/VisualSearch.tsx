"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Camera,
  Upload,
  X,
  Search,
  ImageIcon,
  Loader2,
  ScanSearch,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Product } from "@/lib/types";

interface VisualSearchProps {
  onClose: () => void;
}

type Tab = "upload" | "camera";
type SearchState = "idle" | "searching" | "done";
type Match = Product & { similarity: number };

export default function VisualSearch({ onClose }: VisualSearchProps) {
  const [tab, setTab] = useState<Tab>("upload");
  const [preview, setPreview] = useState<string | null>(null);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [results, setResults] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ── cleanup camera on unmount / tab switch ── */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    if (tab !== "camera") stopCamera();
  }, [tab, stopCamera]);

  /* ── start camera ── */
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setPreview(null);
    } catch {
      setCameraError("Kamera erişimi reddedildi. Lütfen kamera izinlerine onay verip tekrar deneyin.");
    }
  };

  /* ── capture frame ── */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.92);
    setPreview(dataUrl);
    stopCamera();
  };

  /* ── file upload ── */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  /* ── real search: send the image to the Python CLIP server via our API ── */
  const handleSearch = async () => {
    if (!preview) return;
    setSearchState("searching");
    setError(null);
    setResults([]);
    try {
      const res = await fetch("/api/visual-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Görsel arama başarısız oldu.");
      setResults((data.products ?? []).filter((p: Match) => p && p.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Görsel arama başarısız oldu.");
    } finally {
      setSearchState("done");
    }
  };

  const reset = () => {
    setPreview(null);
    setSearchState("idle");
    setResults([]);
    setError(null);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Blurred dark backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg animate-fade-in-up">
        {/* Glow border wrapper */}
        <div className="relative rounded-3xl p-px" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.5), rgba(59,130,246,0.3), rgba(139,92,246,0.4))" }}>
          <div className="glass rounded-3xl overflow-hidden" style={{ background: "#0d1424" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
                  <ScanSearch className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base leading-none">Görsel Arama</h2>
                  <p className="text-slate-500 text-xs mt-0.5">Görsel veya kamera ile ara</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-3 mx-6 mt-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              {(["upload", "camera"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); reset(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    tab === t
                      ? "gradient-brand text-white shadow-lg shadow-cyan-500/20"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]"
                  }`}
                >
                  {t === "upload" ? <Upload className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                  {t === "upload" ? "Görsel Yükle" : "Canlı Kamera"}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="p-6 pt-4">
              {/* ── UPLOAD TAB ── */}
              {tab === "upload" && (
                <div>
                  {!preview ? (
                    <div
                      className="relative border-2 border-dashed border-white/[0.12] rounded-2xl p-10 text-center cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/[0.03] transition-all duration-300 group"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <div className="w-14 h-14 rounded-2xl glass-light flex items-center justify-center mx-auto mb-4 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all">
                        <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <p className="text-white font-semibold mb-1">Görseli buraya bırakın</p>
                      <p className="text-slate-500 text-sm">veya dosya seçmek için tıklayın</p>
                      <p className="text-slate-600 text-xs mt-3">PNG, JPG, WEBP — en fazla 10MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFile}
                      />
                    </div>
                  ) : (
                    <PreviewSection
                      preview={preview}
                      searchState={searchState}
                      results={results}
                      error={error}
                      onSearch={handleSearch}
                      onReset={reset}
                      onClose={onClose}
                    />
                  )}
                </div>
              )}

              {/* ── CAMERA TAB ── */}
              {tab === "camera" && (
                <div>
                  {cameraError && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm text-center">
                      {cameraError}
                    </div>
                  )}

                  {!preview && (
                    <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/[0.07]" style={{ aspectRatio: "16/9" }}>
                      <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${cameraActive ? "opacity-100" : "opacity-0"}`}
                        muted
                        playsInline
                        autoPlay
                      />
                      {!cameraActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                          <div className="w-16 h-16 rounded-2xl glass-light flex items-center justify-center">
                            <Camera className="w-7 h-7 text-slate-400" />
                          </div>
                          <p className="text-slate-400 text-sm">Kamera önizlemesi burada görünecek</p>
                          <button
                            onClick={startCamera}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-semibold hover:opacity-90 hover:scale-105 transition-all"
                          >
                            <Camera className="w-4 h-4" /> Kamerayı Başlat
                          </button>
                        </div>
                      )}
                      {/* Scan overlay */}
                      {cameraActive && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-6 rounded-xl border-2 border-cyan-400/60" />
                          <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-cyan-400 rounded-tl" />
                          <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-cyan-400 rounded-tr" />
                          <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-cyan-400 rounded-bl" />
                          <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-cyan-400 rounded-br" />
                          <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-line" />
                        </div>
                      )}
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />

                  {!preview ? (
                    cameraActive && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={capturePhoto}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 hover:scale-[1.02] transition-all"
                        >
                          <Camera className="w-4 h-4" /> Fotoğraf Çek
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-4 py-3 rounded-xl glass-light text-slate-400 hover:text-white transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="mt-4">
                      <PreviewSection
                        preview={preview}
                        searchState={searchState}
                        results={results}
                        error={error}
                        onSearch={handleSearch}
                        onReset={reset}
                        onClose={onClose}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Preview + Search sub-component ───────────────────────── */
function PreviewSection({
  preview,
  searchState,
  results,
  error,
  onSearch,
  onReset,
  onClose,
}: {
  preview: string;
  searchState: SearchState;
  results: Match[];
  error: string | null;
  onSearch: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Önizleme" className="w-full object-cover max-h-52" />
        <button
          onClick={onReset}
          className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {searchState === "idle" && (
        <button
          onClick={onSearch}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-brand text-white font-semibold hover:opacity-90 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-200"
        >
          <Search className="w-4 h-4" /> Görselle Ara
        </button>
      )}

      {searchState === "searching" && (
        <div className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span className="text-sm font-medium">Görsel analiz ediliyor…</span>
        </div>
      )}

      {searchState === "done" && (
        <div className="space-y-3">
          {error ? (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm font-medium">
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-300 text-sm font-medium text-center">
              Benzer ürün bulunamadı. Başka bir görsel deneyin.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {results.length} benzer ürün bulundu
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    href={`/product/${p.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-cyan-500/40 hover:bg-cyan-500/[0.05] transition-all group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-white/5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-cyan-300 transition-colors">
                        {p.name}
                      </p>
                      <p className="text-slate-500 text-xs truncate">{p.category}</p>
                      <p className="text-cyan-400 text-sm font-semibold mt-0.5">
                        ₺{Number(p.price).toFixed(2)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
                      %{Math.round(p.similarity)} eşleşme
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
          <button
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl glass-light text-slate-400 hover:text-white text-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Başka bir görsel dene
          </button>
        </div>
      )}
    </div>
  );
}
