import React, { useEffect, useState } from 'react';
import VideoGenerator from './components/VideoGenerator';
import ProductCard from './components/ProductCard';
import Marquee from './components/Marquee';
import BookingForm from './components/BookingForm';
import { generateManifesto } from './services/geminiService';
import { ArrowDown } from 'lucide-react';

const App: React.FC = () => {
  const [manifesto, setManifesto] = useState("LOADING PROPAGANDA...");

  useEffect(() => {
    generateManifesto().then(setManifesto).catch(() => setManifesto("ROTBAE // DIGITAL BRUTALISM"));
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-[1600px] mx-auto border-x-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] my-4">
      {/* Header */}
      <header className="flex justify-between items-center p-4 border-b-2 border-black sticky top-0 bg-white z-50">
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter">ROTBAE&copy;</h1>
        <div className="hidden md:block text-right">
            <p className="text-xs font-mono">EST. 2024</p>
            <p className="text-xs font-mono">SECTOR 7G</p>
        </div>
        <button className="md:hidden font-bold border-2 border-black px-2 py-1">MENU</button>
      </header>

      {/* Marquee 1 */}
      <Marquee text="NEW ARRIVALS DETECTED // ARTIFICIAL INTELLIGENCE INTEGRATED // VEO VIDEO SYNTHESIS ACTIVE" />

      {/* Hero / Video Section */}
      <section className="relative">
        <VideoGenerator />
        <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-2 hidden md:block">
            <span className="text-xs font-bold block">STATUS: ONLINE</span>
            <span className="text-xs font-bold block text-red-600 animate-pulse">RECORDING...</span>
        </div>
      </section>

      {/* Manifesto */}
      <section className="p-8 md:p-24 border-b-2 border-black text-center bg-black text-white">
        <p className="text-2xl md:text-4xl font-bold uppercase leading-tight max-w-4xl mx-auto">
          "{manifesto}"
        </p>
        <ArrowDown className="mx-auto mt-8 animate-bounce w-8 h-8" />
      </section>

      {/* Product Grid */}
      <section className="border-b-2 border-black">
        <div className="p-4 border-b-2 border-black bg-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-bold uppercase">Inventory_V2.0</h2>
            <span className="text-xs font-mono">[GENERATE_TO_VIEW]</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <ProductCard initialName="Oversized Hoodie" initialPrice="$120.00" />
            <ProductCard initialName="Tactical Vest" initialPrice="$250.00" />
            <ProductCard initialName="Platform Boots" initialPrice="$300.00" />
            <ProductCard initialName="Distressed Denim" initialPrice="$180.00" />
        </div>
      </section>

      {/* Marquee 2 */}
      <Marquee text="CONSUME // REPLICATE // UPLOAD // DOWNLOAD // CONSUME // REPLICATE" />

      {/* Booking / Contact */}
      <BookingForm />

      {/* Footer */}
      <footer className="p-4 flex justify-between items-end bg-gray-100 text-xs font-bold">
        <div>
            <p>ROTBAE INTERNATIONAL</p>
            <p>NO RIGHTS RESERVED.</p>
        </div>
        <div className="text-right">
            <a href="#" className="block hover:underline">INSTAGRAM</a>
            <a href="#" className="block hover:underline">TWITTER</a>
            <a href="#" className="block hover:underline">DARKWEB</a>
        </div>
      </footer>
    </div>
  );
};

export default App;