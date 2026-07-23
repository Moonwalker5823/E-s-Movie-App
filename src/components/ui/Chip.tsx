interface Props {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

/** Pill filter/tab used for leagues, categories, etc. */
export default function Chip({ active, onClick, children }: Props) {
  return (
    <button onClick={onClick} data-focusable className={`chip ${active ? "chip-active" : ""}`}>
      {children}
    </button>
  );
}
