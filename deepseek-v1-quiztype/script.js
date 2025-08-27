// === Game Settings ===
let gameSettings = {
    ttsEnabled: true,
    teamCount: 5
};

// === Enhanced Text-to-Speech Function ===
function speakPlayerName(name) {
    if (!gameSettings.ttsEnabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(name);
    
    // Enhanced TTS settings for crisp and slow speech
    utterance.lang = 'hi-IN';
    utterance.rate = 0.6; // Slower rate for clarity
    utterance.pitch = 1.1; // Slightly higher pitch
    utterance.volume = 0.8; // Good volume level
    
    // Try to find the best Hindi voice
    const voices = speechSynthesis.getVoices();
    const hindiVoice = voices.find(voice => 
        voice.lang.includes('hi') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
    ) || voices.find(voice => voice.lang.includes('hi')) || voices[0];
    
    if (hindiVoice) {
        utterance.voice = hindiVoice;
    }
    
    speechSynthesis.speak(utterance);
}

// === Dynamic Team Generation ===
function generateTeamOptions() {
    const groupSelect = document.getElementById('groupSelect');
    const teamCount = parseInt(document.getElementById('teamCount').value);
    
    groupSelect.innerHTML = '';
    
    // Generate team options A, B, C, D, E, F, G, H based on team count
    const teamLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    
    for (let i = 0; i < teamCount; i++) {
        const option = document.createElement('option');
        option.value = teamLetters[i];
        option.textContent = `ग्रुप ${teamLetters[i]}`;
        groupSelect.appendChild(option);
    }
}

// === Enhanced Live Leaderboard Update ===
function updateLiveLeaderboard() {
    const topPlayersCol1El = document.getElementById('liveTopPlayersCol1');
    const topPlayersCol2El = document.getElementById('liveTopPlayersCol2');
    const topTeamsEl = document.getElementById('liveTopTeams');
    
    if (!topPlayersCol1El || !topPlayersCol2El || !topTeamsEl) return;
    
    // Top 10 Players in two columns
    const sortedPlayers = [...GameManager.players]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    
    const col1Players = sortedPlayers.slice(0, 5);
    const col2Players = sortedPlayers.slice(5, 10);
    
    const createPlayerItem = (player, index) => {
        const rank = index + 1;
        const highlightClass = rank === 1 ? 'highlight gold' : rank === 2 ? 'highlight silver' : rank === 3 ? 'highlight bronze' : '';
        return `
            <div class="live-item ${highlightClass}">
                <span class="rank">${rank}.</span>
                <span class="name">${player.name}</span>
                <span class="score">${player.score}</span>
            </div>
        `;
    };

    topPlayersCol1El.innerHTML = col1Players.map(createPlayerItem).join('');
    topPlayersCol2El.innerHTML = col2Players.map((player, index) => createPlayerItem(player, index + 5)).join('');

    // Top 4 Teams
    const teams = {};
    GameManager.players.forEach(p => {
        if (!teams[p.group]) teams[p.group] = { score: 0, players: 0, correct: 0, wrong: 0 };
        teams[p.group].score += p.score;
        teams[p.group].players++;
        teams[p.group].correct += p.history.filter(h => h.isCorrect).length;
        teams[p.group].wrong += p.history.filter(h => !h.isCorrect).length;
    });
    
    const sortedTeams = Object.entries(teams)
        .sort(([, a], [, b]) => b.score - a.score)
        .slice(0, 4);
    
    topTeamsEl.innerHTML = sortedTeams.map(([group, data], index) => `
        <div class="live-item team-item ${index === 0 ? 'highlight gold' : index === 1 ? 'highlight silver' : index === 2 ? 'highlight bronze' : ''}">
            <span class="rank">${index + 1}.</span>
            <span class="team-name">
                <span class="group-badge group-${group}">ग्रुप ${group}</span>
                <span class="team-stats">(${data.players} सदस्य)</span>
            </span>
            <span class="score">${data.score}</span>
        </div>
    `).join('');
}

// === Enhanced GameManager ===
const GameManager = {
    players: [],
    questions: [
        {
            "question": "The boy was flying a kite.",
            "correct": "लड़का पतंग उड़ा रहा था।",
            "options": ["लड़का पतंग उड़ा रहा था।", "लड़का पतंग उड़ाता था।", "लड़का पतंग उड़ा चुका था।", "लड़का पतंग उड़ाएगा।"]
        },
        {
            "question": "तुम पत्र लिख रहे हो।",
            "correct": "You are writing a letter.",
            "options": ["You are writing a letter.", "You write a letter.", "You have written a letter.", "You will write a letter."]
        },
        {
            "question": "I ___ happy.",
            "correct": "am",
            "options": ["am", "is", "are", "was"]
        },
        {
            "question": "She ___ my sister.",
            "correct": "is",
            "options": ["is", "am", "are", "were"]
        },
        {
            "question": "वे स्कूल जा रहे हैं।",
            "correct": "They are going to school.",
            "options": ["They are going to school.", "They go to school.", "They went to school.", "They will go to school."]
        },
        {
            "question": "We ___ playing cricket.",
            "correct": "are",
            "options": ["are", "is", "am", "were"]
        },
        {
            "question": "मैं पुस्तक पढ़ता हूँ।",
            "correct": "I read a book.",
            "options": ["I read a book.", "I am reading a book.", "I have read a book.", "I will read a book."]
        },
        {
            "question": "They ___ very intelligent.",
            "correct": "are",
            "options": ["are", "is", "am", "was"]
        }
    ],
    currentQuestion: null,
    answerType: 'member',
    timerInterval: null,
    usedQuestionIndices: [],
    turnOrderMode: 'round-robin',
    masterTurnList: [],
    currentTurnIndex: -1,

    addPlayer(name, group) {
        if (!name.trim()) {
            alert("कृपया खिलाड़ी का नाम दर्ज करें!");
            return;
        }
        
        // Check if player already exists
        const existingPlayer = this.players.find(p => p.name.toLowerCase() === name.toLowerCase() && p.group === group);
        if (existingPlayer) {
            alert("यह खिलाड़ी पहले से मौजूद है!");
            return;
        }
        
        this.players.push({ 
            id: Date.now(), 
            name: name.trim(), 
            group, 
            score: 0, 
            history: [] 
        });
        
        this.saveState();
        showLeaderboard();
        updateLiveLeaderboard();
        
        // Success feedback
        this.showNotification(`${name} को ग्रुप ${group} में जोड़ा गया!`, 'success');
    },

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.saveState();
        showLeaderboard();
        updateLiveLeaderboard();
    },

    generateTurnOrder() {
        this.masterTurnList = [];
        const groups = this.getGroups();
        const playersByGroup = groups.reduce((acc, group) => {
            acc[group] = this.players.filter(p => p.group === group);
            return acc;
        }, {});

        if (this.turnOrderMode === 'group-by-group') {
            groups.forEach(group => { 
                this.masterTurnList.push(...playersByGroup[group]); 
            });
        } else {
            let maxPlayers = Math.max(...groups.map(group => playersByGroup[group].length));
            for (let i = 0; i < maxPlayers; i++) {
                groups.forEach(group => { 
                    if (playersByGroup[group][i]) {
                        this.masterTurnList.push(playersByGroup[group][i]); 
                    }
                });
            }
        }
    },

    startGame() {
        if (this.players.length === 0) { 
            alert("कम से कम एक खिलाड़ी जोड़ें!"); 
            return; 
        }
        
        // Update game settings
        gameSettings.ttsEnabled = document.getElementById('ttsToggle').checked;
        gameSettings.teamCount = parseInt(document.getElementById('teamCount').value);
        
        this.turnOrderMode = document.getElementById('turnOrderSelect').value;
        this.generateTurnOrder();
        this.currentTurnIndex = -1;
        this.usedQuestionIndices = [];
        
        showScreen('game-screen');
        this.nextTurn();
    },

    getCurrentPlayer() { 
        return this.masterTurnList[this.currentTurnIndex]; 
    },

    nextTurn() {
        if (this.usedQuestionIndices.length >= this.questions.length) { 
            endGame(); 
            return; 
        }
        
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.masterTurnList.length;
        const unusedQuestionIndex = this.getUnusedQuestionIndex();
        
        if (unusedQuestionIndex === -1) { 
            endGame(); 
            return; 
        }
        
        this.currentQuestion = this.questions[unusedQuestionIndex];
        this.usedQuestionIndices.push(unusedQuestionIndex);
        
        this.displayQuestion();
        this.startTimer();
        updateProgressBar();
        updateLiveLeaderboard();
    },

    getGroups() { 
        return [...new Set(this.players.map(p => p.group))].sort(); 
    },

    displayQuestion() {
        const player = this.getCurrentPlayer();
        if (!player) { 
            endGame(); 
            return; 
        }
        
        document.getElementById('currentGroup').textContent = `ग्रुप ${player.group}`;
        document.getElementById('currentPlayerName').textContent = player.name;
        
        // Enhanced TTS with settings check
        speakPlayerName(player.name);
        
        const questionBox = document.getElementById('question');
        questionBox.textContent = this.currentQuestion.question;
        questionBox.classList.remove('animate-in');
        void questionBox.offsetWidth;
        questionBox.classList.add('animate-in');
        
        const answersDiv = document.getElementById('answers');
        answersDiv.innerHTML = '';
        const shuffledOptions = [...this.currentQuestion.options].sort(() => Math.random() - 0.5);
        
        shuffledOptions.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            const optionPrefix = ['A) ', 'B) ', 'C) ', 'D)'][index];
            btn.innerHTML = `<span class="option-prefix">${optionPrefix}</span><span class="option-text">${option}</span>`;
            btn.onclick = () => this.checkAnswer(option, btn);
            btn.style.animationDelay = `${index * 0.1}s`;
            answersDiv.appendChild(btn);
            void btn.offsetWidth;
            btn.classList.add('animate-in');
        });
    },

    checkAnswer(selectedAnswer, btn) {
        this.stopTimer();
        const isCorrect = selectedAnswer === this.currentQuestion.correct;
        const player = this.getCurrentPlayer();
        const points = isCorrect ? (this.answerType === 'member' ? 10 : 5) : -5;
        
        player.score += points;
        player.history.push({ isCorrect, points, question: this.currentQuestion.question });
        
        Array.from(document.getElementById('answers').children).forEach(button => {
            button.disabled = true;
            const buttonText = button.querySelector('.option-text').textContent;
            if (buttonText === this.currentQuestion.correct) {
                button.classList.add('highlight-correct');
                button.classList.add('is-correct-final');
            }
        });
        
        if (!isCorrect) {
            btn.classList.add('highlight-wrong');
            btn.classList.add('is-wrong-final');
        } else {
            btn.classList.add('is-correct-final');
        }
        
        showFeedback(isCorrect, points);
        this.saveState();
        setTimeout(() => this.nextTurn(), 2500);
    },

    timeUp() {
        this.stopTimer(false);
        const player = this.getCurrentPlayer();
        player.score -= 5;
        player.history.push({ isCorrect: false, points: -5, question: this.currentQuestion.question });
        
        Array.from(document.getElementById('answers').children).forEach(button => {
            button.disabled = true;
            const buttonText = button.querySelector('.option-text').textContent;
            if (buttonText === this.currentQuestion.correct) {
                button.classList.add('highlight-correct');
                button.classList.add('is-correct-final');
            }
        });
        
        showFeedback(false, -5, "समय समाप्त!");
        this.saveState();
        setTimeout(() => this.nextTurn(), 2500);
    },

    getUnusedQuestionIndex() {
        const available = this.questions.map((_, i) => i).filter(i => !this.usedQuestionIndices.includes(i));
        if (available.length === 0) return -1;
        return available[Math.floor(Math.random() * available.length)];
    },

    stopTimer(resetSound = true) {
        clearInterval(this.timerInterval);
        if (resetSound) {
            const tickSound = document.getElementById('tickSound');
            if (tickSound) { 
                tickSound.pause(); 
                tickSound.currentTime = 0; 
            }
        }
    },

    startTimer() {
        this.stopTimer();
        let timeLeft = 20;
        const timerContainer = document.getElementById('timerContainer');
        const timerText = document.querySelector('.timer-text');
        const timerProgress = document.querySelector('.timer-progress');
        const tickSound = document.getElementById('tickSound');
        const circleLength = 2 * Math.PI * 28;
        
        if (timerContainer) timerContainer.classList.remove('half-time');
        if (timerProgress) {
            timerProgress.style.strokeDasharray = circleLength;
            timerProgress.style.strokeDashoffset = 0;
        }
        if (timerText) timerText.textContent = timeLeft;
        
        this.timerInterval = setInterval(() => {
            timeLeft--;
            if (timerText) timerText.textContent = timeLeft;
            if (timerProgress) timerProgress.style.strokeDashoffset = ((20 - timeLeft) / 20) * circleLength;
            
            if (timeLeft <= 5 && timeLeft > 0) {
                if (timerContainer) timerContainer.classList.add('half-time');
                if (tickSound && gameSettings.ttsEnabled) tickSound.play().catch(() => {});
            }
            
            if (timeLeft <= 0) this.timeUp();
        }, 1000);
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i> ${message}`;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    },

    saveState() { 
        localStorage.setItem('tenseTranslationGameState', JSON.stringify({ 
            players: this.players, 
            usedQuestionIndices: this.usedQuestionIndices,
            gameSettings: gameSettings
        })); 
    },

    loadState() {
        const savedState = localStorage.getItem('tenseTranslationGameState');
        if (savedState) {
            const data = JSON.parse(savedState);
            this.players = data.players || [];
            if (data.gameSettings) {
                gameSettings = { ...gameSettings, ...data.gameSettings };
            }
        }
    }
};

// === UI Functions ===
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function addPlayer() {
    const playerName = document.getElementById('playerName');
    const groupSelect = document.getElementById('groupSelect');
    if (playerName && groupSelect) {
        GameManager.addPlayer(playerName.value, groupSelect.value);
        playerName.value = '';
        playerName.focus();
    }
}

function startGame() { 
    GameManager.startGame(); 
}

function endGame() {
    GameManager.stopTimer();
    showScreen('leaderboard-screen');
    showLeaderboard(true);
}

function restartGameSetup() {
    GameManager.stopTimer();
    showScreen('setup-screen');
    showLeaderboard();
    updateLiveLeaderboard();
    document.getElementById('final-winner').textContent = '';
}

function setAnswerType(type, element) {
    GameManager.answerType = type;
    document.querySelectorAll('.answer-type-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

let currentLeaderboardView = 'individual';

function setLeaderboardView(view, element) {
    currentLeaderboardView = view;
    document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    showLeaderboard();
}

function showFeedback(isCorrect, points, customMessage = "") {
    const feedbackEl = document.getElementById('feedbackMessage');
    if (feedbackEl) {
        feedbackEl.textContent = customMessage || (isCorrect ? `बहुत बढ़िया! +${points} अंक` : `गलत जवाब! ${points} अंक`);
        feedbackEl.className = isCorrect ? 'correct' : 'incorrect';
        feedbackEl.classList.add('show');
        
        const sound = document.getElementById(isCorrect ? 'correctSound' : 'incorrectSound');
        if (sound && gameSettings.ttsEnabled) sound.play().catch(() => {});
        
        setTimeout(() => feedbackEl.classList.remove('show'), 2000);
    }
}

function updateProgressBar() {
    const progressBar = document.getElementById('game-progress-bar');
    const totalQuestions = GameManager.questions.length;
    const answeredQuestions = GameManager.usedQuestionIndices.length;
    const progress = (answeredQuestions / totalQuestions) * 100;
    if (progressBar) progressBar.style.width = `${progress}%`;
}

function showLeaderboard(isFinal = false) {
    const header = document.getElementById('leaderboardHeader');
    const content = document.getElementById('leaderboardContent');
    const previewContent = document.getElementById('leaderboardContentPreview');
    
    if (!content) return;
    
    const sortedPlayers = [...GameManager.players].sort((a, b) => b.score - a.score);
    
    const playerHtml = sortedPlayers.map((p, i) => `
        <div class="leaderboard-item individual ${i < 3 ? `rank-${i+1}` : ''}">
            <div class="rank-cell">${i + 1}</div>
            <div class="name-cell">${p.name}</div>
            <div class="group-cell"><span class="badge group-${p.group}">ग्रुप ${p.group}</span></div>
            <div class="correct-cell">${p.history.filter(h => h.isCorrect).length}</div>
            <div class="wrong-cell">${p.history.filter(h => !h.isCorrect).length}</div>
            <div class="score-cell"><b>${p.score}</b></div>
            <div class="action-cell">
                <button class="btn-icon-small" onclick="GameManager.removePlayer(${p.id})" title="हटाएं">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`).join('');
        
    if (previewContent) {
        previewContent.innerHTML = sortedPlayers.length > 0 ? sortedPlayers.map(p => `
            <div class="leaderboard-item individual preview-item">
                <div class="player-info">
                    <span class="player-name">${p.name}</span>
                    <span class="badge group-${p.group}">ग्रुप ${p.group}</span>
                </div>
                <div class="player-score">${p.score}</div>
            </div>`).join('') : '<p class="empty-message">शुरू करने के लिए खिलाड़ी जोड़ें...</p>';
    }
    
    content.innerHTML = '';
    
    if (currentLeaderboardView === 'individual') {
        header.className = 'leaderboard-header individual';
        header.innerHTML = `
            <div>#</div><div>नाम</div><div>ग्रुप</div><div>सही</div><div>गलत</div><div>कुल स्कोर</div><div>कार्य</div>
        `;
        content.innerHTML = playerHtml;
    } else {
        header.className = 'leaderboard-header team';
        header.innerHTML = `<div>#</div><div>ग्रुप</div><div>कुल सही</div><div>कुल गलत</div><div>खिलाड़ी</div><div>कुल स्कोर</div>`;
        
        const teams = {};
        GameManager.players.forEach(p => {
            if (!teams[p.group]) teams[p.group] = { score: 0, correct: 0, wrong: 0, players: 0 };
            teams[p.group].score += p.score;
            teams[p.group].correct += p.history.filter(h => h.isCorrect).length;
            teams[p.group].wrong += p.history.filter(h => !h.isCorrect).length;
            teams[p.group].players++;
        });
        
        const sortedTeams = Object.entries(teams).sort(([, a], [, b]) => b.score - a.score);
        content.innerHTML = sortedTeams.map(([group, data], i) => `
            <div class="leaderboard-item team ${i < 3 ? `rank-${i+1}` : ''}">
                <div>${i + 1}</div>
                <div><span class="badge group-${group}">ग्रुप ${group}</span></div>
                <div>${data.correct}</div>
                <div>${data.wrong}</div>
                <div>${data.players}</div>
                <div><b>${data.score}</b></div>
            </div>`).join('');
    }
    
    if (isFinal) {
        const winnerEl = document.getElementById('final-winner');
        let winnerName = '';
        
        if (currentLeaderboardView === 'individual' && sortedPlayers.length > 0) {
            winnerName = sortedPlayers[0].name;
        } else {
            const teams = {};
            GameManager.players.forEach(p => {
                if (!teams[p.group]) teams[p.group] = { score: 0 };
                teams[p.group].score += p.score;
            });
            const sortedTeams = Object.entries(teams).sort(([, a], [, b]) => b.score - a.score);
            if (sortedTeams.length > 0) winnerName = `ग्रुप ${sortedTeams[0][0]}`;
        }
        
        if (winnerName) winnerEl.textContent = `🏆 विजेता: ${winnerName}! 🏆`;
    }
}

