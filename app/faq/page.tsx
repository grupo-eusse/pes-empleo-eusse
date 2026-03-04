// app/faq/page.tsx
"use client";

import { useState } from "react";

type FaqItem = {
  q: string;
  a: string;
};


export const FAQS: FaqItem[] = [
  {
    q: "¿Cómo aplico a un empleo en la empresa?",
    a: "Crea tu cuenta, inicia sesión y ve a la sección 'Open Positions'. Selecciona la vacante y presiona 'Apply Now'. Si no has iniciado sesión, te redirigiremos al login para continuar."
  },
  {
    q: "¿En qué ubicaciones tienen vacantes actualmente?",
    a: "Nuestras vacantes se publican principalmente para las sedes de Naranjo (Gasolinera y Gimnasio), Barranca (Gasolinera) y Guápiles (Lubricentro). Usa el filtro de ubicación en la página de vacantes para ver opciones por zona."
  },
  {
    q: "¿Ofrecen puestos remotos?",
    a: "La mayoría de roles son presenciales por la naturaleza operativa (estaciones de servicio, lubricentros y gimnasios). Ocasionalmente publicamos vacantes administrativas con modalidad híbrida; si aplica, se indicará en la descripción del puesto."
  },
  {
    q: "¿Qué beneficios ofrecen?",
    a: "Los beneficios pueden variar según el rol y la sede, pero comúnmente incluyen: asociación solidarista, seguro de riesgos del trabajo, bonificaciones por desempeño, capacitación continua, descuentos en servicios de lubricentro y membresía de gimnasio, además de uniforme y apoyo en alimentación según ubicación."
  },
  {
    q: "¿Cuánto dura el proceso de reclutamiento?",
    a: "Tras postularte, revisamos tu candidatura en 3 a 5 días hábiles. Si avanzas, te contactamos para entrevista (presencial o virtual). En puestos operativos podría requerirse una prueba práctica en sitio."
  },
  {
    q: "Requisitos frecuentes para puestos operativos",
    a: "Ser mayor de edad, disponibilidad para horarios rotativos, experiencia en servicio al cliente (y conocimientos básicos de mantenimiento para Lubricentro), hoja de delincuencia actualizada, referencias laborales y preferiblemente residir cerca de la sede (Naranjo, Barranca o Guápiles)."
  },
  {
    q: "Contacto para dudas sobre mi postulación",
    a: "Puedes escribir a talento@empresa.cr o al WhatsApp de RR. HH. +506 0000-0000. Indica tu nombre completo y la vacante a la que aplicaste."
  }
];

function FaqItemRow({
  item,
  index,
  openIndex,
  setOpenIndex,
}: {
  item: FaqItem;
  index: number;
  openIndex: number | null;
  setOpenIndex: (i: number | null) => void;
}) {
  const isOpen = openIndex === index;
  return (
    <div className="rounded-2xl border border-transparent bg-white shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
      <button
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpenIndex(isOpen ? null : index)}
        aria-expanded={isOpen}
      >
        <span className="text-base font-semibold text-brand-900">{item.q}</span>
        <span className="text-brand-600">{isOpen ? "–" : "+"}</span>
      </button>
      {isOpen && (
        <div className="border-t border-transparent px-5 pb-5 pt-0 text-brand-900/70">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <main className="min-h-screen bg-brand-50 text-brand-900">
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-600">
          Grupo Empresarial Eusse
        </p>
        <h1 className="mt-3 text-4xl font-bold text-brand-900">
          Preguntas Frecuentes
        </h1>
        <p className="mt-3 text-lg text-brand-900/70">
          Encuentra respuestas sobre nuestro proceso de contratación y trabajo
          en nuestras sedes.
        </p>
      </section>

      {/* FAQ list */}
      <section className="mx-auto max-w-3xl space-y-4 px-4 pb-16">
        {FAQS.map((item, i) => (
          <FaqItemRow
            key={i}
            item={item}
            index={i}
            openIndex={openIndex}
            setOpenIndex={setOpenIndex}
          />
        ))}

        {/* Contact card */}
        <div className="mt-8 rounded-3xl border border-transparent bg-white p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.05)]">
          <h3 className="text-lg font-semibold text-brand-900">
            ¿Aún tienes preguntas?
          </h3>
          <p className="mt-2 text-brand-900/70">
            Si no encuentras la respuesta que buscas, nuestro equipo de RR. HH.
            está para ayudarte.
          </p>
          <div className="mt-4">
            <a className="text-brand-600 underline-offset-4 hover:underline" href="mailto:talento@empresa.cr">
              talento@empresa.cr
            </a>

          </div>
        </div>
      </section>
    </main>
  );
}
