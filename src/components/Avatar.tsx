import { getInitials } from '@/lib/format';

const palette = [
  'bg-brand-500',
  'bg-success-500',
  'bg-warning-500',
  'bg-accent-500',
  'bg-danger-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-rose-500',
];

function pickColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export function Avatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string;
  photoUrl?: string | null;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${pickColor(name)}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {getInitials(name)}
    </div>
  );
}
