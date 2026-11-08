export interface ClassInfo {
  id: number;
  name: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: string;
  roles: string[];
}

export const WOW_CLASSES: Record<number, ClassInfo> = {
  1: {
    id: 1,
    name: "Guerreiro",
    color: "#C69B6D",
    bgClass: "bg-[#C69B6D]/15",
    borderClass: "border-[#C69B6D]/40",
    textClass: "text-[#C69B6D]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg",
    roles: ["Tanque", "DPS"],
  },
  2: {
    id: 2,
    name: "Paladino",
    color: "#F48CBA",
    bgClass: "bg-[#F48CBA]/15",
    borderClass: "border-[#F48CBA]/40",
    textClass: "text-[#F48CBA]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg",
    roles: ["Tanque", "Cura", "DPS"],
  },
  3: {
    id: 3,
    name: "Caçador",
    color: "#AAD372",
    bgClass: "bg-[#AAD372]/15",
    borderClass: "border-[#AAD372]/40",
    textClass: "text-[#AAD372]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg",
    roles: ["DPS"],
  },
  4: {
    id: 4,
    name: "Ladino",
    color: "#FFF468",
    bgClass: "bg-[#FFF468]/15",
    borderClass: "border-[#FFF468]/40",
    textClass: "text-[#FFF468]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg",
    roles: ["DPS"],
  },
  5: {
    id: 5,
    name: "Sacerdote",
    color: "#FFFFFF",
    bgClass: "bg-white/15",
    borderClass: "border-white/40",
    textClass: "text-white",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg",
    roles: ["Cura", "DPS"],
  },
  6: {
    id: 6,
    name: "Cavaleiro da Morte",
    color: "#C41E3A",
    bgClass: "bg-[#C41E3A]/15",
    borderClass: "border-[#C41E3A]/40",
    textClass: "text-[#C41E3A]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg",
    roles: ["Tanque", "DPS"],
  },
  7: {
    id: 7,
    name: "Xamã",
    color: "#0070DD",
    bgClass: "bg-[#0070DD]/15",
    borderClass: "border-[#0070DD]/40",
    textClass: "text-[#0070DD]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg",
    roles: ["Cura", "DPS"],
  },
  8: {
    id: 8,
    name: "Mago",
    color: "#3FC7EB",
    bgClass: "bg-[#3FC7EB]/15",
    borderClass: "border-[#3FC7EB]/40",
    textClass: "text-[#3FC7EB]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg",
    roles: ["DPS"],
  },
  9: {
    id: 9,
    name: "Bruxo",
    color: "#8788EE",
    bgClass: "bg-[#8788EE]/15",
    borderClass: "border-[#8788EE]/40",
    textClass: "text-[#8788EE]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg",
    roles: ["DPS"],
  },
  11: {
    id: 11,
    name: "Druida",
    color: "#FF7C0A",
    bgClass: "bg-[#FF7C0A]/15",
    borderClass: "border-[#FF7C0A]/40",
    textClass: "text-[#FF7C0A]",
    icon: "https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg",
    roles: ["Tanque", "Cura", "DPS"],
  },
};

export const WOW_RACES: Record<number, { id: number; name: string }> = {
  1: { id: 1, name: "Humano" },
  2: { id: 2, name: "Orc" },
  3: { id: 3, name: "Anão" },
  4: { id: 4, name: "Elfo Noturno" },
  5: { id: 5, name: "Morto-vivo" },
  6: { id: 6, name: "Tauren" },
  7: { id: 7, name: "Gnomo" },
  8: { id: 8, name: "Troll" },
  9: { id: 9, name: "Goblin" },
  10: { id: 10, name: "Elfo Sangrento" },
  11: { id: 11, name: "Draenei" },
};

export function getClassInfo(classId: number): ClassInfo {
  return (
    WOW_CLASSES[classId] || {
      id: classId,
      name: `Classe #${classId}`,
      color: "#A49E93",
      bgClass: "bg-pedra/15",
      borderClass: "border-pedra/40",
      textClass: "text-pedra",
      icon: "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg",
      roles: ["DPS"],
    }
  );
}

export function getRaceName(raceId: number): string {
  return WOW_RACES[raceId]?.name || `Raça #${raceId}`;
}

/**
 * Nomes dos ranks da guilda. A API da Blizzard devolve só o número do rank
 * (0 = Guild Master), nunca o nome configurado no jogo — edite esta lista
 * para espelhar os ranks da Sepultura.
 */
export const GUILD_RANK_NAMES: Record<number, string> = {
  0: "Guild Master",
  1: "Oficial",
  2: "Veterano",
  3: "Raider",
  8: "Recruta",
};

