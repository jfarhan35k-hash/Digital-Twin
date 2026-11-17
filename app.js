const $ = (s) => document.querySelector(s);
const NS = "http://www.w3.org/2000/svg";
const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const DOMAINS = {
  prod: {
    name: "Production", title: "Production floor", color: "#2796d2",
    stations: ["Inbound", "Assembly", "Dispatch"],
    issues: [
      { id:"p1", x:335, y:450, title:"Material movement is hard to trace", summary:"Pallets and work-in-progress move between stations with manual updates. Teams spend time searching and reconciling records.", impact:"Potential to reduce material-search effort by 15–25%", rupees:[350000,650000], loss:"Search time · line waiting · manual reconciliation", options:[
        ["Add more manual tracking staff","Adds capacity, but the process still depends on manual updates.",0,5,8],
        ["Introduce barcode scans at transfer points","Improves traceability, though each movement still needs a scan.",1,12,18],
        ["Connect RFID events to a live production twin","Creates near-real-time location visibility and highlights flow bottlenecks.",2,18,25]
      ]},
      { id:"p2", x:790, y:455, title:"Assembly line flow is uneven", summary:"Work queues build up between stations while other stations wait for material. The imbalance is difficult to spot early.", impact:"Potential to reduce avoidable waiting by 10–20%", rupees:[450000,800000], loss:"Idle time · queue build-up · missed throughput", options:[
        ["Increase buffer inventory","May soften short interruptions but can hide the underlying imbalance.",0,4,7],
        ["Review line balance once per shift","Improves awareness, but relies on periodic manual analysis.",1,9,14],
        ["Use live cycle-time data and twin simulations","Tests line-balance changes virtually and surfaces bottlenecks as they form.",2,15,20]
      ]},
      { id:"p3", x:1260, y:735, title:"Dispatch planning changes too late", summary:"Finished goods, staging space and dispatch schedules are updated in separate places, creating last-minute reshuffling.", impact:"Potential to reduce dispatch rework by 12–22%", rupees:[300000,600000], loss:"Rescheduling · staging rework · delayed hand-offs", options:[
        ["Add a manual dispatch checklist","Creates discipline but does not synchronize live status.",0,4,8],
        ["Create a shared dispatch dashboard","Improves coordination, with some manual data refresh.",1,10,15],
        ["Link production completion to a twin-based dispatch plan","Aligns staging and dispatch with live production progress.",2,16,22]
      ]}
    ]
  },
  maint: {
    name:"Maintenance", title:"Maintenance floor", color:"#d49a24",
    stations:["CNC Cell", "Utilities", "Service Bay"],
    issues:[
      {id:"m1",x:1015,y:185,title:"CNC spindle health is not visible",summary:"Spindle wear is discovered after performance drops or a breakdown occurs, leaving little time to plan a repair.",impact:"Potential to reduce unplanned downtime by 15–25%",rupees:[650000,1100000],loss:"Emergency repair · lost production · expedited parts",options:[
        ["Keep a larger spare-motor inventory","Can shorten repair waits, but failures still interrupt production.",0,5,9],
        ["Service every machine on a fixed calendar","Reduces some risk but may service healthy assets too early.",1,10,16],
        ["Combine vibration sensing with predictive twin models","Flags changing asset behaviour early so work can be planned around production.",2,18,25]
      ]},
      {id:"m2",x:1245,y:455,title:"Utility consumption spikes go unnoticed",summary:"Compressed air and cooling loads vary during shifts. Without equipment-level visibility, leaks and inefficient operating patterns persist.",impact:"Potential to reduce avoidable utility use by 8–16%",rupees:[250000,500000],loss:"Energy waste · leaks · inefficient operating schedules",options:[
        ["Ask operators to report unusual usage","Useful observations, but intermittent and difficult to quantify.",0,3,6],
        ["Review monthly utility bills","Shows overall trends after the fact, not the source of a spike.",1,7,11],
        ["Monitor equipment-level utility signals in the twin","Connects usage patterns to assets and helps prioritize corrective action.",2,12,16]
      ]},
      {id:"m3",x:700,y:730,title:"Maintenance planning clashes with production",summary:"Service windows are planned separately from the production schedule, causing avoidable disruption and rushed decisions.",impact:"Potential to reduce maintenance-related schedule disruption by 10–20%",rupees:[400000,750000],loss:"Schedule changes · overtime · avoidable changeovers",options:[
        ["Keep maintenance on fixed weekend slots","Simple to coordinate, but may not match actual asset condition.",0,4,7],
        ["Coordinate weekly planning meetings","Improves communication but relies on manually shared information.",1,8,13],
        ["Use asset health and production plans in one twin","Suggests service windows using equipment condition and planned demand.",2,14,20]
      ]}
    ]
  },
  qual: {
    name:"Quality", title:"Quality inspection floor", color:"#8c72ce",
    stations:["Incoming", "Process Check", "Final QA"],
    issues:[
      {id:"q1",x:1030,y:445,title:"Defects are detected at the end of the line",summary:"Inspection happens after much of the product value has already been added, increasing scrap and rework exposure.",impact:"Potential to reduce late-stage defect escapes by 15–25%",rupees:[500000,900000],loss:"Scrap · rework · returns · inspection effort",options:[
        ["Add more end-of-line inspectors","Adds inspection capacity, but defects are still found late.",0,4,8],
        ["Increase batch sampling frequency","Finds more issues, though samples can miss intermittent defects.",1,9,15],
        ["Deploy inline vision linked to process data","Detects defects closer to their source and connects patterns to process conditions.",2,18,25]
      ]},
      {id:"q2",x:785,y:450,title:"Quality records are disconnected",summary:"Inspection readings, machine settings and defect notes sit in separate records, making root-cause analysis slow.",impact:"Potential to reduce investigation time by 20–30%",rupees:[220000,450000],loss:"Manual record matching · repeated investigations · delayed closure",options:[
        ["Create a common spreadsheet template","Standardizes entries but still requires manual consolidation.",0,5,9],
        ["Build a shared quality dashboard","Makes trends easier to see, with continued manual data collection.",1,12,18],
        ["Connect inspection and machine data to the twin","Links quality outcomes with operating conditions for faster root-cause analysis.",2,22,30]
      ]},
      {id:"q3",x:1010,y:185,title:"Process drift is noticed too late",summary:"Small changes in temperature, speed or pressure can gradually affect output before a threshold is crossed.",impact:"Potential to reduce process-drift exposure by 10–20%",rupees:[350000,700000],loss:"Off-spec batches · rework · delayed corrective action",options:[
        ["Increase manual checks","Adds checkpoints, but gaps remain between inspections.",0,4,8],
        ["Set tighter fixed process limits","Can catch known deviations but may not adapt to changing conditions.",1,9,14],
        ["Use twin-based trend detection and what-if tests","Surfaces drift patterns and helps test adjustments before applying them.",2,15,20]
      ]}
    ]
  }
};

