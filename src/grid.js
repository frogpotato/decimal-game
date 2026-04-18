import { state, totalUsedColumns, totalUsedSquares } from './state.js';
import { getNeededPieces } from './levels.js';
import { playSnap } from './audio.js';

let gridEl = null;
let cells = [];
let grids = []; // array of { frame, grid, cells } for multi-grid support
let gridContainer = null; // parent element that holds all grids

export function renderGrid(container, size) {
  state.session.gridSize = size;
  grids = [];
  cells = [];
  gridContainer = container;
  container.innerHTML = '';

  const { frame, grid, gridCells } = createOneGrid(size);
  container.appendChild(frame);
  gridEl = frame;
  cells = gridCells;
  grids.push({ frame, grid, cells: gridCells });
  return { frame, grid, cells: gridCells };
}

function createOneGrid(size) {
  const frame = document.createElement('div');
  frame.className = 'grid-frame';
  if (grids.length === 0) frame.id = 'grid-frame';

  const grid = document.createElement('div');
  grid.className = `grid-container grid-${size}`;
  if (grids.length === 0) grid.id = 'grid';

  // Smaller grids when showing two side by side
  if (grids.length > 0 || state.session.needsMultiGrid) {
    frame.classList.add('grid-half');
  }

  const count = size === 10 ? 10 : 100;
  const gridCells = [];
  for (let i = 0; i < count; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.dataset.index = i;
    grid.appendChild(cell);
    gridCells.push(cell);
  }

  frame.appendChild(grid);
  return { frame, grid, gridCells };
}

function ensureSecondGrid() {
  if (grids.length >= 2) return;
  const size = state.session.gridSize;
  const { frame, grid, gridCells } = createOneGrid(size);

  // Make first grid half-size too
  grids[0].frame.classList.add('grid-half');

  gridContainer.appendChild(frame);
  grids.push({ frame, grid, cells: gridCells });

  // Animate it in
  frame.style.opacity = '0';
  frame.style.transform = 'scale(0.8)';
  requestAnimationFrame(() => {
    frame.style.transition = 'opacity 0.3s, transform 0.3s var(--ease-bounce)';
    frame.style.opacity = '1';
    frame.style.transform = 'scale(1)';
  });
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
  grids = [];
  return { frame, grid };
}

export function getGridFrame() { return gridEl; }
export function getCells() { return cells; }
export function getGrids() { return grids; }

export function clearCells() {
  grids.forEach(g => g.cells.forEach(c => { c.className = 'grid-cell'; }));
  // Remove second grid if it exists
  if (grids.length > 1) {
    grids[1].frame.remove();
    grids.splice(1, 1);
    grids[0].frame.classList.remove('grid-half');
  }
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
    const gridIdx = Math.floor(colIdx / 10);
    const localCol = colIdx % 10;

    if (gridIdx >= 2) return false;

    // Spawn second grid if needed
    if (gridIdx >= 1) ensureSecondGrid();

    const targetCells = grids[gridIdx]?.cells;
    if (!targetCells) return false;

    const cls = color === 'red' ? 'placed-red' : 'placed-blue';
    for (let row = 0; row < 10; row++) {
      targetCells[row * 10 + localCol].classList.add(cls);
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
  const absCol = startCol + Math.floor(sqNum / 10);
  const sqRow = sqNum % 10;

  const gridIdx = Math.floor(absCol / 10);
  const localCol = absCol % 10;

  if (gridIdx >= 2 || sqNum >= 20) return false;

  // Spawn second grid if needed
  if (gridIdx >= 1) ensureSecondGrid();

  const targetCells = grids[gridIdx]?.cells;
  if (!targetCells) return false;

  const cellIdx = sqRow * 10 + localCol;
  const cls = color === 'red' ? 'placed-red' : 'placed-blue';
  targetCells[cellIdx].classList.add(cls);

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
