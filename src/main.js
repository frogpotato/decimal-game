import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';
import { state, save, resetPlacement, resetProgress } from './state.js';
import { LEVELS, generateProblem, formatDecimal, getNeededPieces } from './levels.js';
import { renderGrid, renderSolidSquare, clearCells, fillAllMustard, shadeCell, placeColumn, placeSquare, getCells, getGridFrame } from './grid.js';
import { initDrag, setOnPlace } from './placement.js';
import { playClick, playCorrect, playWrong, playCountBlip, playUnlock, setSoundOn, isSoundOn } from './audio.js';

const app = document.getElementById('app');

// ── CONFETTI ──────────────────────────────
function spawnConfetti(count = 30) {
  const colors = ['#e94f37', '#2d5d8a', '#f4b942', '#4a7c59', '#c24545'];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = (Math.random() * 100) + 'vw';
    el.style.top = '-20px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.animationDelay = (Math.random() * 0.5) + 's';
    el.style.animationDuration = (1.2 + Math.random() * 1) + 's';
    el.style.width = (6 + Math.random() * 8) + 'px';
    el.style.height = (8 + Math.random() * 12) + 'px';
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function showFeedback(text, type) {
  const el = document.createElement('div');
  el.className = `feedback feedback-${type}`;
  el.textContent = text;
  const area = document.querySelector('.play-area') || app;
  area.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

// ── SPLASH ────────────────────────────────
function renderSplash() {
  app.innerHTML = `
    <div class="splash">
      <div class="splash-square"></div>
      <h1>Break the <em>Square</em></h1>
      <div class="splash-sub">A Decimal Adventure</div>
      <button class="btn-primary" id="btn-go">Let's Go →</button>
    </div>
  `;
  document.getElementById('btn-go').addEventListener('click', () => {
    playClick();
    state.session.phase = 'tutorial';
    state.session.tutorialStep = 0;
    renderTutorial();
  });
}

// ── TUTORIAL ──────────────────────────────
const tutorialSteps = [
  {
    caption: 'This square is <em>1 whole</em>. One full unit.',
    action: 'next',
    setup: (area) => {
      const gc = document.createElement('div');
      gc.id = 'grid-area';
      area.appendChild(gc);
      renderSolidSquare(gc);
    },
  },
  {
    caption: 'We can break it into <em>10 columns</em> to show decimals. Press to watch!',
    action: 'show-me',
    setup: (area) => {
      const gc = document.createElement('div');
      gc.id = 'grid-area';
      area.appendChild(gc);
      renderSolidSquare(gc);
    },
    onShow: async (area) => {
      // Replace solid square with a 10-column grid, revealing columns one by one
      const gc = document.getElementById('grid-area');
      renderGrid(gc, 10);
      const cells = getCells();
      // Start all cells mustard, then reveal each column
      cells.forEach(c => c.classList.add('filled-mustard'));

      for (let i = 0; i < 10; i++) {
        cells[i].classList.remove('filled-mustard');
        cells[i].style.background = 'var(--paper)';
        cells[i].style.border = '1px solid rgba(26,24,20,0.25)';
        playCountBlip(i);

        // Show count badge
        const badge = document.createElement('div');
        badge.className = 'count-badge';
        badge.textContent = i + 1;
        const frame = getGridFrame();
        badge.style.left = '50%';
        badge.style.top = '50%';
        badge.style.transform = 'translate(-50%, -50%)';
        frame.style.position = 'relative';
        frame.appendChild(badge);
        setTimeout(() => badge.remove(), 450);

        await new Promise(r => setTimeout(r, 500));
      }
    },
  },
  {
    caption: 'So <span class="val-red">0.7</span> means 7 out of 10 columns are shaded. Press to see!',
    action: 'show-me',
    setup: (area) => {
      const gc = document.createElement('div');
      gc.id = 'grid-area';
      area.appendChild(gc);
      renderGrid(gc, 10);
    },
    onShow: async () => {
      const cells = getCells();
      for (let i = 0; i < 7; i++) {
        cells[i].classList.add('tutorial-shade');
        playCountBlip(i);
        await new Promise(r => setTimeout(r, 400));
      }
    },
  },
  {
    caption: 'Bigger decimals like <span class="val-red">0.15</span> need even smaller pieces — each column breaks into <em>10 tiny squares</em>, giving us <em>100</em> total.',
    action: 'next',
    setup: (area) => {
      const gc = document.createElement('div');
      gc.id = 'grid-area';
      area.appendChild(gc);
      renderGrid(gc, 100);
    },
  },
  {
    caption: "Let's try together! First just one number, then we'll add two.",
    action: 'next',
    setup: () => {},
  },
  // Round A - 0.7
  {
    caption: 'Here\'s <span class="val-red">0.7</span>. How many pieces? <em>10</em> or <em>100</em>?',
    action: 'pick-pieces',
    expected: 10,
    setup: () => {},
  },
  {
    caption: 'Good! Now drag the tenths onto the grid. You need <span class="val-red">7</span> of them.',
    action: 'drag',
    dragSetup: { n1: 0.7, n2: 0, pieces: 10 },
    setup: () => {},
  },
  {
    caption: "That's it — <span class=\"val-red\">7 tenths = 0.7</span>. Each red column is one tenth.",
    action: 'next',
    setup: () => {},
  },
  // Round B - 0.15
  {
    caption: 'Now <span class="val-red">0.15</span>. Can we show this with only 10 pieces? Try picking!',
    action: 'pick-pieces',
    expected: 100,
    setup: () => {},
  },
  {
    caption: 'Right — we need 100 pieces. Now drag <span class="val-red">1 tenth</span> (column) + <span class="val-red">5 hundredths</span> (little squares).',
    action: 'drag',
    dragSetup: { n1: 0.15, n2: 0, pieces: 100 },
    setup: () => {},
  },
  {
    caption: "Beautiful! <span class=\"val-red\">1 tenth + 5 hundredths = 0.15</span>. That's place value you just did with your hands.",
    action: 'next',
    setup: () => {},
  },
  // Round C - 0.3 + 0.4
  {
    caption: 'Now let\'s add two numbers: <span class="val-red">0.3</span> + <span class="val-blue">0.4</span>. How many pieces?',
    action: 'pick-pieces',
    expected: 10,
    setup: () => {},
  },
  {
    caption: 'Drag <span class="val-red">3 red tenths</span>, then <span class="val-blue">4 blue tenths</span>.',
    action: 'drag',
    dragSetup: { n1: 0.3, n2: 0.4, pieces: 10 },
    setup: () => {},
  },
  {
    caption: 'Now count all the pieces — red AND blue. What\'s the total?',
    action: 'answer',
    expected: 0.7,
    setup: () => {},
  },
  {
    caption: '<span class="val-red">0.3</span> + <span class="val-blue">0.4</span> = <span class="val-mustard">0.7</span> — you got it! Now you\'ll try 3 practice rounds on your own, then the real game.',
    action: 'start',
    setup: () => {},
  },
];

let tutorialShowDone = false;

function renderTutorial() {
  const step = tutorialSteps[state.session.tutorialStep];
  if (!step) { startPractice(); return; }

  tutorialShowDone = false;

  app.innerHTML = `
    <div class="game-layout">
      <div class="sidebar">
        <div class="sidebar-title"><div class="sq"></div> Break the <em>Square</em></div>
        ${renderLevelList()}
      </div>
      <div class="play-area" id="play-area">
        <div class="top-bar">
          <span class="tutorial-badge">Step ${state.session.tutorialStep + 1}</span>
          <button class="skip-btn" id="skip-tutorial">Skip tutorial</button>
        </div>
        <div class="caption-box">${step.caption}</div>
      </div>
      <div class="scoreboard">
        ${renderScoreboard()}
      </div>
    </div>
  `;

  const area = document.getElementById('play-area');

  document.getElementById('skip-tutorial').addEventListener('click', () => {
    playClick();
    startPractice();
  });

  // Run step setup
  step.setup(area);

  // Add action buttons
  if (step.action === 'next') {
    addBtn(area, 'Next →', 'btn-action btn-next', () => {
      playClick();
      state.session.tutorialStep++;
      renderTutorial();
    });
  } else if (step.action === 'show-me') {
    addBtn(area, '▶ Show me!', 'btn-action btn-showme', async (btn) => {
      btn.remove();
      if (step.onShow) await step.onShow(area);
      addBtn(area, 'Next →', 'btn-action btn-next', () => {
        playClick();
        state.session.tutorialStep++;
        renderTutorial();
      });
    });
  } else if (step.action === 'pick-pieces') {
    renderPickButtons(area, step.expected, () => {
      state.session.tutorialStep++;
      renderTutorial();
    });
  } else if (step.action === 'drag') {
    renderDragStep(area, step.dragSetup);
  } else if (step.action === 'answer') {
    renderAnswerInput(area, step.expected, () => {
      playCorrect();
      spawnConfetti();
      showFeedback('Nice!', 'correct');
      state.session.tutorialStep++;
      setTimeout(() => renderTutorial(), 1200);
    });
  } else if (step.action === 'start') {
    spawnConfetti(40);
    addBtn(area, 'Start Playing →', 'btn-primary', () => {
      playClick();
      startPractice();
    });
  }
}

function addBtn(parent, text, cls, onClick) {
  const row = document.createElement('div');
  row.className = 'action-row';
  const btn = document.createElement('button');
  btn.className = cls;
  btn.textContent = text;
  btn.addEventListener('click', () => onClick(btn));
  row.appendChild(btn);
  parent.appendChild(row);
  return btn;
}

function renderPickButtons(parent, expected, onCorrect) {
  const row = document.createElement('div');
  row.className = 'pick-row';
  const hint = document.createElement('div');
  hint.className = 'hint';

  [10, 100].forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'btn-pick';
    btn.textContent = n;
    btn.addEventListener('click', () => {
      playClick();
      if (n === expected) {
        onCorrect();
      } else {
        playWrong();
        btn.classList.add('wrong');
        setTimeout(() => btn.classList.remove('wrong'), 400);
        hint.textContent = n === 10
          ? `Can you show ${formatDecimal(0.15)} with only 10 pieces?`
          : 'We only need 10 pieces for tenths!';
      }
    });
    row.appendChild(btn);
  });

  parent.appendChild(row);
  parent.appendChild(hint);
}

