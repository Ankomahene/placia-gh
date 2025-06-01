import { cn } from '@/lib/utils';
import { categoryIcons } from '@/lib/icons/category-icons';

interface IconRendererProps {
  icon: string;
  className?: string;
}

export function IconRenderer({ icon, className }: IconRendererProps) {
  // Check if the icon is a predefined category icon
  const categoryIcon = categoryIcons.find((cat) => cat.id === icon);

  if (categoryIcon) {
    return <categoryIcon.icon className={cn('w-5 h-5', className)} />;
  }

  // If not a category icon, assume it's a custom SVG string
  if (icon.startsWith('<svg')) {
    return (
      <div
        className={cn('w-5 h-5', className)}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }

  // Fallback for invalid icons
  return null;
}
