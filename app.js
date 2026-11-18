const $ = (s) => document.querySelector(s);
const NS = "http://www.w3.org/2000/svg";
const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const DOMAINS = {
  prod: {
    name: "Production", title: "Production floor", color: "#2796d2",
    stations: ["Inbound", "Assembly", "Dispatch"],
    issues: [
      {
        id:"p1", x:335, y:450,
        title:"Manual pallet tracking gaps at line-side",
        summary:"Pallet movements between stores, kitting and assembly are recorded manually. Incomplete hand-off records create inaccurate WIP locations, stock mismatches and delays in material retrieval.",
        impact:"Potential to reduce material-search effort by 15–25%",
        rupees:[350000,650000],
        loss:"Search time · line waiting · manual reconciliation",
        options:[
          ["Add more manual tracking staff","Adds capacity, but the process still depends on manual updates.",0,5,8],
          ["Introduce barcode scans at transfer points","Improves traceability, though each movement still needs a scan.",1,12,18],
          ["Connect RFID events to a live production twin","Creates near-real-time location visibility and highlights flow bottlenecks.",2,18,25]
        ]
      },
      {
        id:"p2", x:790, y:455,
        title:"Assembly cycle time exceeds takt time",
        summary:"PLC cycle-time readings indicate that one assembly station consistently exceeds the required takt time. Upstream stations continue feeding components, creating WIP accumulation and downstream starvation.",
        impact:"Potential to reduce avoidable waiting by 10–20%",
        rupees:[450000,800000],
        loss:"Idle time · queue build-up · missed throughput",
        options:[
          ["Increase buffer inventory","May soften short interruptions but can hide the underlying imbalance.",0,4,7],
          ["Review line balance once per shift","Improves awareness, but relies on periodic manual analysis.",1,9,14],
          ["Use live cycle-time data and twin simulations","Tests line-balance changes virtually and surfaces bottlenecks as they form.",2,15,20]
        ]
      },
      {
        id:"p3", x:1260, y:735,
        title:"MES–WMS dispatch synchronization failure",
        summary:"Production completion signals from the MES are not synchronized with warehouse staging and transport schedules. Delayed order-status updates result in incorrect pallet allocation, vehicle-slot conflicts and dispatch rescheduling.",
        impact:"Potential to reduce dispatch rework by 12–22%",
        rupees:[300000,600000],
        loss:"Rescheduling · staging rework · delayed hand-offs",
        options:[
          ["Add a manual dispatch checklist","Creates discipline but does not synchronize live status.",0,4,8],
          ["Create a shared dispatch dashboard","Improves coordination, with some manual data refresh.",1,10,15],
          ["Link production completion to a twin-based dispatch plan","Aligns staging and dispatch with live production progress.",2,16,22]
        ]
      }
    ]
  },

  maint: {
    name:"Maintenance", title:"Maintenance floor", color:"#d49a24",
    stations:["CNC Cell", "Utilities", "Service Bay"],
    issues:[
      {
        id:"m1", x:1015, y:185,
        title:"Abnormal CNC spindle vibration signature",
        summary:"Accelerometer readings show increasing vibration amplitude around the spindle's bearing frequency range. The machine has not failed yet, but the vibration pattern may indicate bearing degradation, shaft imbalance or misalignment.",
        impact:"Potential to reduce unplanned downtime by 15–25%",
        rupees:[650000,1100000],
        loss:"Emergency repair · lost production · expedited parts",
        options:[
          ["Keep a larger spare-motor inventory","Can shorten repair waits, but failures still interrupt production.",0,5,9],
          ["Service every machine on a fixed calendar","Reduces some risk but may service healthy assets too early.",1,10,16],
          ["Combine vibration sensing with predictive twin models","Flags changing asset behaviour early so work can be planned around production.",2,18,25]
        ]
      },
      {
        id:"m2", x:1245, y:455,
        title:"Compressed-air network pressure loss",
        summary:"Compressor loading remains unusually high during low-demand production periods. Pressure decay across the distribution network suggests possible pneumatic leaks, inefficient pressure regulation or unnecessary air consumption.",
        impact:"Potential to reduce avoidable utility use by 8–16%",
        rupees:[250000,500000],
        loss:"Energy waste · leaks · inefficient operating schedules",
        options:[
          ["Ask operators to report unusual usage","Useful observations, but intermittent and difficult to quantify.",0,3,6],
          ["Review monthly utility bills","Shows overall trends after the fact, not the source of a spike.",1,7,11],
          ["Monitor equipment-level utility signals in the twin","Connects usage patterns to assets and helps prioritize corrective action.",2,12,16]
        ]
      },
      {
        id:"m3", x:700, y:730,
        title:"CMMS work orders conflict with production schedules",
        summary:"Preventive maintenance work orders are generated without considering live asset condition, production order priority or planned machine utilization. This causes maintenance windows to overlap with critical production runs.",
        impact:"Potential to reduce maintenance-related schedule disruption by 10–20%",
        rupees:[400000,750000],
        loss:"Schedule changes · overtime · avoidable changeovers",
        options:[
          ["Keep maintenance on fixed weekend slots","Simple to coordinate, but may not match actual asset condition.",0,4,7],
          ["Coordinate weekly planning meetings","Improves communication but relies on manually shared information.",1,8,13],
          ["Use asset health and production plans in one twin","Suggests service windows using equipment condition and planned demand.",2,14,20]
        ]
      }
    ]
  },

  qual: {
    name:"Quality", title:"Quality inspection floor", color:"#8c72ce",
    stations:["Incoming", "Process Check", "Final QA"],
    issues:[
      {
        id:"q1", x:1030, y:445,
        title:"Surface defects escape upstream inspection",
        summary:"Visual defects such as scratches, dents and coating irregularities are detected only during final inspection. The affected batch must be traced across preceding process stages, increasing rework and containment effort.",
        impact:"Potential to reduce late-stage defect escapes by 15–25%",
        rupees:[500000,900000],
        loss:"Scrap · rework · returns · inspection effort",
        options:[
          ["Add more end-of-line inspectors","Adds inspection capacity, but defects are still found late.",0,4,8],
          ["Increase batch sampling frequency","Finds more issues, though samples can miss intermittent defects.",1,9,15],
          ["Deploy inline vision linked to process data","Detects defects closer to their source and connects patterns to process conditions.",2,18,25]
        ]
      },
      {
        id:"q2", x:785, y:450,
        title:"Disconnected gauge, batch and PLC records",
        summary:"Dimensional inspection readings, batch identifiers and machine operating parameters are stored in separate systems. Without consistent OPC UA data mapping, quality engineers cannot correlate a defective batch with the machine settings active during production.",
        impact:"Potential to reduce investigation time by 20–30%",
        rupees:[220000,450000],
        loss:"Manual record matching · repeated investigations · delayed closure",
        options:[
          ["Create a common spreadsheet template","Standardizes entries but still requires manual consolidation.",0,5,9],
          ["Build a shared quality dashboard","Makes trends easier to see, with continued manual data collection.",1,12,18],
          ["Connect inspection and machine data to the twin","Links quality outcomes with operating conditions for faster root-cause analysis.",2,22,30]
        ]
      },
      {
        id:"q3", x:1010, y:185,
        title:"Gradual dimensional drift in critical parameters",
        summary:"Repeated gauge measurements show a gradual shift in component dimensions toward the upper control limit. Tool wear, temperature variation or process instability may be introducing a trend that is not detected by individual pass/fail inspections.",
        impact:"Potential to reduce process-drift exposure by 10–20%",
        rupees:[350000,700000],
        loss:"Off-spec batches · rework · delayed corrective action",
        options:[
          ["Increase manual checks","Adds checkpoints, but gaps remain between inspections.",0,4,8],
          ["Set tighter fixed process limits","Can catch known deviations but may not adapt to changing conditions.",1,9,14],
          ["Use twin-based trend detection and what-if tests","Surfaces drift patterns and helps test adjustments before applying them.",2,15,20]
        ]
      }
    ]
  }
};