function renderDragStep(parent, setup) {
  const { n1, n2, pieces } = setup;
  resetPlacement();

  // Grid
  const gc = document.createElement('div');
  gc.id = 'grid-area';
  parent.appendChild(gc);
  renderGrid(gc, pieces);

  // Trays
  const traysEl = document.createElement('div');
  traysEl.className = 'trays-container';
  parent.appendChild(traysEl);

  // Tally
  const tallyEl = document.createElement('div');
  tallyEl.className = 'tally';
  tallyEl.id = 'tally';
  parent.appendChild(tallyEl);

  const p1 = n1 > 0 ? getNeededPieces(n1, pieces) : null;
  const p2 = n2 > 0 ? getNeededPieces(n2, pieces) : null;

  const totalNeeded = (p1 ? p1.cols + p1.sqs : 0) + (p2 ? p2.cols + p2.sqs : 0);

  if (p1) renderTray(traysEl, 'red', p1, pieces);
  if (p2) renderTray(traysEl, 'blue', p2, pieces);

  // Action row
  const actionRow = document.createElement('div');
  actionRow.className = 'action-row';
  actionRow.id = 'drag-actions';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn-action btn-clear';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => {
    playClick();
    resetPlacement();
    clearCells();
    updateTally(tallyEl, p1, p2, pieces);
    updateTrays(traysEl, p1, p2);
    if (doneBtn) doneBtn.style.display = 'none';
  });

  const doneBtn = document.createElement('button');
  doneBtn.className = 'btn-action btn-done';
  doneBtn.textContent = 'All placed! →';
  doneBtn.style.display = 'none';
  doneBtn.addEventListener('click', () => {
    playClick();
    state.session.tutorialStep++;
    renderTutorial();
  });

  actionRow.appendChild(clearBtn);
  actionRow.appendChild(doneBtn);
  parent.appendChild(actionRow);

  setOnPlace(() => {
    updateTally(tallyEl, p1, p2, pieces);
    updateTrays(traysEl, p1, p2);
    const placed = state.session.placement;
    const totalPlaced = placed.redCols + placed.redSqs + placed.blueCols + placed.blueSqs;
    if (totalPlaced >= totalNeeded) {
      doneBtn.style.display = '';
    }
  });

  updateTally(tallyEl, p1, p2, pieces);
}

