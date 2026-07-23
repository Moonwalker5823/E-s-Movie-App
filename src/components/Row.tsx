import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PosterCard from "./PosterCard";
import Heading from "./ui/Heading";
import HScroll from "./ui/HScroll";
import { PosterSkeletonRow } from "./ui/Skeleton";
import type { TmdbItem } from "../lib/types";

interface Props {
  title: string;
  emoji?: string;
  load: () => Promise<TmdbItem[]>;
}

/** A titled horizontal rail of posters. Hides itself if the source is empty. */
export default function Row({ title, emoji, load }: Props) {
  const [items, setItems] = useState<TmdbItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    load()
      .then((r) => alive && setItems(r.filter((i) => i.poster_path).slice(0, 20)))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error || (items && items.length === 0)) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
    >
      <Heading emoji={emoji} className="mb-3 px-4 sm:px-8">
        {title}
      </Heading>

      {items ? (
        <HScroll>
          {items.map((i) => (
            <PosterCard key={`${i.media_type}-${i.id}`} item={i} />
          ))}
        </HScroll>
      ) : (
        <PosterSkeletonRow />
      )}
    </motion.section>
  );
}