const TOOL_INFO = {
  prod: [
    {id:"rfid",name:"RFID",icon:"⌁"},
    {id:"line-sensor",name:"PLC Sensor",icon:"◷"},
    {id:"dispatch-link",name:"Dispatch Link",icon:"⇄"},
    {id:"barcode",name:"Barcode Scanner",icon:"▤"},
    {id:"forklift-tag",name:"Forklift Tag",icon:"▰"}
  ],
  maint: [
    {id:"vibration",name:"Vibration Sensor",icon:"〰"},
    {id:"energy-meter",name:"Leak Detector",icon:"ϟ"},
    {id:"schedule-twin",name:"CMMS Link",icon:"▦"},
    {id:"thermal-camera",name:"Thermal Camera",icon:"◉"},
    {id:"pressure-gauge",name:"Pressure Gauge",icon:"◴"}
  ],
  qual: [
    {id:"vision",name:"Vision Camera",icon:"◎"},
    {id:"data-link",name:"OPC UA Link",icon:"⌘"},
    {id:"trend-monitor",name:"SPC Chart",icon:"⌁"},
    {id:"caliper",name:"Digital Caliper",icon:"⊣"},
    {id:"sample-kit",name:"Sample Kit",icon:"▣"}
  ]
};

const ISSUE_META = {
  p1:{
    label:"Manual Pallet Tracking Failure",
    tool:"rfid",
    clue:"The missing link is automatic identification at each hand-off. Look for a reader that detects tagged pallets without line-of-sight.",
    reason:"RFID readers capture pallet movement at transfer points. This gives the team a more complete location history and helps reduce search time and line-side stock mismatch."
  },
  p2:{
    label:"Assembly Station Cycle-Time Deviation",
    tool:"line-sensor",
    clue:"Compare actual cycle time with takt time. You need live station data to find the constraint, then a safe way to test a new line balance.",
    reason:"PLC cycle-time data shows which station is above takt time. Twin simulation lets the team test task shifts and buffer changes before changing the live line."
  },
  p3:{
    label:"Conveyor-to-Dispatch Data Mismatch",
    tool:"dispatch-link",
    clue:"The fault crosses production, warehouse and transport. Look for a live connection between order completion, goods staging and vehicle slots.",
    reason:"Linking MES, WMS and TMS data keeps production completion, staging and transport plans aligned, reducing last-minute reshuffling."
  },
  m1:{
    label:"CNC Spindle Bearing Vibration",
    tool:"vibration",
    clue:"The machine is still running, but its vibration pattern is changing. Look for a tool that reads frequency and vibration levels while it runs.",
    reason:"An accelerometer and vibration analyser can reveal bearing wear, imbalance and misalignment early, giving maintenance time to inspect before an unplanned stop."
  },
  m2:{
    label:"Compressed-Air Line Leakage",
    tool:"energy-meter",
    clue:"Air use stays high when demand is low. Think about a tool that can find small leaks along pipes and joints.",
    reason:"An ultrasonic leak detector helps locate compressed-air leaks so repairs can reduce wasted compressor load and energy use."
  },
  m3:{
    label:"Machine Maintenance Scheduling Conflict",
    tool:"schedule-twin",
    clue:"A good service plan needs machine condition and the production calendar together. Look for a link between work orders and shift plans.",
    reason:"A CMMS and production-schedule link helps place maintenance work in lower-impact windows while keeping critical jobs visible."
  },
  q1:{
    label:"Machined Surface Defect Detection",
    tool:"vision",
    clue:"The check must happen on every part as it moves through the process. Look for a system that can inspect visible surface features quickly.",
    reason:"Inline machine vision checks each part near the source of the defect, reducing the amount of work added before a defect is found."
  },
  q2:{
    label:"Gauge-to-PLC Data Integration Gap",
    tool:"data-link",
    clue:"A measurement is useful for root-cause work only when tied to the batch and machine settings at that time. Think about an industrial data connection.",
    reason:"An OPC UA data link can connect gauge results, batch identity and PLC values, giving investigators the process context behind each result."
  },
  q3:{
    label:"Machining Dimensional Drift",
    tool:"trend-monitor",
    clue:"The readings move slowly over time. Look for a method that tracks patterns and warns before a control limit is crossed.",
    reason:"SPC control charts track process variation over time and can flag a trend before dimensions move out of specification."
  }
};