function renderTray(container, color, needed, pieces) {
  const tray = document.createElement('div');
  tray.className = `tray tray-${color}`;
  tray.dataset.color = color;

  const label = document.createElement('div');
  label.className = 'tray-label';
  label.textContent = color === 'red' ? 'Number 1' : 'Number 2';
  tray.appendChild(label);

  if (needed.cols > 0) {
    const row = document.createElement('div');
    row.className = 'piece-row';
    row.dataset.type = 'column';

    const piece = document.createElement('div');
    piece.className = `piece piece-column piece-${color}`;
    piece.style.touchAction = 'none';
    initDrag(piece, 'column', color);

    const info = document.createElement('div');
    info.className = 'piece-info';
    info.innerHTML = `<span class="piece-name">1 tenth</span><span class="piece-count" data-count="col-${color}">×${needed.cols}</span>`;

    row.appendChild(piece);
    row.appendChild(info);
    tray.appendChild(row);
  }

  if (needed.sqs > 0 && pieces === 100) {
    const row = document.createElement('div');
    row.className = 'piece-row';
    row.dataset.type = 'square';

    const piece = document.createElement('div');
    piece.className = `piece piece-square piece-${color}`;
    piece.style.touchAction = 'none';
    initDrag(piece, 'square', color);

    const info = document.createElement('div');
    info.className = 'piece-info';
    info.innerHTML = `<span class="piece-name">1 hundredth</span><span class="piece-count" data-count="sq-${color}">×${needed.sqs}</span>`;

    row.appendChild(piece);
    row.appendChild(info);
    tray.appendChild(row);
  }

  container.appendChild(tray);
}

