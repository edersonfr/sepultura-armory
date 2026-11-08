import { getClassInfo, getRaceName, getRankLabel, ClassInfo } from "./wow-constants";

const REGION = process.env.NEXT_PUBLIC_WOW_REGION || "us";
const LOCALE = process.env.NEXT_PUBLIC_WOW_LOCALE || "pt_BR";
const DEFAULT_GUILD_SLUG = process.env.NEXT_PUBLIC_GUILD_SLUG || "sepultura";
const PROFILE_NAMESPACE = `profile-forever-${REGION}`;

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getBlizzardAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Credenciais BLIZZARD_CLIENT_ID e BLIZZARD_CLIENT_SECRET não configuradas no .env.local"
    );
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Falha ao autenticar na Battle.net OAuth (${res.status})`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 86400) * 1000,
  };

  return cachedToken.token;
}

/**
 * Resolve nomes de raças que não estão em WOW_RACES (ex.: raças novas do
 * WoW: Forever) consultando a API de dados estáticos. Cache de 24h.
 */
async function resolveUnknownRaceNames(raceIds: number[]): Promise<Map<number, string>> {
  const names = new Map<number, string>();
  const missing = Array.from(new Set(raceIds)).filter((id) => getRaceName(id).startsWith("Raça #"));
  const namespaces = [`static-forever-${REGION}`, `static-classic-${REGION}`, `static-${REGION}`];

  await Promise.all(
    missing.map(async (id) => {
      for (const ns of namespaces) {
        const data = await blizzardFetch<any>(
          `https://${REGION}.api.blizzard.com/data/wow/playable-race/${id}?namespace=${ns}`,
          86400
        ).catch(() => null);
        if (data?.name) {
          names.set(id, data.name);
          return;
        }
      }
    })
  );
  return names;
}

