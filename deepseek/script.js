const GameManager = {
    players: [],
    questions: [
        { "question": "'श्रम-विभाजन और जाति प्रथा' पाठ के लेखक कौन हैं?", "correct": "भीमराव अंबेडकर", "options": ["महात्मा गांधी", "भीमराव अंबेडकर", "जवाहरलाल नेहरू", "राममनोहर लोहिया"] },
        { "question": "भीमराव अंबेडकर का जन्म कब हुआ था?", "correct": "1891 ई.", "options": ["1889 ई.", "1891 ई.", "1901 ई.", "1911 ई."] },
        { "question": "भीमराव अंबेडकर का जन्म कहाँ हुआ था?", "correct": "महू, मध्य प्रदेश", "options": ["पटना, बिहार", "महू, मध्य प्रदेश", "बलिया, उत्तर प्रदेश", "वाराणसी, उत्तर प्रदेश"] },
        { "question": "'विष के दाँत' कहानी के लेखक कौन हैं?", "correct": "नलिन विलोचन शर्मा", "options": ["अमरकांत", "नलिन विलोचन शर्मा", "विनोद कुमार शुक्ल", "यतींद्र मिश्र"] }
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
            groups.forEach(group => {
                this.masterTurnList.push(...playersByGroup[group]);
            });
        } else { // round-robin is default
            let maxPlayers = 0;
            groups.forEach(group => {
                if (playersByGroup[group].length > maxPlayers) maxPlayers = playersByGroup[group].length;
            });
            for (let i = 0; i < maxPlayers; i++) {
                groups.forEach(group => {
                    if (playersByGroup[group][i]) this.masterTurnList.push(playersByGroup[group][i]);
                });
            }
        }
    },

    startGame() {
        if (this.players.length === 0) {
            alert("कम से कम एक खिलाड़ी जोड़ें!");
            return;
        }
        this.turnOrderMode = document.getElementById('turnOrderSelect').value;
        this.generateTurnOrder();
        this.currentTurnIndex = -1;
        document.querySelector('.player-setup').style.display = 'none';
        document.querySelector('.leaderboard').style.display = 'none';
        document.querySelector('.game-screen').style.display = 'flex';
        this.nextTurn();
    },

    getCurrentPlayer() {
        return this.masterTurnList[this.currentTurnIndex];
    },

    nextTurn() {
        this.currentTurnIndex++;
        if (this.currentTurnIndex >= this.masterTurnList.length) {
            alert("सभी खिलाड़ियों की बारी समाप्त हो गई!");
            endGame();
            return;
        }
        const unusedQuestionIndex = this.getUnusedQuestionIndex();
        if (unusedQuestionIndex === -1) {
            alert("सभी प्रश्न समाप्त हो गए!");
            endGame();
            return;
        }
        this.currentQuestion = this.questions[unusedQuestionIndex];
        this.usedQuestionIndices.push(unusedQuestionIndex);
        this.displayQuestion();
        this.startTimer();
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
        document.getElementById('currentGroup').textContent = `ग्रुप ${player.group} की बारी`;
        document.getElementById('currentPlayerName').textContent = player.name;
        document.getElementById('question').textContent = this.currentQuestion.question;
        const answersDiv = document.getElementById('answers');
        answersDiv.innerHTML = '';
        const shuffledOptions = [...this.currentQuestion.options].sort(() => Math.random() - 0.5);
        shuffledOptions.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'answer-btn';
            btn.textContent = option;
            btn.onclick = () => this.checkAnswer(option, btn);
            answersDiv.appendChild(btn);
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
            if (button.textContent === this.currentQuestion.correct) button.classList.add('highlight-correct');
        });
        if (!isCorrect) btn.classList.add('highlight-wrong');

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
            if (button.textContent === this.currentQuestion.correct) button.classList.add('highlight-correct');
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
            tickSound.pause();
            tickSound.currentTime = 0;
        }
    },

    startTimer() {
        this.stopTimer();
        let timeLeft = 15;
        const timerContainer = document.getElementById('timerContainer');
        const timerText = document.querySelector('.timer-text');
        const timerProgress = document.querySelector('.timer-progress');
        const tickSound = document.getElementById('tickSound');
        const circleLength = 2 * Math.PI * 28;

        timerContainer.classList.remove('half-time');
        timerProgress.style.strokeDashoffset = 0;
        timerText.textContent = timeLeft;

        this.timerInterval = setInterval(() => {
            timeLeft--;
            timerText.textContent = timeLeft;
            timerProgress.style.strokeDashoffset = ((10 - timeLeft) / 10) * circleLength;
            if (timeLeft <= 5 && timeLeft > 0) {
                timerContainer.classList.add('half-time');
                tickSound.play();
            }
            if (timeLeft <= 0) {
                this.timeUp();
            }
        }, 1000);
    },

    saveState() {
        localStorage.setItem('antakshariGameState', JSON.stringify(this.players));
    },

    loadState() {
        const savedState = localStorage.getItem('antakshariGameState');
        if (savedState) this.players = JSON.parse(savedState);
    }
};

