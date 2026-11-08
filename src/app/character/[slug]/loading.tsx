export default function LoadingCharacterArmory() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 rounded-lg bg-onix" />
      <div className="h-36 w-full rounded-lg bg-onix" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 h-[540px] rounded-lg bg-onix" />
        <div className="xl:col-span-4 h-[540px] rounded-lg bg-onix" />
      </div>
    </div>
  );
}