function updateTrays(traysEl, p1, p2) {
  const pl = state.session.placement;

  // Update counts and exhausted state
  const update = (color, type, needed, used) => {
    const remaining = needed - used;
    const countEl = traysEl.querySelector(`[data-count="${type}-${color}"]`);
    if (countEl) countEl.textContent = `×${Math.max(0, remaining)}`;

    const tray = traysEl.querySelector(`.tray-${color}`);
    if (!tray) return;
    const row = tray.querySelector(`[data-type="${type === 'col' ? 'column' : 'square'}"]`);
    if (!row) return;
    const piece = row.querySelector('.piece');
    if (piece) {
      piece.classList.toggle('exhausted', remaining <= 0);
    }
  };

  if (p1) {
    update('red', 'col', p1.cols, pl.redCols);
    update('red', 'sq', p1.sqs, pl.redSqs);
  }
  if (p2) {
    update('blue', 'col', p2.cols, pl.blueCols);
    update('blue', 'sq', p2.sqs, pl.blueSqs);
  }
}

function updateTally(tallyEl, p1, p2, pieces) {
  const pl = state.session.placement;
  let html = '';

  if (p1 && p1.cols > 0) {
    html += `<span class="tally-chip chip-red"><span class="tally-dot dot-col dot-red"></span> ×${pl.redCols}</span>`;
  }
  if (p1 && p1.sqs > 0 && pieces === 100) {
    html += `<span class="tally-chip chip-red"><span class="tally-dot dot-sq dot-red"></span> ×${pl.redSqs}</span>`;
  }
  if (p2 && p2.cols > 0) {
    if (p1) html += ' <span style="font-weight:700">+</span> ';
    html += `<span class="tally-chip chip-blue"><span class="tally-dot dot-col dot-blue"></span> ×${pl.blueCols}</span>`;
  }
  if (p2 && p2.sqs > 0 && pieces === 100) {
    html += `<span class="tally-chip chip-blue"><span class="tally-dot dot-sq dot-blue"></span> ×${pl.blueSqs}</span>`;
  }

  const totalValue = (pl.redCols + pl.blueCols) / 10 +
    (pieces === 100 ? (pl.redSqs + pl.blueSqs) / 100 : 0);

  if (totalValue > 0) {
    html += ` <span style="font-weight:700">=</span> <span class="tally-total">${formatDecimal(Math.round(totalValue * 100) / 100)}</span>`;
  }

  tallyEl.innerHTML = html;
}

