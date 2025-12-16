import React, { useState } from 'react';
import { generateProductImage } from '../services/geminiService';
import { RefreshCw, Camera } from 'lucide-react';

interface ProductCardProps {
  initialName: string;
  initialPrice: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ initialName, initialPrice }) => {
  const [image, setImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleGenerate = async () => {
    if (!customPrompt && !image) {
        // First generic generation if empty
        setShowInput(true);
        return;
    }
    
    setIsGenerating(true);
    try {
      const finalPrompt = customPrompt || initialName;
      const result = await generateProductImage(finalPrompt);
      setImage(result);
      setShowInput(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border-r-2 border-b-2 border-black p-4 flex flex-col min-h-[400px] relative group hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-xl uppercase max-w-[70%]">{initialName}</h3>
        <span className="font-mono text-sm bg-black text-white px-1">{initialPrice}</span>
      </div>

      <div className="flex-grow relative flex items-center justify-center border-2 border-black mb-4 overflow-hidden bg-white">
        {image ? (
          <img src={image} alt="Generated" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
        ) : (
          <div className="text-gray-300 flex flex-col items-center">
             <Camera className="w-12 h-12 mb-2" />
             <span className="text-xs font-mono">NO IMAGE DATA</span>
          </div>
        )}
        
        {isGenerating && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <RefreshCw className="animate-spin w-8 h-8" />
            </div>
        )}
      </div>

      {showInput ? (
          <div className="mb-2">
              <input 
                type="text" 
                autoFocus
                placeholder="DEFINE VISUALS..."
                className="w-full border-b-2 border-black bg-transparent text-sm p-1 font-mono uppercase"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
          </div>
      ) : null}

      <button 
        onClick={() => setShowInput(!showInput)}
        className="text-xs underline text-left mb-2 decoration-1 hover:bg-black hover:text-white inline-block w-max px-1"
      >
        {showInput ? "CANCEL" : "CUSTOMIZE_SPEC_"}
      </button>

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-2 border-2 border-black font-bold text-sm uppercase hover:bg-black hover:text-white transition-all disabled:opacity-50"
      >
        {isGenerating ? "FABRICATING..." : (image ? "RE-GENERATE" : "VISUALIZE ITEM")}
      </button>
    </div>
  );
};

export default ProductCard;