function printLeaderboard() { 
    window.print(); 
}

function downloadLeaderboardCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    let rows = [];
    
    if (currentLeaderboardView === 'team') {
        rows.push(["#", "ग्रुप", "कुल सही", "कुल गलत", "खिलाड़ी", "कुल स्कोर"]);
        const teams = {};
        GameManager.players.forEach(p => {
            if (!teams[p.group]) teams[p.group] = { score: 0, correct: 0, wrong: 0, players: 0 };
            teams[p.group].score += p.score;
            teams[p.group].correct += p.history.filter(h => h.isCorrect).length;
            teams[p.group].wrong += p.history.filter(h => !h.isCorrect).length;
            teams[p.group].players++;
        });
        Object.entries(teams).sort(([, a], [, b]) => b.score - a.score)
            .forEach(([group, data], i) => rows.push([i + 1, `ग्रुप ${group}`, data.correct, data.wrong, data.players, data.score]));
    } else {
        rows.push(["#", "नाम", "ग्रुप", "सही", "गलत", "कुल स्कोर"]);
        [...GameManager.players].sort((a, b) => b.score - a.score)
            .forEach((p, i) => {
                const correct = p.history.filter(h => h.isCorrect).length;
                const wrong = p.history.filter(h => !h.isCorrect).length;
                const name = `"${p.name.replace(/"/g, '""')}"`;
                rows.push([i + 1, name, p.group, correct, wrong, p.score]);
            });
    }
    
    csvContent += rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `leaderboard_${currentLeaderboardView}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// === Event Listeners ===
document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 't' && document.getElementById('game-screen').classList.contains('active')) {
        event.preventDefault();
        const memberBtn = document.getElementById('memberAnswerBtn');
        const teamBtn = document.getElementById('teamAnswerBtn');
        if (document.querySelector('.answer-type-btn.active').id === 'memberAnswerBtn') {
            teamBtn.click();
        } else {
            memberBtn.click();
        }
    }
    
    // Enter to add player
    if (event.key === 'Enter' && document.getElementById('setup-screen').classList.contains('active')) {
        const playerNameInput = document.getElementById('playerName');
        if (document.activeElement === playerNameInput) {
            addPlayer();
        }
    }
});

// Team count change handler
document.addEventListener('DOMContentLoaded', () => {
    const teamCountSelect = document.getElementById('teamCount');
    if (teamCountSelect) {
        teamCountSelect.addEventListener('change', generateTeamOptions);
    }
    
    // TTS toggle handler
    const ttsToggle = document.getElementById('ttsToggle');
    if (ttsToggle) {
        ttsToggle.addEventListener('change', (e) => {
            gameSettings.ttsEnabled = e.target.checked;
        });
    }
});

// === Initialization ===
window.addEventListener('load', () => {
    GameManager.loadState();
    
    // Set saved settings
    document.getElementById('ttsToggle').checked = gameSettings.ttsEnabled;
    document.getElementById('teamCount').value = gameSettings.teamCount;
    
    generateTeamOptions();
    showScreen('setup-screen');
    showLeaderboard();
    updateLiveLeaderboard();
    
    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
        speechSynthesis.onvoiceschanged = () => {
            console.log('Speech synthesis voices loaded');
        };
    }
});