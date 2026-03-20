"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const PHOTOS = [
  "/nuestra_historia/Cuadro 1 - Grupo Eusse.webp",
  "/nuestra_historia/Cuadro 2 - Grupo Eusse.webp",
  "/nuestra_historia/Cuadro 3 - Grupo Eusse.webp",
  "/nuestra_historia/Cuadro 4 - Grupo Eusse.webp",
  "/nuestra_historia/Cuadro 5 - Grupo Eusse.webp",
  "/nuestra_historia/Cuadro 6 - Grupo Eusse.webp",
  "/nuestra_historia/Cuadro 7 - Grupo Eusse.webp",
  "/nuestra_historia/Cuadro 8 - Grupo Eusse.webp",
  "/nuestra_historia/Cuadro 9 - Grupo Eusse.webp",
];

const total = PHOTOS.length;

function NavButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Imagen anterior" : "Imagen siguiente"}
      className={`absolute ${isPrev ? "left-3" : "right-3"} top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/35`}
    >
      {isPrev ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  );
}

export default function TimelineSection() {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent((i) => (i === 0 ? total - 1 : i - 1)), []);
  const next = useCallback(() => setCurrent((i) => (i === total - 1 ? 0 : i + 1)), []);

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next]);

  const triple = useMemo(() => {
    const p = current === 0 ? total - 1 : current - 1;
    const n = current === total - 1 ? 0 : current + 1;
    return [
      { src: PHOTOS[p], index: p },
      { src: PHOTOS[current], index: current },
      { src: PHOTOS[n], index: n },
    ];
  }, [current]);

  return (
    <section className="relative overflow-hidden bg-brand-900 px-6 py-16 rounded-2xl magnify-disable-reveal mx-auto max-w-6xl my-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-10 text-center"
      >
        <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">Nuestra Historia</h2>
      </motion.div>

      {/* Desktop — 3 images */}
      <div className="relative mx-auto hidden max-w-5xl lg:block">
        <div className="relative flex items-center justify-center gap-6 min-h-125">
          {triple.map(({ src, index }, idx) => (
            <motion.div
              key={`desktop-${index}`}
              animate={{ opacity: idx === 1 ? 1 : 0.6, scale: idx === 1 ? 1 : 0.9, y: idx === 1 ? 0 : 10 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              onClick={() => { if (idx === 0) prev(); if (idx === 2) next(); }}
              className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-white/10 shadow-2xl shadow-brand-950/40 ${
                idx === 1 ? "max-h-125 max-w-100" : "max-h-100 max-w-80 cursor-pointer"
              }`}
            >
              <Image src={src} alt={`Nuestra historia ${index + 1}`} width={0} height={0}
                className="h-auto w-auto max-h-full max-w-full object-contain z-10"
                sizes="(max-width: 1024px) 50vw, 400px" style={{ width: "auto", height: "auto" }} priority
              />
              {idx !== 1 && <div className="absolute inset-0 bg-black/15 hover:bg-black/5 transition-colors duration-300 z-20" />}
            </motion.div>
          ))}
        </div>
        <NavButton direction="prev" onClick={prev} />
        <NavButton direction="next" onClick={next} />
      </div>

      {/* Mobile + Tablet — single image */}
      <div className="relative mx-auto lg:hidden">
        <div className="relative flex items-center justify-center px-4 md:px-0 min-h-[70vh] md:min-h-112.5">
          <motion.div
            key={`single-${current}`}
            initial={{ opacity: 0.8, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative flex items-center justify-center overflow-hidden rounded-xl bg-white/10 shadow-2xl shadow-brand-950/40 max-h-[70vh] md:max-h-112.5 w-full max-w-sm md:max-w-150"
          >
            <Image src={PHOTOS[current]} alt={`Nuestra historia ${current + 1}`} width={0} height={0}
              className="h-auto w-auto max-h-full max-w-full object-contain"
              sizes="(max-width: 768px) 90vw, 600px" style={{ width: "auto", height: "auto" }} priority
            />
          </motion.div>
        </div>
        <NavButton direction="prev" onClick={prev} />
        <NavButton direction="next" onClick={next} />
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {PHOTOS.map((_, i) => (
          <button key={i} type="button" onClick={() => setCurrent(i)} aria-label={`Ir a imagen ${i + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${current === i ? "w-8 bg-white" : "w-2.5 bg-white/50 hover:bg-white/75"}`}
          />
        ))}
      </div>
    </section>
  );
}


