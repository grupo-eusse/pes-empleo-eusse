// app/faq/page.tsx
import { FaqList } from "@/ui/components/faq/faq-list";
import { FAQS } from "./data";

export default function FaqPage() {
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
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <FaqList items={FAQS} />

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
            <a
              className="text-brand-600 underline-offset-4 hover:underline"
              href="mailto:talento@empresa.cr"
            >
              talento@empresa.cr
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