let activeDomain = null, resolved = new Set(), resolvedTools = new Set(), startedAt = 0, timer = null, elapsedPenalty = 0, selectedIssue = null;
let totalImpactLow = 0, totalImpactHigh = 0, totalTimeSavedLow = 0, totalTimeSavedHigh = 0, score = 0;

const fmtTime = seconds => `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(Math.floor(seconds%60)).padStart(2,"0")}`;
const elapsed = () => startedAt ? Math.floor((Date.now()-startedAt)/1000)+elapsedPenalty : 0;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const moneyRange = (lo,hi) => `${INR.format(lo)}–${INR.format(hi)}`;

function renderMap() {
  const domain = DOMAINS[activeDomain], svg=$("#map");

  svg.innerHTML = `
    <defs>
      <filter id="markerShadow" x="-80%" y="-80%" width="260%" height="260%">
        <feDropShadow dx="0" dy="5" stdDeviation="7"
          flood-color="#263b32" flood-opacity=".28"/>
      </filter>
    </defs>
  `;

  const placedLabels = [];

  const MAP_WIDTH = 1536;
  const MAP_HEIGHT = 1024;
  const LABEL_HEIGHT = 38;
  const LABEL_GAP = 12;
  const EDGE_PADDING = 12;

  function overlaps(a, b) {
    return !(
      a.right + LABEL_GAP <= b.left ||
      a.left >= b.right + LABEL_GAP ||
      a.bottom + LABEL_GAP <= b.top ||
      a.top >= b.bottom + LABEL_GAP
    );
  }

  function isValidPosition(rect) {
    if (
      rect.left < EDGE_PADDING ||
      rect.top < EDGE_PADDING ||
      rect.right > MAP_WIDTH - EDGE_PADDING ||
      rect.bottom > MAP_HEIGHT - EDGE_PADDING
    ) {
      return false;
    }

    return !placedLabels.some(existing => overlaps(rect, existing));
  }

  function positionLabel(x, y, width) {
    const halfWidth = width / 2;

    const candidates = [
      { x, y: y - 88 },
      { x, y: y + 50 },
      { x: x - halfWidth - 50, y: y - LABEL_HEIGHT / 2 },
      { x: x + halfWidth + 50, y: y - LABEL_HEIGHT / 2 },
      { x: x - 80, y: y - 125 },
      { x: x + 80, y: y - 125 },
      { x: x - 80, y: y + 90 },
      { x: x + 80, y: y + 90 }
    ];

    for (const candidate of candidates) {
      const rect = {
        left: candidate.x - halfWidth,
        right: candidate.x + halfWidth,
        top: candidate.y,
        bottom: candidate.y + LABEL_HEIGHT
      };

      if (isValidPosition(rect)) {
        placedLabels.push(rect);
        return candidate;
      }
    }

    const step = 48;

    for (let distance = 1; distance <= 15; distance++) {
      for (let dx = -distance; dx <= distance; dx++) {
        for (const dy of [-distance, distance]) {
          const candidate = {
            x: x + dx * step,
            y: y + dy * step
          };

          const rect = {
            left: candidate.x - halfWidth,
            right: candidate.x + halfWidth,
            top: candidate.y,
            bottom: candidate.y + LABEL_HEIGHT
          };

          if (isValidPosition(rect)) {
            placedLabels.push(rect);
            return candidate;
          }
        }
      }

      for (let dy = -distance + 1; dy < distance; dy++) {
        for (const dx of [-distance, distance]) {
          const candidate = {
            x: x + dx * step,
            y: y + dy * step
          };

          const rect = {
            left: candidate.x - halfWidth,
            right: candidate.x + halfWidth,
            top: candidate.y,
            bottom: candidate.y + LABEL_HEIGHT
          };

          if (isValidPosition(rect)) {
            placedLabels.push(rect);
            return candidate;
          }
        }
      }
    }

    const fallback = {
      x: Math.max(
        halfWidth + EDGE_PADDING,
        Math.min(MAP_WIDTH - halfWidth - EDGE_PADDING, x)
      ),
      y: Math.max(
        EDGE_PADDING,
        Math.min(MAP_HEIGHT - LABEL_HEIGHT - EDGE_PADDING, y - 88)
      )
    };

    const rect = {
      left: fallback.x - halfWidth,
      right: fallback.x + halfWidth,
      top: fallback.y,
      bottom: fallback.y + LABEL_HEIGHT
    };

    placedLabels.push(rect);
    return fallback;
  }

  domain.issues.forEach((issue) => {
    const done = resolved.has(issue.id);
    const meta = ISSUE_META[issue.id];

    const g = document.createElementNS(NS, "g");

    const x = Math.max(104, Math.min(1432, issue.x));
    const y = Math.max(122, Math.min(940, issue.y));

    g.setAttribute("class", `hotspot ${done ? "is-done" : ""}`);
    g.setAttribute("role", "button");
    g.setAttribute("tabindex", "0");
    g.setAttribute(
      "aria-label",
      `${meta.label}: ${done ? "fixed" : "error"}`
    );

    const labelWidth = Math.max(
      150,
      Math.min(360, meta.label.length * 9 + 36)
    );

    const labelPosition = positionLabel(x, y, labelWidth);

    const labelX = labelPosition.x;
    const labelY = labelPosition.y;

    g.innerHTML = `
      <g class="issue-label">
        <rect
          x="${labelX - labelWidth / 2}"
          y="${labelY}"
          width="${labelWidth}"
          height="${LABEL_HEIGHT}"
          rx="19"
        />
        <text
          x="${labelX}"
          y="${labelY + 25}"
          text-anchor="middle"
        >${esc(meta.label)}</text>
      </g>

      <circle
        cx="${x}"
        cy="${y}"
        r="45"
        class="marker-halo"
      />

      <path
        d="
          M ${x-22} ${y-34}
          L ${x+22} ${y-34}
          L ${x+37} ${y-19}
          L ${x+37} ${y+19}
          L ${x+22} ${y+34}
          L ${x-22} ${y+34}
          L ${x-37} ${y+19}
          L ${x-37} ${y-19}
          Z
        "
        class="marker-error"
        filter="url(#markerShadow)"
      />

      <text
        x="${x}"
        y="${y+12}"
        text-anchor="middle"
        class="marker-symbol"
      >${done ? "✓" : "×"}</text>
    `;

    g.addEventListener("click", () => {
      selectedIssue = issue;
      showHint(issue, null);
    });

    g.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showHint(issue, null);
      }
    });

    g.addEventListener("dragover", e => {
      if (!done) {
        e.preventDefault();
        g.classList.add("drop-target");
      }
    });

    g.addEventListener("dragleave", () => {
      g.classList.remove("drop-target");
    });

    g.addEventListener("drop", e => {
      e.preventDefault();
      g.classList.remove("drop-target");

      const id = e.dataTransfer.getData("text/tool-id");

      if (id) applyTool(issue, id);
    });

    svg.appendChild(g);
  });
}