async function blizzardFetch<T>(
  urlOrPath: string,
  revalidateSeconds = 300
): Promise<T | null> {
  const token = await getBlizzardAccessToken();
  const fullUrl = urlOrPath.startsWith("http")
    ? `${urlOrPath}${urlOrPath.includes("locale=") ? "" : `&locale=${LOCALE}`}`
    : `https://${REGION}.api.blizzard.com${urlOrPath}${
        urlOrPath.includes("?") ? "&" : "?"
      }namespace=${PROFILE_NAMESPACE}&locale=${LOCALE}`;

  const res = await fetch(fullUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<T>;
}

export interface GuildMemberEnriched {
  id: number;
  name: string;
  surname: string;
  fullName: string;
  slug: string;
  level: number;
  rank: number;
  rankLabel: string;
  classId: number;
  classInfo: ClassInfo;
  raceId: number;
  raceName: string;
  faction: string;
  armoryAvailable: boolean;
}

export interface GuildDataResponse {
  id: number;
  name: string;
  slug: string;
  faction: {
    type: string;
    name: string;
  };
  ruleset: {
    id: number;
    name: string;
  };
  memberCount: number;
  createdTimestamp: number;
  members: GuildMemberEnriched[];
  stats: {
    totalMembers: number;
    level60Count: number;
    level20PlusCount: number;
    armoryReadyCount: number;
    highestLevel: number;
    averageLevel: number;
    classBreakdown: Array<{
      classInfo: ClassInfo;
      count: number;
      percentage: number;
    }>;
  };
}

export async function getGuildData(
  guildSlug: string = DEFAULT_GUILD_SLUG
): Promise<GuildDataResponse> {
  const [guildInfo, rosterData] = await Promise.all([
    blizzardFetch<any>(`/data/wow/guild/${guildSlug}`, 300),
    blizzardFetch<any>(`/data/wow/guild/${guildSlug}/roster`, 300),
  ]);

  if (!guildInfo || !rosterData) {
    throw new Error(`Não foi possível carregar os dados da guilda "${guildSlug}".`);
  }

  const rawMembers: any[] = rosterData.members || [];
  const extraRaceNames = await resolveUnknownRaceNames(
    rawMembers.map((e) => e.character?.playable_race?.id).filter(Boolean)
  );

  const members: GuildMemberEnriched[] = rawMembers
    .map((entry) => {
      const char = entry.character;
      const classId = char.playable_class?.id || 1;
      const raceId = char.playable_race?.id || 1;
      const classInfo = getClassInfo(classId);
      const raceName =
        char.playable_race?.name || extraRaceNames.get(raceId) || getRaceName(raceId);
      const surname = char.surname || "";
      const fullName = surname ? `${char.name} ${surname}` : char.name;
      const rank = typeof entry.rank === "number" ? entry.rank : 9;

      return {
        id: char.id,
        name: char.name,
        surname,
        fullName,
        slug: char.slug,
        level: char.level || 1,
        rank,
        rankLabel: getRankLabel(rank),
        classId,
        classInfo,
        raceId,
        raceName,
        faction: char.faction?.type || guildInfo.faction?.type || "HORDE",
        armoryAvailable: (char.level || 1) >= 10,
      };
    })
    .sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.fullName.localeCompare(b.fullName);
    });

  const totalMembers = members.length;
  const level60Count = members.filter((m) => m.level >= 60).length;
  const level20PlusCount = members.filter((m) => m.level >= 20).length;
  const armoryReadyCount = members.filter((m) => m.level >= 10).length;
  const highestLevel = members.reduce((max, m) => Math.max(max, m.level), 1);
  const averageLevel =
    totalMembers > 0
      ? Math.round(
          (members.reduce((acc, m) => acc + m.level, 0) / totalMembers) * 10
        ) / 10
      : 1;

  const classMap = new Map<number, number>();
  for (const m of members) {
    classMap.set(m.classId, (classMap.get(m.classId) || 0) + 1);
  }

  const classBreakdown = Array.from(classMap.entries())
    .map(([classId, count]) => ({
      classInfo: getClassInfo(classId),
      count,
      percentage: totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    id: guildInfo.id,
    name: guildInfo.name || "Sepultura",
    slug: guildInfo.slug || guildSlug,
    faction: guildInfo.faction || { type: "HORDE", name: "Horda" },
    ruleset: guildInfo.ruleset || { id: 2, name: "Normal" },
    memberCount: guildInfo.member_count || totalMembers,
    createdTimestamp: guildInfo.created_timestamp || Date.now(),
    members,
    stats: {
      totalMembers,
      level60Count,
      level20PlusCount,
      armoryReadyCount,
      highestLevel,
      averageLevel,
      classBreakdown,
    },
  };
}

export interface EquippedItemEnriched {
  id: number;
  name: string;
  slotType: string;
  slotName: string;
  qualityType: string;
  qualityName: string;
  itemLevel: number;
  itemLevelDisplay: string;
  requiredLevel?: number;
  requiredLevelDisplay?: string;
  itemClass: string;
  itemSubclass: string;
  inventoryName: string;
  binding?: string;
  armorDisplay?: string;
  weaponInfo?: {
    damageDisplay: string;
    speedDisplay: string;
    dpsDisplay: string;
  };
  stats: Array<{
    displayString: string;
    isEquipBonus?: boolean;
  }>;
  spells: Array<{
    description: string;
  }>;
  enchantments: Array<{
    displayString: string;
  }>;
  durabilityDisplay?: string;
  sellPrice?: {
    header: string;
    gold: string;
    silver: string;
    copper: string;
  };
  iconUrl: string;
}

export interface CharacterFullProfile {
  slug: string;
  id: number;
  name: string;
  surname: string;
  fullName: string;
  level: number;
  genderName: string;
  factionName: string;
  factionType: string;
  raceId: number;
  raceName: string;
  classId: number;
  classInfo: ClassInfo;
  guildName: string;
  guildSlug: string;
  guildRank?: number;
  guildRankLabel?: string;
  equippedItemLevel: number;
  averageItemLevel: number;
  achievementPoints: number;
  honorableKills: number;
  pvpRank: number;
  lastLoginTimestamp?: number;
  avatarUrl?: string;
  mainRenderUrl?: string;
  isPartialFromRoster: boolean;
  equippedItems: Record<string, EquippedItemEnriched>;
  equippedItemsList: EquippedItemEnriched[];
  statistics: any | null;
  specializations: Array<{
    name: string;
    id: number;
    pointsSpent: number;
    talents: Array<{
      id: number;
      name: string;
      rank: number;
      spellId?: number;
      description: string;
      castTime?: string;
    }>;
  }>;
}

async function getItemIconUrl(mediaHref?: string): Promise<string> {
  const fallback =
    "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
  if (!mediaHref) return fallback;

  try {
    const mediaData = await blizzardFetch<any>(mediaHref, 86400);
    const iconAsset = mediaData?.assets?.find((a: any) => a.key === "icon");
    return iconAsset?.value || fallback;
  } catch {
    return fallback;
  }
}

export async function getCharacterFullProfile(
  rawSlug: string
): Promise<CharacterFullProfile | null> {
  const slug = rawSlug.toLowerCase().trim();

  const [
    profile,
    equipmentData,
    statisticsData,
    specData,
    mediaData,
    pvpData,
    guildData,
  ] = await Promise.all([
    blizzardFetch<any>(`/profile/wow/character/${slug}`, 300),
    blizzardFetch<any>(`/profile/wow/character/${slug}/equipment`, 300),
    blizzardFetch<any>(`/profile/wow/character/${slug}/statistics`, 300),
    blizzardFetch<any>(`/profile/wow/character/${slug}/specializations`, 300),
    blizzardFetch<any>(`/profile/wow/character/${slug}/character-media`, 300),
    blizzardFetch<any>(`/profile/wow/character/${slug}/pvp-summary`, 300),
    getGuildData().catch(() => null),
  ]);

  const rosterMember = guildData?.members.find((m) => m.slug === slug);

  // Caso o personagem seja < nível 10 (ainda não sincronizado no endpoint individual da Blizzard),
  // mas já faça parte do Roster da guilda Sepultura:
  if (!profile && rosterMember) {
    return {
      slug: rosterMember.slug,
      id: rosterMember.id,
      name: rosterMember.name,
      surname: rosterMember.surname,
      fullName: rosterMember.fullName,
      level: rosterMember.level,
      genderName: "Aventureiro(a)",
      factionName: rosterMember.faction === "HORDE" ? "Horda" : "Aliança",
      factionType: rosterMember.faction,
      raceId: rosterMember.raceId,
      raceName: rosterMember.raceName,
      classId: rosterMember.classId,
      classInfo: rosterMember.classInfo,
      guildName: guildData?.name || "Sepultura",
      guildSlug: guildData?.slug || "sepultura",
      guildRank: rosterMember.rank,
      guildRankLabel: rosterMember.rankLabel,
      equippedItemLevel: 0,
      averageItemLevel: 0,
      achievementPoints: 0,
      honorableKills: 0,
      pvpRank: 0,
      isPartialFromRoster: true,
      equippedItems: {},
      equippedItemsList: [],
      statistics: null,
      specializations: [],
    };
  }

  if (!profile) {
    return null;
  }

  const rawItems: any[] = equipmentData?.equipped_items || [];
  const enrichedItemsList: EquippedItemEnriched[] = await Promise.all(
    rawItems.map(async (item: any) => {
      const iconUrl = await getItemIconUrl(item.media?.key?.href);

      const weaponInfo = item.weapon
        ? {
            damageDisplay:
              item.weapon.damage?.display_string || "",
            speedDisplay:
              item.weapon.attack_speed?.display_string || "",
            dpsDisplay: item.weapon.dps?.display_string || "",
          }
        : undefined;

      const stats = (item.stats || []).map((st: any) => ({
        displayString:
          st.display?.display_string ||
          `+${st.value} ${st.type?.name || ""}`,
        isEquipBonus: Boolean(st.is_equip_bonus),
      }));

      const spells = (item.spells || []).map((sp: any) => ({
        description: sp.description || sp.spell?.name || "",
      }));

      const enchantments = (item.enchantments || []).map((enc: any) => ({
        displayString: enc.display_string || "",
      }));

      return {
        id: item.item?.id || 0,
        name: item.name || "Item Desconhecido",
        slotType: item.slot?.type || "UNKNOWN",
        slotName: item.slot?.name || "",
        qualityType: item.quality?.type || "COMMON",
        qualityName: item.quality?.name || "Comum",
        itemLevel: item.level?.value || 1,
        itemLevelDisplay:
          item.level?.display_string ||
          `Nível do Item: ${item.level?.value || 1}`,
        requiredLevel: item.requirements?.level?.value,
        requiredLevelDisplay: item.requirements?.level?.display_string,
        itemClass: item.item_class?.name || "",
        itemSubclass: item.item_subclass?.name || "",
        inventoryName: item.inventory_type?.name || item.slot?.name || "",
        binding: item.binding?.name,
        armorDisplay: item.armor?.display?.display_string,
        weaponInfo,
        stats,
        spells,
        enchantments,
        durabilityDisplay: item.durability?.display_string,
        sellPrice: item.sell_price?.display_strings,
        iconUrl,
      };
    })
  );

  const equippedItemsMap: Record<string, EquippedItemEnriched> = {};
  for (const item of enrichedItemsList) {
    equippedItemsMap[item.slotType] = item;
  }

  const computedAvgIlvl =
    enrichedItemsList.length > 0
      ? Math.round(
          enrichedItemsList.reduce((acc, i) => acc + i.itemLevel, 0) /
            enrichedItemsList.length
        )
      : 0;

  const assets: any[] = mediaData?.assets || [];
  const avatarUrl =
    assets.find((a) => a.key === "avatar")?.value ||
    assets.find((a) => a.key === "avatar-sd")?.value;
  const mainRenderUrl =
    assets.find((a) => a.key === "main-raw")?.value ||
    assets.find((a) => a.key === "main-sd-raw")?.value;

  const activeSpecGroup =
    specData?.specialization_groups?.find((g: any) => g.is_active) ||
    specData?.specialization_groups?.[0];

  const specializations = (activeSpecGroup?.specializations || []).map(
    (sp: any) => {
      const talents = (sp.talents || []).map((t: any) => ({
        id: t.talent?.id || 0,
        name: t.talent?.name || t.spell_tooltip?.spell?.name || "Talento",
        rank: t.talent_rank || 1,
        spellId: t.spell_tooltip?.spell?.id,
        description: t.spell_tooltip?.description || "",
        castTime: t.spell_tooltip?.cast_time,
      }));
      const pointsSpent = talents.reduce(
        (sum: number, t: { rank: number }) => sum + t.rank,
        0
      );

      return {
        name: sp.specialization?.name || "Especialização",
        id: sp.specialization?.id || 0,
        pointsSpent,
        talents,
      };
    }
  );

  const classId = profile.character_class?.id || rosterMember?.classId || 1;
  const raceId = profile.race?.id || rosterMember?.raceId || 1;
  const surname =
    equipmentData?.character?.surname ||
    specData?.character?.surname ||
    mediaData?.character?.surname ||
    rosterMember?.surname ||
    slug.split("-").slice(1).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");

  const fullName = surname ? `${profile.name} ${surname}` : profile.name;

  return {
    slug,
    id: profile.id,
    name: profile.name,
    surname,
    fullName,
    // O roster às vezes atualiza antes do perfil individual: usa o maior nível conhecido.
    level: Math.max(profile.level || 1, rosterMember?.level || 1),
    genderName: profile.gender?.name || "",
    factionName: profile.faction?.name || "Horda",
    factionType: profile.faction?.type || "HORDE",
    raceId,
    raceName: profile.race?.name || rosterMember?.raceName || getRaceName(raceId),
    classId,
    classInfo: getClassInfo(classId),
    guildName: profile.guild?.name || "Sepultura",
    guildSlug: profile.guild?.slug || "sepultura",
    guildRank: rosterMember?.rank,
    guildRankLabel: rosterMember?.rankLabel,
    equippedItemLevel: profile.equipped_item_level || computedAvgIlvl,
    averageItemLevel: profile.average_item_level || computedAvgIlvl,
    achievementPoints: profile.achievement_points || 0,
    honorableKills: pvpData?.honorable_kills || 0,
    pvpRank: pvpData?.pvp_rank || 0,
    lastLoginTimestamp: profile.last_login_timestamp,
    avatarUrl,
    mainRenderUrl,
    isPartialFromRoster: false,
    equippedItems: equippedItemsMap,
    equippedItemsList: enrichedItemsList,
    statistics: statisticsData,
    specializations,
  };
}
