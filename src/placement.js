import { placeColumn, placeSquare, getGridFrame } from './grid.js';
import { playPop } from './audio.js';

let onPlaceCallback = null;
let activeDrag = null;

export function setOnPlace(cb) { onPlaceCallback = cb; }

export function initDrag(pieceEl, type, color) {
  pieceEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    pieceEl.setPointerCapture(e.pointerId);
    playPop();

    const rect = pieceEl.getBoundingClientRect();
    const clone = document.createElement('div');
    clone.className = `piece piece-clone piece-${type} piece-${color}`;
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.left = (e.clientX - rect.width / 2) + 'px';
    clone.style.top = (e.clientY - rect.height / 2) + 'px';
    document.body.appendChild(clone);

    activeDrag = { clone, type, color, pointerId: e.pointerId };

    const frame = getGridFrame();
    if (frame) frame.classList.add('drop-hover');

    const onMove = (ev) => {
      if (!activeDrag || ev.pointerId !== activeDrag.pointerId) return;
      ev.preventDefault();
      clone.style.left = (ev.clientX - rect.width / 2) + 'px';
      clone.style.top = (ev.clientY - rect.height / 2) + 'px';

      if (frame) {
        const fr = frame.getBoundingClientRect();
        const over = ev.clientX >= fr.left && ev.clientX <= fr.right &&
                     ev.clientY >= fr.top && ev.clientY <= fr.bottom;
        frame.classList.toggle('drop-hover', over);
      }
    };

    const onUp = (ev) => {
      if (!activeDrag || ev.pointerId !== activeDrag.pointerId) return;
      ev.preventDefault();

      if (frame) frame.classList.remove('drop-hover');

      const fr = frame ? frame.getBoundingClientRect() : null;
      const over = fr && ev.clientX >= fr.left && ev.clientX <= fr.right &&
                   ev.clientY >= fr.top && ev.clientY <= fr.bottom;

      if (over) {
        let placed = false;
        if (type === 'column') placed = placeColumn(color);
        else placed = placeSquare(color);

        if (placed && onPlaceCallback) onPlaceCallback();
      }

      clone.remove();
      activeDrag = null;

      pieceEl.removeEventListener('pointermove', onMove);
      pieceEl.removeEventListener('pointerup', onUp);
      pieceEl.removeEventListener('pointercancel', onUp);
    };

    pieceEl.addEventListener('pointermove', onMove);
    pieceEl.addEventListener('pointerup', onUp);
    pieceEl.addEventListener('pointercancel', onUp);
  });
}
