import React from 'react';

const BookingForm: React.FC = () => {
  return (
    <div className="p-8 md:p-16 border-b-2 border-black bg-white">
        <h2 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter">JOIN THE CULT</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black">
            <div className="p-4 border-b-2 md:border-b-0 md:border-r-2 border-black">
                <label className="block font-bold mb-2 uppercase text-xs">Identity String (Name)</label>
                <input type="text" className="w-full bg-gray-100 p-4 border-b-2 border-black rounded-none focus:bg-white" placeholder="JOHN DOE" />
            </div>
            <div className="p-4">
                 <label className="block font-bold mb-2 uppercase text-xs">Comm Channel (Email)</label>
                 <input type="email" className="w-full bg-gray-100 p-4 border-b-2 border-black rounded-none focus:bg-white" placeholder="USER@DOMAIN.COM" />
            </div>
            <div className="col-span-1 md:col-span-2 p-4 border-t-2 border-black">
                 <label className="block font-bold mb-2 uppercase text-xs">Manifesto / Request</label>
                 <textarea className="w-full bg-gray-100 p-4 h-32 border-b-2 border-black rounded-none focus:bg-white resize-none" placeholder="I WANT TO CONSUME." />
            </div>
        </div>
        <button className="mt-8 px-8 py-4 bg-black text-white text-xl font-bold uppercase hover:bg-white hover:text-black border-2 border-black w-full md:w-auto">
            SUBMIT DATA
        </button>
    </div>
  );
};

export default BookingForm;