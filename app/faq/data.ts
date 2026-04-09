export type FaqItem = {
  q: string;
  a: string;
};

export const FAQS: FaqItem[] = [
  {
    q: "Es necesario adjuntar mi CV?",
    a: "Sí, es indispensable adjuntar su currículum actualizado para una mejor evaluación.",
  },
  {
    q: "¿Puedo aplicar sin experiencia laboral?",
    a: "Sí, en algunos puestos operativos como pistero o cajero de market se brinda capacitación, por lo que no siempre es indispensable contar con experiencia previa.",
  },
  {
    q: "¿Las vacantes tienen ubicación específica?",
    a: "Le recomendamos revisar esta información antes de postularse, para asegurarse de que la ubicación sea cercana a su zona de residencia.",
  },
  {
    q: "¿Cuánto tiempo tarda el proceso de selección?",
    a: "El tiempo puede variar según el puesto, pero generalmente el proceso tarda de 1 a 3 semanas.",
  },
  {
    q: "¿Se requiere disponibilidad de horarios?",
    a: "Sí, especialmente en puestos operativos, se requiere disponibilidad para trabajar en horarios rotativos, fines de semana y feriados.",
  },
];
