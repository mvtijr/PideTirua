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
      className={`fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t p-3 sm:p-4 pointer-events-none ${theme.floatingGradient}`}
    >
      <div className="mx-auto max-w-xl pointer-events-auto">
        <button
          type="button"
          onClick={onOpenDrawer}
          className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 shadow-xl transition-all active:scale-[0.99] ${theme.floatingBtn}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl font-extrabold ${theme.floatingIconBox}`}
            >
              <ShoppingBag className="h-5 w-5" />
              <span
                className={`-right-1.5 -top-1.5 absolute flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-black shadow ${theme.floatingCountBadge}`}
              >
                {totalUnidades}
              </span>
            </div>
            <div className="text-left">
              <p className={`text-xs font-medium ${theme.floatingSubText}`}>
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
                className={`block text-[10px] font-semibold uppercase tracking-wider ${theme.floatingSubText}`}
              >
                Total parcial
              </span>
              <span className="text-base font-black sm:text-lg">
                {formatCLP(subtotal)}
              </span>
            </div>
            <ChevronRight className={`h-5 w-5 ${theme.floatingChevron}`} />
          </div>
        </button>
      </div>
    </div>
  );
}
