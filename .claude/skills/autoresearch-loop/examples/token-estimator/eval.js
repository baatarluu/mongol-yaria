// eval.js — FIXED scoring harness (READ-ONLY during the loop)
// МN: Тогтмол үнэлгээ. Метрик = MAE (бага нь сайн). Давталтын үед ХӨДӨЛГӨХГҮЙ.
//
// Runs the agent-editable estimator over the fixed dataset and prints ONE
// scalar metric: mean absolute error (MAE) vs the reference token counts.

const { DATA } = require('./prepare.js');
const { estimate } = require('./estimator.js');

let sumAbsErr = 0;
for (const { text, ref } of DATA) {
  const pred = estimate(text);
  sumAbsErr += Math.abs(pred - ref);
}
const mae = sumAbsErr / DATA.length;

// The single line the loop parses:
console.log(`MAE=${mae.toFixed(4)}`);
