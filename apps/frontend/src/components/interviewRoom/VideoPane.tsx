import React from 'react';

type VideoPaneProps = {
  roomUrl: string | null;
  error: string | null;
};

const VideoPane: React.FC<VideoPaneProps> = React.memo(({ roomUrl, error }) => {
  

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (roomUrl) {
    return (
      <iframe
        src={roomUrl}
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