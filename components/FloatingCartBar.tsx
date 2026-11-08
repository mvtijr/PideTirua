"use client";

import { ShoppingBag, ChevronRight } from "lucide-react";
import { formatCLP } from "@/lib/formatters";
import { getLocalTheme } from "@/lib/localTheme";

interface FloatingCartBarProps {
  totalUnidades: number;
  subtotal: number;
  onOpenDrawer: () => void;
  localSlug: string;
}

export default function FloatingCartBar({
  totalUnidades,
  subtotal,
  onOpenDrawer,
  localSlug,
}: FloatingCartBarProps) {
  if (totalUnidades <= 0) return null;

  const theme = getLocalTheme(localSlug);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t p-3 sm:p-4 pointer-events-none safe-bottom ${theme.floatingGradient}`}
    >
      <div className="mx-auto max-w-xl md:max-w-2xl lg:max-w-3xl pointer-events-auto">
        <button
          type="button"
          onClick={onOpenDrawer}
          className={`flex w-full min-h-[56px] items-center justify-between px-4 py-3.5 transition-all active:scale-[0.99] shadow-xl ${theme.floatingBtn}`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`relative flex h-10 w-10 items-center justify-center rounded-full font-extrabold ${theme.floatingIconBox}`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span
                className={`-right-1.5 -top-1.5 absolute flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-black shadow tabular-nums ${theme.floatingCountBadge}`}
              >
                {totalUnidades}
              </span>
            </span>
            <span className="text-left block">
              <span className={`block text-xs font-medium ${theme.floatingSubText}`}>
                {totalUnidades === 1
                  ? "1 producto seleccionado"
                  : `${totalUnidades} productos seleccionados`}
              </span>
              <span className="block text-sm font-extrabold tracking-tight sm:text-base">
                Ver carrito y pedir
              </span>
            </span>
          </span>

          <span className="flex items-center gap-2">
            <span className="text-right block">
              <span
                className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.floatingSubText}`}
              >
                Total parcial
              </span>
              <span className="block text-base font-black sm:text-lg tabular-nums">
                {formatCLP(subtotal)}
              </span>
            </span>
            <ChevronRight className={`h-5 w-5 ${theme.floatingChevron}`} />
          </span>
        </button>
      </div>
    </div>
  );
}
