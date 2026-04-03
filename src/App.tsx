/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Download, Wand2, RotateCcw, LayoutGrid, MessageSquare, Sparkles, Image as ImageIcon, Sun, Moon, Dices } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

// --- Preset Data ---
const THEME_PRESETS = [
  {
    name: "Cyberpunk Night Race",
    theme: "dark",
    bgIdea: "ถนนแข่งรถไซเบอร์พังก์ตอนกลางคืน แสงนีออนสีชมพูและฟ้า มีเส้นกริดดิจิทัลดูล้ำสมัย",
    slots: [
      { label: "STREET RACERS", prompt: "Futuristic glowing neon cyberpunk racing helmet" },
      { label: "CYBER MEDIA", prompt: "Holographic floating cinema camera with neon blue lens" },
      { label: "GARAGE SERVICES", prompt: "Glowing neon wrench and futuristic tools" },
      { label: "CONNECT NOW", prompt: "Digital neon smartphone displaying a hologram" }
    ]
  },
  {
    name: "Luxury Minimal Supercar",
    theme: "dark",
    bgIdea: "ห้องจัดแสดงรถซูเปอร์คาร์สุดหรู โทนสีดำด้านและทองแดง แสงไฟสปอตไลท์ส่องลงมาดูแพงและเรียบหรู",
    slots: [
      { label: "ELITE RACERS", prompt: "Premium matte black racing helmet with copper gold details" },
      { label: "LUXURY MEDIA", prompt: "High-end expensive cinema camera with gold accents" },
      { label: "VIP SERVICES", prompt: "Golden handshake logo, elegant and luxury" },
      { label: "BOOKING", prompt: "Premium black leather calendar with gold foil numbers" }
    ]
  },
  {
    name: "Rally Dirt Track",
    theme: "light",
    bgIdea: "บรรยากาศสนามแข่งแรลลี่ฝุ่นตลบ โทนสีส้มดินและเหลือง แสงแดดส่องสว่าง มีคราบโคลนสาดกระเซ็น",
    slots: [
      { label: "RALLY TEAM", prompt: "Off-road rally helmet with mud splatters and goggles" },
      { label: "ACTION CAMS", prompt: "Rugged action camera covered in light dust" },
      { label: "PARTNERS", prompt: "Two hands wearing dirty racing gloves shaking" },
      { label: "RACE SCHEDULE", prompt: "Vintage rally stopwatch and calendar" }
    ]
  },
  {
    name: "F1 Pitstop Tech",
    theme: "dark",
    bgIdea: "บรรยากาศในพิทสต็อป F1 ที่เต็มไปด้วยหน้าจอเทคโนโลยี คาร์บอนไฟเบอร์ และแสงไฟ LED สีแดงดุดัน",
    slots: [
      { label: "FORMULA TEAM", prompt: "High-tech F1 carbon fiber steering wheel with glowing buttons" },
      { label: "BROADCAST", prompt: "Professional broadcast camera with red tally light" },
      { label: "SPONSORS", prompt: "Formula racing tire with golden trophy" },
      { label: "CONTACT PIT", prompt: "F1 team headset with glowing microphone" }
    ]
  }
];

