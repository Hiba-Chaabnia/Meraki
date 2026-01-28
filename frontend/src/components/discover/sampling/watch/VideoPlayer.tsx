import { ExternalLinkIcon } from "@/components/ui/Icons";

interface VideoPlayerProps {
  url: string;
  title: string;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : null;
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const youtubeId = getYouTubeId(url);

  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black">
      {youtubeId ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white hover:underline"
          >
            Open video <ExternalLinkIcon className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
