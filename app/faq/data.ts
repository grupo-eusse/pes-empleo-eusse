export type FaqItem = {
  q: string;
  a: string;
};

export const FAQS: FaqItem[] = [
  {
    q: "¿Cómo aplico a un empleo en la empresa?",
    a: "Crea tu cuenta, inicia sesión y ve a la sección 'Open Positions'. Selecciona la vacante y presiona 'Apply Now'. Si no has iniciado sesión, te redirigiremos al login para continuar.",
  },
  {
    q: "¿En qué ubicaciones tienen vacantes actualmente?",
    a: "Nuestras vacantes se publican principalmente para las sedes de Naranjo (Gasolinera y Gimnasio), Barranca (Gasolinera) y Guápiles (Lubricentro). Usa el filtro de ubicación en la página de vacantes para ver opciones por zona.",
  },
  {
    q: "¿Ofrecen puestos remotos?",
    a: "La mayoría de roles son presenciales por la naturaleza operativa (estaciones de servicio, lubricentros y gimnasios). Ocasionalmente publicamos vacantes administrativas con modalidad híbrida; si aplica, se indicará en la descripción del puesto.",
  },
  {
    q: "¿Qué beneficios ofrecen?",
    a: "Los beneficios pueden variar según el rol y la sede, pero comúnmente incluyen: asociación solidarista, seguro de riesgos del trabajo, bonificaciones por desempeño, capacitación continua, descuentos en servicios de lubricentro y membresía de gimnasio, además de uniforme y apoyo en alimentación según ubicación.",
  },
  {
    q: "¿Cuánto dura el proceso de reclutamiento?",
    a: "Tras postularte, revisamos tu candidatura en 3 a 5 días hábiles. Si avanzas, te contactamos para entrevista (presencial o virtual). En puestos operativos podría requerirse una prueba práctica en sitio.",
  },
  {
    q: "Requisitos frecuentes para puestos operativos",
    a: "Ser mayor de edad, disponibilidad para horarios rotativos, experiencia en servicio al cliente (y conocimientos básicos de mantenimiento para Lubricentro), hoja de delincuencia actualizada, referencias laborales y preferiblemente residir cerca de la sede (Naranjo, Barranca o Guápiles).",
  },
  {
    q: "Contacto para dudas sobre mi postulación",
    a: "Puedes escribir a talento@empresa.cr o al WhatsApp de RR. HH. +506 0000-0000. Indica tu nombre completo y la vacante a la que aplicaste.",
  },
];