function renderAnswerInput(parent, expected, onCorrect) {
  const row = document.createElement('div');
  row.className = 'answer-row';
  const input = document.createElement('input');
  input.className = 'answer-input';
  input.type = 'text';
  input.inputMode = 'decimal';
  input.placeholder = '?';
  input.autofocus = true;

  const btn = document.createElement('button');
  btn.className = 'btn-action btn-check';
  btn.textContent = 'Check ✓';

  const hint = document.createElement('div');
  hint.className = 'hint';

  const check = () => {
    const val = parseFloat(input.value);
    if (Math.abs(val - expected) < 0.001) {
      onCorrect();
    } else {
      playWrong();
      hint.textContent = 'Try again!';
      input.value = '';
      const frame = getGridFrame();
      if (frame) {
        frame.classList.add('shake');
        setTimeout(() => frame.classList.remove('shake'), 400);
      }
    }
  };

  btn.addEventListener('click', check);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });

  row.appendChild(input);
  row.appendChild(btn);
  parent.appendChild(row);
  parent.appendChild(hint);
  setTimeout(() => input.focus(), 100);
}

// ── PRACTICE & SCORED MODE ────────────────
const QUESTIONS_PER_LEVEL = 5;

function startPractice() {
  state.session.phase = 'practice';
  state.session.practiceLeft = 3;
  state.session.streak = 0;
  state.session.levelQuestions = 0;
  renderGameRound();
}

function startScored() {
  state.session.phase = 'scored';
  state.session.startTime = Date.now();
  state.session.totalPaused = 0;
  state.session.levelQuestions = 0;
  renderGameRound();
}

function renderGameRound() {
  const level = LEVELS[state.session.currentLevel - 1];
  const problem = generateProblem(level.difficulty);
  state.session.problem = problem;

  const isPractice = state.session.phase === 'practice';

  app.innerHTML = `
    <div class="game-layout">
      <div class="sidebar">
        <div class="sidebar-title"><div class="sq"></div> Break the <em>Square</em></div>
        ${renderLevelList()}
      </div>
      <div class="play-area" id="play-area">
        <div class="top-bar">
          ${isPractice ? `<span class="practice-badge">PRACTICE · ${state.session.practiceLeft} left</span>` : `<span class="practice-badge">${state.session.levelQuestions || 0}/${QUESTIONS_PER_LEVEL}</span>`}
          ${!isPractice ? renderTimerPill() : ''}
          ${renderSoundBtn()}
        </div>
        <div class="problem-card">
          <div class="equation">
            <span class="n1">${formatDecimal(problem.n1)}</span>
            <span class="op">+</span>
            <span class="n2">${formatDecimal(problem.n2)}</span>
            <span class="eq">=</span>
            <span class="answer-val">?</span>
          </div>
        </div>
      </div>
      <div class="scoreboard">
        ${renderScoreboard()}
      </div>
    </div>
  `;

  const area = document.getElementById('play-area');
  setupSoundToggle();
  if (!isPractice) setupTimer();

  // Step 1: Pick pieces
  const caption = document.createElement('div');
  caption.className = 'caption-box';
  caption.textContent = 'How should we break the square?';
  area.appendChild(caption);

  renderPickButtons(area, problem.pieces, () => {
    caption.remove();
    // Remove pick buttons
    area.querySelectorAll('.pick-row, .hint').forEach(el => el.remove());
    renderGameDragPhase(area, problem);
  });
}

