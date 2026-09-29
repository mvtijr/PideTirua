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

export function getLocalTheme(slug: string): LocalTheme {
  switch (slug) {
    case "las-tranqueras":
      return {
        pageBg: "bg-[#171614]",
        videoOverlayGradient:
          "from-[#171614]/60 via-[#171614]/50 to-[#171614]/75",
        containerBg:
          "bg-[#171614]/40 backdrop-blur-[2px] shadow-2xl sm:border-x sm:border-[#F8DC4B]/25",
        headerBg: "bg-[#171614]",
        headerGradient: "from-[#171614]/95 via-[#171614]/45 to-black/25",
        backBtn:
          "bg-[#171614]/90 text-[#F8DC4B] ring-1 ring-[#F8DC4B]/50 hover:bg-[#171614]",
        qrBtn: "bg-[#F8DC4B] text-[#171614] hover:bg-[#f6d52b]",
        qrIcon: "text-[#171614]",
        logoBox: "border-[#F8DC4B] bg-[#F8DC4B]",
        statusBadge: "bg-[#F8DC4B] text-[#171614]",
        rubroText: "text-[#F8DC4B]",
        infoSectionBg: "border-[#F8DC4B]/30 bg-[#171614]/80 backdrop-blur-md",
        infoDescText: "text-[#FFFDF2]/90",
        infoGridBox:
          "border border-[#F8DC4B]/45 bg-[#171614]/75 text-[#FFFDF2]",
        infoIcon: "text-[#F8DC4B]",
        infoTitle: "text-[#F8DC4B]",
        infoSub: "text-[#FFFDF2]/80",
        modalityBadge:
          "bg-[#F8DC4B]/20 text-[#F8DC4B] border border-[#F8DC4B]/55",
        modalityIcon: "text-[#F8DC4B]",
        callBtn: "bg-[#F8DC4B] text-[#171614] hover:bg-[#f6d52b]",
        callIcon: "text-[#171614]",
        stickyBar: "border-[#F8DC4B]/35 bg-[#171614]/85",
        tabActive:
          "bg-[#F8DC4B] text-[#171614] ring-2 ring-[#F8DC4B] shadow-sm",
        tabInactive:
          "bg-white/10 text-[#FFFDF2] border border-[#F8DC4B]/40 hover:bg-[#F8DC4B]/20",
        searchInput:
          "border-[#F8DC4B]/60 bg-[#FFFDF2]/95 focus:border-[#F8DC4B]",
        categoryTitle: "text-[#F8DC4B] drop-shadow-sm",
        categoryCount: "bg-[#F8DC4B] text-[#171614] font-bold shadow-sm",
        emptyStateBox: "border-[#F8DC4B]/50 bg-[#171614]/80 backdrop-blur-md",
        emptyStateIcon: "text-[#F8DC4B]",
        emptyStateText: "text-[#FFFDF2]",
        emptyStateBtn: "text-[#F8DC4B]",
        footerBg:
          "border-[#F8DC4B]/35 bg-[#171614]/85 text-[#FFFDF2]/85 backdrop-blur-md",
        footerTitle: "text-[#F8DC4B]",
        footerSub: "text-[#FFFDF2]/75",
        footerLink: "text-[#F8DC4B]",
        qrModalAccent: "text-[#171614]",
        qrModalTitle: "text-[#171614]",
        cardActive:
          "border-[#F8DC4B] bg-[#FFFDF0]/95 backdrop-blur-sm shadow-md ring-2 ring-[#F8DC4B]",
        cardInactive:
          "border-[#F8DC4B]/50 bg-white/92 backdrop-blur-sm shadow-sm hover:border-[#F8DC4B] hover:bg-white hover:shadow-md",
        cardTag: "bg-[#F8DC4B] text-[#171614]",
        cardTagIcon: "text-[#171614]",
        cardInCartBadge: "bg-[#171614] text-[#F8DC4B]",
        cardTitle: "text-[#171614]",
        cardPrice: "text-[#171614]",
        cardAddBtn: "bg-[#171614] text-[#F8DC4B] hover:bg-neutral-800",
        cardCounterBox: "border-[#F8DC4B]",
        cardMinusBtn: "bg-[#FEF9C3] text-[#171614] hover:bg-[#F8DC4B]",
        cardQtyText: "text-[#171614]",
        cardPlusBtn: "bg-[#171614] text-[#F8DC4B] hover:bg-neutral-800",
        floatingGradient: "from-[#171614]/45 via-[#171614]/15 to-transparent",
        floatingBtn:
          "bg-[#171614] text-[#F8DC4B] ring-2 ring-[#F8DC4B] hover:bg-neutral-900",
        floatingIconBox: "bg-[#F8DC4B] text-[#171614]",
        floatingCountBadge: "bg-white text-[#171614]",
        floatingSubText: "text-white/85",
        floatingChevron: "text-[#F8DC4B]",
        drawerHeader: "border-[#F8DC4B]/30 bg-[#171614] text-white",
        drawerHeaderSub: "text-[#F8DC4B]",
        drawerCloseBtn:
          "bg-neutral-800 text-[#F8DC4B] hover:bg-[#F8DC4B] hover:text-[#171614]",
        drawerItemsBox:
          "divide-[#F8DC4B]/30 border-[#F8DC4B]/50 bg-[#FFFDF2]",
        drawerItemTitle: "text-[#171614]",
        drawerItemTotal: "text-[#171614]",
        drawerOptionActive:
          "border-[#171614] bg-[#FEF9C3]/60 text-[#171614] ring-2 ring-[#F8DC4B]",
        drawerOptionIconActive: "text-[#171614]",
        drawerLabel: "text-[#171614]",
        drawerLabelIcon: "text-[#171614]",
        drawerPreviewBox: "bg-[#171614] text-[#F8DC4B]",
      };

    case "sushi-burger":
      // Logo Bendito Sushi: Negro Nori (#141414), Salmón Coral (#E85D3F), Verde Bambú (#1E7A46) y Blanco (#FFFFFF)
      return {
        pageBg: "bg-[#141414]",
        videoOverlayGradient:
          "from-[#141414]/60 via-[#141414]/50 to-[#141414]/78",
        containerBg:
          "bg-[#141414]/42 backdrop-blur-[2px] shadow-2xl sm:border-x sm:border-[#E85D3F]/30",
        headerBg: "bg-[#141414]",
        headerGradient: "from-[#141414]/95 via-[#141414]/45 to-black/25",
        backBtn:
          "bg-[#141414]/90 text-white ring-1 ring-[#E85D3F]/60 hover:bg-[#141414]",
        qrBtn: "bg-[#E85D3F] text-white hover:bg-[#d44d30]",
        qrIcon: "text-white",
        logoBox: "border-[#141414] bg-white ring-2 ring-[#E85D3F]",
        statusBadge: "bg-[#1E7A46] text-white",
        rubroText: "text-[#FF8A70]",
        infoSectionBg: "border-[#E85D3F]/30 bg-[#141414]/82 backdrop-blur-md",
        infoDescText: "text-white/90",
        infoGridBox:
          "border border-[#E85D3F]/45 bg-[#141414]/75 text-white",
        infoIcon: "text-[#E85D3F]",
        infoTitle: "text-[#FF8A70]",
        infoSub: "text-white/80",
        modalityBadge:
          "bg-[#1E7A46]/25 text-[#6EE7B7] border border-[#1E7A46]/70",
        modalityIcon: "text-[#6EE7B7]",
        callBtn: "bg-[#E85D3F] text-white hover:bg-[#d44d30]",
        callIcon: "text-white",
        stickyBar: "border-[#E85D3F]/35 bg-[#141414]/88",
        tabActive:
          "bg-[#E85D3F] text-white ring-2 ring-[#FF8A70] shadow-sm",
        tabInactive:
          "bg-white/10 text-white border border-[#E85D3F]/40 hover:bg-[#E85D3F]/25",
        searchInput:
          "border-[#E85D3F]/60 bg-white/95 focus:border-[#E85D3F]",
        categoryTitle: "text-white drop-shadow-sm",
        categoryCount: "bg-[#E85D3F] text-white font-bold shadow-sm",
        emptyStateBox: "border-[#E85D3F]/50 bg-[#141414]/80 backdrop-blur-md",
        emptyStateIcon: "text-[#E85D3F]",
        emptyStateText: "text-white",
        emptyStateBtn: "text-[#FF8A70]",
        footerBg:
          "border-[#E85D3F]/35 bg-[#141414]/88 text-white/85 backdrop-blur-md",
        footerTitle: "text-[#FF8A70]",
        footerSub: "text-white/75",
        footerLink: "text-[#E85D3F]",
        qrModalAccent: "text-[#E85D3F]",
        qrModalTitle: "text-[#141414]",
        cardActive:
          "border-[#E85D3F] bg-[#FFF8F6]/95 backdrop-blur-sm shadow-md ring-2 ring-[#E85D3F]",
        cardInactive:
          "border-[#E85D3F]/40 bg-white/92 backdrop-blur-sm shadow-sm hover:border-[#E85D3F] hover:bg-white hover:shadow-md",
        cardTag: "bg-[#E85D3F] text-white",
        cardTagIcon: "text-white",
        cardInCartBadge: "bg-[#1E7A46] text-white",
        cardTitle: "text-[#141414]",
        cardPrice: "text-[#E85D3F]",
        cardAddBtn: "bg-[#141414] text-white hover:bg-[#E85D3F]",
        cardCounterBox: "border-[#E85D3F]",
        cardMinusBtn: "bg-[#FEE2E2] text-[#141414] hover:bg-[#E85D3F] hover:text-white",
        cardQtyText: "text-[#141414]",
        cardPlusBtn: "bg-[#E85D3F] text-white hover:bg-[#d44d30]",
        floatingGradient: "from-[#141414]/50 via-[#141414]/15 to-transparent",
        floatingBtn:
          "bg-[#141414] text-white ring-2 ring-[#E85D3F] hover:bg-neutral-900",
        floatingIconBox: "bg-[#E85D3F] text-white",
        floatingCountBadge: "bg-[#1E7A46] text-white",
        floatingSubText: "text-white/85",
        floatingChevron: "text-[#E85D3F]",
        drawerHeader: "border-[#E85D3F]/35 bg-[#141414] text-white",
        drawerHeaderSub: "text-[#FF8A70]",
        drawerCloseBtn:
          "bg-neutral-800 text-white hover:bg-[#E85D3F] hover:text-white",
        drawerItemsBox:
          "divide-[#E85D3F]/25 border-[#E85D3F]/45 bg-[#FFF8F6]",
        drawerItemTitle: "text-[#141414]",
        drawerItemTotal: "text-[#E85D3F]",
        drawerOptionActive:
          "border-[#E85D3F] bg-[#FFF0EC] text-[#141414] ring-2 ring-[#E85D3F]/50",
        drawerOptionIconActive: "text-[#E85D3F]",
        drawerLabel: "text-[#141414]",
        drawerLabelIcon: "text-[#E85D3F]",
        drawerPreviewBox: "bg-[#141414] text-[#FF8A70]",
      };

    case "rio-mar":
      // Logo Río Mar Restaurant: Negro Elegante (#0A0A0A), Dorado Champagne (#D4A843) y Blanco Puro (#FFFFFF)
      return {
        pageBg: "bg-[#0A0A0A]",
        videoOverlayGradient:
          "from-[#0A0A0A]/65 via-[#0A0A0A]/52 to-[#0A0A0A]/82",
        containerBg:
          "bg-[#0A0A0A]/45 backdrop-blur-[2px] shadow-2xl sm:border-x sm:border-[#D4A843]/30",
        headerBg: "bg-[#0A0A0A]",
        headerGradient: "from-[#0A0A0A]/95 via-[#0A0A0A]/45 to-black/30",
        backBtn:
          "bg-[#0A0A0A]/90 text-[#D4A843] ring-1 ring-[#D4A843]/55 hover:bg-black",
        qrBtn: "bg-[#D4A843] text-[#0A0A0A] hover:bg-[#e0b654]",
        qrIcon: "text-[#0A0A0A]",
        logoBox: "border-[#D4A843] bg-black",
        statusBadge: "bg-[#D4A843] text-[#0A0A0A]",
        rubroText: "text-[#D4A843]",
        infoSectionBg: "border-[#D4A843]/35 bg-[#0A0A0A]/82 backdrop-blur-md",
        infoDescText: "text-white/90",
        infoGridBox:
          "border border-[#D4A843]/45 bg-[#0A0A0A]/78 text-white",
        infoIcon: "text-[#D4A843]",
        infoTitle: "text-[#D4A843]",
        infoSub: "text-white/80",
        modalityBadge:
          "bg-[#D4A843]/20 text-[#F3D078] border border-[#D4A843]/55",
        modalityIcon: "text-[#D4A843]",
        callBtn: "bg-[#D4A843] text-[#0A0A0A] hover:bg-[#e0b654]",
        callIcon: "text-[#0A0A0A]",
        stickyBar: "border-[#D4A843]/35 bg-[#0A0A0A]/88",
        tabActive:
          "bg-[#D4A843] text-[#0A0A0A] ring-2 ring-[#F3D078] shadow-sm",
        tabInactive:
          "bg-white/10 text-white border border-[#D4A843]/40 hover:bg-[#D4A843]/20",
        searchInput:
          "border-[#D4A843]/60 bg-white/95 focus:border-[#D4A843]",
        categoryTitle: "text-[#D4A843] drop-shadow-sm",
        categoryCount: "bg-[#D4A843] text-[#0A0A0A] font-bold shadow-sm",
        emptyStateBox: "border-[#D4A843]/50 bg-[#0A0A0A]/80 backdrop-blur-md",
        emptyStateIcon: "text-[#D4A843]",
        emptyStateText: "text-white",
        emptyStateBtn: "text-[#D4A843]",
        footerBg:
          "border-[#D4A843]/35 bg-[#0A0A0A]/88 text-white/85 backdrop-blur-md",
        footerTitle: "text-[#D4A843]",
        footerSub: "text-white/75",
        footerLink: "text-[#D4A843]",
        qrModalAccent: "text-[#D4A843]",
        qrModalTitle: "text-[#0A0A0A]",
        cardActive:
          "border-[#D4A843] bg-[#FFFCF5]/95 backdrop-blur-sm shadow-md ring-2 ring-[#D4A843]",
        cardInactive:
          "border-[#D4A843]/45 bg-white/92 backdrop-blur-sm shadow-sm hover:border-[#D4A843] hover:bg-white hover:shadow-md",
        cardTag: "bg-[#D4A843] text-[#0A0A0A]",
        cardTagIcon: "text-[#0A0A0A]",
        cardInCartBadge: "bg-[#0A0A0A] text-[#D4A843]",
        cardTitle: "text-[#0A0A0A]",
        cardPrice: "text-[#0A0A0A]",
        cardAddBtn: "bg-[#0A0A0A] text-[#D4A843] hover:bg-neutral-800",
        cardCounterBox: "border-[#D4A843]",
        cardMinusBtn: "bg-[#FEF3C7] text-[#0A0A0A] hover:bg-[#D4A843]",
        cardQtyText: "text-[#0A0A0A]",
        cardPlusBtn: "bg-[#0A0A0A] text-[#D4A843] hover:bg-neutral-800",
        floatingGradient: "from-[#0A0A0A]/50 via-[#0A0A0A]/15 to-transparent",
        floatingBtn:
          "bg-[#0A0A0A] text-[#D4A843] ring-2 ring-[#D4A843] hover:bg-neutral-900",
        floatingIconBox: "bg-[#D4A843] text-[#0A0A0A]",
        floatingCountBadge: "bg-white text-[#0A0A0A]",
        floatingSubText: "text-white/85",
        floatingChevron: "text-[#D4A843]",
        drawerHeader: "border-[#D4A843]/35 bg-[#0A0A0A] text-white",
        drawerHeaderSub: "text-[#D4A843]",
        drawerCloseBtn:
          "bg-neutral-800 text-[#D4A843] hover:bg-[#D4A843] hover:text-[#0A0A0A]",
        drawerItemsBox:
          "divide-[#D4A843]/30 border-[#D4A843]/50 bg-[#FFFCF5]",
        drawerItemTitle: "text-[#0A0A0A]",
        drawerItemTotal: "text-[#0A0A0A]",
        drawerOptionActive:
          "border-[#0A0A0A] bg-[#FEF3C7]/65 text-[#0A0A0A] ring-2 ring-[#D4A843]",
        drawerOptionIconActive: "text-[#0A0A0A]",
        drawerLabel: "text-[#0A0A0A]",
        drawerLabelIcon: "text-[#D4A843]",
        drawerPreviewBox: "bg-[#0A0A0A] text-[#D4A843]",
      };

    case "gran-pacifico":
    default:
      // Logo Gran Pacífico: Azul Océano Profundo (#194A6E / #0F314A), Coral Tenedor Libre (#F06A59), Turquesa Ola (#38BDF8) y Blanco (#FFFFFF)
      return {
        pageBg: "bg-[#0F314A]",
        videoOverlayGradient:
          "from-[#0F314A]/65 via-[#194A6E]/50 to-[#0F314A]/80",
        containerBg:
          "bg-[#0F314A]/42 backdrop-blur-[2px] shadow-2xl sm:border-x sm:border-[#38BDF8]/30",
        headerBg: "bg-[#0F314A]",
        headerGradient: "from-[#0F314A]/95 via-[#194A6E]/45 to-black/25",
        backBtn:
          "bg-[#0F314A]/90 text-white ring-1 ring-[#38BDF8]/55 hover:bg-[#0F314A]",
        qrBtn: "bg-[#F06A59] text-white hover:bg-[#e05644]",
        qrIcon: "text-white",
        logoBox: "border-[#38BDF8] bg-[#194A6E]",
        statusBadge: "bg-[#F06A59] text-white",
        rubroText: "text-[#7DD3FC]",
        infoSectionBg: "border-[#38BDF8]/30 bg-[#0F314A]/82 backdrop-blur-md",
        infoDescText: "text-white/90",
        infoGridBox:
          "border border-[#38BDF8]/40 bg-[#194A6E]/75 text-white",
        infoIcon: "text-[#38BDF8]",
        infoTitle: "text-[#7DD3FC]",
        infoSub: "text-white/80",
        modalityBadge:
          "bg-[#38BDF8]/20 text-[#7DD3FC] border border-[#38BDF8]/50",
        modalityIcon: "text-[#38BDF8]",
        callBtn: "bg-[#F06A59] text-white hover:bg-[#e05644]",
        callIcon: "text-white",
        stickyBar: "border-[#38BDF8]/35 bg-[#0F314A]/88",
        tabActive:
          "bg-[#F06A59] text-white ring-2 ring-[#38BDF8] shadow-sm",
        tabInactive:
          "bg-white/10 text-white border border-[#38BDF8]/40 hover:bg-[#38BDF8]/25",
        searchInput:
          "border-[#38BDF8]/60 bg-white/95 focus:border-[#F06A59]",
        categoryTitle: "text-white drop-shadow-sm",
        categoryCount: "bg-[#F06A59] text-white font-bold shadow-sm",
        emptyStateBox: "border-[#38BDF8]/50 bg-[#0F314A]/80 backdrop-blur-md",
        emptyStateIcon: "text-[#38BDF8]",
        emptyStateText: "text-white",
        emptyStateBtn: "text-[#7DD3FC]",
        footerBg:
          "border-[#38BDF8]/35 bg-[#0F314A]/88 text-white/85 backdrop-blur-md",
        footerTitle: "text-[#7DD3FC]",
        footerSub: "text-white/75",
        footerLink: "text-[#F06A59]",
        qrModalAccent: "text-[#F06A59]",
        qrModalTitle: "text-[#194A6E]",
        cardActive:
          "border-[#F06A59] bg-[#F0F9FF]/95 backdrop-blur-sm shadow-md ring-2 ring-[#F06A59]",
        cardInactive:
          "border-[#38BDF8]/45 bg-white/92 backdrop-blur-sm shadow-sm hover:border-[#38BDF8] hover:bg-white hover:shadow-md",
        cardTag: "bg-[#F06A59] text-white",
        cardTagIcon: "text-white",
        cardInCartBadge: "bg-[#194A6E] text-[#7DD3FC]",
        cardTitle: "text-[#0F314A]",
        cardPrice: "text-[#F06A59]",
        cardAddBtn: "bg-[#194A6E] text-white hover:bg-[#F06A59]",
        cardCounterBox: "border-[#38BDF8]",
        cardMinusBtn: "bg-[#E0F2FE] text-[#0F314A] hover:bg-[#38BDF8] hover:text-white",
        cardQtyText: "text-[#0F314A]",
        cardPlusBtn: "bg-[#F06A59] text-white hover:bg-[#e05644]",
        floatingGradient: "from-[#0F314A]/50 via-[#0F314A]/15 to-transparent",
        floatingBtn:
          "bg-[#0F314A] text-white ring-2 ring-[#F06A59] hover:bg-[#194A6E]",
        floatingIconBox: "bg-[#F06A59] text-white",
        floatingCountBadge: "bg-[#38BDF8] text-[#0F314A]",
        floatingSubText: "text-[#7DD3FC]",
        floatingChevron: "text-[#F06A59]",
        drawerHeader: "border-[#38BDF8]/35 bg-[#0F314A] text-white",
        drawerHeaderSub: "text-[#7DD3FC]",
        drawerCloseBtn:
          "bg-[#194A6E] text-white hover:bg-[#F06A59] hover:text-white",
        drawerItemsBox:
          "divide-[#38BDF8]/25 border-[#38BDF8]/45 bg-[#F0F9FF]",
        drawerItemTitle: "text-[#0F314A]",
        drawerItemTotal: "text-[#F06A59]",
        drawerOptionActive:
          "border-[#194A6E] bg-[#E0F2FE] text-[#0F314A] ring-2 ring-[#F06A59]",
        drawerOptionIconActive: "text-[#F06A59]",
        drawerLabel: "text-[#0F314A]",
        drawerLabelIcon: "text-[#194A6E]",
        drawerPreviewBox: "bg-[#0F314A] text-[#7DD3FC]",
      };
  }
}
