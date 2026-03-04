"use client";

import { useState } from "react";
import type { FaqItem } from "@/app/faq/data";

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

export function FaqList({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <FaqItemRow
          key={i}
          item={item}
          index={i}
          openIndex={openIndex}
          setOpenIndex={setOpenIndex}
        />
      ))}
    </div>
  );
}
