import { Suit, Language, CardData } from '../types';
import { SUIT_NAMES } from '../constants';

// --- DRAWING HELPERS ---

const drawNoise = (ctx: CanvasRenderingContext2D, width: number, height: number, opacity: number = 0.05) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * 50;
        data[i] = Math.min(255, Math.max(0, data[i] + grain));
        data[i+1] = Math.min(255, Math.max(0, data[i+1] + grain));
        data[i+2] = Math.min(255, Math.max(0, data[i+2] + grain));
    }
    ctx.putImageData(imageData, 0, 0);
};

const drawVignette = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, height * 0.8);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(20,10,5,0.4)'); // Dark brownish vignette
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
};

const drawGoldBorder = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    ctx.save();
    ctx.strokeStyle = '#d4af37'; // Gold
    ctx.lineWidth = 4;
    
    // Outer Line
    ctx.strokeRect(x, y, w, h);
    
    // Inner Line with decorative corners
    const pad = 10;
    ctx.strokeRect(x + pad, y + pad, w - pad*2, h - pad*2);

    // Corner Filigree (Simple geometric)
    const cornerSize = 40;
    ctx.beginPath();
    // Top Left
    ctx.moveTo(x, y + cornerSize);
    ctx.lineTo(x + cornerSize, y + cornerSize);
    ctx.lineTo(x + cornerSize, y);
    // Top Right
    ctx.moveTo(x + w, y + cornerSize);
    ctx.lineTo(x + w - cornerSize, y + cornerSize);
    ctx.lineTo(x + w - cornerSize, y);
    // Bottom Left
    ctx.moveTo(x, y + h - cornerSize);
    ctx.lineTo(x + cornerSize, y + h - cornerSize);
    ctx.lineTo(x + cornerSize, y + h);
    // Bottom Right
    ctx.moveTo(x + w, y + h - cornerSize);
    ctx.lineTo(x + w - cornerSize, y + h - cornerSize);
    ctx.lineTo(x + w - cornerSize, y + h);
    
    ctx.stroke();
    ctx.restore();
};

