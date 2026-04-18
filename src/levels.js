export const LEVELS = [
  { id: 1, name: 'Tenths', pieces: 10, difficulty: 'tenths-no-carry', locked: false },
  { id: 2, name: 'Hundredths', pieces: 100, difficulty: 'hundredths-no-carry', locked: false },
  { id: 3, name: 'Place Value', pieces: 100, difficulty: 'place-value', locked: false },
  { id: 4, name: 'Mixed', pieces: 100, difficulty: 'mixed', locked: false },
  { id: 5, name: 'Regrouping', pieces: 100, difficulty: 'hundredths-regroup', locked: false },
  { id: 6, name: 'Big Numbers', pieces: 100, difficulty: 'hundredths-carry', locked: false },
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundDec(n) {
  return Math.round(n * 100) / 100;
}

export function generateProblem(difficulty) {
  let n1, n2;

  switch (difficulty) {
    case 'tenths-no-carry': {
      const sum = randInt(2, 9);
      n1 = randInt(1, sum - 1);
      n2 = sum - n1;
      return { n1: n1 / 10, n2: n2 / 10, sum: sum / 10, pieces: 10 };
    }
    case 'tenths-carry': {
      const sum = randInt(10, 18);
      n1 = randInt(Math.max(1, sum - 9), Math.min(9, sum - 1));
      n2 = sum - n1;
      return { n1: n1 / 10, n2: n2 / 10, sum: sum / 10, pieces: 10 };
    }
    case 'place-value': {
      // One number is a clean tenth (.X0), the other has 0 tenths (.0Y)
      // e.g. .4 + .06, .30 + .07, .5 + .03
      const tenth = randInt(1, 6) / 10;
      const hundredth = randInt(1, 9) / 100;
      // Randomly swap order so sometimes it's .06 + .4
      if (Math.random() < 0.5) {
        return { n1: tenth, n2: hundredth, sum: roundDec(tenth + hundredth), pieces: 100 };
      }
      return { n1: hundredth, n2: tenth, sum: roundDec(tenth + hundredth), pieces: 100 };
    }
    case 'hundredths-no-carry': {
      const t1 = randInt(1, 4);
      const h1 = randInt(1, 9);
      const t2 = randInt(1, 4);
      const h2 = randInt(1, 9 - h1);
      n1 = t1 / 10 + h1 / 100;
      n2 = t2 / 10 + h2 / 100;
      if (roundDec(n1 + n2) > 0.98) return generateProblem(difficulty);
      return { n1: roundDec(n1), n2: roundDec(n2), sum: roundDec(n1 + n2), pieces: 100 };
    }
    case 'mixed': {
      const tenth = randInt(1, 4) / 10;
      const t2 = randInt(1, 3);
      const h2 = randInt(1, 9);
      const hundredth = t2 / 10 + h2 / 100;
      n1 = tenth;
      n2 = roundDec(hundredth);
      if (roundDec(n1 + n2) >= 1.0) return generateProblem(difficulty);
      return { n1, n2, sum: roundDec(n1 + n2), pieces: 100 };
    }
    case 'hundredths-regroup': {
      // Hundredths digits sum >= 10 (carry into tenths), but total < 1.0
      const t1 = randInt(1, 3);
      const t2 = randInt(1, 3);
      const h1 = randInt(4, 9);
      const h2 = randInt(10 - h1, 9); // ensures h1 + h2 >= 10
      n1 = t1 / 10 + h1 / 100;
      n2 = t2 / 10 + h2 / 100;
      const s = roundDec(n1 + n2);
      if (s >= 1.0) return generateProblem(difficulty);
      return { n1: roundDec(n1), n2: roundDec(n2), sum: s, pieces: 100 };
    }
    case 'hundredths-carry': {
      const t1 = randInt(3, 7);
      const h1 = randInt(3, 9);
      const t2 = randInt(3, 7);
      const h2 = randInt(1, 9);
      n1 = t1 / 10 + h1 / 100;
      n2 = t2 / 10 + h2 / 100;
      const s = roundDec(n1 + n2);
      if (s < 1.0 || s > 1.8) return generateProblem(difficulty);
      return { n1: roundDec(n1), n2: roundDec(n2), sum: s, pieces: 100 };
    }
    default:
      return generateProblem('tenths-no-carry');
  }
}

export function formatDecimal(n) {
  return n.toFixed(n % 1 === 0 ? 1 : (Math.round(n * 100) % 10 === 0 ? 1 : 2));
}

export function getNeededPieces(value, pieces) {
  if (pieces === 10) {
    return { cols: Math.round(value * 10), sqs: 0 };
  }
  const tenths = Math.floor(value * 10);
  const hundredths = Math.round(value * 100) - tenths * 10;
  return { cols: tenths, sqs: hundredths };
}