function renderToolTray(){
  const tools=TOOL_INFO[activeDomain].filter(t=>!resolvedTools.has(t.id));

  $("#tool-tray").innerHTML=`
    <div class="tool-tray-head">
      <b>TOOLS</b>
      <small>${tools.length} tools left</small>
    </div>
    <div class="tool-scroll" id="tool-scroll">
      <div class="tool-items">
        ${tools.map(t=>`
          <button
            class="tool-chip"
            draggable="true"
            data-tool="${t.id}"
            aria-label="Drag ${t.name} to an error"
            type="button"
          >
            <span class="tool-icon">${t.icon}</span>
            <span>${t.name}</span>
          </button>
        `).join("")}
      </div>
    </div>
    <input class="tool-slider" id="tool-slider" type="range" min="0" max="100" value="0" aria-label="Move through tools">
  `;

  const scroller=$("#tool-scroll"), slider=$("#tool-slider");

  const syncSlider=()=>{
    const max=scroller.scrollWidth-scroller.clientWidth;
    slider.value=max>0?Math.round(scroller.scrollLeft/max*100):0;
  };

  scroller.addEventListener("scroll",syncSlider,{passive:true});

  slider.addEventListener("input",()=>{
    const max=scroller.scrollWidth-scroller.clientWidth;
    scroller.scrollLeft=max*(Number(slider.value)/100);
  });

  // Tools can ONLY be used by dragging them onto a map issue.
  // No click handler is attached to tool buttons.
  $("#tool-tray").querySelectorAll("[data-tool]").forEach(btn=>{
    btn.addEventListener("dragstart",e=>{
      e.dataTransfer.setData("text/tool-id",btn.dataset.tool);
      e.dataTransfer.effectAllowed="move";
      btn.classList.add("is-dragging");
    });

    btn.addEventListener("dragend",()=>{
      btn.classList.remove("is-dragging");
    });
  });

  requestAnimationFrame(syncSlider);
}

