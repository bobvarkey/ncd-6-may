import { ExternalLink, Image } from "lucide-react";

interface ImageLinkProps {
  imageId: string;
  label: string;
  className?: string;
}

/**
 * Replaces an inline image with a link to the Image Gallery page.
 * Clicking opens the image gallery focused on that image.
 *
 * The link carries the catalog `imageId` (not the display label) so the gallery
 * can resolve it exactly. Linking by label only worked when the label happened
 * to be a substring of a catalog label/description — which was true for 1 of
 * 62 call sites, so every other "View ..." link landed on an empty gallery.
 */
export default function ImageLink({ imageId, label, className = "" }: ImageLinkProps) {
  return (
    <a
      href={`/images?image=${encodeURIComponent(imageId)}`}
      className={`inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 underline decoration-dotted underline-offset-2 transition-colors ${className}`}
    >
      <Image className="h-3.5 w-3.5" />
      <span>{label}</span>
      <ExternalLink className="h-3 w-3 text-muted-foreground" />
    </a>
  );
}
