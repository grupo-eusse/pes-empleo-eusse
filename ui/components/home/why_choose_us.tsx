type Benefit = {
  title: string
  description: string
  stat: string
  statLabel: string
}

const benefits: Benefit[] = [
  {
    title: "Cultura colaborativa",
    description: "Trabajá con profesionales talentosos que valoran el trabajo en equipo y el éxito compartido.",
    stat: "95%",
    statLabel: "Satisfacción del equipo",
  },
  {
    title: "Crecimiento profesional",
    description: "Accedé a programas de aprendizaje continuo y rutas claras para avanzar dentro del grupo.",
    stat: "80%",
    statLabel: "Promociones internas",
  },
  {
    title: "Equilibrio vida-trabajo",
    description: "Disfrutá de horarios flexibles, programas de bienestar y beneficios integrales.",
    stat: "4.8/5",
    statLabel: "Índice de bienestar",
  },
]

export function WhyChooseUs() {
  return (
    <section className="bg-white py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl lg:text-5xl">
            ¿Por qué elegirnos?
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Nos comprometemos a crear un entorno donde puedas prosperar profesional y personalmente.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {benefits.map(({ title, description, stat, statLabel }) => (
            <div
              key={title}
              className="rounded-2xl bg-card p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <h3 className="mb-3 text-2xl font-bold">{title}</h3>
              <p className="mb-6 leading-relaxed text-muted-foreground">{description}</p>
              <div className="border-t border-border pt-6">
                <p className="mb-1 text-3xl font-bold text-accent">{stat}</p>
                <p className="text-sm text-muted-foreground">{statLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