const drawSacredGeometry = (ctx: CanvasRenderingContext2D, suit: Suit, cx: number, cy: number, radius: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)'; // Transparent Gold
    ctx.lineWidth = 1.5;

    if (suit === Suit.MAJOR) {
        // Complex Mandala / Star
        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            ctx.beginPath();
            ctx.arc(0, radius * 0.5, radius * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, radius);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
        
    } else if (suit === Suit.WANDS) {
        // Fire / Radiating Lines
        const rays = 16;
        for (let i = 0; i < rays; i++) {
            ctx.rotate((Math.PI * 2) / rays);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, radius);
            ctx.stroke();
            // Flame tip
            ctx.beginPath();
            ctx.arc(0, radius, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#8B0000';
            ctx.fill();
        }

    } else if (suit === Suit.CUPS) {
        // Water / Interlocking Circles
        for (let i = 0; i < 6; i++) {
            ctx.rotate((Math.PI * 2) / 6);
            ctx.beginPath();
            ctx.arc(radius * 0.5, 0, radius * 0.4, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = '#003366';
        ctx.stroke();

    } else if (suit === Suit.SWORDS) {
        // Air / Triangles / Sharp
        const sides = 3;
        for (let j = 0; j < 4; j++) {
            ctx.rotate(Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(0, -radius);
            ctx.lineTo(radius * 0.5, radius * 0.5);
            ctx.lineTo(-radius * 0.5, radius * 0.5);
            ctx.closePath();
            ctx.stroke();
        }

    } else if (suit === Suit.PENTACLES) {
        // Earth / Pentagram / Squares
        ctx.beginPath();
        ctx.rect(-radius * 0.6, -radius * 0.6, radius * 1.2, radius * 1.2);
        ctx.stroke();
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.rect(-radius * 0.6, -radius * 0.6, radius * 1.2, radius * 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 100, 0, 0.2)';
        ctx.fill();
    }

    ctx.restore();
};


export const createCardTexture = (cardData: CardData, language: Language, isBack: boolean = false, customImg?: string): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 896;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return canvas;

  const displayName = language === Language.VN ? cardData.name_vn : cardData.name_cn;

  // --- CARD BACK (Mystic Portal) ---
  if (isBack) {
    // 1. Deep Space Gradient
    const gradient = ctx.createRadialGradient(256, 448, 20, 256, 448, 600);
    gradient.addColorStop(0, '#2a1a4a'); // Lighter purple center
    gradient.addColorStop(0.6, '#130921'); // Deep violet
    gradient.addColorStop(1, '#05020a'); // Black edge
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 896);

    // 2. Add Noise for texture
    drawNoise(ctx, 512, 896, 0.08);

    // 3. Golden Mandala Back Design
    ctx.translate(256, 448);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    
    // Rotating Squares
    for(let i=0; i<8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-150, -150, 300, 300);
    }
    
    // Outer Circle
    ctx.beginPath();
    ctx.arc(0, 0, 240, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Inner Eye Symbol
    ctx.beginPath();
    ctx.ellipse(0, 0, 40, 25, 0, 0, Math.PI*2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI*2);
    ctx.fillStyle = '#130921';
    ctx.fill();

    // Reset Transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 4. Border
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 500, 884);

  } else {
    // --- CARD FRONT (Aged Parchment Style) ---
    
    // 1. Background: Aged Paper
    ctx.fillStyle = '#e8dec3'; // Warm parchment base
    ctx.fillRect(0, 0, 512, 896);
    
    // Add "stains" (Large subtle clouds)
    for(let k=0; k<5; k++) {
        const x = Math.random() * 512;
        const y = Math.random() * 896;
        const r = 100 + Math.random() * 200;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(160, 140, 100, 0.1)');
        g.addColorStop(1, 'rgba(160, 140, 100, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }
    
    // Texture Noise
    drawNoise(ctx, 512, 896, 0.06);
    drawVignette(ctx, 512, 896);

    // 2. Intricate Gold Border
    drawGoldBorder(ctx, 20, 20, 472, 856);

    // 3. Card Number (Roman or Arabic)
    ctx.fillStyle = '#000000'; // Pure Black for High Contrast
    ctx.font = '700 36px "Cinzel", serif';
    ctx.textAlign = 'center';
    
    let displayNum = cardData.number.toString();
    if (cardData.suit === Suit.MAJOR) {
        const romans = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
        displayNum = romans[cardData.number] || cardData.number.toString();
    }
    // Decorative lines around number
    ctx.beginPath();
    ctx.moveTo(180, 70);
    ctx.lineTo(332, 70);
    ctx.strokeStyle = '#000000'; // Black lines
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillText(displayNum, 256, 110);

    // 4. Central Art Window (Arch Shape)
    ctx.save();
    ctx.beginPath();
    // Arch path
    ctx.moveTo(60, 200);
    ctx.lineTo(60, 650);
    ctx.lineTo(452, 650);
    ctx.lineTo(452, 200);
    ctx.bezierCurveTo(452, 100, 60, 100, 60, 200); 
    ctx.closePath();
    
    // Background for Art
    const suitGradient = ctx.createLinearGradient(0, 150, 0, 650);
    // Dynamic background color based on suit
    if (cardData.suit === Suit.MAJOR) {
        suitGradient.addColorStop(0, '#2e1a47'); // Mystic Purple
        suitGradient.addColorStop(1, '#1a0f2e');
    } else if (cardData.suit === Suit.WANDS) {
        suitGradient.addColorStop(0, '#4a1a1a'); // Fire Red/Brown
        suitGradient.addColorStop(1, '#2e0f0f');
    } else if (cardData.suit === Suit.CUPS) {
        suitGradient.addColorStop(0, '#1a2e4a'); // Deep Blue
        suitGradient.addColorStop(1, '#0f1a2e');
    } else if (cardData.suit === Suit.SWORDS) {
        suitGradient.addColorStop(0, '#2f3f4f'); // Slate Grey
        suitGradient.addColorStop(1, '#1a232e');
    } else { // Pentacles
        suitGradient.addColorStop(0, '#2a3a1a'); // Earth Green
        suitGradient.addColorStop(1, '#17210f');
    }
    
    ctx.fillStyle = suitGradient;
    ctx.fill();
    
    // Clip to this shape for the artwork
    ctx.clip();
    
    // --- GENERATIVE ARTWORK ---
    // Draw background nebula/clouds
    for (let n=0; n<10; n++) {
        ctx.fillStyle = `rgba(255,255,255, ${Math.random() * 0.05})`;
        ctx.beginPath();
        ctx.arc(Math.random()*512, Math.random()*896, Math.random()*100, 0, Math.PI*2);
        ctx.fill();
    }
    
    // Draw Suit Specific Sacred Geometry
    drawSacredGeometry(ctx, cardData.suit, 256, 425, 140);
    
    // Additional "Magic Particles"
    for(let p=0; p<20; p++) {
        const px = 60 + Math.random() * 390;
        const py = 150 + Math.random() * 500;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(px, py, 2, 2);
    }
    
    ctx.restore(); // Stop clipping

    // Stroke the Arch Frame
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 5;
    ctx.stroke();

    // 5. Card Title Box
    ctx.fillStyle = '#000000'; // Pure Black
    // Use smaller font if name is very long
    const fontSize = displayName.length > 12 ? 38 : 46;
    ctx.font = `700 ${fontSize}px "Noto Serif SC", serif`;
    ctx.textAlign = 'center';
    
    // Reduced shadow transparency and color for sharper look
    ctx.shadowColor = "rgba(0,0,0,0.1)"; 
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.fillText(displayName, 256, 730);
    
    // Reset shadow
    ctx.shadowColor = "transparent";

    // 6. Suit Label (Small Caps)
    const suitDisplay = cardData.suit === Suit.MAJOR 
        ? (language === Language.VN ? "BỘ ẨN CHÍNH" : "大阿卡纳") 
        : SUIT_NAMES[cardData.suit][language].toUpperCase();
    
    ctx.font = '700 18px "Cinzel", serif';
    ctx.fillStyle = '#000000'; // Pure Black
    ctx.fillText(`- ${suitDisplay} -`, 256, 770);
    
    // 7. Bottom Decoration
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(256, 820, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(200, 820);
    ctx.lineTo(312, 820);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  return canvas;
};