function renderGameDragPhase(area, problem) {
  resetPlacement();

  const gc = document.createElement('div');
  gc.id = 'grid-area';
  area.appendChild(gc);
  renderGrid(gc, problem.pieces);

  const traysEl = document.createElement('div');
  traysEl.className = 'trays-container';
  area.appendChild(traysEl);

  const p1 = getNeededPieces(problem.n1, problem.pieces);
  const p2 = getNeededPieces(problem.n2, problem.pieces);

  renderTray(traysEl, 'red', p1, problem.pieces);
  renderTray(traysEl, 'blue', p2, problem.pieces);

  const totalNeeded = p1.cols + p1.sqs + p2.cols + p2.sqs;

  // Action buttons
  const actionRow = document.createElement('div');
  actionRow.className = 'action-row';

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn-action btn-clear';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => {
    playClick();
    resetPlacement();
    clearCells();
    updateTrays(traysEl, p1, p2);
    doneBtn.style.display = 'none';
  });

  const doneBtn = document.createElement('button');
  doneBtn.className = 'btn-action btn-done';
  doneBtn.textContent = 'Done Placing →';
  doneBtn.style.display = 'none';
  doneBtn.addEventListener('click', () => {
    playClick();
    traysEl.remove();
    actionRow.remove();
    renderAnswerInput(area, problem.sum, () => onAnswerCorrect(problem));
  });

  actionRow.appendChild(clearBtn);
  actionRow.appendChild(doneBtn);
  area.appendChild(actionRow);

  setOnPlace(() => {
    updateTrays(traysEl, p1, p2);
    const placed = state.session.placement;
    const totalPlaced = placed.redCols + placed.redSqs + placed.blueCols + placed.blueSqs;
    if (totalPlaced >= totalNeeded) {
      doneBtn.style.display = '';
    }
  });
}

function onAnswerCorrect(problem) {
  playCorrect();
  spawnConfetti();
  showFeedback('Nice!', 'correct');

  // Update equation display
  const ansEl = document.querySelector('.answer-val');
  if (ansEl) ansEl.textContent = formatDecimal(problem.sum);

  const isPractice = state.session.phase === 'practice';

  // Track questions answered
  state.session.levelQuestions = (state.session.levelQuestions || 0) + 1;

  if (!isPractice) {
    // Scored mode
    const multiplier = getMultiplier(state.session.streak);
    state.session.streak++;
    state.session.points += 10 * multiplier;

    if (state.session.streak > state.bestStreak) {
      state.bestStreak = state.session.streak;
    }

    updateStars();
    save();

    // After 5 questions, auto-advance to next level
    if (state.session.levelQuestions >= QUESTIONS_PER_LEVEL) {
      const nextLevel = state.session.currentLevel + 1;
      if (nextLevel <= 5) {
        state.unlocked[nextLevel] = true;
        save();
        playUnlock();
        spawnConfetti(60);
        setTimeout(() => {
          showModal('Level Complete!', `Great job! Moving on to Level ${nextLevel}: ${LEVELS[nextLevel - 1].name}!`, () => {
            state.session.currentLevel = nextLevel;
            state.session.levelQuestions = 0;
            startScored();
          });
        }, 1000);
        return;
      } else {
        // All levels done
        setTimeout(() => {
          showModal('All Levels Complete!', 'You finished every level — amazing!', () => {
            state.session.levelQuestions = 0;
            renderGameRound();
          });
        }, 1000);
        return;
      }
    }
  }

  if (isPractice) {
    state.session.practiceLeft--;
    if (state.session.practiceLeft <= 0) {
      setTimeout(() => {
        showModal('Practice done!', "Real rounds next — let's go!", () => {
          startScored();
        });
      }, 1200);
      return;
    }
  }

  // Next problem button
  setTimeout(() => {
    const area = document.getElementById('play-area');
    if (!area) return;
    addBtn(area, 'Next Problem →', 'btn-primary', () => {
      playClick();
      renderGameRound();
    });
  }, 1000);
}