function chooseDomain(id) {
  activeDomain=id;
  resolved=new Set();
  resolvedTools=new Set();
  startedAt=Date.now();
  elapsedPenalty=0;

  $("#timer-slot").classList.remove("leaderboard-slot");
  $("#timer-slot").innerHTML=`<small>SHIFT TIMER</small><b id="tm">00:00</b>`;

  $("#sb").textContent="Save score";
  $("#sb").disabled=false;
  $("#nm").value="";

  totalImpactLow=0;
  totalImpactHigh=0;
  totalTimeSavedLow=0;
  totalTimeSavedHigh=0;
  score=0;

  document.body.classList.add("map-mode");
  $("#landing").hidden=true;
  $("#factory-stage").hidden=false;

  $("#map-domain").textContent=`${DOMAINS[id].name.toUpperCase()} FLOOR`;
  $("#map-context").textContent=`${DOMAINS[id].name} · PLANT 01`;

  $("#fx").textContent="0 / 3";
  $("#tm").textContent="00:00";
  $("#sv").textContent="₹0";

  $("#feedback-modal").hidden=true;

  renderMap();
  renderToolTray();
  updateProgress();

  clearInterval(timer);
  timer=setInterval(()=>$("#tm").textContent=fmtTime(elapsed()),250);
}