export function getRankLabel(rank: number): string {
  return GUILD_RANK_NAMES[rank] ?? "Membro";
}

export interface PaperdollSlotDef {
  type: string;
  label: string;
  emptyIcon: string;
}

export const LEFT_PAPERDOLL_SLOTS: PaperdollSlotDef[] = [
  { type: "HEAD", label: "Cabeça", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_head.jpg" },
  { type: "NECK", label: "Pescoço", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_neck.jpg" },
  { type: "SHOULDER", label: "Ombros", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_shoulder.jpg" },
  { type: "BACK", label: "Costas", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_chest.jpg" },
  { type: "CHEST", label: "Torso", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_chest.jpg" },
  { type: "SHIRT", label: "Camisa", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_shirt.jpg" },
  { type: "TABARD", label: "Tabardo", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_tabard.jpg" },
  { type: "WRIST", label: "Pulsos", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_wrists.jpg" },
];

export const RIGHT_PAPERDOLL_SLOTS: PaperdollSlotDef[] = [
  { type: "HANDS", label: "Mãos", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_hands.jpg" },
  { type: "WAIST", label: "Cintura", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_waist.jpg" },
  { type: "LEGS", label: "Pernas", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_legs.jpg" },
  { type: "FEET", label: "Pés", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_feet.jpg" },
  { type: "FINGER_1", label: "Dedo 1", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_finger.jpg" },
  { type: "FINGER_2", label: "Dedo 2", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_finger.jpg" },
  { type: "TRINKET_1", label: "Berloque 1", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_trinket.jpg" },
  { type: "TRINKET_2", label: "Berloque 2", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_trinket.jpg" },
];

export const BOTTOM_PAPERDOLL_SLOTS: PaperdollSlotDef[] = [
  { type: "MAIN_HAND", label: "Mão Principal", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_mainhand.jpg" },
  { type: "OFF_HAND", label: "Mão Secundária", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_offhand.jpg" },
  { type: "RANGED", label: "Longo Alcance / Relíquia", emptyIcon: "https://wow.zamimg.com/images/wow/icons/large/inventoryslot_ranged.jpg" },
];

export const QUALITY_STYLES: Record<
  string,
  { color: string; textClass: string; borderClass: string; glowClass: string; badgeBg: string }
> = {
  POOR: {
    color: "#9d9d9d",
    textClass: "text-[#9d9d9d]",
    borderClass: "border-[#9d9d9d]/60",
    glowClass: "shadow-[#9d9d9d]/10",
    badgeBg: "bg-[#9d9d9d]/15",
  },
  COMMON: {
    color: "#ffffff",
    textClass: "text-white",
    borderClass: "border-white/60",
    glowClass: "shadow-white/10",
    badgeBg: "bg-white/15",
  },
  UNCOMMON: {
    color: "#1eff00",
    textClass: "text-[#1eff00]",
    borderClass: "border-[#1eff00]/70",
    glowClass: "shadow-[#1eff00]/20",
    badgeBg: "bg-[#1eff00]/15",
  },
  RARE: {
    color: "#0070dd",
    textClass: "text-[#3b9eff]",
    borderClass: "border-[#0070dd]/80",
    glowClass: "shadow-[#0070dd]/30",
    badgeBg: "bg-[#0070dd]/20",
  },
  EPIC: {
    color: "#a335ee",
    textClass: "text-[#c65eff]",
    borderClass: "border-[#a335ee]/80",
    glowClass: "shadow-[#a335ee]/35",
    badgeBg: "bg-[#a335ee]/20",
  },
  LEGENDARY: {
    color: "#ff8000",
    textClass: "text-[#ff8000]",
    borderClass: "border-[#ff8000]/90",
    glowClass: "shadow-[#ff8000]/40",
    badgeBg: "bg-[#ff8000]/20",
  },
  ARTIFACT: {
    color: "#e6cc80",
    textClass: "text-[#e6cc80]",
    borderClass: "border-[#e6cc80]/80",
    glowClass: "shadow-[#e6cc80]/30",
    badgeBg: "bg-[#e6cc80]/20",
  },
  HEIRLOOM: {
    color: "#00ccff",
    textClass: "text-[#00ccff]",
    borderClass: "border-[#00ccff]/80",
    glowClass: "shadow-[#00ccff]/30",
    badgeBg: "bg-[#00ccff]/20",
  },
};

export function getQualityStyle(qualityType?: string) {
  return QUALITY_STYLES[qualityType || "COMMON"] || QUALITY_STYLES.COMMON;
}
