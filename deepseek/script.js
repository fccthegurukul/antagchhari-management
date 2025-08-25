// === GameManager ऑब्जेक्ट (लॉजिक अपरिवर्तित) ===
const GameManager = {
    players: [],
    questions: [
        { "question": "I am reading a book. - इस वाक्य का Hindi अनुवाद क्या है?", "correct": "मैं एक किताब पढ़ रहा हूँ।", "options": ["मैं एक किताब पढ़ रहा हूँ।", "मैं एक किताब पढ़ता हूँ।", "मैंने एक किताब पढ़ी है।", "मैं एक किताब पढ़ूंगा।"] },
        { "question": "She goes to school. - इस वाक्य का Hindi अनुवाद क्या है?", "correct": "वह स्कूल जाती है।", "options": ["वह स्कूल जा रही है।", "वह स्कूल जाती है।", "वह स्कूल जाएगी।", "वह स्कूल गई थी।"] },
        { "question": "They have played cricket. - इस वाक्य का Hindi अनुवाद क्या है?", "correct": "वे क्रिकेट खेल चुके हैं।", "options": ["वे क्रिकेट खेल रहे हैं।", "वे क्रिकेट खेलते हैं।", "वे क्रिकेट खेल चुके हैं।", "वे क्रिकेट खेलेंगे।"] },
        { "question": "मैं अपना काम कर रहा हूँ। - इस वाक्य का English अनुवाद क्या है?", "correct": "I am doing my work.", "options": ["I do my work.", "I have done my work.", "I am doing my work.", "I will do my work."] },
        { "question": "उसने एक पत्र लिखा। - इस वाक्य का English अनुवाद क्या है?", "correct": "He wrote a letter.", "options": ["He is writing a letter.", "He wrote a letter.", "He has written a letter.", "He writes a letter."] },
        { "question": "हम कल दिल्ली जाएंगे। - इस वाक्य का English अनुवाद क्या है?", "correct": "We will go to Delhi tomorrow.", "options": ["We are going to Delhi tomorrow.", "We go to Delhi tomorrow.", "We have gone to Delhi tomorrow.", "We will go to Delhi tomorrow."] },
        { "question": "He had finished his meal. - इस वाक्य का Hindi अनुवाद क्या है?", "correct": "वह अपना भोजन समाप्त कर चुका था।", "options": ["वह अपना भोजन समाप्त कर रहा था।", "वह अपना भोजन समाप्त करता है।", "वह अपना भोजन समाप्त कर चुका था।", "उसने अपना भोजन समाप्त कर लिया है।"] },
        { "question": "बारिश हो रही है। - इस वाक्य का English अनुवाद क्या है?", "correct": "It is raining.", "options": ["It rains.", "It has been raining.", "It is raining.", "It will rain."] },
        { "question": "Did you complete the task? - इस वाक्य का Hindi अनुवाद क्या है?", "correct": "क्या तुमने काम पूरा किया?", "options": ["क्या तुम काम पूरा कर रहे हो?", "क्या तुम काम पूरा कर चुके हो?", "क्या तुमने काम पूरा किया?", "क्या तुम काम पूरा करोगे?"] },
        { "question": "उन्होंने अभी-अभी खाना खाया है। - इस वाक्य का English अनुवाद क्या है?", "correct": "They have just eaten food.", "options": ["They have just eaten food.", "They are just eating food.", "They just eat food.", "They will just eat food."] }
    ],
    currentQuestion: null,
    answerType: 'member',
    timerInterval: null,
    usedQuestionIndices: [],
    turnOrderMode: 'round-robin',
    masterTurnList: [],
    currentTurnIndex: -1,

    addPlayer(name, group) {
        if (!name.trim()) return;
        this.players.push({ id: Date.now(), name, group, score: 0, history: [] });
        this.saveState();
        showLeaderboard();
    },

    generateTurnOrder() {
        this.masterTurnList = [];
        const groups = this.getGroups();
        const playersByGroup = groups.reduce((acc, group) => {
            acc[group] = this.players.filter(p => p.group === group);
            return acc;
        }, {});
        if (this.turnOrderMode === 'group-by-group') {
            groups.forEach(group => { this.masterTurnList.push(...playersByGroup[group]); });
        } else {
            let maxPlayers = 0;
            groups.forEach(group => { if (playersByGroup[group].length > maxPlayers) maxPlayers = playersByGroup[group].length; });
            for (let i = 0; i < maxPlayers; i++) {
                groups.forEach(group => { if (playersByGroup[group][i]) this.masterTurnList.push(playersByGroup[group][i]); });
            }
        }
    },

    startGame() {
        if (this.players.length === 0) { alert("कम से कम एक खिलाड़ी जोड़ें!"); return; }
        this.turnOrderMode = document.getElementById('turnOrderSelect').value;
        this.generateTurnOrder();
        this.currentTurnIndex = -1;
        this.usedQuestionIndices = [];
        showScreen('game-screen');
        this.nextTurn();
    },

    getCurrentPlayer() { return this.masterTurnList[this.currentTurnIndex]; },

    nextTurn() {
        if (this.usedQuestionIndices.length >= this.questions.length) { endGame(); return; }
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.masterTurnList.length;
        const unusedQuestionIndex = this.getUnusedQuestionIndex();
        if (unusedQuestionIndex === -1) { endGame(); return; }
        this.currentQuestion = this.questions[unusedQuestionIndex];
        this.usedQuestionIndices.push(unusedQuestionIndex);
        this.displayQuestion();
        this.startTimer();
        updateProgressBar();
    },

    getGroups() { return [...new Set(this.players.map(p => p.group))].sort(); },

    displayQuestion() {
        const player = this.getCurrentPlayer();
        if (!player) { endGame(); return; }
        document.getElementById('currentGroup').textContent = `ग्रुप ${player.group}`;
        document.getElementById('currentPlayerName').textContent = player.name;
        
        const questionBox = document.getElementById('question');
        questionBox.textContent = this.currentQuestion.question;
        questionBox.classList.remove('animate-in');
        void questionBox.offsetWidth; // Trigger reflow
        questionBox.classList.add('animate-in');

        const answersDiv = document.getElementById('answers');
        answersDiv.innerHTML = '';
        const shuffledOptions = [...this.currentQuestion.options].sort(() => Math.random() - 0.5);
        
        shuffledOptions.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            const optionPrefix = ['A) ', 'B) ', 'C) ', 'D)'][index];
            btn.textContent = optionPrefix + option;
            btn.onclick = () => this.checkAnswer(option, btn);
            btn.style.animationDelay = `${index * 0.1}s`;
            answersDiv.appendChild(btn);
            void btn.offsetWidth; // Trigger reflow
            btn.classList.add('animate-in');
        });
    },

    checkAnswer(selectedAnswer, btn) {
        this.stopTimer();
        const isCorrect = selectedAnswer === this.currentQuestion.correct;
        const player = this.getCurrentPlayer();
        const points = isCorrect ? (this.answerType === 'member' ? 10 : 5) : -5;
        player.score += points;
        player.history.push({ isCorrect });

        Array.from(document.getElementById('answers').children).forEach(button => {
            button.disabled = true;
            // A,B,C,Dプレフィックスを削除して比較
            const buttonText = button.textContent.substring(3);
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
        player.history.push({ isCorrect: false });
        Array.from(document.getElementById('answers').children).forEach(button => {
            button.disabled = true;
            const buttonText = button.textContent.substring(3);
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
            if (tickSound) { tickSound.pause(); tickSound.currentTime = 0; }
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
        if (timerProgress) timerProgress.style.strokeDashoffset = 0;
        if (timerText) timerText.textContent = timeLeft;
        this.timerInterval = setInterval(() => {
            timeLeft--;
            if (timerText) timerText.textContent = timeLeft;
            if (timerProgress) timerProgress.style.strokeDashoffset = ((20 - timeLeft) / 20) * circleLength;
            if (timeLeft <= 5 && timeLeft > 0) {
                if (timerContainer) timerContainer.classList.add('half-time');
                if (tickSound) tickSound.play().catch(() => {});
            }
            if (timeLeft <= 0) this.timeUp();
        }, 1000);
    },

    saveState() { localStorage.setItem('tenseTranslationGameState', JSON.stringify({ players: this.players, usedQuestionIndices: this.usedQuestionIndices })); },
    loadState() {
        const savedState = localStorage.getItem('tenseTranslationGameState');
        if (savedState) {
            const data = JSON.parse(savedState);
            this.players = data.players || [];
        }
    }
};

// === UI फंक्शन सेक्शन (अब अपडेट किया गया है) ===

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
    }
}

function startGame() { GameManager.startGame(); }

function endGame() {
    GameManager.stopTimer();
    showScreen('leaderboard-screen');
    showLeaderboard(true); // खेल खत्म होने पर विजेता दिखाएं
}

function restartGameSetup() {
    showScreen('setup-screen');
    showLeaderboard();
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
        if (sound) sound.play().catch(() => {});
        setTimeout(() => feedbackEl.classList.remove('show'), 2000);
    }
}

