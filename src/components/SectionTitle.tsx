interface Props {
  index?: string;
  title: string;
  description?: string;
  id?: string;
}

/** Cabeçalho de seção do Códice da Horda: número · título Cinzel · filete · descrição. */
export function SectionTitle({ index, title, description, id }: Props) {
  return (
    <div id={id} className="flex items-center gap-4 scroll-mt-24">
      {index && <span className="font-display text-xs text-pedra">{index}</span>}
      <h2 className="font-display text-lg sm:text-xl font-bold text-marfim">
        {title}
      </h2>
      <span className="section-rule" aria-hidden="true" />
      {description && (
        <span className="hidden sm:block text-xs text-pedra">{description}</span>
      )}
    </div>
  );
}