const TOOL_INFO = {
  prod: [
    {id:"rfid",name:"RFID tag reader",icon:"⌁",hint:"Use the RFID tag reader."},
    {id:"line-sensor",name:"Speed sensor",icon:"◷",hint:"Use the speed sensor."},
    {id:"dispatch-link",name:"Dispatch tracker",icon:"⇄",hint:"Use the dispatch tracker."},
    {id:"barcode",name:"Barcode reader",icon:"▤",hint:"A barcode scanner tracks items, but this issue needs live location updates."},
    {id:"stock-counter",name:"Stock counter",icon:"▥",hint:"A stock counter tracks quantity, not movement between stations."},
    {id:"forklift-tag",name:"Forklift tag",icon:"▰",hint:"A forklift tag tracks vehicles, not every pallet hand-off."},
    {id:"camera",name:"Camera",icon:"◉",hint:"A floor camera may help, but it does not measure line cycle time."},
    {id:"shift-board",name:"Shift board",icon:"▦",hint:"A shift board is manual and will not sync dispatch status."},
    {id:"maintenance-log",name:"Service log",icon:"▧",hint:"A service log does not solve this production flow issue."}
  ],
  maint: [
    {id:"vibration",name:"Vibration sensor",icon:"〰",hint:"Use the vibration sensor."},
    {id:"energy-meter",name:"Power meter",icon:"ϟ",hint:"Use the power meter."},
    {id:"schedule-twin",name:"Service planner",icon:"▦",hint:"Use the service planner."},
    {id:"thermal-camera",name:"Heat camera",icon:"◉",hint:"A thermal camera checks heat, not spindle vibration."},
    {id:"spare-parts",name:"Spare parts",icon:"▣",hint:"Spare parts reduce repair delay, but do not spot early wear."},
    {id:"lubrication-kit",name:"Oil kit",icon:"⚙",hint:"An oil kit supports service, but does not track asset health."},
    {id:"pressure-gauge",name:"Pressure gauge",icon:"◴",hint:"A pressure gauge checks pressure, not energy use across equipment."},
    {id:"work-order",name:"Work order app",icon:"▤",hint:"A work order app plans jobs, but does not match service to live demand."},
    {id:"operator-check",name:"Check sheet",icon:"☷",hint:"A check sheet depends on manual checks and may miss early changes."}
  ],
  qual: [
    {id:"vision",name:"Inspection camera",icon:"◎",hint:"Use the inspection camera."},
    {id:"data-link",name:"Data link",icon:"⌘",hint:"Use the data link."},
    {id:"trend-monitor",name:"Trend chart",icon:"⌁",hint:"Use the trend chart."},
    {id:"caliper",name:"Digital caliper",icon:"⊣",hint:"A caliper checks size, but does not inspect every item on the line."},
    {id:"sample-kit",name:"Sample kit",icon:"▣",hint:"A sample kit checks selected items, not every item near the source."},
    {id:"defect-board",name:"Defect board",icon:"▤",hint:"A defect board records issues but does not link them to machine settings."},
    {id:"gauge",name:"Pressure gauge",icon:"◴",hint:"A pressure gauge checks one value, not gradual process trends."},
    {id:"barcode",name:"Barcode reader",icon:"▥",hint:"A barcode scanner tracks products, not defect patterns."},
    {id:"audit-form",name:"Check form",icon:"☷",hint:"An audit form records checks but does not detect process drift live."}
  ]
};
const ISSUE_META = {
  p1:{label:"Parts not tracked",tool:"rfid",reason:"Correct. RFID event capture makes pallet and work-in-progress locations visible across hand-offs, reducing search and reconciliation time."},
  p2:{label:"One station is slow",tool:"line-sensor",reason:"Correct. Cycle-time sensing reveals where queues form and where downstream stations are starved, giving the team evidence to rebalance the line."},
  p3:{label:"Dispatch info is late",tool:"dispatch-link",reason:"Correct. Linking production completion with dispatch planning aligns staging, finished-goods readiness and vehicle schedules."},
  m1:{label:"Machine vibration is high",tool:"vibration",reason:"Correct. Vibration monitoring identifies changing spindle behaviour early enough to plan inspection and maintenance before an unplanned stoppage."},
  m2:{label:"Power use is high",tool:"energy-meter",reason:"Correct. Equipment-level energy data helps isolate abnormal consumption and distinguish asset-level leaks or inefficient operating patterns."},
  m3:{label:"Service stops production",tool:"schedule-twin",reason:"Correct. A planning twin combines asset condition with production demand so service windows can be selected with less schedule disruption."},
  q1:{label:"Defects are missed",tool:"vision",reason:"Correct. Inline vision inspection detects defects closer to their source, reducing the value added before a defect is identified."},
  q2:{label:"Quality data is missing",tool:"data-link",reason:"Correct. Linking inspection readings with machine settings preserves process context and speeds evidence-based root-cause analysis."},
  q3:{label:"Product size is changing",tool:"trend-monitor",reason:"Correct. Trend monitoring surfaces gradual movement in process conditions before it becomes an out-of-specification event."}
};
let activeDomain = null, resolved = new Set(), startedAt = 0, timer = null, elapsedPenalty = 0, selectedIssue = null;
let totalImpactLow = 0, totalImpactHigh = 0, totalTimeSavedLow = 0, totalTimeSavedHigh = 0, score = 0;
const fmtTime = seconds => `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(Math.floor(seconds%60)).padStart(2,"0")}`;
const elapsed = () => startedAt ? Math.floor((Date.now()-startedAt)/1000)+elapsedPenalty : 0;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const moneyRange = (lo,hi) => `${INR.format(lo)}–${INR.format(hi)}`;