function backToDomains(){
  clearInterval(timer);
  timer=null;
  activeDomain=null;
  document.body.classList.remove("map-mode");
  $("#factory-stage").hidden=true;
  $("#landing").hidden=false;
  $("#feedback-modal").hidden=true;
}

function updateProgress(){
  $("#fx").textContent=`${resolved.size} / 3`;
}

function showHint(issue,toolId){
  if(resolved.has(issue.id))return;

  const meta=ISSUE_META[issue.id];
  const correct=toolId===meta.tool;

  $("#feedback-content").innerHTML=toolId===null
    ? `<div class="feedback-mark is-hint">!</div>
       <p class="feedback-kicker">FACTORY ERROR</p>
       <h2>${esc(meta.label)}</h2>
       <p>${esc(meta.clue)}</p>
       <button class="primary-button full-button" id="feedback-back">Back to map <span>→</span></button>`

    : correct
    ? `<div class="feedback-mark is-correct">✓</div>
       <p class="feedback-kicker">GOOD MATCH</p>
       <h2>Correct</h2>
       <p>${esc(meta.reason)}</p>
       <button class="primary-button full-button" id="feedback-back">Back to map <span>→</span></button>`

    : `<div class="feedback-mark is-hint">↗</div>
       <p class="feedback-kicker">THINK IT THROUGH</p>
       <h2>Not quite</h2>
       <p>${esc(meta.clue)}</p>
       <button class="primary-button full-button" id="feedback-back">Back to map <span>→</span></button>`;

  $("#feedback-modal").hidden=false;

  if(correct)completeIssue(issue);

  const closeFeedback=()=>{
    $("#feedback-modal").hidden=true;
  };

  $("#feedback-back").onclick=(event)=>{
    event.preventDefault();
    event.stopPropagation();
    closeFeedback();
  };

  $("#feedback-modal").onclick=(event)=>{
    if(event.target===$("#feedback-modal"))closeFeedback();
  };
}

function applyTool(issue,toolId){
  if(resolved.has(issue.id))return;
  showHint(issue,toolId);
}

function completeIssue(issue){
  selectedIssue=null;

  const meta=ISSUE_META[issue.id];
  const idx=DOMAINS[activeDomain].issues.indexOf(issue);

  const [lo,hi]=issue.rupees;
  const option=issue.options[2];

  totalImpactLow+=Math.round(lo*option[3]/100);
  totalImpactHigh+=Math.round(hi*option[4]/100);

  totalTimeSavedLow+=12;
  totalTimeSavedHigh+=20;
  score+=100;

  resolved.add(issue.id);
  resolvedTools.add(meta.tool);

  renderMap();
  renderToolTray();
  updateProgress();

  $("#sv").textContent=INR.format(totalImpactLow)+"+";

  if(resolved.size===3)finishDomain();
}

