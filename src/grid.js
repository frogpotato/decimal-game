import { state, totalUsedColumns, totalUsedSquares } from './state.js';
import { getNeededPieces } from './levels.js';
import { playSnap } from './audio.js';

let gridEl = null;
let cells = [];

export function renderGrid(container, size) {
  state.session.gridSize = size;
  const frame = document.createElement('div');
  frame.className = 'grid-frame';
  frame.id = 'grid-frame';

  const grid = document.createElement('div');
  grid.className = `grid-container grid-${size}`;
  grid.id = 'grid';

  const count = size === 10 ? 10 : 100;
  cells = [];
  for (let i = 0; i < count; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.index = i;
    grid.appendChild(cell);
    cells.push(cell);
  }

  frame.appendChild(grid);
  container.innerHTML = '';
  container.appendChild(frame);
  gridEl = frame;
  return { frame, grid, cells };
}

export function renderSolidSquare(container) {
  const frame = document.createElement('div');
  frame.className = 'grid-frame';
  frame.id = 'grid-frame';

  const grid = document.createElement('div');
  grid.className = 'grid-container grid-solid';
  grid.id = 'grid';

  frame.appendChild(grid);
  container.innerHTML = '';
  container.appendChild(frame);
  gridEl = frame;
  cells = [];
  return { frame, grid };
}

export function getGridFrame() { return gridEl; }
export function getCells() { return cells; }

export function clearCells() {
  cells.forEach(c => {
    c.className = 'grid-cell';
  });
}

export function fillAllMustard() {
  cells.forEach(c => c.classList.add('filled-mustard'));
}

export function shadeCell(index, cls, delay) {
  return new Promise(resolve => {
    setTimeout(() => {
      if (cells[index]) cells[index].classList.add(cls);
      resolve();
    }, delay);
  });
}

// Place a column piece (fills a full column)
export function placeColumn(color) {
  const colIdx = totalUsedColumns();
  if (state.session.gridSize === 10) {
    // 10-grid: each cell IS a column
    if (colIdx >= 10) return false;
    const cls = color === 'red' ? 'placed-red' : 'placed-blue';
    cells[colIdx].classList.add(cls);
  } else {
    // 100-grid: fill all 10 rows in the column
    if (colIdx >= 10) return false;
    const cls = color === 'red' ? 'placed-red' : 'placed-blue';
    for (let row = 0; row < 10; row++) {
      cells[row * 10 + colIdx].classList.add(cls);
    }
  }

  if (color === 'red') state.session.placement.redCols++;
  else state.session.placement.blueCols++;

  playSnap();
  return true;
}

// Place a square piece (fills one cell, starting in the column after all needed columns)
export function placeSquare(color) {
  if (state.session.gridSize !== 100) return false;
  const p = state.session.problem;
  const p1 = p ? getNeededPieces(p.n1, p.pieces) : { cols: 0 };
  const p2 = p ? getNeededPieces(p.n2, p.pieces) : { cols: 0 };
  const startCol = p ? (p1.cols + p2.cols) : totalUsedColumns();
  const sqNum = totalUsedSquares();

  // Squares fill down a column, then wrap to the next column
  const sqCol = startCol + Math.floor(sqNum / 10);
  const sqRow = sqNum % 10;
  if (sqCol >= 10 || sqNum >= 20) return false;

  const cellIdx = sqRow * 10 + sqCol;
  const cls = color === 'red' ? 'placed-red' : 'placed-blue';
  cells[cellIdx].classList.add(cls);

  if (color === 'red') state.session.placement.redSqs++;
  else state.session.placement.blueSqs++;

  playSnap();
  return true;
}

export function animateBreak(size, slow = false) {
  const count = size === 10 ? 10 : 100;
  const delay = slow ? 500 : (1000 / count);
  return new Promise(resolve => {
    let i = 0;
    const interval = setInterval(() => {
      if (i >= count) { clearInterval(interval); resolve(); return; }
      cells[i].style.background = 'var(--paper)';
      cells[i].style.border = '1px solid rgba(26,24,20,0.2)';
      i++;
    }, delay);
  });
}
