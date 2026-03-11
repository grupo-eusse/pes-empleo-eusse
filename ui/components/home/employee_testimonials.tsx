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
    name: "Adrian Rojas",
    role: "Administrador Eusse Naranjo",
    image: "/Empleado1.jpeg",
    quote: "Me gusta trabajar en Grupo Eusse porque el servicio, el compromiso y el trabajo en equipo se reflejan cada día en la experiencia que brindamos a nuestros clientes.",
  },
  {
    name: "Jairo Barrantes",
    role: "Jefe de pistas Eusse Naranjo",
    image: "/Empleado2.jpeg",
    quote: "Me gusta trabajar en Grupo Eusse porque durante estos 7 años he tenido grandes oportunidades y beneficios. Me han dado estabilidad, buen ambiente de trabajo y la oportunidad de crecer. Por eso me siento agradecido y orgulloso de ser parte de este equipo.",
  },
  {
    name: "Henry Ramírez",
    role: "Jefe de mecánica Ginni Lubricentro",
    image: "/Empleado3.jpeg",
    quote: "Me gusta trabajar en Grupo Eusse ya que es un lugar con un ambiente muy bonito, un espacio seguro y de confianza. También existe un excelente trato con el personal y gran apreciación hacia el esfuerzo del colaborador.",
  },
  {
    name: "Jeffry Segura",
    role: "Jefe de pistas Eusse Guápiles",
    image: "/Empleado4.jpeg",
    quote: "Me gusta trabajar en Grupo Eusse por varios motivos: es un trabajo estable, excelente ambiente laboral, facilidad de horarios, la calidad del producto, el orden y el sistema con el que se manejan las cuentas es súper esencial para un empleado.",
  },
  {
    name: "Gabriel Quesada",
    role: "Jefe de pistas Eusse Barranca",
    image: "/Empleado5.jpeg",
    quote: "Me gusta trabajar en Estación de Servicio Eusse porque es un ambiente donde se aprende disciplina, puntualidad y compromiso. Además de vender combustible, se ofrece ayuda y servicio a las personas que viajan. ",
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

        <div className="grid gap-8 md:grid-cols-6">
          {testimonials.map(({ name, role, image, quote }, i) => (
            <div
              key={name}
              className={`relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                i < 3 ? 'md:col-span-2' : 'md:col-span-3'
              }`}
            >
              {image && (
                <Image
                  src={image}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover object-top"
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
