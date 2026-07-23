interface Props {
  className?: string;
}

/** Loading placeholder with the brand shimmer. */
export default function Skeleton({ className = "" }: Props) {
  return <div className={`shimmer rounded-xl ${className}`} />;
}

export function PosterSkeletonRow({ count = 8 }: { count?: number }) {
  return (
    <div className="rail no-scrollbar">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-[2/3] w-[9.5rem] shrink-0 sm:w-[10.5rem]" />
      ))}
    </div>
  );
}
