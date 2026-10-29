export interface LocalTheme {
  pageBg: string;
  videoOverlayGradient: string;
  containerBg: string;
  headerBg: string;
  headerGradient: string;
  backBtn: string;
  qrBtn: string;
  qrIcon: string;
  logoBox: string;
  statusBadge: string;
  rubroText: string;
  infoSectionBg: string;
  infoDescText: string;
  infoGridBox: string;
  infoIcon: string;
  infoTitle: string;
  infoSub: string;
  modalityBadge: string;
  modalityIcon: string;
  callBtn: string;
  callIcon: string;
  stickyBar: string;
  tabActive: string;
  tabInactive: string;
  searchInput: string;
  categoryTitle: string;
  categoryCount: string;
  emptyStateBox: string;
  emptyStateIcon: string;
  emptyStateText: string;
  emptyStateBtn: string;
  footerBg: string;
  footerTitle: string;
  footerSub: string;
  footerLink: string;
  qrModalAccent: string;
  qrModalTitle: string;
  // ProductCard
  cardActive: string;
  cardInactive: string;
  cardTag: string;
  cardTagIcon: string;
  cardInCartBadge: string;
  cardTitle: string;
  cardPrice: string;
  cardAddBtn: string;
  cardCounterBox: string;
  cardMinusBtn: string;
  cardQtyText: string;
  cardPlusBtn: string;
  // FloatingCartBar
  floatingGradient: string;
  floatingBtn: string;
  floatingIconBox: string;
  floatingCountBadge: string;
  floatingSubText: string;
  floatingChevron: string;
  // CartDrawer
  drawerHeader: string;
  drawerHeaderSub: string;
  drawerCloseBtn: string;
  drawerItemsBox: string;
  drawerItemTitle: string;
  drawerItemTotal: string;
  drawerOptionActive: string;
  drawerOptionIconActive: string;
  drawerLabel: string;
  drawerLabelIcon: string;
  drawerPreviewBox: string;
}

export function getVideoPoster(videoSrc?: string, fallback?: string): string {
  if (!videoSrc) return fallback || "";
  if (videoSrc.endsWith(".mp4")) {
    return videoSrc.replace(/\.mp4$/, "-poster.jpg");
  }
  return fallback || "";
}

/**
 * Generador de temas armonizado con la estética artesanal, editorial y luminosa (Crust Pizza Co.)
 * Unifica el fondo marfil (#FAF8F5), tipografía Bebas Neue y bordes stone en todos los locales.
 */