// --- UI Functions ---
function addPlayer() {
    GameManager.addPlayer(document.getElementById('playerName').value, document.getElementById('groupSelect').value);
    document.getElementById('playerName').value = '';
}

function startGame() {
    GameManager.startGame();
}

function endGame() {
    GameManager.stopTimer();
    document.querySelector('.game-screen').style.display = 'none';
    document.querySelector('.player-setup').style.display = 'block';
    document.querySelector('.leaderboard').style.display = 'flex';
    showLeaderboard();
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
    feedbackEl.textContent = customMessage || (isCorrect ? `बहुत बढ़िया! +${points} अंक` : `गलत जवाब! ${points} अंक`);
    feedbackEl.className = isCorrect ? 'correct' : 'incorrect';
    feedbackEl.classList.add('show');
    isCorrect ? document.getElementById('correctSound').play() : document.getElementById('incorrectSound').play();
    setTimeout(() => feedbackEl.classList.remove('show'), 2000);
}

function showLeaderboard() {
    const header = document.getElementById('leaderboardHeader');
    const content = document.getElementById('leaderboardContent');
    content.innerHTML = '';
    
    if (currentLeaderboardView === 'individual') {
        header.className = 'leaderboard-header individual';
        header.innerHTML = `<div>#</div><div>नाम</div><div>ग्रुप</div><div>सही</div><div>गलत</div><div>कुल स्कोर</div>`;
        const sortedPlayers = [...GameManager.players].sort((a, b) => b.score - a.score);
        content.innerHTML = sortedPlayers.map((p, i) => `
            <div class="leaderboard-item individual">
                <div>${i + 1}</div>
                <div>${p.name}</div>
                <div><span class="badge group-${p.group}">ग्रुप ${p.group}</span></div>
                <div>${p.history.filter(h => h.isCorrect).length}</div>
                <div>${p.history.filter(h => !h.isCorrect).length}</div>
                <div><b>${p.score}</b></div>
            </div>`).join('');
    } else { // Team view
        header.className = 'leaderboard-header team';
        header.innerHTML = `<div>#</div><div>ग्रुप</div><div>कुल सही</div><div>कुल गलत</div><div>खिलाड़ी</div><div>कुल स्कोर</div>`;
        const teams = {};
        GameManager.players.forEach(p => {
            if (!teams[p.group]) {
                teams[p.group] = { score: 0, correct: 0, wrong: 0, players: 0 };
            }
            teams[p.group].score += p.score;
            teams[p.group].correct += p.history.filter(h => h.isCorrect).length;
            teams[p.group].wrong += p.history.filter(h => !h.isCorrect).length;
            teams[p.group].players++;
        });
        const sortedTeams = Object.entries(teams).sort(([, a], [, b]) => b.score - a.score);
        content.innerHTML = sortedTeams.map(([group, data], i) => `
            <div class="leaderboard-item team">
                <div>${i + 1}</div>
                <div><span class="badge group-${group}">ग्रुप ${group}</span></div>
                <div>${data.correct}</div>
                <div>${data.wrong}</div>
                <div>${data.players}</div>
                <div><b>${data.score}</b></div>
            </div>`).join('');
    }
}

// --- Leaderboard Action Functions ---
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
                // Escape commas in names if any
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

// --- Event Listeners ---
document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 't' && document.activeElement.tagName !== 'INPUT') {
        event.preventDefault();
        const currentActiveId = document.querySelector('.answer-type-btn.active').id;
        document.getElementById(currentActiveId === 'memberAnswerBtn' ? 'teamAnswerBtn' : 'memberAnswerBtn').click();
    }
});

window.onload = () => {
    GameManager.loadState();
    showLeaderboard();
};