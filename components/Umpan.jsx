"use client";

// Umpan balik antarmuka: toast (pesan singkat) dan dialog konfirmasi.
// Menggantikan alert/confirm bawaan browser agar tampilan seragam dan bisa dipakai dengan keyboard.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

const UmpanContext = createContext(null);

export function useUmpan() {
  const ctx = useContext(UmpanContext);
  if (!ctx) throw new Error("useUmpan harus dipakai di dalam UmpanProvider");
  return ctx;
}

const GAYA_TOAST = {
  sukses: { ikon: CheckCircle2, cls: "border-emerald-400/40 text-emerald-200" },
  galat: { ikon: XCircle, cls: "border-red-400/40 text-red-200" },
  info: { ikon: Info, cls: "border-bola/40 text-garis" },
};

export function UmpanProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const tutupToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (pesan, jenis = "sukses") => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-2), { id, pesan, jenis }]);
      setTimeout(() => tutupToast(id), 4500);
    },
    [tutupToast]
  );

  // konfirmasi({ judul, isi, tombol, bahaya }) -> Promise<boolean>
  const konfirmasi = useCallback(
    (opsi) => new Promise((resolve) => setDialog({ ...opsi, resolve })),
    []
  );

  function jawab(nilai) {
    dialog?.resolve(nilai);
    setDialog(null);
  }

  return (
    <UmpanContext.Provider value={{ toast, konfirmasi }}>
      {children}

      <div
        className="fixed z-50 bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 flex flex-col gap-2 sm:w-96 print:hidden"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const g = GAYA_TOAST[t.jenis] ?? GAYA_TOAST.info;
            const Ikon = g.ikon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={`flex items-start gap-3 rounded-xl border bg-pitch-950/95 backdrop-blur px-4 py-3 shadow-2xl shadow-black/40 ${g.cls}`}
                role="status"
              >
                <Ikon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-garis flex-1">{t.pesan}</p>
                <button onClick={() => tutupToast(t.id)} className="text-redup hover:text-garis" aria-label="Tutup pesan">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>{dialog && <Dialog key="dialog" {...dialog} onJawab={jawab} />}</AnimatePresence>
    </UmpanContext.Provider>
  );
}

function Dialog({ judul, isi, tombol = "Ya, lanjutkan", batal = "Batal", bahaya = false, onJawab }) {
  const tombolRef = useRef(null);

  useEffect(() => {
    tombolRef.current?.focus();
    const tekan = (e) => e.key === "Escape" && onJawab(false);
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [onJawab]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={() => onJawab(false)} aria-hidden="true" />
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-judul"
        aria-describedby="dialog-isi"
        className="relative w-full max-w-md card !bg-pitch-800 !p-6 shadow-2xl shadow-black/50"
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="flex gap-4">
          <span
            className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
              bahaya ? "bg-red-400/15 text-red-300" : "bg-bola/15 text-bola"
            }`}
          >
            {bahaya ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </span>
          <div>
            <h2 id="dialog-judul" className="font-display text-2xl font-semibold leading-tight">
              {judul}
            </h2>
            {isi && (
              <p id="dialog-isi" className="text-redup mt-1.5">
                {isi}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
          <button className="btn-outline" onClick={() => onJawab(false)}>
            {batal}
          </button>
          <button
            ref={tombolRef}
            className={bahaya ? "btn-primary !bg-red-400 hover:!bg-red-300" : "btn-primary"}
            onClick={() => onJawab(true)}
          >
            {tombol}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
