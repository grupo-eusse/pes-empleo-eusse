import Image from 'next/image';
import { Quote } from 'lucide-react';

type Testimonial = {
  name: string;
  role: string;
  image?: string;
  quote: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Carolina Méndez",
    role: "Coordinadora de Operaciones",
    image: "/persona1.png",
    quote: "Ingresar a este equipo fue la mejor decisión profesional que he tomado. La cultura de innovación y apoyo me permitió crecer como nunca.",
  },
  {
    name: "David Rojas",
    role: "Líder de Ingeniería",
    image: "/persona2.png",
    quote: "Lo que diferencia a la compañía es el interés genuino por el desarrollo de las personas. Lideré proyectos que generan impacto real.",
  },
  {
    name: "Juan Solís",
    role: "Gerente de Marketing",
    image: "/persona3.png",
    quote: "El balance vida-trabajo es excepcional. Puedo seguir mis pasiones mientras contribuyo a proyectos significativos con un gran equipo.",
  },
];

export default function EmployeeTestimonials() {
  return (
    <section className="bg-brand-100/50 py-16 md:py-28 text-brand-900">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl lg:text-5xl">
            La voz de nuestro equipo
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-gray-600 md:text-xl">
            Conocé qué hace especial a Eusse directamente desde las personas que construyen cada proyecto.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map(({ name, role, image, quote }, i) => (
            <div
              key={name}
              className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
            >
              {image && (
                <Image
                  src={image}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover blur-xs"
                  priority={i === 0}
                />
              )}
              <div className="absolute inset-0 -z-10 bg-linear-to-b from-brand-900/60 via-brand-900/70 to-brand-900/80" />
              <div className="relative z-10 p-8 text-brand-50">
                <Quote className="mb-6 h-10 w-10 opacity-80" aria-hidden="true" />
                <p className="mb-8 text-pretty leading-relaxed text-brand-50/90">"{quote}"</p>
                <div>
                  <p className="text-lg font-semibold">{name}</p>
                  <p className="text-sm text-brand-100/80">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
