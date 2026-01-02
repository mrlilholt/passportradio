import React from 'react';
import { Trophy, Globe, Loader, Radio, AlertCircle } from 'lucide-react';

const GameView = ({ gameScore, highScore, gameRoundData, isGameLoading, startNewGameRound, handleGameGuess, handleGameSkip }) => (
    <div className="p-6 flex flex-col items-center h-full animate-fade-in pb-24 overflow-y-auto">
        <div className="w-full flex justify-between items-center mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-passport-teal text-slate-900 p-2 rounded-lg"><Trophy size={24} /></div>
                <div><h3 className="font-bold text-lg leading-none">Score: {gameScore}</h3><p className="text-xs text-white/50 uppercase tracking-widest mt-1">Session Best: <span className="text-passport-teal font-bold">{highScore}</span></p></div>
            </div>
            {gameScore > 0 && gameScore >= highScore && <div className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/50 animate-pulse">NEW RECORD!</div>}
        </div>
        <div className="flex-1 w-full max-w-sm flex flex-col justify-center items-center">
            {!gameRoundData && !isGameLoading && (
                <div className="text-center">
                    <Globe size={64} className="mx-auto text-passport-teal mb-4 animate-pulse" />
                    <h2 className="text-2xl font-bold mb-2">Ready to Travel?</h2>
                    <p className="text-white/60 mb-6">Listen to a random radio station and guess where it is broadcasting from.</p>
                    <button onClick={startNewGameRound} className="bg-white text-passport-dark font-bold px-8 py-3 rounded-full text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition active:scale-95">Start Game</button>
                </div>
            )}
            {isGameLoading && (
                <div className="flex flex-col items-center animate-pulse"><Loader className="animate-spin mb-4 text-passport-teal" size={48} /><p className="text-sm font-bold uppercase tracking-widest">Tuning in...</p></div>
            )}
            {gameRoundData && (
                <div className="w-full space-y-4 animate-fade-in">
                    <div className="relative w-32 h-32 mx-auto bg-black/50 rounded-full border-4 border-white/10 flex items-center justify-center mb-6 shadow-xl">
                        {gameRoundData.hasGuessed ? <img src={gameRoundData.station.favicon} onError={(e) => e.target.style.display = 'none'} className="w-full h-full object-cover rounded-full opacity-80" alt="station" /> : <div className="animate-pulse"><Radio size={48} className="text-white/50" /></div>}
                        {gameRoundData.hasGuessed && <div className={`absolute -bottom-2 -right-2 p-2 rounded-full border-2 border-white ${gameRoundData.userCorrect ? 'bg-green-500' : 'bg-red-500'}`}>{gameRoundData.userCorrect ? <Trophy size={20} className="text-white" /> : <AlertCircle size={20} className="text-white" />}</div>}
                    </div>
                    <h3 className="text-center text-xl font-bold mb-4">{gameRoundData.hasGuessed ? (gameRoundData.userCorrect ? "Correct! +1 Point" : `Nope! It was ${gameRoundData.correctAnswer}`) : "Where is this station?"}</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {gameRoundData.options.map((country, idx) => {
                            let btnClass = "bg-white/10 hover:bg-white/20 border-white/10";
                            if (gameRoundData.hasGuessed) {
                                if (country === gameRoundData.correctAnswer) btnClass = "bg-green-500 text-white border-green-500";
                                else if (country !== gameRoundData.correctAnswer && !gameRoundData.userCorrect) btnClass = "opacity-50 bg-red-500/20";
                            }
                            return <button key={idx} disabled={gameRoundData.hasGuessed} onClick={() => handleGameGuess(country)} className={`p-3 rounded-xl border font-bold text-left text-sm transition-all truncate ${btnClass}`}>{country}</button>
                        })}
                    </div>
                    {!gameRoundData.hasGuessed && <button onClick={handleGameSkip} className="w-full mt-2 py-3 text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition">Skip / Give Up</button>}
                    {gameRoundData.hasGuessed && <button onClick={startNewGameRound} className="w-full mt-4 bg-white text-passport-dark font-bold py-3 rounded-xl hover:scale-105 transition shadow-lg">Next Round →</button>}
                </div>
            )}
        </div>
    </div>
);

export default GameView;