function finishDomain(){
  clearInterval(timer);
  timer=null;

  const duration=elapsed();

  score+=Math.max(0,Math.round(300-duration/3));

  $("#eh").textContent=`${DOMAINS[activeDomain].name} shift complete`;

  $("#ep").textContent="All three interventions matched the operational issue. Validate the illustrative impact against plant baselines before treating them as realised savings.";

  $("#es").innerHTML=`
    <div><small>TIME TAKEN</small><b>${fmtTime(duration)}</b></div>
    <div><small>MODELLED ANNUAL VALUE</small><b>${moneyRange(totalImpactLow,totalImpactHigh)}</b></div>
    <div><small>TIME RECOVERY RANGE</small><b>${totalTimeSavedLow}–${totalTimeSavedHigh}%</b></div>
  `;

  $("#timer-slot").classList.add("leaderboard-slot");
  $("#timer-slot").innerHTML=`<button id="open-leaderboard">🏆 Leaderboard</button>`;

  $("#open-leaderboard").onclick=openLeaderboard;

  $("#end").hidden=false;
  renderLeaderboard();
}

function renderLeaderboard(){
  const rows=window.TwinForgeLeaderboard
    ?window.TwinForgeLeaderboard.getAll().slice(0,50)
    :[];

  $("#lb-empty").hidden=rows.length>0;

  $("#lb").innerHTML=rows.length
    ? `<thead>
         <tr>
           <th>RANK</th>
           <th>PLAYER</th>
           <th>DOMAIN</th>
           <th>SCORE</th>
           <th>DATE</th>
         </tr>
       </thead>
       <tbody>
         ${rows.map((r,i)=>`
           <tr>
             <td>${i+1}</td>
             <td>${esc(r.name)}</td>
             <td>${esc(r.domain)}</td>
             <td>${r.score}</td>
             <td>${esc(r.date)}</td>
           </tr>
         `).join("")}
       </tbody>`
    :"";
}

function saveScore(){
  const name=$("#nm").value.trim()||"Player";

  const result=window.TwinForgeLeaderboard.add({
    name,
    domain:DOMAINS[activeDomain].name,
    score,
    date:new Date().toLocaleDateString("en-IN")
  });

  if(result.ok){
    $("#sb").textContent="Saved ✓";
    $("#sb").disabled=true;
    renderLeaderboard();
  }else{
    $("#lb-empty").hidden=false;
    $("#lb-empty").textContent="Could not save this score. Check browser storage.";
  }
}

function openLeaderboard(){
  $("#end").hidden=true;
  $("#leaderboard-modal").hidden=false;
  renderLeaderboard();
}

function closeLeaderboard(){
  $("#leaderboard-modal").hidden=true;
}

function exportLeaderboard(){
  const result=window.TwinForgeLeaderboard.exportCSV();

  if(!result.ok){
    alert("There are no saved leaderboard results to export yet.");
  }
}

window.addEventListener("twinforge:leaderboard-updated",renderLeaderboard);

document.querySelectorAll("[data-domain]").forEach(b=>{
  b.addEventListener("click",()=>chooseDomain(b.dataset.domain));
});

$("#back-domains").addEventListener("click",backToDomains);
$("#sb").addEventListener("click",saveScore);
$("#export-lb").addEventListener("click",exportLeaderboard);
$("#close-leaderboard").addEventListener("click",closeLeaderboard);

$("#leaderboard-modal").addEventListener("click",e=>{
  if(e.target===$("#leaderboard-modal"))closeLeaderboard();
});

$("#return-map").addEventListener("click",()=>{
  $("#end").hidden=true;
});

$("#play-again").addEventListener("click",()=>{
  $("#end").hidden=true;
  $("#leaderboard-modal").hidden=true;
  backToDomains();
});

$("#feedback-modal").addEventListener("click",e=>{
  if(e.target===$("#feedback-modal")){
    $("#feedback-modal").hidden=true;
  }
});