function getMultiplier(streak) {
  if (streak >= 8) return 4;
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

function updateStars() {
  const lvl = state.session.currentLevel;
  let stars = 0;
  if (state.session.streak >= 1) stars = 1;
  if (state.session.streak >= 3) stars = 2;
  // Star 3 requires streak >= 3 AND fast time
  if (state.stars[lvl] < stars) state.stars[lvl] = stars;
}

// ── TIMER ─────────────────────────────────
let timerInterval = null;

function renderTimerPill() {
  return `<div class="timer-pill" id="timer-pill">
    <button class="pause-btn" id="pause-btn" aria-label="Pause">⏸</button>
    <span id="timer-display">0s</span>
  </div>`;
}

function setupTimer() {
  if (timerInterval) clearInterval(timerInterval);
  state.session.startTime = Date.now();
  state.session.totalPaused = 0;
  state.session.paused = false;

  timerInterval = setInterval(() => {
    if (state.session.paused) return;
    const elapsed = Math.floor((Date.now() - state.session.startTime - state.session.totalPaused) / 1000);
    const display = document.getElementById('timer-display');
    if (display) display.textContent = `${elapsed}s`;
  }, 1000);

  setTimeout(() => {
    const pauseBtn = document.getElementById('pause-btn');
    if (!pauseBtn) return;
    pauseBtn.addEventListener('click', () => {
      if (state.session.paused) {
        state.session.totalPaused += Date.now() - state.session.pauseStart;
        state.session.paused = false;
        pauseBtn.textContent = '⏸';
        document.getElementById('timer-pill')?.classList.remove('paused');
      } else {
        state.session.paused = true;
        state.session.pauseStart = Date.now();
        pauseBtn.textContent = '▶';
        document.getElementById('timer-pill')?.classList.add('paused');
      }
    });
  }, 50);
}

// ── SOUND TOGGLE ──────────────────────────
function renderSoundBtn() {
  return `<button class="sound-btn" id="sound-btn" aria-label="Toggle sound">${isSoundOn() ? '🔊' : '🔇'}</button>`;
}

function setupSoundToggle() {
  const btn = document.getElementById('sound-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const on = !isSoundOn();
    setSoundOn(on);
    btn.textContent = on ? '🔊' : '🔇';
    state.prefs.sound = on;
    save();
  });
}

// ── SIDEBAR LEVEL LIST ────────────────────
function renderLevelList() {
  return `<div class="level-list">
    ${LEVELS.map(l => {
      const locked = !state.unlocked[l.id];
      const active = l.id === state.session.currentLevel;
      const stars = state.stars[l.id] || 0;
      return `<button class="level-btn ${locked ? 'level-locked' : ''} ${active ? 'level-active' : ''}"
        data-level="${l.id}" ${locked ? 'disabled' : ''}>
        <span class="level-num">${l.id}</span>
        <span>${l.name}</span>
        <span class="level-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
      </button>`;
    }).join('')}
  </div>`;
}

// ── SCOREBOARD ────────────────────────────
function renderScoreboard() {
  const streak = state.session.streak || 0;
  const mult = getMultiplier(streak);
  const flames = Array.from({ length: 5 }, (_, i) => i < streak ? 'lit' : '').map(
    cls => `<span class="flame ${cls}">🔥</span>`
  ).join('');

  return `
    <div class="score-section">
      <h3>Score</h3>
      <div class="score-points">${state.session.points}</div>
      <div class="score-label">points</div>
    </div>
    <div class="score-section">
      <h3>Streak</h3>
      <div class="streak-flames">${flames}</div>
      <div class="multiplier">×${mult}</div>
    </div>
    <div class="score-section">
      <h3>Best Times</h3>
      ${LEVELS.slice(0, 3).map(l => `
        <div class="best-time-row">
          <span>${l.name}</span>
          <span class="best-time-val">${state.bestTimes[l.id] ? state.bestTimes[l.id] + 's' : '—'}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ── MODAL ─────────────────────────────────
function showModal(title, message, onClose) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>${title}</h2>
      <p>${message}</p>
      <button class="btn-primary" id="modal-close">Let's Go! →</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => {
    overlay.remove();
    if (onClose) onClose();
  };

  overlay.querySelector('#modal-close').addEventListener('click', () => {
    playClick();
    close();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { document.removeEventListener('keydown', handler); close(); }
  });
}

// ── INIT ──────────────────────────────────
setSoundOn(state.prefs.sound);
renderSplash();

// Level selection from sidebar
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.level-btn');
  if (!btn || btn.disabled) return;
  const lvl = parseInt(btn.dataset.level);
  state.session.currentLevel = lvl;
  state.session.phase = 'practice';
  state.session.practiceLeft = 3;
  state.session.streak = 0;
  playClick();
  renderGameRound();
});
