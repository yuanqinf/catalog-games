import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface GameDetailSectionProps {
  title: string;
  items?: string[];
  icon: LucideIcon;
  className?: string;
}

export default function GameDetailSection({
  title,
  items,
  icon: Icon,
  className = '',
}: GameDetailSectionProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={className}>
      <h4 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
        <Icon className="h-4 w-4" />
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge variant="outline" key={item} className="px-3 py-1 text-sm">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}
