import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DECK, SPREADS, TRANSLATIONS } from './constants';
import { AppState, CardState, SpreadDef, Language } from './types';
import Scene from './components/Scene';
import { getTarotReading, getFullSpreadReading } from './services/geminiService';

// --- ANIMATION CONSTANTS ---
const CAMERA_TILT_X = 0.28; 
const TABLE_HEIGHT = 0;

// Helper: Wait function for async animations
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper: Markdown Parser ---
const formatReadingText = (text: string) => {
    if (!text) return null;
    let cleanText = text.replace(/\*\*\*/g, '**');
    const blocks = cleanText.split(/\n\n+/);
    return blocks.map((block, index) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('###')) {
            return <h3 key={index} className="text-lg text-[#a8c7fa] mt-6 mb-3 font-medium border-b border-[#444746] pb-2">{parseInlineFormatting(trimmed.replace(/^###\s*/, ''))}</h3>;
        }
        if (trimmed.startsWith('##')) {
            return <h2 key={index} className="text-xl font-bold text-[#e3e3e3] mt-8 mb-4 font-serif">{parseInlineFormatting(trimmed.replace(/^##\s*/, ''))}</h2>;
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('* ')) {
            const items = trimmed.split(/\n/).map((line, i) => <li key={i} className="mb-2 pl-4 border-l-2 border-[#a8c7fa] ml-1"><span className="text-[#c4c7c5] leading-relaxed">{parseInlineFormatting(line.replace(/^[-*]\s*/, ''))}</span></li>);
            return <ul key={index} className="mb-4 space-y-1">{items}</ul>;
        }
        return <p key={index} className="text-[#e3e3e3] text-base leading-7 mb-4 font-light text-justify">{parseInlineFormatting(trimmed)}</p>;
    });
};
const parseInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i} className="text-[#d3e3fd] font-bold mx-1">{part.slice(2, -2)}</strong> : part.replace(/\*/g, ''));
};

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.INTRO);
  const [selectedSpread, setSelectedSpread] = useState<SpreadDef>(SPREADS[1]); // Default to 3 Card
  const [language, setLanguage] = useState<Language>(Language.CN);
  const [deck, setDeck] = useState<CardState[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Reading States
  const [readings, setReadings] = useState<Record<string, string>>({});
  const [isLoadingReading, setIsLoadingReading] = useState(false);
  const [showFullReading, setShowFullReading] = useState(false);
  const [fullReadingText, setFullReadingText] = useState<string | null>(null);
  const [isGeneratingFull, setIsGeneratingFull] = useState(false);

  const t = TRANSLATIONS[language];

  // Helper to get localized string from card
  const getCardName = (card: CardState) => language === Language.VN ? card.data.name_vn : card.data.name_cn;
  const getCardMeaning = (card: CardState) => language === Language.VN ? card.data.meaning_upright_vn : card.data.meaning_upright_cn;
  const getCardKeywords = (card: CardState) => language === Language.VN ? card.data.keywords_vn : card.data.keywords_cn;

  // Check if all spread cards are flipped
  const allCardsFlipped = React.useMemo(() => {
    if (!selectedSpread || deck.length === 0) return false;
    const spreadCards = deck.slice(0, selectedSpread.positions.length);
    return spreadCards.every(c => c.isFlipped);
  }, [deck, selectedSpread]);

  // Initial Setup: Create Deck and position 3 Hero cards
  useEffect(() => {
    const initialDeck: CardState[] = DECK.map((data, index) => ({
      data,
      isReversed: false,
      isFlipped: false,
      position: [0, -10, -5], // Default hidden below
      rotation: [0, Math.PI, 0],
      uuid: uuidv4()
    }));

    // Position first 3 cards for Intro Display (Fool, Magician, Priestess)
    initialDeck[0].position = [-4, 0, 0];
    initialDeck[0].rotation = [CAMERA_TILT_X, 0, 0]; // Face up
    initialDeck[0].isFlipped = true;

    initialDeck[1].position = [0, 0, 0];
    initialDeck[1].rotation = [CAMERA_TILT_X, 0, 0];
    initialDeck[1].isFlipped = true;

    initialDeck[2].position = [4, 0, 0];
    initialDeck[2].rotation = [CAMERA_TILT_X, 0, 0];
    initialDeck[2].isFlipped = true;

    setDeck(initialDeck);
  }, []);

  // --- VORTEX SHUFFLE ANIMATION ---
  const startShuffle = useCallback(async () => {
    if (appState === AppState.SHUFFLING) return;
    
    // 1. Reset the 3 intro cards to face down and join the "pile" center
    setDeck(prev => prev.map(c => ({
        ...c,
        isFlipped: false,
        // Move to center before vortex
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, Math.PI, 0] as [number, number, number] 
    })));

    await wait(600); // Wait for cards to center

    setAppState(AppState.SHUFFLING);

    // 2. The Vortex happens automatically in TarotCard.tsx
    await wait(2500); 

    // 3. Randomize deck logic
    const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
    const finalDeck = shuffledDeck.map((c, i) => ({
        ...c,
        isReversed: Math.random() > 0.5,
        position: [0, 0, i * 0.015] as [number, number, number],
        rotation: [0, Math.PI, 0] as [number, number, number]
    }));

    setDeck(finalDeck);
    
    setAppState(AppState.DEALING);

  }, [appState, deck]);

  // --- DEAL CARDS ---
  const dealCards = useCallback(async () => {
    if (!selectedSpread) return;
    setAppState(AppState.READING);

    const spreadLen = selectedSpread.positions.length;
    const remainingCards = deck.slice(spreadLen);

    // 1. Move remaining deck out of view
    const hiddenDeck = remainingCards.map(c => ({
        ...c,
        position: [0, 15, -10] as [number, number, number]
    }));

    setDeck(prev => {
         const currentDealCards = prev.slice(0, spreadLen);
         return [...currentDealCards, ...hiddenDeck];
    });
    
    await wait(100);

    // 2. Deal animation
    for (let i = 0; i < spreadLen; i++) {
        const pos = selectedSpread.positions[i];
        setDeck(prev => {
            const newDeck = [...prev];
            newDeck[i] = {
                ...newDeck[i],
                position: [pos.x, pos.y, pos.z + TABLE_HEIGHT],
                rotation: [CAMERA_TILT_X, Math.PI, pos.rotationZ] 
            };
            return newDeck;
        });
        await wait(200);
    }

    await wait(500);

    // 3. Flip
    for (let i = 0; i < spreadLen; i++) {
        setDeck(prev => {
            const newDeck = [...prev];
            const pos = selectedSpread.positions[i];
            newDeck[i] = {
                ...newDeck[i],
                isFlipped: true,
                rotation: [CAMERA_TILT_X, 0, pos.rotationZ]
            };
            return newDeck;
        });
        await wait(600);
    }

  }, [selectedSpread, deck]);

  // --- Auto Deal Trigger ---
  useEffect(() => {
    if (appState === AppState.DEALING) {
        dealCards();
    }
  }, [appState, dealCards]);


  const fetchReading = async (card: CardState, positionLabel: string) => {
    if (!selectedSpread) return;
    setIsLoadingReading(true);
    try {
        const reading = await getTarotReading(
            getCardName(card), 
            positionLabel, 
            selectedSpread.name, 
            card.isReversed,
            language
        );
        setReadings(prev => ({ ...prev, [card.uuid]: reading }));
    } catch (error) {
        console.error("Reading error", error);
    } finally {
        setIsLoadingReading(false);
    }
  };

  const handleCardClick = (uuid: string) => {
    if (appState !== AppState.READING) return;
    const index = deck.findIndex(c => c.uuid === uuid);
    if (index !== -1 && selectedSpread && index < selectedSpread.positions.length) {
        setActiveCardId(uuid);
        if (!readings[uuid]) fetchReading(deck[index], selectedSpread.positions[index].label);
    }
  };

  const handleFullReading = async () => {
    if (!selectedSpread) return;
    setShowFullReading(true);
    if (fullReadingText) return;

    setIsGeneratingFull(true);
    try {
        const spreadCards = deck.slice(0, selectedSpread.positions.length);
        const cardsInfo = spreadCards.map((c, i) => ({
            name: getCardName(c),
            position: selectedSpread.positions[i].label,
            isReversed: c.isReversed,
            meaning: language === Language.VN ? c.data.meaning_upright_vn : c.data.meaning_upright_cn
        }));
        const text = await getFullSpreadReading(selectedSpread.name, cardsInfo, language);
        setFullReadingText(text);
    } catch (e) {
        setFullReadingText(t.connectError);
    } finally {
        setIsGeneratingFull(false);
    }
  };

  const activeCard = deck.find(c => c.uuid === activeCardId);
  const activePositionLabel = activeCard ? selectedSpread?.positions[deck.findIndex(c => c.uuid === activeCardId)]?.label : "";
  const currentReading = activeCardId ? readings[activeCardId] : null;

  return (
    <div className="w-full h-full relative font-sans overflow-hidden cursor-default selection:bg-[#a8c7fa] selection:text-[#062e6f]">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[#131314]">
        {deck.length > 0 && (
            <Scene 
                cards={deck} 
                onCardClick={handleCardClick} 
                interactionAllowed={appState === AppState.READING}
                isShuffling={appState === AppState.SHUFFLING}
                language={language}
            />
        )}
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header - Left */}
        <header className="absolute top-6 left-6 z-50 pointer-events-auto transition-opacity duration-500" style={{ opacity: showFullReading ? 0 : 1 }}>
            <div className="bg-[#1e1f20]/90 backdrop-blur-md px-6 py-2 rounded-full border border-[#444746] shadow-lg">
                <h1 className="text-xl text-[#e3e3e3] font-serif tracking-widest uppercase flex items-center gap-2">
                    <span className="text-[#a8c7fa] text-lg">❖</span> {t.title}
                </h1>
            </div>
        </header>

        {/* Top Right Controls (Language & Spread) */}
        <div className="absolute top-6 right-6 z-50 pointer-events-auto flex gap-3" style={{ opacity: showFullReading ? 0 : 1 }}>
             {/* Language Toggle */}
             <div className="bg-[#1e1f20]/90 backdrop-blur-md rounded-full border border-[#444746] flex overflow-hidden">
                <button 
                    onClick={() => setLanguage(Language.CN)}
                    className={`px-4 py-2 text-xs font-bold transition-colors ${language === Language.CN ? 'bg-[#a8c7fa] text-[#062e6f]' : 'text-[#c4c7c5] hover:bg-[#303132]'}`}
                >
                    中
                </button>
                <div className="w-[1px] bg-[#444746]"></div>
                <button 
                    onClick={() => setLanguage(Language.VN)}
                    className={`px-4 py-2 text-xs font-bold transition-colors ${language === Language.VN ? 'bg-[#a8c7fa] text-[#062e6f]' : 'text-[#c4c7c5] hover:bg-[#303132]'}`}
                >
                    VN
                </button>
             </div>

             {/* Spread Selector Trigger */}
             <div className="relative">
                <button 
                    onClick={() => setShowSettings(!showSettings)}
                    className="studio-panel h-full px-4 flex items-center gap-2 hover:bg-[#303132] transition-colors text-[#e3e3e3] text-sm"
                >
                    <span>{language === Language.CN ? selectedSpread.name_cn : selectedSpread.name_vn}</span>
                    <span className="text-[10px]">▼</span>
                </button>

                {/* Dropdown */}
                {showSettings && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#1e1f20] border border-[#444746] rounded-lg shadow-xl overflow-hidden animate-fade-in flex flex-col">
                        <div className="p-3 border-b border-[#444746] bg-[#28292a]">
                            <span className="text-xs text-[#8e918f] uppercase tracking-wider">{t.selectSpread}</span>
                        </div>
                        {SPREADS.map(spread => (
                            <button
                                key={spread.name}
                                onClick={() => {
                                    setSelectedSpread(spread);
                                    setShowSettings(false);
                                }}
                                className={`text-left px-4 py-3 text-sm hover:bg-[#303132] transition-colors border-b border-[#444746]/50 last:border-0 ${selectedSpread.name === spread.name ? 'text-[#a8c7fa] bg-[#28292a]' : 'text-[#c4c7c5]'}`}
                            >
                                <div className="font-medium">{language === Language.CN ? spread.name_cn : spread.name_vn}</div>
                                <div className="text-[10px] text-[#8e918f] mt-1 line-clamp-1">{language === Language.CN ? spread.description_cn : spread.description_vn}</div>
                            </button>
                        ))}
                    </div>
                )}
             </div>
        </div>


        {/* --- STEP 1: HERO / INTRO SCREEN --- */}
        {appState === AppState.INTRO && (
             <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-auto z-40 animate-slide-up">
                <button 
                    onClick={startShuffle}
                    className="group relative"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#a8c7fa] to-[#d3e3fd] rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative studio-btn px-16 py-5 text-xl shadow-2xl tracking-[0.2em] font-serif uppercase">
                        {t.start}
                    </div>
                </button>
             </div>
        )}

        {/* --- STEP 4: FULL READING BUTTON --- */}
        {appState === AppState.READING && allCardsFlipped && !showFullReading && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center z-[40] pointer-events-auto animate-fade-in">
                <button 
                    onClick={handleFullReading}
                    className="studio-panel bg-[#1e1f20] px-10 py-4 rounded-full text-[#a8c7fa] border border-[#444746] hover:bg-[#28292a] hover:text-[#d3e3fd] transition-all flex items-center gap-3 shadow-xl"
                >
                    <span className="text-xl">✦</span> 
                    <span className="tracking-widest font-medium uppercase">{t.fullAnalysis}</span>
                </button>
            </div>
        )}

        {/* --- FULL READING OVERLAY --- */}
        {showFullReading && (
            <div className="fixed inset-0 z-[100] pointer-events-auto flex items-center justify-center bg-[#131314]/95 backdrop-blur-xl animate-fade-in">
                <div className="w-[90%] md:w-[70%] max-w-4xl h-[85%] studio-panel flex flex-col relative bg-[#1e1f20] overflow-hidden">
                    <div className="px-8 py-5 border-b border-[#444746] flex justify-between items-center shrink-0 bg-[#1e1f20]">
                        <div className="flex items-center gap-3">
                            <span className="text-[#a8c7fa] text-xl">✦</span>
                            <div>
                                <h2 className="text-lg font-bold text-[#e3e3e3] tracking-wide">{t.fateReport}</h2>
                                <p className="text-xs text-[#c4c7c5] uppercase">{language === Language.CN ? selectedSpread?.name_cn : selectedSpread?.name_vn}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowFullReading(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#303132] text-[#c4c7c5] transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                        {isGeneratingFull ? (
                            <div className="flex flex-col items-center justify-center h-full space-y-6 opacity-70">
                                <div className="w-12 h-12 border-t-2 border-b-2 border-[#a8c7fa] rounded-full animate-spin"></div>
                                <p className="text-[#e3e3e3] text-sm tracking-widest animate-pulse uppercase">{t.analyzing}</p>
                            </div>
                        ) : (
                            <div className="max-w-3xl mx-auto animate-slide-up pb-10">
                                {formatReadingText(fullReadingText || '')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- SINGLE CARD SIDE PANEL (FIXED) --- */}
        {activeCard && activeCard.isFlipped && !showFullReading && (
            <div className="absolute right-6 top-24 bottom-24 w-full md:w-[400px] pointer-events-none z-50 flex flex-col items-end">
                {/* Independent Card Container to prevent full height blocking */}
                <div className="studio-panel w-full max-h-full flex flex-col pointer-events-auto bg-[#1e1f20]/95 backdrop-blur-xl animate-slide-up shadow-2xl overflow-hidden border border-[#444746]">
                    
                    {/* Header Fixed */}
                    <div className="p-6 border-b border-[#444746] relative shrink-0">
                         <button 
                            onClick={() => setActiveCardId(null)}
                            className="absolute top-4 right-4 text-[#8e918f] hover:text-[#e3e3e3] transition-colors w-8 h-8 flex items-center justify-center"
                        >
                            ✕
                        </button>
                        <span className="text-xs uppercase tracking-widest text-[#a8c7fa] mb-2 block font-medium">
                            {activePositionLabel}
                        </span>
                        <h2 className="text-2xl font-serif text-[#e3e3e3] mb-3">{getCardName(activeCard)}</h2>
                        <span className={`inline-block px-3 py-1 text-[10px] tracking-wider rounded-sm ${activeCard.isReversed ? 'bg-red-900/30 text-red-200 border border-red-800/50' : 'bg-[#a8c7fa]/10 text-[#a8c7fa] border border-[#a8c7fa]/30'}`}>
                            {activeCard.isReversed ? t.reversed : t.upright}
                        </span>
                    </div>

                    {/* Scrollable Content */}
                    <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
                         <div className="bg-[#28292a] p-5 rounded-lg border border-[#444746] mb-6">
                            <h4 className="text-[#a8c7fa] text-xs uppercase mb-3 flex items-center gap-2 tracking-widest font-medium">
                                <span className="text-lg">✦</span> {t.interpretation}
                            </h4>
                            {isLoadingReading && !currentReading ? (
                                <div className="flex items-center gap-3 py-2 opacity-60">
                                    <span className="w-1.5 h-1.5 bg-[#a8c7fa] rounded-full animate-ping"></span>
                                    <span className="text-xs text-[#c4c7c5] tracking-widest">CONNECTING...</span>
                                </div>
                            ) : (
                                <p className="text-[#e3e3e3] font-serif leading-7 text-justify text-sm font-light">
                                    {parseInlineFormatting(currentReading || getCardMeaning(activeCard))}
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <h4 className="text-[#8e918f] text-xs uppercase mb-3 tracking-widest">{t.keywords}</h4>
                            <div className="flex flex-wrap gap-2">
                                {getCardKeywords(activeCard).map(k => (
                                    <span key={k} className="text-[11px] border border-[#444746] px-3 py-1 text-[#c4c7c5] bg-[#28292a] rounded-full tracking-wide">{k}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;