function renderMap() {
  const domain = DOMAINS[activeDomain], svg=$("#map");
  svg.innerHTML = `<defs><filter id="markerShadow" x="-80%" y="-80%" width="260%" height="260%"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#263b32" flood-opacity=".28"/></filter></defs>`;
  domain.issues.forEach((issue)=>{
    const done=resolved.has(issue.id), meta=ISSUE_META[issue.id], g=document.createElementNS(NS,"g");
    // Keep both the error marker and its short label inside the illustrated factory.
    const x=Math.max(104,Math.min(1432,issue.x));
    const y=Math.max(122,Math.min(940,issue.y));
    g.setAttribute("class",`hotspot ${done?"is-done":""}`);
    g.setAttribute("role","button");g.setAttribute("tabindex","0");
    g.setAttribute("aria-label",`${meta.label}: ${done?"fixed":"error"}`);
    const labelWidth=Math.max(132,Math.min(300,meta.label.length*11+34));
    g.innerHTML=`<g class="issue-label"><rect x="${x-labelWidth/2}" y="${Math.max(12,y-88)}" width="${labelWidth}" height="38" rx="13"/><text x="${x}" y="${Math.max(37,y-63)}" text-anchor="middle">${esc(meta.label)}</text></g><circle cx="${x}" cy="${y}" r="45" class="marker-halo"/><path d="M ${x-22} ${y-34} L ${x+22} ${y-34} L ${x+37} ${y-19} L ${x+37} ${y+19} L ${x+22} ${y+34} L ${x-22} ${y+34} L ${x-37} ${y+19} L ${x-37} ${y-19} Z" class="marker-error" filter="url(#markerShadow)"/><text x="${x}" y="${y+12}" text-anchor="middle" class="marker-symbol">${done?"✓":"×"}</text>`;
    g.addEventListener("click",()=>{selectedIssue=issue;showHint(issue,null);});
    g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();showHint(issue,null);}});
    g.addEventListener("dragover",e=>{if(!done){e.preventDefault();g.classList.add("drop-target");}});
    g.addEventListener("dragleave",()=>g.classList.remove("drop-target"));
    g.addEventListener("drop",e=>{e.preventDefault();g.classList.remove("drop-target");const id=e.dataTransfer.getData("text/tool-id");if(id)applyTool(issue,id);});
    svg.appendChild(g);
  });
}
function renderToolTray(){
  const tools=TOOL_INFO[activeDomain];
  $("#tool-tray").innerHTML=`<div class="tool-tray-head"><b>TOOLS</b><small>${tools.length} tools</small></div><div class="tool-scroll" id="tool-scroll"><div class="tool-items">${tools.map(t=>`<button class="tool-chip" draggable="true" data-tool="${t.id}" aria-label="Drag ${t.name} to an error"><span class="tool-icon">${t.icon}</span><span>${t.name}</span></button>`).join("")}</div></div><input class="tool-slider" id="tool-slider" type="range" min="0" max="100" value="0" aria-label="Move through tools">`;
  const scroller=$("#tool-scroll"), slider=$("#tool-slider");
  const syncSlider=()=>{const max=scroller.scrollWidth-scroller.clientWidth;slider.value=max>0?Math.round(scroller.scrollLeft/max*100):0;};
  scroller.addEventListener("scroll",syncSlider,{passive:true});
  slider.addEventListener("input",()=>{const max=scroller.scrollWidth-scroller.clientWidth;scroller.scrollLeft=max*(Number(slider.value)/100);});
  $("#tool-tray").querySelectorAll("[data-tool]").forEach(btn=>{
    btn.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/tool-id",btn.dataset.tool);e.dataTransfer.effectAllowed="move";btn.classList.add("is-dragging");});
    btn.addEventListener("dragend",()=>btn.classList.remove("is-dragging"));
    btn.addEventListener("click",()=>{const pending=selectedIssue&&!resolved.has(selectedIssue.id)?selectedIssue:DOMAINS[activeDomain].issues.find(i=>!resolved.has(i.id));if(pending)applyTool(pending,btn.dataset.tool);});
  });
  requestAnimationFrame(syncSlider);
}
function chooseDomain(id) {
  activeDomain=id;resolved=new Set();startedAt=Date.now();elapsedPenalty=0;
  $("#timer-slot").classList.remove("leaderboard-slot");
  $("#timer-slot").innerHTML=`<small>SHIFT TIMER</small><b id="tm">00:00</b>`;
  $("#sb").textContent="Save score";$("#sb").disabled=false;$("#nm").value="";
  totalImpactLow=0;totalImpactHigh=0;totalTimeSavedLow=0;totalTimeSavedHigh=0;score=0;
  document.body.classList.add("map-mode");
  $("#landing").hidden=true;$("#factory-stage").hidden=false;
  $("#map-domain").textContent=`${DOMAINS[id].name.toUpperCase()} FLOOR`;
  $("#map-context").textContent=`${DOMAINS[id].name} · PLANT 01`;
  $("#fx").textContent="0 / 3";$("#tm").textContent="00:00";$("#sv").textContent="₹0";
  $("#feedback-modal").hidden=true;
  renderMap();renderToolTray();updateProgress();clearInterval(timer);timer=setInterval(()=>$("#tm").textContent=fmtTime(elapsed()),250);
}
function backToDomains(){clearInterval(timer);timer=null;activeDomain=null;document.body.classList.remove("map-mode");$("#factory-stage").hidden=true;$("#landing").hidden=false;$("#feedback-modal").hidden=true;}
function updateProgress(){$("#fx").textContent=`${resolved.size} / 3`;}
function showHint(issue,toolId){
  if(resolved.has(issue.id))return;
  const meta=ISSUE_META[issue.id], expected=TOOL_INFO[activeDomain].find(t=>t.id===meta.tool);
  const correct=toolId===meta.tool;
  $("#feedback-content").innerHTML=toolId===null
    ? `<div class="feedback-mark is-hint">!</div><p class="feedback-kicker">FACTORY ERROR</p><h2>${esc(meta.label)}</h2><p>Choose a tool for this error.</p><button class="primary-button full-button" id="feedback-back">Back to map <span>→</span></button>`
    : correct
    ? `<div class="feedback-mark is-correct">✓</div><p class="feedback-kicker">GOOD MATCH</p><h2>Correct</h2><p>${esc(meta.reason)}</p><button class="primary-button full-button" id="feedback-back">Back to map <span>→</span></button>`
    : `<div class="feedback-mark is-hint">↗</div><p class="feedback-kicker">TRY AGAIN</p><h2>Not this tool</h2><p>${esc(expected.name)} is the right tool.</p><button class="primary-button full-button" id="feedback-back">Back to map <span>→</span></button>`;
  $("#feedback-modal").hidden=false;

  // Commit a correct match as soon as it is made. Closing the message is only a UI action.
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
function applyTool(issue,toolId){if(resolved.has(issue.id))return;showHint(issue,toolId);}
function completeIssue(issue){
  selectedIssue=null;
  const meta=ISSUE_META[issue.id], idx=DOMAINS[activeDomain].issues.indexOf(issue);
  const [lo,hi]=issue.rupees;const option=issue.options[2];
  totalImpactLow+=Math.round(lo*option[3]/100);totalImpactHigh+=Math.round(hi*option[4]/100);
  totalTimeSavedLow+=12;totalTimeSavedHigh+=20;score+=100;
  resolved.add(issue.id);renderMap();updateProgress();
  $("#sv").textContent=INR.format(totalImpactLow)+"+";
  if(resolved.size===3)finishDomain();
}
function finishDomain(){clearInterval(timer);timer=null;const duration=elapsed();score+=Math.max(0,Math.round(300-duration/3));$("#eh").textContent=`${DOMAINS[activeDomain].name} shift complete`;
  $("#ep").textContent="All three interventions matched the operational issue. Validate the illustrative impact against plant baselines before treating it as realised savings.";
  $("#es").innerHTML=`<div><small>TIME TAKEN</small><b>${fmtTime(duration)}</b></div><div><small>MODELLED ANNUAL VALUE</small><b>${moneyRange(totalImpactLow,totalImpactHigh)}</b></div><div><small>TIME RECOVERY RANGE</small><b>${totalTimeSavedLow}–${totalTimeSavedHigh}%</b></div>`;
  $("#timer-slot").classList.add("leaderboard-slot");$("#timer-slot").innerHTML=`<button id="open-leaderboard">🏆 Leaderboard</button>`;
  $("#open-leaderboard").onclick=openLeaderboard;
  $("#end").hidden=false;renderLeaderboard();}
function renderLeaderboard(){const rows=window.TwinForgeLeaderboard?window.TwinForgeLeaderboard.getAll().slice(0,50):[];$("#lb-empty").hidden=rows.length>0;$("#lb").innerHTML=rows.length?`<thead><tr><th>RANK</th><th>PLAYER</th><th>DOMAIN</th><th>SCORE</th><th>DATE</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(r.domain)}</td><td>${r.score}</td><td>${esc(r.date)}</td></tr>`).join("")}</tbody>`:"";}
function saveScore(){const name=$("#nm").value.trim()||"Player";const result=window.TwinForgeLeaderboard.add({name,domain:DOMAINS[activeDomain].name,score,date:new Date().toLocaleDateString("en-IN")});if(result.ok){$("#sb").textContent="Saved ✓";$("#sb").disabled=true;renderLeaderboard();}else{$("#lb-empty").hidden=false;$("#lb-empty").textContent="Could not save this score. Check browser storage.";}}
function openLeaderboard(){$("#end").hidden=true;$("#leaderboard-modal").hidden=false;renderLeaderboard();}
function closeLeaderboard(){$("#leaderboard-modal").hidden=true;}
function exportLeaderboard(){const result=window.TwinForgeLeaderboard.exportCSV();if(!result.ok)alert("There are no saved leaderboard results to export yet.");}
window.addEventListener("twinforge:leaderboard-updated",renderLeaderboard);
document.querySelectorAll("[data-domain]").forEach(b=>b.addEventListener("click",()=>chooseDomain(b.dataset.domain)));
$("#back-domains").addEventListener("click",backToDomains);
$("#sb").addEventListener("click",saveScore);$("#export-lb").addEventListener("click",exportLeaderboard);
$("#close-leaderboard").addEventListener("click",closeLeaderboard);
$("#leaderboard-modal").addEventListener("click",e=>{if(e.target===$("#leaderboard-modal"))closeLeaderboard();});
$("#return-map").addEventListener("click",()=>{$("#end").hidden=true;});
$("#play-again").addEventListener("click",()=>{$("#end").hidden=true;$("#leaderboard-modal").hidden=true;backToDomains();});
$("#feedback-modal").addEventListener("click",e=>{if(e.target===$("#feedback-modal"))$("#feedback-modal").hidden=true;});
