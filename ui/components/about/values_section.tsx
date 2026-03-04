"use client";
import { motion } from "framer-motion";

const VALUES = [
  {
    title: "Actitud positiva y proactiva",
    description:
      "Creemos que una actitud optimista y proactiva transforma los desafíos en oportunidades. Buscamos siempre soluciones con entusiasmo y determinación.",
  },
  {
    title: "Agilidad, creatividad y adaptabilidad",
    description:
      "Nos movemos con rapidez frente al cambio, fomentando la creatividad y la capacidad de adaptación como motores del crecimiento y la mejora continua.",
  },
  {
    title: "Respeto y cercanía",
    description:
      "Valoramos las relaciones basadas en la empatía, el respeto y la sostenibilidad. Promovemos un entorno donde las personas y la naturaleza conviven en equilibrio.",
  },
  {
    title: "Ejemplaridad, ética y transparencia",
    description:
      "La integridad guía cada una de nuestras acciones. Actuamos con honestidad, claridad y responsabilidad para fortalecer la confianza en todo lo que hacemos.",
  },
  {
    title: "Colaboración y compromiso",
    description:
      "Fomentamos el trabajo en equipo, la comunicación abierta y el sentido de pertenencia. El compromiso mutuo es la base de nuestros logros.",
  },
  {
    title: "Crecimiento y aprendizaje continuo",
    description:
      "Entendemos el aprendizaje como una oportunidad constante para mejorar, innovar y construir un futuro sostenible y exitoso.",
  },
];

export default function ValuesSection() {
  return (
    <section
      className="bg-brand-50 py-12 px-6 rounded-2xl overflow-hidden magnify-disable-reveal mx-auto max-w-6xl my-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-20"
      >
        <span className="px-6 py-2 bg-linear-to-r from-brand-700 to-brand-900 text-white rounded-full font-medium text-sm">
          Nuestros Valores
        </span>

        <h2 className="text-4xl md:text-5xl font-bold text-brand-900 mt-4 mb-6">
          Lo que representamos
        </h2>
        <p className="text-lg text-brand-700 max-w-3xl mx-auto leading-relaxed">
          Estos principios guían nuestras acciones, dan forma a nuestra cultura
          y definen quiénes somos como organización.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {VALUES.map((value, index) => (
          <motion.div
            key={value.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="bg-white/95 rounded-md p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 h-full"
          >
            <h3 className="text-2xl font-bold text-brand-900 text-center mb-2">
              {value.title}
            </h3>
            <div className="mx-auto h-1 w-40 rounded-full bg-linear-to-r from-brand-900 to-brand-600" />
            <p className="text-brand-700 leading-relaxed mt-4">
              {value.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
