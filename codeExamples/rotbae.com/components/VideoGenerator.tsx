import React, { useState } from 'react';
import { generateStockVideo } from '../services/geminiService';
import { Play, Loader2, Square } from 'lucide-react';

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = await generateStockVideo(prompt);
      setVideoUrl(url);
    } catch (e) {
        console.error(e);
      setError("TRANSMISSION_FAILED. RETRY.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[500px] brutal-border-b flex flex-col md:flex-row">
      {/* Video Display Area */}
      <div className="w-full md:w-3/4 relative bg-gray-100 flex items-center justify-center min-h-[400px] overflow-hidden group">
        {isLoading ? (
          <div className="text-center">
            <Loader2 className="animate-spin w-16 h-16 mx-auto mb-4" />
            <p className="animate-pulse tracking-widest">RENDERING REALITY...</p>
          </div>
        ) : videoUrl ? (
          <video 
            src={videoUrl} 
            autoPlay 
            loop 
            muted 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="text-center p-8 opacity-50 select-none">
            <Square className="w-24 h-24 mx-auto mb-4 stroke-1" />
            <h2 className="text-4xl font-bold tracking-tighter">NO SIGNAL</h2>
            <p className="mt-2 text-sm">INITIATE SEQUENCE TO VIEW MEDIA</p>
          </div>
        )}
        
        {/* Overlay Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-1/4 brutal-border-l bg-white flex flex-col justify-between p-0">
        <div className="p-4 border-b-2 border-black">
          <h3 className="font-bold text-lg mb-2">LIVE FEED CONTROL</h3>
          <p className="text-xs mb-4 text-gray-500">
            Generate new stock footage for the Rotbae collection. 
            Powered by Veo. Paid key required.
          </p>
        </div>

        <div className="flex-grow p-4 flex flex-col justify-end gap-4">
             {error && (
                <div className="bg-red-600 text-white text-xs p-2 font-bold">
                    ERROR: {error}
                </div>
             )}
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="DESCRIBE THE SCENE // E.G. MODEL WALKING IN RAIN"
                className="w-full h-32 p-2 border-2 border-black text-sm uppercase resize-none rounded-none focus:bg-yellow-50"
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-4 bg-black text-white font-bold hover:bg-white hover:text-black border-2 border-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? <Loader2 className="animate-spin h-4 w-4"/> : <Play className="h-4 w-4" />}
                {isLoading ? "PROCESSING..." : "GENERATE FEED"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerator;