 const modal = document.getElementById("instructionsModal");
  const openBtn = document.getElementById("openInstructions");
   

  openBtn.onclick = () => modal.style.display = "block";
  
  window.onclick = e => { if (e.target == modal) modal.style.display = "none"; }
// Globals
let lineData = [];
let YbusMat = null;
let BbusMat = null;
let nbus = 0;

// Generate Line Table Function
function generateLineTable() {
  const cnt = parseInt(document.getElementById('numLines').value);
  if (!cnt || cnt < 1) return alert('Enter valid number of lines.');
  let html = '<table><tr><th>#</th><th>From</th><th>To</th><th>R (pu)</th><th>X (pu)</th><th>B/2 (pu)</th></tr>';
  for (let i = 1; i <= cnt; i++) {
    html += `<tr><td>${i}</td>` +
      `<td><input type="number" id="lineFrom${i}" /></td>` +
      `<td><input type="number" id="lineTo${i}" /></td>` +
      `<td><input type="number" step="any" id="lineR${i}" /></td>` +
      `<td><input type="number" step="any" id="lineX${i}" /></td>` +
      `<td><input type="number" step="any" id="lineB${i}" /></td></tr>` ;
  }
  html += '</table>';
  document.getElementById('lineTableContainer').innerHTML = html;
}

function autofillFiveBusLines() {
  document.getElementById('numLines').value = 6;
  generateLineTable();
  const from = [1,1,2,3,3,4];
  const to   = [2,5,3,4,5,5];
  const R    = [0.042,0.031,0.031,0.024,0.053,0.063];
  const X    = [0.168,0.126,0.126,0.136,0.210,0.252];
  const B    = [0.041,0.031,0.031,0.082,0.051,0.061];
  for (let i = 1; i <= 6; i++) {
    document.getElementById(`lineFrom${i}`).value = from[i-1];
    document.getElementById(`lineTo${i}`).value   = to[i-1];
    document.getElementById(`lineR${i}`).value    = R[i-1];
    document.getElementById(`lineX${i}`).value    = X[i-1];
    document.getElementById(`lineB${i}`).value    = B[i-1];
  }
}


/* ---- Generate Measurement Data Table ---- */
function generateMeasTable() {
    document.getElementById("measurementTypes").style.display = "block";

  const cnt = parseInt(document.getElementById('numMeas').value);
  if (!cnt || cnt < 1) return alert('Enter valid measurement count');
  let html = '<table><tr><th>#</th><th>Type</th><th>From</th><th>To</th><th>Measurement (pu)</th><th>Rii</th></tr>';
  for (let i = 1; i <= cnt; i++) html +=
    `<tr><td>${i}</td>` +
    `<td><input type="number" id="measType${i}" /></td>` +
    `<td><input type="number" id="measFrom${i}" /></td>` +
    `<td><input type="number" id="measTo${i}" /></td>` +
    `<td><input type="number" step="any" id="measVal${i}" /></td>` +
    `<td><input type="number" step="any" id="measR${i}" /></td></tr>`;
  html += '</table>';
  document.getElementById('measTableContainer').innerHTML = html;
}

/* ---- Type-4 5 test data ---- */
 function autofillFiveBusMeas() {
  const types = [4, 4, 4, 4, 4, 4, 5, 5]; // Example: 1=Voltage, 2=Real Power Injection, etc.
  const from = [1, 1, 2, 3, 3, 4, 1, 1];
  const to   = [2, 5, 3, 4, 5, 5, 2, 5];
  const vals = [-0.1615, 0.7289, 0.3382, 0.9630, 0.3685, -0.2240, 0.0019, 0.2632]; // Example measurement values
  const r = [1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10];

  document.getElementById('numMeas').value = types.length;
  generateMeasTable();
  for (let i = 1; i <= types.length; i++) {
    document.getElementById(`measType${i}`).value = types[i - 1];
    document.getElementById(`measFrom${i}`).value = from[i - 1];
    document.getElementById(`measTo${i}`).value = to[i - 1];
    document.getElementById(`measVal${i}`).value = vals[i - 1];
    document.getElementById(`measR${i}`).value = r[i - 1];
  }
} 

/* ---- Type-1 2 test data ---- */
/*  function autofillFiveBusMeas() {
  const types = [1, 1, 1, 1, 2, 2, 2, 2]; // Example: 1=Voltage, 2=Real Power Injection, etc.
  const from = [2, 3, 4, 5, 1, 2, 3, 4];
  const to   = [2, 3, 4, 5, 1, 2, 3, 4];
  const vals = [1, 1, 0.90594, 0.94397, 0.5674, 0.500, 1, -1.15]; // Example measurement values
  const r = [1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10, 1e-10];

  document.getElementById('numMeas').value = types.length;
  generateMeasTable();
  for (let i = 1; i <= types.length; i++) {
    document.getElementById(`measType${i}`).value = types[i - 1];
    document.getElementById(`measFrom${i}`).value = from[i - 1];
    document.getElementById(`measTo${i}`).value = to[i - 1];
    document.getElementById(`measVal${i}`).value = vals[i - 1];
    document.getElementById(`measR${i}`).value = r[i - 1];
  }
} */


/* ---- State Estimation ---- */

function calculateYbus() {
  const cnt = parseInt(document.getElementById('numLines').value);
  lineData = [];
  for (let i = 1; i <= cnt; i++) {
    const f = parseInt(document.getElementById(`lineFrom${i}`).value);
    const t = parseInt(document.getElementById(`lineTo${i}`).value);
    const r = parseFloat(document.getElementById(`lineR${i}`).value);
    const x = parseFloat(document.getElementById(`lineX${i}`).value);
    const b = parseFloat(document.getElementById(`lineB${i}`).value);
    if ([f, t, r, x, b].some(v => isNaN(v))) continue;
    lineData.push({ f, t, r, x, b });
  }

  nbus = Math.max(...lineData.map(d => Math.max(d.f, d.t)));
  YbusMat = math.zeros(nbus, nbus);  // Initialize Ybus matrix
  BbusMat = math.zeros(nbus, nbus);  // Initialize Bbus matrix

  lineData.forEach(({ f: fb, t: tb, r, x, b}) => {
    const z = math.complex(r, x), y = math.divide(1, z), bsh = math.complex(0, b);
    YbusMat.set([fb - 1, tb - 1], math.subtract(YbusMat.get([fb - 1, tb - 1]), math.divide(y, 1)));
    YbusMat.set([tb - 1, fb - 1], YbusMat.get([fb - 1, tb - 1]));
    BbusMat.set([fb - 1, tb - 1], BbusMat.get([fb - 1, tb - 1]) + b);
    BbusMat.set([tb - 1, fb - 1], BbusMat.get([fb - 1, tb - 1]));
  });

  for (let m = 1; m <= nbus; m++) {
    lineData.forEach(({ f: fb, t: tb, r, x, b }) => {
      const z = math.complex(r, x), y = math.divide(1, z), bsh = math.complex(0, b);
      if (fb === m) YbusMat.set([m - 1, m - 1], math.add(YbusMat.get([m - 1, m - 1]), math.add(math.divide(y, 1), bsh)));
      if (tb === m) YbusMat.set([m - 1, m - 1], math.add(YbusMat.get([m - 1, m - 1]), math.add(y, bsh)));
    });
  }
}

// Check if there are enough measurements
function checkSufficientData() {
  const cnt = parseInt(document.getElementById('numMeas').value);
  let totalMeasurements = 0;

  for (let i = 1; i <= cnt; i++) {
    const type = +document.getElementById(`measType${i}`).value;
    if (type === 1) totalMeasurements++;  // Voltage Magnitudes
    if (type === 2) totalMeasurements++;  // Real Power Injection
    if (type === 3) totalMeasurements++;  // Reactive Power Injection
    if (type === 4) totalMeasurements++;  // Real Power Flow
    if (type === 5) totalMeasurements++;  // Reactive Power Flow
  }

  const numUnknowns = nbus - 2;  // We have nbus - 2 unknowns (voltage and angle for bus 1 are fixed)
  
  if (totalMeasurements < numUnknowns) {
    alert('Not sufficient data. The number of measurements is less than required for state estimation.');
    return false;
  }
  return true;
}

function runEstimation() {
  // Check if the measurement data is sufficient before running the estimation
  if (!checkSufficientData()) return;

  // Proceed with Ybus calculation and state estimation
  calculateYbus();
  const G = math.re(YbusMat).toArray();
  const B = math.im(YbusMat).toArray();
  const bpq = BbusMat.toArray();
  let meas = [];
  const cnt = parseInt(document.getElementById('numMeas').value);
  for (let i = 1; i <= cnt; i++) {
    const type = +document.getElementById(`measType${i}`).value;
    const f = +document.getElementById(`measFrom${i}`).value;
    const t = +document.getElementById(`measTo${i}`).value;
    const z = +document.getElementById(`measVal${i}`).value;
    const R = +document.getElementById(`measR${i}`).value;

    if ([type, f, t, z, R].every(v => !isNaN(v))) {
      meas.push({ type, f, t, z, R });
    }
  }

  // Prepare state variables (Voltage magnitudes and angles)
  const V = Array(nbus).fill(1);
  const del = Array(nbus).fill(0);
  let E = del.slice(1).concat(V.slice(1));
  const z = meas.map(m => m.z);
  const Rinv = meas.map(m => 1 / m.R);
  const M = meas.length;
  let tol = 1, iter = 0;
  const tolInput = +document.getElementById('tolerance').value;
  const iterinput = +document.getElementById('Iteration').value;


 while (tol > tolInput && iter < iterinput) {
      // while chalu

    let h = [], H = [];
    for (let i = 0; i < M; i++) {
      const { type, f, t } = meas[i];
      const m = f - 1, n = t - 1;
      let hi = 0;
      
     
     if (type === 1) {
       hi = V[m];  // Voltage Magnitude measurement
      } else if (type === 2) {
        for (let k2 = 0; k2 < nbus; k2++) {
        hi += V[m] * V[k2] * (G[m][k2] * Math.cos(del[m] - del[k2]) + B[m][k2] * Math.sin(del[m] - del[k2]));
        }
      } else if (type === 3) {
        for (let k2 = 0; k2 < nbus; k2++) {
    hi += V[m] * V[k2] * (G[m][k2] * Math.sin(del[m] - del[k2]) - B[m][k2] * Math.cos(del[m] - del[k2]));
    }
      } else if (type === 4) {
        hi = -V[m] * V[m] * G[m][n] - V[m] * V[n] * (-G[m][n] * Math.cos(del[m] - del[n]) - B[m][n] * Math.sin(del[m] - del[n]));
      } else if (type === 5) {
        hi = -V[m] * V[m] * (-B[m][n] + bpq[m][n]) - V[m] * V[n] * (-G[m][n] * Math.sin(del[m] - del[n]) + B[m][n] * Math.cos(del[m] - del[n]));
      }
      
      h.push(hi);

      const row = Array(2 * (nbus - 1)).fill(0);
      for (let k = 1; k < nbus; k++) {
      const idxTh = k - 1;
      const idxV = (nbus - 1) + (k - 1);

  // Voltage magnitude
  if (type === 1) {
    hi = V[m]; // Voltage at bus m
   row[idxV] = (k === m) ? 1 : 0;
    }
    
  // Real power injection
    else if (type === 2) {
        hi = 0;
        for (let k2 = 0; k2 < nbus; k2++)
        // ∂P_m / ∂θ_k
        if (k === m) {
        let sum = 0;
        for (let n2 = 0; n2 < nbus; n2++) {
            sum += V[m] * V[n2] * (-G[m][n2] * Math.sin(del[m] - del[n2]) + B[m][n2] * Math.cos(del[m] - del[n2]));
        }
        row[idxTh] = sum - V[m] * V[m] * B[m][m];
        } else {
        row[idxTh] = V[m] * V[k] * (G[m][k] * Math.sin(del[m] - del[k]) - B[m][k] * Math.cos(del[m] - del[k]));
        }
        // ∂P_m / ∂V_k
        if (k === m) {
        let sum = 0;
        for (let n2 = 0; n2 < nbus; n2++) {
            sum += V[n2] * (G[m][n2] * Math.cos(del[m] - del[n2]) + B[m][n2] * Math.sin(del[m] - del[n2]));
        }
        row[idxV] = sum + V[m] * G[m][m];
        } else {
        row[idxV] = V[m] * (G[m][k] * Math.cos(del[m] - del[k]) + B[m][k] * Math.sin(del[m] - del[k]));
        }
}
    // Reactive power injection
    else if (type === 3) {
        hi = 0;
    for (let k2 = 0; k2 < nbus; k2++) 
    // ∂Q_m / ∂θ_k
    if (k === m) {
    let sum = 0;
    for (let n2 = 0; n2 < nbus; n2++) {
        sum += V[m] * V[n2] * (G[m][n2] * Math.cos(del[m] - del[n2]) + B[m][n2] * Math.sin(del[m] - del[n2]));
    }
    row[idxTh] = sum - V[m] * V[m] * G[m][m] ;
    } else {
    row[idxTh] = V[m] * V[k] * (-G[m][k] * Math.cos(del[m] - del[k]) - B[m][k] * Math.sin(del[m] - del[k]));
    }
    // ∂Q_m / ∂V_k
    if (k === m) {
    let sum = 0;
    for (let n2 = 0; n2 < nbus; n2++) {
        sum += V[n2] * (G[m][n2] * Math.sin(del[m] - del[n2]) - B[m][n2] * Math.cos(del[m] - del[n2]));
    }
    row[idxV] = sum - V[m] * B[m][m];
    } else {
    row[idxV] = V[m] * (G[m][k] * Math.sin(del[m] - del[k]) - B[m][k] * Math.cos(del[m] - del[k]));
    }
    }


  // Type 4 & 5 already implemented (as you had)
  else if (type === 4) {
    if (k === m) row[idxTh] = V[m] * V[n] * (-G[m][n] * Math.sin(del[m] - del[n]) + B[m][n] * Math.cos(del[m] - del[n]));
    if (k === n) row[idxTh] = -V[m] * V[n] * (-G[m][n] * Math.sin(del[m] - del[n]) + B[m][n] * Math.cos(del[m] - del[n]));
    if (k === m) row[idxV] = -2 * G[m][n] * V[m] - V[n] * (-G[m][n] * Math.cos(del[m] - del[n]) - B[m][n] * Math.sin(del[m] - del[n]));
    if (k === n) row[idxV] = -V[m] * (-G[m][n] * Math.cos(del[m] - del[n]) - B[m][n] * Math.sin(del[m] - del[n]));
  } else if (type === 5) {
    if (k === m) row[idxTh] = -V[m] * V[n] * (-G[m][n] * Math.cos(del[m] - del[n]) - B[m][n] * Math.sin(del[m] - del[n]));
    if (k === n) row[idxTh] = V[m] * V[n] * (-G[m][n] * Math.cos(del[m] - del[n]) - B[m][n] * Math.sin(del[m] - del[n]));
    if (k === m) row[idxV] = -2 * (-B[m][n] + bpq[m][n]) * V[m] - V[n] * (-G[m][n] * Math.sin(del[m] - del[n]) + B[m][n] * Math.cos(del[m] - del[n]));
    if (k === n) row[idxV] = -V[m] * (-G[m][n] * Math.sin(del[m] - del[n]) + B[m][n] * Math.cos(del[m] - del[n]));
    }
    }
    H.push(row); 
    }

    const Hmat = math.matrix(H);
    const RinvMat = math.diag(Rinv);
    const rvec = math.subtract(math.matrix(z), math.matrix(h));
    const Gm = math.multiply(math.transpose(Hmat), math.multiply(RinvMat, Hmat));

    let invGm;
    try {
      invGm = math.inv(Gm);
    } catch (err) {
      const eps = 1e-6;
      const I = math.identity(Gm.size()[0]);
      invGm = math.inv(math.add(Gm, math.multiply(eps, I)));
    }

    const dE = math.multiply(invGm, math.multiply(math.transpose(Hmat), math.multiply(RinvMat, rvec)));
    const d = dE.toArray();
      
    for (let i = 0; i < E.length; i++) E[i] += d[i];
    for (let i = 1; i < nbus; i++) {
  del[i] = E[i - 1];                      // angles: 2 to nbus
  V[i] = E[(nbus - 1) + (i - 1)];         // voltages: 2 to nbus
}
    tol = Math.max(...d.map(Math.abs)); iter++;
}
          // while khatam


  // Display results
  let html = '<table><tr><th>Bus</th><th>V (pu)</th><th>Angle (°)</th></tr>';
  for (let i = 0; i < nbus; i++) {
    html += `<tr><td>${i + 1}</td><td>${V[i].toFixed(4)}</td><td>${(del[i] * 180 / Math.PI).toFixed(4)}</td></tr>`;
  }
  html += '</table>';
  document.getElementById('resultContainer').innerHTML = html;
}