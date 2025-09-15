// === Game Settings ===
let gameSettings = {
  ttsEnabled: true,
  teamCount: 5,
  lifelinesPerStudent: 2
};


// === Timer & Pause state ===
let globalTimerInterval = null;      // replaces GameManager.timerInterval for clarity
let globalTimeLeft = 20;             // seconds left
let isPaused = false;
let startTime; // For tracking answer time


// === Modal controls ===
function openPlayersModal() {
  const modal = document.getElementById('playersModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}
function closePlayersModal() {
  const modal = document.getElementById('playersModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}


// === TTS ===
function speakPlayerName(name) {
    if (!gameSettings.ttsEnabled || !('speechSynthesis' in window)) {
        console.warn('TTS disabled or not supported in this browser.');
        return;
    }
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(name);
    
    // Enhanced TTS settings for crisp and slow speech
    utterance.lang = 'hi-IN';
    utterance.rate = 0.8; // Slower rate for clarity
    utterance.pitch = 1.1; // Slightly higher pitch
    utterance.volume = 0.8; // Good volume level
    
    // Try to find the best Male Hindi voice
    const voices = speechSynthesis.getVoices();
    const maleHindiVoice = voices.find(voice => 
        voice.lang.includes('hi') && 
        (voice.name.includes('Google हिन्दी') || // Often male
         voice.name.includes('Microsoft Ravi') || // Male voice
         voice.name.toLowerCase().includes('male')) // General male check
    ) || voices.find(voice => voice.lang.includes('hi')) || voices[0]; // Fallback
    
    if (maleHindiVoice) {
        utterance.voice = maleHindiVoice;
    } else {
        console.warn('No suitable male Hindi voice found. Using default.');
    }
    
    // Error handling for speech
    utterance.onerror = (event) => {
        console.error('TTS error:', event.error);
    };
    
    speechSynthesis.speak(utterance);
}



// === Team options for manual add ===
function generateTeamOptions() {
  const groupSelect = document.getElementById('groupSelect');
  const teamCount = parseInt(document.getElementById('teamCount').value);
  groupSelect.innerHTML = '';
  const teamLetters = ['A','B','C','D','E','F','G','H'];
  for (let i = 0; i < teamCount; i++) {
    const o = document.createElement('option');
    o.value = teamLetters[i]; o.textContent = `ग्रुप ${teamLetters[i]}`;
    groupSelect.appendChild(o);
  }
}


// === Live leaderboard ===
function updateLiveLeaderboard() {
  const col1 = document.getElementById('liveTopPlayersCol1');
  const col2 = document.getElementById('liveTopPlayersCol2');
  const topTeamsEl = document.getElementById('liveTopTeams');
  if (!col1 || !col2 || !topTeamsEl) return;


  const sortedPlayers = [...GameManager.players].sort((a,b)=>b.score-a.score).slice(0,10);
  const c1 = sortedPlayers.slice(0,5);
  const c2 = sortedPlayers.slice(5,10);
  const item = (p, idx) => `
    <div class="live-item">
      <span class="rank">${idx+1}.</span>
      <span class="name">${p.name}</span>
      <span class="score">${p.score}</span>
    </div>`;


  col1.innerHTML = c1.map(item).join('');
  col2.innerHTML = c2.map((p,i)=>item(p,i+5)).join('');


  const teams = {};
  GameManager.players.forEach(p=>{
    if (!teams[p.group]) teams[p.group]={score:0,players:0,correct:0,wrong:0};
    teams[p.group].score += p.score;
    teams[p.group].players++;
    teams[p.group].correct += p.history.filter(h=>h.isCorrect).length;
    teams[p.group].wrong += p.history.filter(h=>!h.isCorrect).length;
  });


  const sortedTeams = Object.entries(teams).sort(([,a],[,b])=>b.score-a.score).slice(0,4);
  topTeamsEl.innerHTML = sortedTeams.map(([g,d],i)=>`
    <div class="live-item team-item">
      <span class="rank">${i+1}.</span>
      <span class="team-name">
        <span class="group-badge group-${g}">ग्रुप ${g}</span>
        <span class="team-stats">(${d.players} सदस्य)</span>
      </span>
      <span class="score">${d.score}</span>
    </div>
  `).join('');
}


// === Student Registry + Selection (Modal) ===
const REGISTRY_KEY = 'studentRegistry';
const TEAM_LETTERS = ['A','B','C','D','E','F','G','H'];


const DEFAULT_STUDENT_REGISTRY = {
classes: {
"Class 5": ["Saloni Kumari 2.0","Pooja Kumari 2.0","Priya Kumari 2.0","Shushma Kumari","Saloni Kumari","Krishna Kumar","Sohit Kumar","Pooja Kumari","Prince Kumar","PRIYA KUMARI","Pankaj Kumar"],
"Class 6": ["Anshu Kumari 2.0","Atish Kumar","Anshu Kumari","Ranjan Kumar","Asha Kumari","Sanjeet Kumar"],
"Class 7": ["Nandini Kumari 2.0","Sabita Kumar 2.0","Chandani Kumari 2.0","Sabita Kumari","Nandini Kumari","Chandani Kumari"],
"Class 8": ["Riya Kumari","Aditya Kumar","Dev Kumar","Aarti Kumari","Nitu Kumari","Anchal Kumari","Avinash Kumar","Kajal Kumari"],
"Class 9": ["Rekha Kumari","Anisha Kumari","Prince Kumar","Deepak Kumar","Mahesh Kumar"],
"Class 10": ["Nitish Kumar","Pankaj Kumar","Jyotish Kumar","Anshu Kumari","Babita Kumari","Sonam Kumari","Ritu Kumari","Rima Kumari","Priti Kumari","Rajnandini Kumari","Naina Kumari"]
}
};


let StudentRegistry = null;
let selectedStudents = new Set();
let assignmentMap = {};


function loadRegistry() {
  const json = localStorage.getItem(REGISTRY_KEY);
  if (json) { try { StudentRegistry = JSON.parse(json); } catch { StudentRegistry = DEFAULT_STUDENT_REGISTRY; } }
  else StudentRegistry = DEFAULT_STUDENT_REGISTRY;
}
function saveRegistry() { localStorage.setItem(REGISTRY_KEY, JSON.stringify(StudentRegistry)); }
function getAllowedTeams() {
  const cnt = parseInt(document.getElementById('teamCount').value) || 5;
  return TEAM_LETTERS.slice(0, cnt);
}
function renderClassOptions() {
  const sel = document.getElementById('classSelect');
  if (!sel) return;
  sel.innerHTML = '';
  Object.keys(StudentRegistry.classes).forEach(cls=>{
    const opt=document.createElement('option'); opt.value=cls; opt.textContent=cls; sel.appendChild(opt);
  });
}
function renderAssignButtons() {
  const wrap = document.getElementById('assignButtons'); if (!wrap) return;
  const allowed = new Set(getAllowedTeams()); wrap.innerHTML = '';
  TEAM_LETTERS.forEach(letter=>{
    const btn = document.createElement('button');
    btn.className = 'team-letter' + (allowed.has(letter)?'':' disabled');
    btn.textContent = letter;
    btn.onclick = ()=>assignSelectedToTeam(letter);
    wrap.appendChild(btn);
  });
}
function applySearch(list, q){ if(!q) return list; const s=q.toLowerCase().trim(); return list.filter(n=>n.toLowerCase().includes(s)); }
function renderStudentList() {
  const cls = document.getElementById('classSelect')?.value;
  const listEl = document.getElementById('studentList');
  const q = document.getElementById('studentSearch')?.value || '';
  if (!cls || !listEl) return;
  const names = applySearch(StudentRegistry.classes[cls] || [], q);
  listEl.innerHTML = names.map(name=>{
    const checked = selectedStudents.has(name) ? 'checked' : '';
    const team = assignmentMap[name] || '-';
    const badge = team !== '-' ? `group-${team}` : '';
    return `
      <div class="student-item">
        <div class="student-left">
          <input type="checkbox" data-name="${name}" ${checked} />
          <div class="student-name">${name}</div>
        </div>
        <div class="team-pill badge ${badge}">टीम: ${team}</div>
      </div>
    `;
  }).join('');
  listEl.querySelectorAll('input[type="checkbox"]').forEach(cb=>{
    cb.addEventListener('change',(e)=>{
      const nm = e.target.getAttribute('data-name');
      if (e.target.checked) selectedStudents.add(nm); else selectedStudents.delete(nm);
    });
  });
}
function selectAllVisible() {
  const cls = document.getElementById('classSelect')?.value;
  const q = document.getElementById('studentSearch')?.value || '';
  const names = applySearch(StudentRegistry.classes[cls] || [], q);
  names.forEach(n=>selectedStudents.add(n)); renderStudentList();
}
function clearSelection(){ selectedStudents.clear(); renderStudentList(); }
function assignSelectedToTeam(letter) {
  const allowed = new Set(getAllowedTeams());
  if (!allowed.has(letter)) { GameManager.showNotification(`यह टीम उपलब्ध नहीं है`, 'info'); return; }
  selectedStudents.forEach(n=>assignmentMap[n]=letter); renderStudentList();
}
function autoBalanceSelectedIntoTeams() {
  const allowed = getAllowedTeams(); if (allowed.length===0) return;
  const pool=[...selectedStudents];
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  pool.forEach((n,idx)=>assignmentMap[n]=allowed[idx%allowed.length]);
  renderStudentList();
}
function loadSelectedToGame() {
  let added=0; let skipped=0;
  [...selectedStudents].forEach(n=>{
    const g = assignmentMap[n];
    if (!g) { skipped++; return; }
    GameManager.addPlayer(n, g, { initLifelines: gameSettings.lifelinesPerStudent });
    added++;
  });
  if (added===0) GameManager.showNotification('कोई चयनित छात्र टीम के बिना है', 'info');
  else GameManager.showNotification(`${added} छात्र जोड़े गए`, 'success');
}


// === GameManager (enhanced with lifelines, pause, keyboard mapping) ===
const GameManager = {
  players: [],
  questions: [
    { question: "The boy was flying a kite.", correct: "लड़का पतंग उड़ा रहा था।", options: ["लड़का पतंग उड़ा रहा था।","लड़का पतंग उड़ाता था।","लड़का पतंग उड़ा चुका था।","लड़का पतंग उड़ाएगा।"] },
    { question: "तुम पत्र लिख रहे हो।", correct: "You are writing a letter.", options: ["You are writing a letter.","You write a letter.","You have written a letter.","You will write a letter."] },
    { question: "I ___ happy.", correct: "am", options: ["am","is","are","was"] },
    { question: "She ___ my sister.", correct: "is", options: ["is","am","are","were"] },
    { question: "वे स्कूल जा रहे हैं।", correct: "They are going to school.", options: ["They are going to school.","They go to school.","They went to school.","They will go to school."] },
    { question: "We ___ playing cricket.", correct: "are", options: ["are","is","am","were"] },
    { question: "मैं पुस्तक पढ़ता हूँ।", correct: "I read a book.", options: ["I read a book.","I am reading a book.","I have read a book.","I will read a book."] },
    { question: "They ___ very intelligent.", correct: "are", options: ["are","is","am","was"] }
  ],
  currentQuestion: null,
  answerType: 'member',
  usedQuestionIndices: [],
  turnOrderMode: 'round-robin',
  masterTurnList: [],
  currentTurnIndex: -1,
  lifelineUsedThisQuestion: false,


  addPlayer(name, group, opts={}) {
    if (!name?.trim()) { alert("कृपया खिलाड़ी का नाम दर्ज करें!"); return; }
    const exists = this.players.find(p=>p.name.toLowerCase()===name.toLowerCase() && p.group===group);
    if (exists) { alert("यह खिलाड़ी पहले से मौजूद है!"); return; }
    const lifelines = typeof opts.initLifelines === 'number' ? opts.initLifelines : gameSettings.lifelinesPerStudent;


    this.players.push({
      id: Date.now(),
      name: name.trim(),
      group,
      score: 0,
      history: [],
      lifelinesRemaining: lifelines,
      totalTime: 0 // New: Total time for answers
    });


    this.saveState();
    showLeaderboard();
    updateLiveLeaderboard();
    this.showNotification(`${name} को ग्रुप ${group} में जोड़ा गया!`, 'success');
  },


  removePlayer(id){
    this.players = this.players.filter(p=>p.id!==id);
    this.saveState(); showLeaderboard(); updateLiveLeaderboard();
  },


  generateTurnOrder() {
    this.masterTurnList = [];
    const groups = this.getGroups();
    const byGroup = groups.reduce((acc,g)=>{ acc[g]=this.players.filter(p=>p.group===g); return acc; },{});
    if (this.turnOrderMode==='group-by-group') {
      groups.forEach(g=>this.masterTurnList.push(...byGroup[g]));
    } else {
      let max = Math.max(...groups.map(g=>byGroup[g].length));
      for (let i=0;i<max;i++){ groups.forEach(g=>{ if (byGroup[g][i]) this.masterTurnList.push(byGroup[g][i]); }); }
    }
  },


  startGame() {
    if (this.players.length===0) { alert("कम से कम एक खिलाड़ी जोड़ें!"); return; }
    gameSettings.ttsEnabled = document.getElementById('ttsToggle').checked;
    gameSettings.teamCount = parseInt(document.getElementById('teamCount').value);
    gameSettings.lifelinesPerStudent = parseInt(document.getElementById('lifelineCount').value);


    // Ensure every player has proper lifelines and totalTime at game start
    this.players.forEach(p => { 
      p.lifelinesRemaining = gameSettings.lifelinesPerStudent;
      p.totalTime = 0; // Reset time
    });


    this.turnOrderMode = document.getElementById('turnOrderSelect').value;
    this.generateTurnOrder();
    this.currentTurnIndex = -1;
    this.usedQuestionIndices = [];
    this.lifelineUsedThisQuestion = false;
    isPaused = false;


    showScreen('game-screen');
    document.getElementById('pauseOverlay')?.classList.remove('show');
    document.getElementById('pauseBtn').innerHTML = `<i class="fas fa-pause"></i> Pause`;


    this.nextTurn();
  },


  getCurrentPlayer(){ return this.masterTurnList[this.currentTurnIndex]; },


  nextTurn() {
    if (this.usedQuestionIndices.length >= this.questions.length) { endGame(); return; }
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.masterTurnList.length;
    const qIdx = this.getUnusedQuestionIndex();
    if (qIdx===-1) { endGame(); return; }
    this.currentQuestion = this.questions[qIdx];
    this.usedQuestionIndices.push(qIdx);
    this.lifelineUsedThisQuestion = false;


    this.displayQuestion();
    startTimer(20); // reset and start timer
    updateProgressBar();
    updateLiveLeaderboard();
    updateLifelineUI();
  },


  getGroups(){ return [...new Set(this.players.map(p=>p.group))].sort(); },


  displayQuestion() {
    const player = this.getCurrentPlayer();
    if (!player) { endGame(); return; }


    document.getElementById('currentGroup').textContent = `ग्रुप ${player.group}`;
    document.getElementById('currentPlayerName').textContent = player.name;
    speakPlayerName(player.name);


    const qBox = document.getElementById('question');
    qBox.textContent = this.currentQuestion.question;
    qBox.classList.remove('animate-in'); void qBox.offsetWidth; qBox.classList.add('animate-in');


    const answers = document.getElementById('answers');
    answers.innerHTML = '';
    const shuffled = [...this.currentQuestion.options].sort(()=>Math.random()-0.5);
    shuffled.forEach((option, idx)=>{
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      const prefix = ['A) ','B) ','C) ','D) '][idx];
      btn.innerHTML = `<span class="option-prefix">${prefix}</span><span class="option-text">${option}</span>`;
      btn.onclick = ()=> this.checkAnswer(option, btn);
      btn.style.animationDelay = `${idx*0.1}s`;
      answers.appendChild(btn);
      void btn.offsetWidth; btn.classList.add('animate-in');
    });


    startTime = Date.now(); // Start timing for this answer
  },


  checkAnswer(selectedAnswer, btn) {
    if (isPaused) return;
    stopTimer();
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    const player = this.getCurrentPlayer();
    player.totalTime += timeTaken; // Add to total time


    const isCorrect = selectedAnswer === this.currentQuestion.correct;
    const points = isCorrect ? (this.answerType==='member'?10:5) : -5;


    player.score += points;
    player.history.push({ isCorrect, points, question: this.currentQuestion.question });


    Array.from(document.getElementById('answers').children).forEach(b=>{
      b.disabled = true;
      const text = b.querySelector('.option-text').textContent;
      if (text === this.currentQuestion.correct) b.classList.add('highlight-correct','is-correct-final');
    });


    if (!isCorrect) btn.classList.add('highlight-wrong','is-wrong-final');
    else btn.classList.add('is-correct-final');


    showFeedback(isCorrect, points);
    this.saveState();
    setTimeout(()=>this.nextTurn(), 2500);
  },


  timeUp() {
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    const player = this.getCurrentPlayer();
    player.totalTime += timeTaken; // Add to total time even on time up


    player.score -= 5;
    player.history.push({ isCorrect:false, points:-5, question:this.currentQuestion.question });


    Array.from(document.getElementById('answers').children).forEach(b=>{
      b.disabled = true;
      const text=b.querySelector('.option-text').textContent;
      if (text===this.currentQuestion.correct) b.classList.add('highlight-correct','is-correct-final');
    });


    showFeedback(false, -5, "समय समाप्त!");
    this.saveState();
    setTimeout(()=>this.nextTurn(), 2500);
  },


  getUnusedQuestionIndex() {
    const avail = this.questions.map((_,i)=>i).filter(i=>!this.usedQuestionIndices.includes(i));
    if (avail.length===0) return -1;
    return avail[Math.floor(Math.random()*avail.length)];
  },


  // Lifeline: 50-50 (with animation and local music)
  useLifeline() {
    if (isPaused) return;
    const player = this.getCurrentPlayer();
    if (!player) return;
    if (player.lifelinesRemaining<=0) { this.showNotification('लाइफलाइन शेष नहीं', 'info'); return; }
    if (this.lifelineUsedThisQuestion) { this.showNotification('इस प्रश्न पर लाइफलाइन हो चुकी है', 'info'); return; }


    const btns = Array.from(document.getElementById('answers').children);
    const correct = this.currentQuestion.correct;
    const wrongBtns = btns.filter(b => b.querySelector('.option-text').textContent !== correct);
    if (wrongBtns.length < 2) return;


    // Keep 1 random wrong + 1 correct, hide others with animation
    const keepWrong = wrongBtns[Math.floor(Math.random()*wrongBtns.length)];
    btns.forEach(b=>{
      const text = b.querySelector('.option-text').textContent;
      const shouldKeep = (text===correct) || (b===keepWrong);
      if (!shouldKeep) {
        b.classList.add('hidden-option'); // Trigger blur-hide animation
      }
    });


    // Play local music
    const lifelineAudio = new Audio('../deepseek-v1-quiztype/sounds/lifeline.mp3'); // Your local file
    lifelineAudio.play();


    player.lifelinesRemaining--;
    this.lifelineUsedThisQuestion = true;
    updateLifelineUI();
    this.showNotification('50-50 लागू हुआ', 'success');
  },


  // Notifications & Persistence
  showNotification(message, type='info') {
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.innerHTML = `<i class="fas fa-${type==='success'?'check':'info'}-circle"></i> ${message}`;
    document.body.appendChild(n);
    setTimeout(()=>n.classList.add('show'),100);
    setTimeout(()=>{ n.classList.remove('show'); setTimeout(()=>document.body.removeChild(n),300); }, 3000);
  },


  saveState() {
    localStorage.setItem('tenseTranslationGameState', JSON.stringify({
      players: this.players,
      usedQuestionIndices: this.usedQuestionIndices,
      gameSettings: gameSettings
    }));
  },


  loadState() {
    const saved = localStorage.getItem('tenseTranslationGameState');
    if (saved) {
      const data = JSON.parse(saved);
      this.players = data.players || [];
      if (data.gameSettings) gameSettings = { ...gameSettings, ...data.gameSettings };
    }
  }
};


// === Pause/Resume & Timer ===
function startTimer(seconds=20) {
  stopTimer();
  globalTimeLeft = seconds;
  isPaused = false;
  const timerText = document.querySelector('.timer-text');
  const timerProgress = document.querySelector('.timer-progress');
  const timerContainer = document.getElementById('timerContainer');
  const tickSound = document.getElementById('tickSound');
  const circleLength = 2 * Math.PI * 28;


  if (timerContainer) timerContainer.classList.remove('half-time');
  if (timerProgress) {
    timerProgress.style.strokeDasharray = circleLength;
    timerProgress.style.strokeDashoffset = 0;
  }
  if (timerText) timerText.textContent = globalTimeLeft;


  globalTimerInterval = setInterval(()=>{
    if (isPaused) return;
    globalTimeLeft--;
    if (timerText) timerText.textContent = globalTimeLeft;
    if (timerProgress) timerProgress.style.strokeDashoffset = ((20 - globalTimeLeft) / 20) * circleLength;


    if (globalTimeLeft <= 5 && globalTimeLeft > 0) {
      if (timerContainer) timerContainer.classList.add('half-time');
      if (tickSound && gameSettings.ttsEnabled) tickSound.play().catch(()=>{});
    }
    if (globalTimeLeft <= 0) {
      stopTimer(false);
      GameManager.timeUp();
    }
  },1000);
}
function stopTimer(resetSound=true) {
  clearInterval(globalTimerInterval);
  if (resetSound) {
    const tickSound = document.getElementById('tickSound');
    if (tickSound) { tickSound.pause(); tickSound.currentTime = 0; }
  }
}
function togglePause() {
  isPaused = !isPaused;
  const overlay = document.getElementById('pauseOverlay');
  const btn = document.getElementById('pauseBtn');
  if (isPaused) {
    overlay.classList.add('show');
    btn.innerHTML = `<i class="fas fa-play"></i> Resume`;
  } else {
    overlay.classList.remove('show');
    btn.innerHTML = `<i class="fas fa-pause"></i> Pause`;
  }
}


// === UI helpers ===
function updateLifelineUI() {
  const player = GameManager.getCurrentPlayer?.();
  const el = document.getElementById('lifelineCountText');
  if (player && el) el.textContent = player.lifelinesRemaining ?? 0;
}


function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}


function addPlayer() {
  const name = document.getElementById('playerName');
  const grp = document.getElementById('groupSelect');
  if (name && grp) {
    GameManager.addPlayer(name.value, grp.value, { initLifelines: gameSettings.lifelinesPerStudent });
    name.value=''; name.focus();
  }
}


function startGame(){ GameManager.startGame(); }
function endGame(){
  stopTimer();
  showScreen('leaderboard-screen');
  showLeaderboard(true);
}
function restartGameSetup(){
  stopTimer();
  showScreen('setup-screen');
  showLeaderboard();
  updateLiveLeaderboard();
  document.getElementById('final-winner').textContent='';
}


// Answer type
function setAnswerType(type, el){
  GameManager.answerType = type;
  document.querySelectorAll('.answer-type-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
}


// Leaderboard (updated with total time column in individual view)
let currentLeaderboardView='individual';
function setLeaderboardView(view, el){
  currentLeaderboardView=view;
  document.querySelectorAll('.btn-filter').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  showLeaderboard();
}
function showFeedback(isCorrect, points, customMessage=""){
  const feedbackEl=document.getElementById('feedbackMessage');
  if (feedbackEl){
    feedbackEl.textContent = customMessage || (isCorrect ? `बहुत बढ़िया! +${points} अंक` : `गलत जवाब! ${points} अंक`);
    feedbackEl.className = isCorrect ? 'correct' : 'incorrect';
    feedbackEl.classList.add('show');
    const sound = document.getElementById(isCorrect ? 'correctSound' : 'incorrectSound');
    if (sound && gameSettings.ttsEnabled) sound.play().catch(()=>{});
    setTimeout(()=>feedbackEl.classList.remove('show'), 2000);
  }
}
function updateProgressBar(){
  const bar = document.getElementById('game-progress-bar');
  const total = GameManager.questions.length;
  const answered = GameManager.usedQuestionIndices.length;
  const p = (answered/total)*100;
  if (bar) bar.style.width = `${p}%`;
}
function showLeaderboard(isFinal=false){
  const header = document.getElementById('leaderboardHeader');
  const content = document.getElementById('leaderboardContent');
  const preview = document.getElementById('leaderboardContentPreview');
  if (!content) return;

  // Updated Sorting: Score descending, then totalTime ascending (faster time wins on tie)
  const sorted = [...GameManager.players].sort((a,b) => {
    if (b.score !== a.score) return b.score - a.score; // Higher score first
    return a.totalTime - b.totalTime; // Lower time first on tie
  });

  const playerHtml = sorted.map((p,i)=>`
    <div class="leaderboard-item individual ${i<3?`rank-${i+1}`:''}">
      <div class="rank-cell">${i+1}</div>
      <div class="name-cell">${p.name}</div>
      <div class="group-cell"><span class="badge group-${p.group}">ग्रुप ${p.group}</span></div>
      <div class="correct-cell">${p.history.filter(h=>h.isCorrect).length}</div>
      <div class="wrong-cell">${p.history.filter(h=>!h.isCorrect).length}</div>
      <div class="time-cell">${p.totalTime.toFixed(2)} सेकंड</div>
      <div class="score-cell"><b>${p.score}</b></div>
      <div class="action-cell">
        <button class="btn-icon-small" onclick="GameManager.removePlayer(${p.id})" title="हटाएं">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  // Preview remains the same
  if (preview){
    preview.innerHTML = sorted.length>0
      ? sorted.map(p=>`
        <div class="leaderboard-item individual preview-item">
          <div class="player-info"><span class="player-name">${p.name}</span><span class="badge group-${p.group}">ग्रुप ${p.group}</span></div>
          <div class="player-score">${p.score}</div>
        </div>`).join('')
      : '<p class="empty-message">शुरू करने के लिए खिलाड़ी जोड़ें...</p>';
  }

  content.innerHTML = '';
  if (currentLeaderboardView==='individual'){
    header.className='leaderboard-header individual';
    header.innerHTML = `<div>#</div><div>नाम</div><div>ग्रुप</div><div>सही</div><div>गलत</div><div>समय</div><div>कुल स्कोर</div><div>कार्य</div>`;
    content.innerHTML = playerHtml;
  } else {
    // Team view remains the same (no time tiebreaker for teams)
    header.className='leaderboard-header team';
    header.innerHTML = `<div>#</div><div>ग्रुप</div><div>कुल सही</div><div>कुल गलत</div><div>खिलाड़ी</div><div>कुल स्कोर</div>`;
    const teams={};
    GameManager.players.forEach(p=>{
      if (!teams[p.group]) teams[p.group]={score:0,correct:0,wrong:0,players:0};
      teams[p.group].score+=p.score;
      teams[p.group].correct+=p.history.filter(h=>h.isCorrect).length;
      teams[p.group].wrong+=p.history.filter(h=>!h.isCorrect).length;
      teams[p.group].players++;
    });
    const sortedTeams = Object.entries(teams).sort(([,a],[,b])=>b.score-a.score);
    content.innerHTML = sortedTeams.map(([g,d],i)=>`
      <div class="leaderboard-item team ${i<3?`rank-${i+1}`:''}">
        <div>${i+1}</div>
        <div><span class="badge group-${g}">ग्रुप ${g}</span></div>
        <div>${d.correct}</div>
        <div>${d.wrong}</div>
        <div>${d.players}</div>
        <div><b>${d.score}</b></div>
      </div>
    `).join('');
  }

  if (isFinal){
    const wEl = document.getElementById('final-winner');
    let winnerName='';
    if (currentLeaderboardView==='individual' && sorted.length>0) winnerName = sorted[0].name;
    else {
      const teams={};
      GameManager.players.forEach(p=>{ if(!teams[p.group]) teams[p.group]={score:0}; teams[p.group].score+=p.score; });
      const top = Object.entries(teams).sort(([,a],[,b])=>b.score-a.score)[0];
      if (top) winnerName = `ग्रुप ${top[0]}`;
    }
    if (winnerName) wEl.textContent = `🏆 विजेता: ${winnerName}! 🏆`;
  }
}

function printLeaderboard(){ window.print(); }
function downloadLeaderboardCSV(){
  let csv = "data:text/csv;charset=utf-8,"; let rows=[];
  if (currentLeaderboardView==='team'){
    rows.push(["#","ग्रुप","कुल सही","कुल गलत","खिलाड़ी","कुल स्कोर"]);
    const teams={};
    GameManager.players.forEach(p=>{
      if(!teams[p.group]) teams[p.group]={score:0,correct:0,wrong:0,players:0};
      teams[p.group].score+=p.score; teams[p.group].correct+=p.history.filter(h=>h.isCorrect).length; teams[p.group].wrong+=p.history.filter(h=>!h.isCorrect).length; teams[p.group].players++;
    });
    Object.entries(teams).sort(([,a],[,b])=>b.score-a.score).forEach(([g,d],i)=>rows.push([i+1,`ग्रुप ${g}`,d.correct,d.wrong,d.players,d.score]));
  } else {
    rows.push(["#","नाम","ग्रुप","सही","गलत","समय","कुल स्कोर"]);
    // Updated Sorting for CSV
    const sortedPlayers = [...GameManager.players].sort((a,b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTime - b.totalTime;
    });
    sortedPlayers.forEach((p,i)=>{
      const c=p.history.filter(h=>h.isCorrect).length; const w=p.history.filter(h=>!h.isCorrect).length; const nm=`"${p.name.replace(/"/g,'""')}"`;
      rows.push([i+1,nm,p.group,c,w,p.totalTime.toFixed(2),p.score]);
    });
  }
  csv += rows.map(r=>r.join(",")).join("\n");
  const a=document.createElement('a'); a.href=encodeURI(csv); a.download=`leaderboard_${currentLeaderboardView}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}


// === New: Download All Data ===
function downloadAllData() {
  const data = {
    questions: GameManager.questions,
    players: GameManager.players,
    scores: GameManager.players.map(p => ({ name: p.name, score: p.score, totalTime: p.totalTime })) // Simplified scores with time
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "quizData.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}


// === Keyboard Shortcuts ===
// a/s/d/f => answer A/B/C/D, p => pause/resume, Esc => close modal, g => lifeline, space => pause/play, v => TTS question
document.addEventListener('keydown',(e)=>{
  const key = e.key.toLowerCase();


  // Close modal on ESC
  if (key==='escape'){
    const modal = document.getElementById('playersModal');
    if (modal.classList.contains('show')) { e.preventDefault(); closePlayersModal(); return; }
  }


  // Handle in game only
  const gameActive = document.getElementById('game-screen').classList.contains('active');


  // Toggle answer type by T (existing)
  if (key==='t' && gameActive){
    e.preventDefault();
    const memberBtn = document.getElementById('memberAnswerBtn');
    const teamBtn = document.getElementById('teamAnswerBtn');
    if (document.querySelector('.answer-type-btn.active')?.id === 'memberAnswerBtn') teamBtn.click(); else memberBtn.click();
  }


  // Pause/Resume by P (existing) or Spacebar (new)
  if ((key==='p' || key===' ') && gameActive){
    e.preventDefault();
    togglePause();
    return;
  }


  // Lifeline by H (existing) or G (new)
  if ((key==='h' || key==='g') && gameActive){
    e.preventDefault();
    GameManager.useLifeline();
    return;
  }

// Inside document.addEventListener('keydown', ...)
if (key==='v' && gameActive){
    e.preventDefault();
    const questionText = document.getElementById('question')?.textContent;
    if (questionText) {
        if (!gameSettings.ttsEnabled || !('speechSynthesis' in window)) {
            console.warn('TTS disabled or not supported in this browser.');
            return;
        }
        
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(questionText);
        
        // Enhanced TTS settings for crisp and slow speech
        utterance.lang = 'hi-IN';
        utterance.rate = 0.8; // Slower rate for clarity
        utterance.pitch = 1.1; // Slightly higher pitch
        utterance.volume = 0.8; // Good volume level
        
        // Try to find the best Male Hindi voice
        const voices = speechSynthesis.getVoices();
        const maleHindiVoice = voices.find(voice => 
            voice.lang.includes('hi') && 
            (voice.name.includes('Google हिन्दी') || // Often male
             voice.name.includes('Microsoft Ravi') || // Male voice
             voice.name.toLowerCase().includes('male')) // General male check
        ) || voices.find(voice => voice.lang.includes('hi')) || voices[0]; // Fallback
        
        if (maleHindiVoice) {
            utterance.voice = maleHindiVoice;
        } else {
            console.warn('No suitable male Hindi voice found. Using default.');
        }
        
        // Error handling for speech
        utterance.onerror = (event) => {
            console.error('TTS error:', event.error);
        };
        
        speechSynthesis.speak(utterance);
    }
    return;
}



  // Answer keys a/s/d/f
  if (gameActive && !isPaused && ['a','s','d','f'].includes(key)){
    e.preventDefault();
    const map = { a:0, s:1, d:2, f:3 };
    const idx = map[key];
    const buttons = Array.from(document.getElementById('answers').children);
    const btn = buttons[idx];
    if (!btn) return;
    if (btn.classList.contains('hidden-option')) return; // ignore hidden after lifeline
    if (btn.disabled) return;
    btn.click();
  }


  // Enter to add player (manual) on setup
  if (e.key === 'Enter' && document.getElementById('setup-screen').classList.contains('active')) {
    const playerNameInput = document.getElementById('playerName');
    if (document.activeElement === playerNameInput) addPlayer();
  }
});


// === DOM wiring ===
document.addEventListener('DOMContentLoaded', ()=>{
  // Settings binds
  const teamCountSelect = document.getElementById('teamCount');
  if (teamCountSelect) {
    teamCountSelect.addEventListener('change', ()=>{
      generateTeamOptions();
      renderAssignButtons();
      renderStudentList();
    });
  }
  const ttsToggle = document.getElementById('ttsToggle');
  if (ttsToggle) ttsToggle.addEventListener('change', e=> gameSettings.ttsEnabled = e.target.checked);


  const lifelineSelect = document.getElementById('lifelineCount');
  if (lifelineSelect) lifelineSelect.addEventListener('change', e=> gameSettings.lifelinesPerStudent = parseInt(e.target.value));


  // Modal open/close
  document.getElementById('openPlayersModalBtn')?.addEventListener('click', openPlayersModal);
  document.getElementById('selectAllBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); selectAllVisible(); });
  document.getElementById('clearSelBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); clearSelection(); });
  document.getElementById('autoBalanceBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); autoBalanceSelectedIntoTeams(); });
  document.getElementById('loadSelectedBtn')?.addEventListener('click', (e)=>{ e.preventDefault(); loadSelectedToGame(); });


  // Lifeline and Pause buttons
  document.getElementById('lifelineBtn')?.addEventListener('click', ()=> GameManager.useLifeline());
  document.getElementById('pauseBtn')?.addEventListener('click', ()=> togglePause());


  // New: Download button listener (add <button id="downloadDataBtn">Download Data</button> in HTML)
  document.getElementById('downloadDataBtn')?.addEventListener('click', downloadAllData);


  // Registry UI init
  loadRegistry();
  renderClassOptions();
  renderAssignButtons();
  renderStudentList();
});


// === Init ===
window.addEventListener('load', ()=>{
  GameManager.loadState();
  document.getElementById('ttsToggle').checked = gameSettings.ttsEnabled;
  document.getElementById('teamCount').value = gameSettings.teamCount;
  document.getElementById('lifelineCount').value = gameSettings.lifelinesPerStudent;


  generateTeamOptions();
  renderAssignButtons();
  renderStudentList();


  showScreen('setup-screen');
  showLeaderboard();
  updateLiveLeaderboard();


  if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = ()=>{};
  }
});
