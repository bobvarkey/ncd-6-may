import { ExternalLink, Image } from "lucide-react";

interface ImageLinkProps {
  imageId: string;
  label: string;
  className?: string;
}

/**
 * Replaces an inline image with a link to the Image Gallery page.
 * Clicking opens the image gallery with the search pre-filled.
 */
export default function ImageLink({ imageId, label, className = "" }: ImageLinkProps) {
  return (
    <a
      href={`/images?search=${encodeURIComponent(label)}`}
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 underline decoration-dotted underline-offset-2 transition-colors ${className}`}
    >
      <Image className="h-3.5 w-3.5" />
      <span>{label}</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground" />
    </a>
  );
}
