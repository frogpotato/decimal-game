import { placeColumn, placeSquare, getGridFrame } from './grid.js';
import { playPop } from './audio.js';

let onPlaceCallback = null;
let activeDrag = null;

export function setOnPlace(cb) { onPlaceCallback = cb; }

export function initDrag(pieceEl, type, color) {
  // Prevent default touch behaviors
  pieceEl.style.touchAction = 'none';
  pieceEl.style.userSelect = 'none';
  pieceEl.style.webkitUserSelect = 'none';

  pieceEl.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // If piece is exhausted, ignore
    if (pieceEl.classList.contains('exhausted')) return;

    playPop();

    const rect = pieceEl.getBoundingClientRect();
    const clone = document.createElement('div');
    clone.className = `piece piece-clone piece-${type} piece-${color}`;
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.left = (e.clientX - rect.width / 2) + 'px';
    clone.style.top = (e.clientY - rect.height / 2) + 'px';
    document.body.appendChild(clone);

    activeDrag = { clone, type, color, startX: e.clientX, startY: e.clientY, moved: false };

    const frame = getGridFrame();

    const onMove = (ev) => {
      if (!activeDrag) return;
      ev.preventDefault();
      activeDrag.moved = true;
      activeDrag.clone.style.left = (ev.clientX - rect.width / 2) + 'px';
      activeDrag.clone.style.top = (ev.clientY - rect.height / 2) + 'px';

      if (frame) {
        const fr = frame.getBoundingClientRect();
        const over = ev.clientX >= fr.left && ev.clientX <= fr.right &&
                     ev.clientY >= fr.top && ev.clientY <= fr.bottom;
        frame.classList.toggle('drop-hover', over);
      }
    };

    const onUp = (ev) => {
      if (!activeDrag) return;
      ev.preventDefault();

      if (frame) frame.classList.remove('drop-hover');

      let shouldPlace = false;

      if (activeDrag.moved) {
        // Drag mode — check if over grid
        const fr = frame ? frame.getBoundingClientRect() : null;
        shouldPlace = fr && ev.clientX >= fr.left && ev.clientX <= fr.right &&
                      ev.clientY >= fr.top && ev.clientY <= fr.bottom;
      } else {
        // Tap mode — just place it directly (no drag needed)
        shouldPlace = true;
      }

      if (shouldPlace) {
        let placed = false;
        if (type === 'column') placed = placeColumn(color);
        else placed = placeSquare(color);
        if (placed && onPlaceCallback) onPlaceCallback();
      }

      activeDrag.clone.remove();
      activeDrag = null;

      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };

    // Use document-level listeners for reliability
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  });
}
