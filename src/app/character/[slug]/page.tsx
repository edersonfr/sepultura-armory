import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCharacterFullProfile } from "@/lib/blizzard";
import { CharacterArmoryClient } from "@/components/CharacterArmoryClient";
import { characterTalentTree } from "@/lib/character-talents";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const character = await getCharacterFullProfile(slug);

  if (!character) {
    return {
      title: "Personagem não encontrado • Sepultura Armory",
    };
  }

  return {
    title: `${character.fullName} (Nv. ${character.level} ${character.classInfo.name}) • Sepultura Armory`,
    description: `Inspecione equipamentos, atributos e talentos de ${character.fullName} (${character.raceName} ${character.classInfo.name}) da guilda Sepultura no World of Warcraft: Forever.`,
  };
}

export default async function CharacterArmoryPage({ params }: PageProps) {
  const { slug } = await params;
  const character = await getCharacterFullProfile(slug);

  if (!character) {
    notFound();
  }

  const talentTree = characterTalentTree(character);

  return <CharacterArmoryClient character={character} talentTree={talentTree} />;
}
