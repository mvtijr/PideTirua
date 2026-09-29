"use client";

import { ShoppingBag, ChevronRight } from "lucide-react";
import { formatCLP } from "@/lib/formatters";

interface FloatingCartBarProps {
  totalUnidades: number;
  subtotal: number;
  onOpenDrawer: () => void;
  esLasTranqueras?: boolean;
}

export default function FloatingCartBar({
  totalUnidades,
  subtotal,
  onOpenDrawer,
  esLasTranqueras = false,
}: FloatingCartBarProps) {
  if (totalUnidades <= 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t p-3 sm:p-4 pointer-events-none ${
        esLasTranqueras
          ? "from-[#171614]/45 via-[#171614]/15 to-transparent"
          : "from-primary/35 via-primary/10 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-xl pointer-events-auto">
        <button
          type="button"
          onClick={onOpenDrawer}
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 shadow-xl transition-all active:scale-[0.99] ${
            esLasTranqueras
              ? "bg-[#171614] text-[#F8DC4B] ring-2 ring-[#F8DC4B] hover:bg-neutral-900"
              : "bg-[#25D366] text-white shadow-primary/30 ring-1 ring-white/20 hover:bg-[#20bd5a]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl font-extrabold ${
                esLasTranqueras
                  ? "bg-[#F8DC4B] text-[#171614]"
                  : "bg-black/20 text-white"
              }`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span
                className={`-right-1.5 -top-1.5 absolute flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-black shadow ${
                  esLasTranqueras
                    ? "bg-white text-[#171614]"
                    : "bg-primary text-on-primary"
                }`}
              >
                {totalUnidades}
              </span>
            </div>
            <div className="text-left">
              <p
                className={`text-xs font-medium ${
                  esLasTranqueras ? "text-white/85" : "text-white/90"
                }`}
              >
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
              <span
                className={`block text-[10px] font-semibold uppercase tracking-wider ${
                  esLasTranqueras ? "text-white/80" : "text-white/90"
                }`}
              >
                Total parcial
              </span>
              <span className="text-base font-black sm:text-lg">
                {formatCLP(subtotal)}
              </span>
            </div>
            <ChevronRight
              className={`h-5 w-5 ${
                esLasTranqueras ? "text-[#F8DC4B]" : "text-white"
              }`}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