function updateProgressBar() {
    const progressBar = document.getElementById('game-progress-bar');
    const totalQuestions = GameManager.questions.length;
    const answeredQuestions = GameManager.usedQuestionIndices.length;
    const progress = (answeredQuestions / totalQuestions) * 100;
    if(progressBar) progressBar.style.width = `${progress}%`;
}


function showLeaderboard(isFinal = false) {
    const header = document.getElementById('leaderboardHeader');
    const content = document.getElementById('leaderboardContent');
    const previewContent = document.getElementById('leaderboardContentPreview');
    if (!content) return;

    const sortedPlayers = [...GameManager.players].sort((a, b) => b.score - a.score);
    const playerHtml = sortedPlayers.map((p, i) => `
        <div class="leaderboard-item individual ${i < 3 ? `rank-${i+1}` : ''}">
            <div>${i + 1}</div>
            <div>${p.name}</div>
            <div><span class="badge group-${p.group}">ग्रुप ${p.group}</span></div>
            <div>${p.history.filter(h => h.isCorrect).length}</div>
            <div>${p.history.filter(h => !h.isCorrect).length}</div>
            <div><b>${p.score}</b></div>
        </div>`).join('');
        
    if(previewContent) {
        previewContent.innerHTML = sortedPlayers.length > 0 ? sortedPlayers.map(p => `
            <div class="leaderboard-item individual">
                 <div>${p.name}</div>
                 <div><span class="badge group-${p.group}">ग्रुप ${p.group}</span></div>
            </div>`).join('') : '<p style="text-align:center; opacity: 0.7;">शुरू करने के लिए खिलाड़ी जोड़ें...</p>';
    }
    
    content.innerHTML = '';
    
    if (currentLeaderboardView === 'individual') {
        header.className = 'leaderboard-header individual';
        header.innerHTML = `<div>#</div><div>नाम</div><div>ग्रुप</div><div>सही</div><div>गलत</div><div>कुल स्कोर</div>`;
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
        if(winnerName) winnerEl.textContent = `🏆 विजेता: ${winnerName}! 🏆`;
    }
}

function printLeaderboard() { window.print(); }


function downloadLeaderboardCSV() {
    // ... यह फंक्शन पहले जैसा ही रहेगा ...
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

document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 't' && document.getElementById('game-screen').classList.contains('active')) {
        event.preventDefault();
        const memberBtn = document.getElementById('memberAnswerBtn');
        const teamBtn = document.getElementById('teamAnswerBtn');
        if (document.querySelector('.answer-type-btn.active').id === 'memberAnswerBtn') teamBtn.click();
        else memberBtn.click();
    }
});

window.addEventListener('load', () => {
    GameManager.loadState();
    showScreen('setup-screen');
    showLeaderboard();
});