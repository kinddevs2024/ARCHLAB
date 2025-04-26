import React from 'react';
import getYearsFrom2024ToNow from '../year';

const Hed = () => {
    return (
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Loyihalar</h1>

            <div className="flex justify-center space-x-2 mb-6">
              {getYearsFrom2024ToNow().map((yr) => (
                <button
                  key={yr}
                  onClick={() => setYear(yr)}
                  className={`px-4 py-2 rounded-full ${
                    year === yr ? "bg-white text-black" : "bg-gray-700"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            <button className="bg-orange-300 hover:bg-orange-400 text-black font-semibold py-2 px-4 rounded-lg">
              Yangi loyiha
            </button>
          </div>
    );
};

export default Hed;