export default function App() {
  // --- State Management ---
  const [bgTheme, setBgTheme] = useState('dark'); 
  const [thaiBgPrompt, setThaiBgPrompt] = useState('');
  const [isTranslatingBg, setIsTranslatingBg] = useState(false);
  const [bgPrompt, setBgPrompt] = useState('High-end dark carbon fiber texture, strictly divided into a perfect 2x2 grid layout with glowing neon frames bordering each of the 4 quadrants to contain icons. ABSOLUTELY NO TEXT, NO WORDS, completely textless, 8k resolution');
  const [bgImg, setBgImg] = useState<string | null>(null);
  const [bgLoading, setBgLoading] = useState(false);
  const [bgBrightness, setBgBrightness] = useState(100);

  const [iconStylePrompt, setIconStylePrompt] = useState('Professional 3D motorsport icon, glossy metallic finish, cinematic lighting, MUST BE ON PURE SOLID BLACK BACKGROUND, centered, high detail');

  // Update icon prompt based on theme
  useEffect(() => {
    if (bgTheme === 'dark') {
      setIconStylePrompt('Professional 3D motorsport icon, glossy metallic finish, cinematic lighting, MUST BE ON PURE SOLID BLACK BACKGROUND, centered, high detail');
    } else {
      setIconStylePrompt('Professional 3D motorsport icon, glossy metallic finish, cinematic lighting, MUST BE ON PURE SOLID WHITE BACKGROUND, centered, high detail');
    }
  }, [bgTheme]);

  const [slots, setSlots] = useState([
    { id: 1, label: 'TEAM & RACERS', prompt: 'Sleek carbon racing helmet with neon accents', img: null as string | null, loading: false, iconOpacity: 100, iconOffsetX: 0, iconOffsetY: 0, iconScale: 100, labelOffsetX: 0, labelOffsetY: 0 },
    { id: 2, label: 'MEDIA WORKS', prompt: 'High-tech cinema camera with glowing lens', img: null as string | null, loading: false, iconOpacity: 100, iconOffsetX: 0, iconOffsetY: 0, iconScale: 100, labelOffsetX: 0, labelOffsetY: 0 },
    { id: 3, label: 'OUR SERVICES', prompt: 'Racing gloves handshake, metallic leather texture', img: null as string | null, loading: false, iconOpacity: 100, iconOffsetX: 0, iconOffsetY: 0, iconScale: 100, labelOffsetX: 0, labelOffsetY: 0 },
    { id: 4, label: 'CONTACT US', prompt: 'Digital race calendar with checkered pattern', img: null as string | null, loading: false, iconOpacity: 100, iconOffsetX: 0, iconOffsetY: 0, iconScale: 100, labelOffsetX: 0, labelOffsetY: 0 }
  ]);

  const [error, setError] = useState<string | null>(null);
  const [exportSize, setExportSize] = useState('2500x1686');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- API Functions ---

  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("API Key is missing");
    return new GoogleGenAI({ apiKey });
  };

  const generateEnglishPrompt = async (textToTranslate = thaiBgPrompt) => {
    if (!textToTranslate) return;
    setIsTranslatingBg(true);
    setError(null);
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `แปลงไอเดียภาษาไทยนี้ให้เป็น Prompt ภาษาอังกฤษสำหรับ AI Image Generator เพื่อทำภาพพื้นหลังเมนู
      
      ข้อบังคับสำคัญที่สุด (CRUCIAL RULES):
      1. ต้องบังคับให้ภาพถูกแบ่งเป็น 4 ช่อง (perfect 2x2 grid layout) เสมอ
      2. ต้องระบุให้มี "กรอบสี่เหลี่ยมสำหรับวางปุ่ม (visible frames or glowing borders surrounding each of the 4 empty quadrants)" อยู่ในภาพพื้นหลัง
      3. **ห้ามมีตัวหนังสือเด็ดขาด:** ต้องใส่คำว่า "ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, textless" ลงไปใน Prompt เสมอ
      4. ส่งกลับมาเฉพาะข้อความ Prompt ภาษาอังกฤษที่ได้เท่านั้น
      
      ไอเดียภาษาไทย: ${textToTranslate}`,
      });

      const englishPrompt = response.text;
      if (englishPrompt) {
        setBgPrompt(englishPrompt.trim());
      }
    } catch (e) {
      console.error(e);
      setError("ไม่สามารถแปลงข้อความได้ กรุณาลองใหม่อีกครั้ง");
    }
    setIsTranslatingBg(false);
  };

  const callImagen = async (prompt: string, aspectRatio: "1:1" | "4:3" | "3:4" | "16:9" | "9:16" = "1:1") => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
        },
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image generated");
  };

  // --- Action Functions ---

  const applyRandomTheme = async () => {
    const randomPreset = THEME_PRESETS[Math.floor(Math.random() * THEME_PRESETS.length)];
    
    setBgTheme(randomPreset.theme);
    setThaiBgPrompt(randomPreset.bgIdea);
    
    const newSlots = slots.map((slot, index) => ({
      ...slot,
      label: randomPreset.slots[index].label,
      prompt: randomPreset.slots[index].prompt,
      img: null,
      iconOpacity: 100,
      iconOffsetX: 0,
      iconOffsetY: 0,
      iconScale: 100,
      labelOffsetX: 0,
      labelOffsetY: 0
    }));
    setSlots(newSlots);

    await generateEnglishPrompt(randomPreset.bgIdea);
  };

  const generateBackground = async () => {
    setBgLoading(true);
    setError(null);
    try {
      const img = await callImagen(bgPrompt, "4:3");
      setBgImg(img);
    } catch (e) {
      console.error(e);
      setError("ไม่สามารถสร้างพื้นหลังได้ กรุณาลองใหม่อีกครั้ง");
    }
    setBgLoading(false);
  };

  const generateIcon = async (index: number) => {
    const newSlots = [...slots];
    newSlots[index].loading = true;
    setSlots(newSlots);
    setError(null);

    const combinedPrompt = `${newSlots[index].prompt}. ${iconStylePrompt}`;
    
    try {
      const img = await callImagen(combinedPrompt, "1:1");
      newSlots[index].img = img;
    } catch (e) {
      console.error(e);
      setError(`ไม่สามารถสร้างไอคอนช่องที่ ${index + 1} ได้`);
    }
    newSlots[index].loading = false;
    setSlots(newSlots);
  };

  // --- Rendering Logic ---

  const drawMenu = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const [w, h] = exportSize.split('x').map(Number);
    canvas.width = w;
    canvas.height = h;

    if (bgImg) {
      const bImg = new Image();
      bImg.onload = () => {
        const scale = Math.max(w / bImg.width, h / bImg.height);
        const x = (w / 2) - (bImg.width / 2) * scale;
        const y = (h / 2) - (bImg.height / 2) * scale;
        ctx.filter = `brightness(${bgBrightness}%)`;
        ctx.drawImage(bImg, x, y, bImg.width * scale, bImg.height * scale);
        ctx.filter = 'none';
        drawIconsAndGrid(ctx, w, h);
      };
      bImg.src = bgImg;
    } else {
      ctx.fillStyle = bgTheme === 'dark' ? '#050507' : '#e5e7eb';
      ctx.fillRect(0, 0, w, h);
      drawIconsAndGrid(ctx, w, h);
    }
  };

  const drawIconsAndGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const qW = w / 2;
    const qH = h / 2;

    slots.forEach((slot, i) => {
      if (slot.img) {
        const iImg = new Image();
        iImg.onload = () => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const startX = col * qW;
          const startY = row * qH;

          ctx.save();
          ctx.globalCompositeOperation = bgTheme === 'dark' ? 'screen' : 'multiply';
          ctx.globalAlpha = slot.iconOpacity !== undefined ? slot.iconOpacity / 100 : 1;
          
          const scaleFactor = slot.iconScale !== undefined ? slot.iconScale / 100 : 1;
          const iconSize = qH * 0.70 * scaleFactor;
          const aspect = iImg.width / iImg.height;
          let dW = iconSize * aspect;
          let dH = iconSize;
          
          const iOffsetX = slot.iconOffsetX !== undefined ? (slot.iconOffsetX / 100) * (qW / 2) : 0;
          const iOffsetY = slot.iconOffsetY !== undefined ? (slot.iconOffsetY / 100) * (qH / 2) : 0;

          ctx.drawImage(iImg, startX + (qW - dW)/2 + iOffsetX, startY + (qH - dH)/2 - (h * 0.05) + iOffsetY, dW, dH);
          ctx.restore();

          const lOffsetX = slot.labelOffsetX !== undefined ? (slot.labelOffsetX / 100) * (qW / 2) : 0;
          const lOffsetY = slot.labelOffsetY !== undefined ? (slot.labelOffsetY / 100) * (qH / 2) : 0;

          const grad = ctx.createLinearGradient(startX, startY + qH - (h * 0.15), startX, startY + qH);
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(1, bgTheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)');
          ctx.fillStyle = grad;
          ctx.fillRect(startX, startY + qH - (h * 0.15), qW, (h * 0.15));

          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${h * 0.045}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 10;
          ctx.fillText(slot.label, startX + qW/2 + lOffsetX, startY + qH - (h * 0.045) + lOffsetY);
        };
        iImg.src = slot.img;
      }
    });

    ctx.beginPath();
    ctx.strokeStyle = bgTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = w * 0.002;
    ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.stroke();
  };

  useEffect(() => {
    drawMenu();
  }, [slots, exportSize, bgImg, bgTheme, bgBrightness]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `Motorsport_V10_${bgTheme}_${exportSize}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.92);
    link.click();
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 font-sans">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-neutral-900 pb-8">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent uppercase">
              NEON-9
            </h1>
            <p className="text-neutral-500 text-xs font-bold tracking-widest mt-1 uppercase">Agenti Ai Content Creation</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {!hasApiKey && (
              <button 
                  onClick={handleSelectKey}
                  className="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <RotateCcw size={16} /> Setup API Key
              </button>
            )}
            <button 
                onClick={applyRandomTheme}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 cursor-pointer"
            >
              <Dices size={16} /> สุ่มธีมเมนู (Magic Preset)
            </button>
            <select 
                value={exportSize} 
                onChange={(e) => setExportSize(e.target.value)}
                className="bg-black border border-neutral-800 rounded-xl px-4 py-2 text-sm font-bold outline-none cursor-pointer"
            >
                <option value="2500x1686">LARGE (2500x1686)</option>
                <option value="1200x810">MEDIUM (1200x810)</option>
            </select>
            <button 
                onClick={handleDownload}
                className="bg-fuchsia-600 hover:bg-fuchsia-500 px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Download size={16} /> Export Final JPG
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-sm font-bold flex items-center gap-3">
            <RotateCcw size={16} /> {error}
          </div>
        )}

        <div className="grid xl:grid-cols-12 gap-8">
          
          {/* Left: Background & Icon Editors */}
          <div className="xl:col-span-7 space-y-6">
            
            {/* Step 1: Background Layer */}
            <section className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-[2rem] shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-black flex items-center gap-2 text-fuchsia-400 uppercase tracking-widest">
                        <ImageIcon size={18} /> Step 1: ภาพพื้นหลัง (Background Layer)
                    </h2>
                    
                    <div className="flex bg-black border border-neutral-800 rounded-lg p-1">
                        <button 
                            onClick={() => setBgTheme('dark')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${bgTheme === 'dark' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}
                        >
                            <Moon size={12} /> พื้นมืด
                        </button>
                        <button 
                            onClick={() => setBgTheme('light')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${bgTheme === 'light' ? 'bg-white text-black' : 'text-neutral-500 hover:text-white'}`}
                        >
                            <Sun size={12} /> พื้นสว่าง
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-col gap-4">
                    <div className="bg-black/50 border border-neutral-800 rounded-2xl p-4">
                        <label className="text-[10px] text-fuchsia-400 font-black uppercase mb-2 flex items-center gap-2">
                            1. พิมพ์ไอเดีย (หรือกดปุ่มสุ่มธีมด้านบน)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="text" 
                                value={thaiBgPrompt}
                                onChange={(e) => setThaiBgPrompt(e.target.value)}
                                placeholder="เช่น พื้นหลังอวกาศมืดๆ มีกรอบนีออน..."
                                className="flex-grow bg-black border border-neutral-700 rounded-xl p-3 text-sm text-white focus:border-fuchsia-500 outline-none"
                            />
                            <button 
                                onClick={() => generateEnglishPrompt(thaiBgPrompt)}
                                disabled={isTranslatingBg || !thaiBgPrompt}
                                className="bg-fuchsia-600 hover:bg-fuchsia-500 px-4 py-3 rounded-xl text-xs font-bold whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
                            >
                                {isTranslatingBg ? <RotateCcw className="animate-spin" size={14} /> : <MessageSquare size={14} />}
                                แปลเป็น Prompt
                            </button>
                        </div>
                    </div>

                    <div className="bg-black/50 border border-neutral-800 rounded-2xl p-4">
                        <label className="text-[10px] text-neutral-500 font-black uppercase mb-2 flex items-center gap-2">
                            2. คำสั่ง AI ภาษาอังกฤษ (กดปุ่มด้านล่างเพื่อสร้างภาพ)
                        </label>
                        <textarea 
                            value={bgPrompt}
                            onChange={(e) => setBgPrompt(e.target.value)}
                            rows={2}
                            className="w-full bg-black border border-neutral-700 rounded-xl p-3 text-xs text-neutral-400 focus:border-fuchsia-500 outline-none mb-3 resize-none leading-relaxed"
                        />
                        <button 
                            onClick={generateBackground}
                            disabled={bgLoading || isTranslatingBg}
                            className="w-full bg-neutral-800 hover:bg-neutral-700 py-3.5 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50 transition-colors border border-neutral-700 text-fuchsia-400 cursor-pointer"
                        >
                            {bgLoading ? <RotateCcw className="animate-spin" size={14} /> : <Wand2 size={14} />}
                            {bgImg ? 'Regenerate Background' : 'Generate Background'}
                        </button>

                        <div className="mt-2 pt-4 border-t border-neutral-800/50">
                            <label className="text-[10px] text-neutral-400 font-black uppercase mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Sun size={14} /> ปรับความสว่างพื้นหลัง</span>
                                <span className="text-fuchsia-400">{bgBrightness}%</span>
                            </label>
                            <input 
                                type="range" 
                                min="10" 
                                max="200" 
                                value={bgBrightness} 
                                onChange={(e) => setBgBrightness(Number(e.target.value))}
                                className="w-full accent-fuchsia-500 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Step 2: Transparent Icons */}
            <section className="space-y-4">
                <div className="flex justify-between items-end">
                    <h2 className="text-sm font-black flex items-center gap-2 text-pink-500 uppercase tracking-widest">
                        <Sparkles size={18} /> Step 2: ไอคอนโปร่งใส (Isolated Icons)
                    </h2>
                    <span className="text-[10px] bg-neutral-900 px-2 py-1 rounded text-neutral-400 border border-neutral-800">
                        {bgTheme === 'dark' ? 'โหมดซ่อนสีดำ (Screen Blend)' : 'โหมดซ่อนสีขาว (Multiply Blend)'}
                    </span>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-5">
                {slots.map((slot, index) => (
                    <div key={slot.id} className="bg-neutral-900/30 border border-neutral-800 p-5 rounded-3xl flex flex-col gap-4">
                        <input 
                            type="text" 
                            value={slot.label} 
                            onChange={(e) => { const n = [...slots]; n[index].label = e.target.value; setSlots(n); }}
                            className="bg-transparent text-sm font-black border-b border-neutral-800 focus:border-pink-500 outline-none pb-1 uppercase text-center text-white"
                        />
                        <textarea 
                            rows={2}
                            value={slot.prompt}
                            onChange={(e) => { const n = [...slots]; n[index].prompt = e.target.value; setSlots(n); }}
                            className="bg-black/30 border border-neutral-800 rounded-xl p-3 text-[10px] text-neutral-400 focus:border-pink-500 outline-none resize-none"
                            placeholder="พิมพ์คำสั่งไอคอน..."
                        />
                        <div className={`aspect-square rounded-2xl border border-neutral-800 flex items-center justify-center relative overflow-hidden group ${bgTheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                            {slot.loading ? (
                                <div className={`animate-spin rounded-full h-8 w-8 border-2 border-t-transparent ${bgTheme === 'dark' ? 'border-pink-500' : 'border-fuchsia-500'}`} />
                            ) : slot.img ? (
                                <img src={slot.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={slot.label} />
                            ) : (
                                <Wand2 size={24} className={bgTheme === 'dark' ? 'text-neutral-800' : 'text-neutral-300'} />
                            )}
                        </div>
                        <button 
                            onClick={() => generateIcon(index)}
                            disabled={slot.loading}
                            className="w-full py-3 bg-neutral-800 hover:bg-pink-600 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                            {slot.img ? 'Regenerate Icon' : 'Generate Icon'}
                        </button>

                        <div className="space-y-3 mt-1 pt-4 border-t border-neutral-800/50">
                            <div className="text-[10px] text-pink-400 font-bold">ICON SETTINGS</div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-12 text-neutral-400">Size</span>
                                <input type="range" min="10" max="200" value={slot.iconScale ?? 100} onChange={(e) => { const n = [...slots]; n[index].iconScale = Number(e.target.value); setSlots(n); }} className="flex-grow accent-pink-500 cursor-pointer" />
                                <span className="w-8 text-right">{slot.iconScale ?? 100}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-12 text-neutral-400">Opacity</span>
                                <input type="range" min="0" max="100" value={slot.iconOpacity ?? 100} onChange={(e) => { const n = [...slots]; n[index].iconOpacity = Number(e.target.value); setSlots(n); }} className="flex-grow accent-pink-500 cursor-pointer" />
                                <span className="w-8 text-right">{slot.iconOpacity ?? 100}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-12 text-neutral-400">Pos X</span>
                                <input type="range" min="-100" max="100" value={slot.iconOffsetX ?? 0} onChange={(e) => { const n = [...slots]; n[index].iconOffsetX = Number(e.target.value); setSlots(n); }} className="flex-grow accent-pink-500 cursor-pointer" />
                                <span className="w-8 text-right">{slot.iconOffsetX ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-12 text-neutral-400">Pos Y</span>
                                <input type="range" min="-100" max="100" value={slot.iconOffsetY ?? 0} onChange={(e) => { const n = [...slots]; n[index].iconOffsetY = Number(e.target.value); setSlots(n); }} className="flex-grow accent-pink-500 cursor-pointer" />
                                <span className="w-8 text-right">{slot.iconOffsetY ?? 0}</span>
                            </div>

                            <div className="text-[10px] text-pink-400 font-bold mt-3">LABEL SETTINGS</div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-12 text-neutral-400">Pos X</span>
                                <input type="range" min="-100" max="100" value={slot.labelOffsetX ?? 0} onChange={(e) => { const n = [...slots]; n[index].labelOffsetX = Number(e.target.value); setSlots(n); }} className="flex-grow accent-pink-500 cursor-pointer" />
                                <span className="w-8 text-right">{slot.labelOffsetX ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                                <span className="w-12 text-neutral-400">Pos Y</span>
                                <input type="range" min="-100" max="100" value={slot.labelOffsetY ?? 0} onChange={(e) => { const n = [...slots]; n[index].labelOffsetY = Number(e.target.value); setSlots(n); }} className="flex-grow accent-pink-500 cursor-pointer" />
                                <span className="w-8 text-right">{slot.labelOffsetY ?? 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            </section>
          </div>

          {/* Right: Composite Preview */}
          <div className="xl:col-span-5">
            <div className="sticky top-6">
                <h2 className="text-sm font-black flex items-center gap-2 mb-4 text-purple-400 uppercase tracking-widest">
                    <LayoutGrid size={18} /> Final Composite Preview
                </h2>
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-[2.5rem] shadow-2xl">
                    <canvas 
                        ref={canvasRef} 
                        className="w-full h-auto rounded-2xl shadow-2xl border border-white/5 bg-black"
                        style={{ aspectRatio: '2500 / 1686' }}
                    />
                    <div className="mt-6 p-5 bg-purple-950/20 border border-purple-900/30 rounded-2xl">
                        <div className="flex items-center gap-2 text-purple-300 font-bold text-xs mb-2">
                            <Dices size={14} /> HOW TO USE MAGIC PRESET
                        </div>
                        <ol className="text-[11px] text-purple-200/70 leading-relaxed list-decimal list-inside space-y-1">
                            <li>กดปุ่ม <strong>"สุ่มธีมเมนู"</strong> (ปุ่มสีม่วงด้านบน)</li>
                            <li>รอระบบแปลคำสั่งภาษาอังกฤษ (หมุนๆ ในช่อง Step 1)</li>
                            <li>กดปุ่ม <strong>"Generate Background"</strong> สร้างพื้นหลัง</li>
                            <li>กดปุ่ม <strong>"Generate Icon"</strong> สร้างไอคอนให้ครบ 4 ช่อง</li>
                        </ol>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
