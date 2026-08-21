import type { ToolModule } from '../../core/tool-contract';
import { metadata } from './metadata';

let cleanup: (() => void) | undefined;

const english = (): boolean => window.localStorage.getItem('utility-hub:locale') === 'en';
const copy = () => english() ? { start: 'Start game', restart: 'Play again', score: 'Score', lives: 'Lives', time: 'Time', intro: 'Move the ship and catch blue stars. Avoid red meteors.', over: 'Game over', ready: 'Ready to launch', controls: 'Arrow keys, A/D, or drag on the playfield' } : { start: 'เริ่มเกม', restart: 'เล่นอีกครั้ง', score: 'คะแนน', lives: 'ชีวิต', time: 'เวลา', intro: 'บังคับยานเก็บดาวสีน้ำเงิน หลบอุกกาบาตสีแดง', over: 'จบเกม', ready: 'พร้อมออกเดินทาง', controls: 'ปุ่มลูกศร, A/D หรือลากบนพื้นที่เล่น' };

export const mount = (container: HTMLElement): void => {
  cleanup?.();
  const c = copy();
  const section = document.createElement('section');
  section.className = 'game-panel game-panel--orbit';
  section.innerHTML = `<div class="game-panel__header"><div><span class="eyebrow">${c.ready}</span><h2>Orbit Catcher</h2><p>${c.intro}</p></div><button class="button button--primary" data-game-start type="button">${c.start}</button></div><div class="game-hud" aria-live="polite"><span>${c.score}: <strong data-score>0</strong></span><span>${c.lives}: <strong data-lives>3</strong></span><span>${c.time}: <strong data-time>30</strong>s</span></div><div class="game-canvas-wrap"><canvas data-game-canvas width="360" height="460" aria-label="Orbit Catcher game"></canvas><div class="game-overlay" data-overlay>${c.ready}<br><small>${c.controls}</small></div></div><p class="game-status" data-status>${c.controls}</p>`;
  container.append(section);
  const canvas = section.querySelector<HTMLCanvasElement>('[data-game-canvas]')!;
  const ctx = canvas.getContext('2d')!;
  const startButton = section.querySelector<HTMLButtonElement>('[data-game-start]')!;
  const overlay = section.querySelector<HTMLElement>('[data-overlay]')!;
  const scoreEl = section.querySelector<HTMLElement>('[data-score]')!;
  const livesEl = section.querySelector<HTMLElement>('[data-lives]')!;
  const timeEl = section.querySelector<HTMLElement>('[data-time]')!;
  let raf = 0; let last = 0; let running = false; let score = 0; let lives = 3; let elapsed = 0; let spawn = 0; let playerX = 180; let items: { x:number; y:number; r:number; speed:number; bad:boolean }[] = [];
  const reset = () => { score = 0; lives = 3; elapsed = 0; spawn = 0; playerX = 180; items = []; running = true; last = performance.now(); overlay.hidden = true; startButton.textContent = c.restart; frame(last); };
  const draw = (now: number) => { const dt = Math.min((now-last)/1000, .05); last = now; elapsed += dt; spawn -= dt; if (spawn <= 0) { spawn = Math.max(.24, .75 - elapsed*.012); items.push({ x: 16 + Math.random()*328, y: -20, r: 8 + Math.random()*7, speed: 90 + Math.random()*80 + elapsed*2.2, bad: Math.random() < .27 }); }
    ctx.clearRect(0,0,360,460); const bg=ctx.createLinearGradient(0,0,0,460); bg.addColorStop(0,'#0b1235'); bg.addColorStop(1,'#15104b'); ctx.fillStyle=bg; ctx.fillRect(0,0,360,460); ctx.fillStyle='rgba(255,255,255,.7)'; for(let i=0;i<34;i++){ const x=(i*83+Math.floor(elapsed*12))%360; const y=(i*47)%430; ctx.fillRect(x,y,2,2); }
    items.forEach(item=>{item.y += item.speed*dt; ctx.beginPath(); ctx.arc(item.x,item.y,item.r,0,Math.PI*2); ctx.fillStyle=item.bad?'#ff6378':'#55d9ff'; ctx.shadowBlur=14; ctx.shadowColor=ctx.fillStyle; ctx.fill(); ctx.shadowBlur=0;});
    const shipY=420; ctx.fillStyle='#ffc857'; ctx.beginPath(); ctx.moveTo(playerX,shipY-22); ctx.lineTo(playerX-19,shipY+17); ctx.lineTo(playerX,shipY+10); ctx.lineTo(playerX+19,shipY+17); ctx.closePath(); ctx.fill(); ctx.fillStyle='#63e6ff'; ctx.beginPath(); ctx.arc(playerX,shipY-4,7,0,Math.PI*2); ctx.fill();
    items = items.filter(item=>{ const hit = Math.abs(item.x-playerX)<item.r+19 && Math.abs(item.y-shipY)<item.r+24; if(hit){ if(item.bad) lives--; else score += 10; return false; } return item.y<485; });
    scoreEl.textContent=String(score); livesEl.textContent=String(lives); timeEl.textContent=String(Math.max(0,Math.ceil(30-elapsed))); if(elapsed>=30 || lives<=0){ running=false; overlay.hidden=false; overlay.innerHTML=`${c.over}<br><strong>${c.score}: ${score}</strong><br><small>${c.restart}</small>`; startButton.focus(); return; } if(running) raf=requestAnimationFrame(frame); };
  const frame=(now:number)=>draw(now);
  const move=(x:number)=>{ const rect=canvas.getBoundingClientRect(); playerX=Math.max(22,Math.min(338,(x-rect.left)*360/rect.width)); };
  const key=(e:KeyboardEvent)=>{if(!running)return; if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a') playerX=Math.max(22,playerX-24); if(e.key==='ArrowRight'||e.key.toLowerCase()==='d') playerX=Math.min(338,playerX+24);};
  const pointer=(e:PointerEvent)=>{if(running)move(e.clientX);};
  startButton.addEventListener('click',reset); window.addEventListener('keydown',key); canvas.addEventListener('pointermove',pointer); canvas.addEventListener('pointerdown',pointer); cleanup=()=>{running=false;cancelAnimationFrame(raf);window.removeEventListener('keydown',key);canvas.removeEventListener('pointermove',pointer);canvas.removeEventListener('pointerdown',pointer);section.remove();};
};
export { metadata }; export const unmount=()=>{cleanup?.();cleanup=undefined;}; export default { metadata, mount, unmount } satisfies ToolModule;
