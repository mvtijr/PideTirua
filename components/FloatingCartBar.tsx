"use client";

import { ShoppingBag, ChevronRight } from "lucide-react";
import { formatCLP } from "@/lib/formatters";

interface FloatingCartBarProps {
  totalUnidades: number;
  subtotal: number;
  onOpenDrawer: () => void;
}

export default function FloatingCartBar({
  totalUnidades,
  subtotal,
  onOpenDrawer,
}: FloatingCartBarProps) {
  if (totalUnidades <= 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-slate-950/30 via-slate-950/10 to-transparent p-3 sm:p-4 pointer-events-none">
      <div className="mx-auto max-w-xl pointer-events-auto">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex w-full items-center justify-between rounded-2xl bg-emerald-600 px-4 py-3.5 text-white shadow-xl shadow-emerald-950/30 ring-1 ring-white/20 transition-all hover:bg-emerald-500 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-800/80 font-extrabold text-white">
              <ShoppingBag className="h-5 w-5" />
              <span className=" -right-1.5 -top-1.5 absolute flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-black text-slate-950 shadow">
                {totalUnidades}
              </span>
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-emerald-100">
                {totalUnidades === 1
                  ? "1 producto seleccionado"
                  : `${totalUnidades} productos seleccionados`}
              </p>
              <p className="text-sm font-extrabold tracking-tight sm:text-base">
                Ver carrito y pedir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-100">
                Total parcial
              </span>
              <span className="text-base font-black sm:text-lg">
                {formatCLP(subtotal)}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-emerald-100" />
          </div>
        </button>
      </div>
    </div>
  );
}
