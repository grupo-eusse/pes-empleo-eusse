import VideoSection from "@/ui/components/about/video_section";
import VisionMission from "@/ui/components/about/vision_mision";
import ValuesSection from "@/ui/components/about/values_section";
import TimelineSection from "@/ui/components/about/timeline_section";
import Image from "next/image";
import { montserrat, montserratBold } from "@/ui/fonts";

export default function Home() {
  return (
    <div className="bg-brand-50 text-brand-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative h-[60vh] w-full">
          <Image
            src="/dron_naranjo.webp"
            alt="Equipo Eusse en operaciones"
            fill
            sizes="100vw"
            className="object-cover"
            fetchPriority="high"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-b from-brand-900/70 via-brand-800/60 to-brand-600/50" />
          <div className="relative mx-auto flex h-full max-w-5xl flex-col items-center justify-center gap-6 px-6 text-center text-brand-50 md:items-start md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-200">
              ¿Quiénes somos?
            </p>
            <h1
              className={`${montserratBold.className} text-[clamp(2rem,4vw,4rem)] leading-tight`}
            >
              Más de una década conectando energía con personas
            </h1>
            <p
              className={`${montserrat.className} max-w-3xl text-[clamp(1rem,1.75vw,1.25rem)] text-brand-50/85`}
            >
              Nacimos en 2011 como una red de transporte pesado y hoy somos una familia de estaciones,
              servicios y programas comunitarios que acompañan el crecimiento de Costa Rica.
            </p>
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl bg-white/90 p-6 shadow-xl shadow-brand-900/10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-700">
            Nuestra historia
          </p>
          <h2 className="mt-2 text-3xl font-bold">Un recorrido en primera persona</h2>
          <div className="mt-8">
            <VideoSection
              videoId="8y6n12TkNYU"
              posterSrc="/Video_Covers/video_cover2.webp"
              className="mx-auto w-full max-w-4xl"
            />
          </div>
        </div>
      </section>
          <VisionMission />
          <ValuesSection />
          <TimelineSection />
    </div>
  );
}
