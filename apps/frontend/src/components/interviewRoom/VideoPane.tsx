import React, { useEffect, useRef } from 'react';

type VideoPaneProps = {
  roomUrl: string | null;
  error: string | null;
};

const VideoPane: React.FC<VideoPaneProps> = React.memo(({ roomUrl, error }) => {
  const srcRef = useRef<string | null>(null);

  // Only update the iframe src when the URL actually changes
  useEffect(() => {
    if (roomUrl && roomUrl !== srcRef.current) {
      srcRef.current = roomUrl;
    }
  }, [roomUrl]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (srcRef.current) {
    return (
      <iframe
        src={srcRef.current}
        title="Video Call"
        allow="camera; microphone; fullscreen; display-capture"
        style={{ width: '100%', height: '100%', border: 0, borderRadius: '1rem' }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-gray-400 text-lg">Loading meeting room...</div>
    </div>
  );
});

export default VideoPane;