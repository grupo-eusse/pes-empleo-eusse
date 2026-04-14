"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Briefcase,
  Users,
  TrendingUp,
  Heart,
  type LucideIcon,
} from "lucide-react";

type Benefit = { icon: LucideIcon; title: string; desc: string; delay: number };

const BENEFITS: Benefit[] = [
  {
    icon: Users,
    title: "Ambiente positivo",
    desc: "Cultura de respeto y colaboración",
    delay: 0.2,
  },
  {
    icon: TrendingUp,
    title: "Crecimiento",
    desc: "Oportunidades de desarrollo profesional",
    delay: 0.3,
  },
  {
    icon: Heart,
    title: "Beneficios",
    desc: "Paquete competitivo de compensación",
    delay: 0.4,
  },
];

export default function CareersSection() {
  return (
    <section
      id="careers"
      className="relative py-24 overflow-hidden magnify-disable-reveal"
    >
      {/* Background images */}
      <div className="absolute inset-0">
        <Image
          src="/trabajador-1.webp"
          alt=""
          fill
          sizes="(max-width: 767px) 0px, 100vw"
          className="hidden md:block object-cover"
        />
        <Image
          src="/trabajador-2.webp"
          alt=""
          fill
          sizes="(max-width: 767px) 100vw, 0px"
          className="md:hidden object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r from-[#003366]/95 via-[#003366]/85 to-[#1CA9C9]/80" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full mb-6">
            <Briefcase className="w-5 h-5 text-[#1CA9C9]" aria-hidden="true" />
            <span className="text-white font-semibold">
              Únete a nuestro equipo
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Trabajá con nosotros
          </h2>

          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            En Grupo Eusse, creemos que nuestro mayor activo es nuestro talento
            humano. Buscamos personas apasionadas, comprometidas y con ganas de
            crecer junto a nosotros.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {BENEFITS.map(({ icon: Icon, title, desc, delay }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-colors duration-300"
              >
                <Icon
                  className="w-8 h-8 text-[#1CA9C9] mb-3"
                  aria-hidden="true"
                />
                <h4 className="text-white font-bold text-lg mb-2">{title}</h4>
                <p className="text-white/80 text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.a
            href="https://empleo.grupoeusse.com/buscar-empleos"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="inline-block bg-[#1CA9C9] hover:bg-[#1CA9C9]/90 hover:-translate-y-0.5 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Ver posiciones disponibles
          </motion.a>
        </motion.div>
      </div>

      {/* Decorative blur */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1CA9C9]/10 rounded-full blur-3xl pointer-events-none" />
    </section>
  );
}
