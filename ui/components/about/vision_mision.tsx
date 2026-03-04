"use client";
import { motion } from "framer-motion";
import { satisfy } from "@/ui/fonts";

const CARDS = [
  {
    title: "Visión",
    description:
      "Impulsamos tu camino con tecnología avanzada, servicios personalizados y soluciones comerciales integrales que se adaptan a cada necesidad.",
  },
  {
    title: "Misión",
    description:
      "Liderar la transformación de la industria energética mediante espacios comerciales integrales, con infraestructura moderna e innovación tecnológica, que ofrezcan una experiencia única y enriquecedora para nuestros clientes.",
  },
];

export default function VisionMission() {
  return (
    <section
      id="vision-section"
      className="bg-white py-12 magnify-disable-reveal"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-brand-900 mb-4">
            Lo que nos impulsa
          </h2>
          <p className="text-lg text-brand-700 max-w-2xl mx-auto">
            Nuestra fundación se basa en una visión clara y una misión con
            propósito.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {CARDS.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 + 0.2 }}
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="rounded-md bg-white/95 p-8 shadow-lg"
            >
              <h3 className={`${satisfy.className} text-5xl text-center font-bold text-brand-900`}>
                {card.title}
              </h3>

              <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-linear-to-r from-brand-900 to-brand-600" />

              <p className="text-brand-700 leading-relaxed mt-4">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
