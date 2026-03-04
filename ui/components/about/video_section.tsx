'use client';
import { useState } from 'react';
import Image from 'next/image';

type Props = {
  videoId: string;
  posterSrc: string;
  title?: string;
  start?: number;
  className?: string;
};

export default function YouTubePoster({
  videoId,
  posterSrc,
  title = 'Reproducir video',
  start = 0,
  className = '',
}: Props) {
  const [playing, setPlaying] = useState(false);

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&playsinline=1&start=${start}`;

  return (
    <div className={`relative w-[85vw] lg:w-[75vw] aspect-video overflow-hidden rounded-md shadow-lg ${className}`}>
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative h-full w-full"
          aria-label={title}
        >
          <Image
            src={posterSrc}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-105">
              <svg
                width="40" height="40" viewBox="0 0 24 24" aria-hidden="true"
                className="translate-x-0.5 text-[#003366]"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
