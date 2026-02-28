import { ImagePlus, X } from "lucide-react";

interface BarberGalleryProps {
  isEditing: boolean;
  images: string[];
}

const placeholders = [
  "bg-gradient-to-br from-primary/20 to-secondary",
  "bg-gradient-to-br from-secondary to-primary/10",
  "bg-gradient-to-br from-primary/15 to-secondary/80",
  "bg-gradient-to-br from-secondary/80 to-primary/20",
  "bg-gradient-to-br from-primary/10 to-secondary",
  "bg-gradient-to-br from-secondary to-primary/15",
];

export function BarberGallery({ isEditing, images }: BarberGalleryProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold text-foreground mb-4">Portfólio</h2>
      <div className="grid grid-cols-3 gap-2">
        {placeholders.map((bg, i) => (
          <div
            key={i}
            className={`relative aspect-square rounded-lg ${bg} flex items-center justify-center overflow-hidden`}
          >
            {images[i] ? (
              <>
                <img src={images[i]} alt={`Portfolio ${i + 1}`} className="h-full w-full object-cover" />
                {isEditing && (
                  <button className="absolute top-1.5 right-1.5 rounded-full bg-destructive/90 p-1">
                    <X className="h-3 w-3 text-destructive-foreground" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Scissors className="h-6 w-6" />
                {isEditing && <span className="text-[10px]">Adicionar</span>}
              </div>
            )}
          </div>
        ))}
        {isEditing && (
          <button className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 transition-colors">
            <ImagePlus className="h-6 w-6" />
            <span className="text-[10px]">Upload</span>
          </button>
        )}
      </div>
    </div>
  );
}

function Scissors(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>
    </svg>
  );
}