function createEditorialTheme(config: {
  accent: string;
  accentBg: string;
  accentBorder: string;
  tagText: string;
  logoBg: string;
}): LocalTheme {
  return {
    pageBg: "bg-[#FAF8F5]",
    videoOverlayGradient: "from-black/75 via-black/35 to-black/85",
    containerBg: "bg-[#FAF8F5] shadow-xl sm:border-x sm:border-stone-200/90",
    headerBg: "bg-stone-900",
    headerGradient: "from-black/85 via-black/40 to-transparent",
    backBtn:
      "bg-white/95 text-stone-900 border border-stone-200/90 shadow-sm hover:bg-stone-100 rounded-full",
    qrBtn: "bg-[#18181B] text-white hover:bg-[#EA580C] shadow-sm rounded-full",
    qrIcon: "text-white",
    logoBox: "border-4 border-white shadow-xl bg-white rounded-2xl",
    statusBadge: "bg-emerald-600 text-white font-bold",
    rubroText: "text-amber-300 font-bold uppercase tracking-wider drop-shadow-sm",
    infoSectionBg: "bg-white border-b border-stone-200/90",
    infoDescText: "text-stone-600 font-medium",
    infoGridBox: "border border-stone-200/90 bg-[#FAF8F5] text-stone-800 rounded-2xl",
    infoIcon: "text-[#C2410C]",
    infoTitle: "text-stone-900 font-bold",
    infoSub: "text-stone-500 font-medium",
    modalityBadge: `${config.accentBg} ${config.tagText} border ${config.accentBorder} font-bold rounded-xl`,
    modalityIcon: config.tagText,
    callBtn:
      "bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm font-bold rounded-full",
    callIcon: "text-white",
    stickyBar:
      "border-b border-stone-200/90 bg-[#FAF8F5]/95 backdrop-blur-md",
    tabActive:
      "bg-[#18181B] text-white shadow-sm ring-1 ring-black rounded-full",
    tabInactive:
      "bg-white border border-stone-200/90 text-stone-700 hover:border-stone-400 rounded-full",
    searchInput:
      "border-stone-200/90 bg-white text-stone-900 placeholder:text-stone-400 focus:border-[#EA580C] rounded-full shadow-xs",
    categoryTitle:
      "text-stone-900 font-display text-3xl tracking-wide uppercase",
    categoryCount: "bg-stone-200 text-stone-700 font-bold rounded-full",
    emptyStateBox: "border-stone-200/90 bg-white rounded-2xl",
    emptyStateIcon: "text-stone-400",
    emptyStateText: "text-stone-600",
    emptyStateBtn: "text-[#C2410C] font-bold",
    footerBg: "border-t border-stone-200/90 bg-white text-stone-600",
    footerTitle:
      "text-stone-900 font-display text-2xl uppercase tracking-wide",
    footerSub: "text-stone-500",
    footerLink: "text-[#C2410C] font-bold hover:underline",
    qrModalAccent: "text-[#C2410C] font-bold",
    qrModalTitle:
      "text-stone-900 font-display text-2xl uppercase tracking-wide",
    cardActive:
      "border-orange-400 bg-white shadow-md ring-2 ring-orange-400/40 rounded-2xl",
    cardInactive:
      "border-stone-200/90 bg-white shadow-sm hover:border-orange-300 hover:shadow-md rounded-2xl",
    cardTag: `${config.accentBg} ${config.tagText} rounded-full`,
    cardTagIcon: config.tagText,
    cardInCartBadge: "bg-[#18181B] text-white font-bold rounded-full",
    cardTitle:
      "text-stone-900 font-display text-xl uppercase tracking-wide",
    cardPrice: "text-stone-900 font-bold text-base",
    cardAddBtn:
      "bg-stone-100 hover:bg-[#18181B] hover:text-white text-stone-900 font-bold uppercase tracking-wider text-xs rounded-full",
    cardCounterBox: "border-stone-300 bg-stone-50 rounded-full",
    cardMinusBtn:
      "bg-white text-stone-800 hover:bg-stone-200 rounded-full",
    cardQtyText: "text-stone-900 font-bold",
    cardPlusBtn:
      "bg-[#18181B] text-white hover:bg-[#EA580C] rounded-full",
    floatingGradient:
      "from-[#FAF8F5] via-[#FAF8F5]/80 to-transparent",
    floatingBtn:
      "bg-[#18181B] hover:bg-black text-white rounded-full shadow-2xl border border-stone-700",
    floatingIconBox: "bg-[#EA580C] text-white rounded-full",
    floatingCountBadge: "bg-white text-[#18181B] font-black",
    floatingSubText: "text-stone-300",
    floatingChevron: "text-[#EA580C]",
    drawerHeader:
      "border-b border-stone-200/90 bg-[#FAF8F5] text-stone-900",
    drawerHeaderSub:
      "text-[#C2410C] font-bold uppercase tracking-wider",
    drawerCloseBtn:
      "bg-stone-200 text-stone-700 hover:bg-stone-300 rounded-full",
    drawerItemsBox:
      "divide-stone-100 border border-stone-200/90 bg-white rounded-2xl shadow-xs",
    drawerItemTitle:
      "text-stone-900 font-display text-lg uppercase tracking-wide",
    drawerItemTotal: "text-stone-900 font-bold",
    drawerOptionActive:
      "border-[#EA580C] bg-orange-50/70 text-stone-900 ring-2 ring-[#EA580C] rounded-2xl",
    drawerOptionIconActive: "text-[#C2410C]",
    drawerLabel: "text-stone-800 font-bold",
    drawerLabelIcon: "text-[#C2410C]",
    drawerPreviewBox: "bg-[#18181B] text-stone-200 rounded-2xl",
  };
}

export function getLocalTheme(slug: string): LocalTheme {
  switch (slug) {
    case "las-tranqueras":
      return createEditorialTheme({
        accent: "#EA580C",
        accentBg: "bg-orange-50",
        accentBorder: "border-orange-200",
        tagText: "text-[#C2410C]",
        logoBg: "#f8dc4b",
      });

    case "sushi-burger":
      return createEditorialTheme({
        accent: "#D93829",
        accentBg: "bg-red-50",
        accentBorder: "border-red-200",
        tagText: "text-[#B91C1C]",
        logoBg: "#ffffff",
      });

    case "rio-mar":
      return createEditorialTheme({
        accent: "#D4A843",
        accentBg: "bg-amber-50",
        accentBorder: "border-amber-200",
        tagText: "text-[#85530E]",
        logoBg: "#000000",
      });

    case "gran-pacifico":
      return createEditorialTheme({
        accent: "#0284C7",
        accentBg: "bg-sky-50",
        accentBorder: "border-sky-200",
        tagText: "text-[#0369A1]",
        logoBg: "#194a6e",
      });

    default:
      return createEditorialTheme({
        accent: "#EA580C",
        accentBg: "bg-orange-50",
        accentBorder: "border-orange-200",
        tagText: "text-[#C2410C]",
        logoBg: "#ffffff",
      });
  }
}
