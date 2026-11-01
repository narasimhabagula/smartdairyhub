import { useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { src: string; label?: string };

export default function CattleVideo({ src, label = "Animal video" }: Props) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  return (
    <div className="space-y-2">
      <video
        key={`${src}-${attempt}`}
        src={src}
        aria-label={label}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-lg border border-border bg-muted object-contain"
        onError={() => setFailed(true)}
        onLoadedData={() => setFailed(false)}
      />
      {failed && (
        <div role="alert" className="space-y-2 rounded-md border border-border bg-muted p-3 text-sm">
          <p>This video couldn’t play. Try again, or download it to watch on your device.</p>
          <p className="text-muted-foreground">If it still won’t play, ask the seller for an MP4 using H.264 video and AAC audio.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>
              <RotateCcw className="mr-2 h-4 w-4" /> Retry video
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={src} target="_blank" rel="noopener noreferrer" download><Download className="mr-2 h-4 w-4" /> Download video</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}