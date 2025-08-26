// ===== Game State Management =====
class QuizGameManager {
    constructor() {
        this.players = [];
        this.teams = []; // NEW: Dynamic teams
        this.questions = [
            { question: "2 + 3 × 4 = ?", answer: "14" },
            { question: "The boy is playing cricket. (Hindi में translate करें)", answer: "लड़का क्रिकेट खेल रहा है।" },
            { 
                question: `
                    <p>न्यूटन का पहला नियम क्या है? इसके मुख्य बिंदु बताएं:</p>
                    <ul>
                        <li>इसे और किस नाम से जाना जाता है?</li>
                        <li>इसका एक उदाहरण दें।</li>
                    </ul>
                `, 
                answer: "जड़त्व का नियम - वस्तु अपनी अवस्था में तब तक रहती है जब तक बाहरी बल न लगाया जाए।" 
            },
            { question: "मैं रोज स्कूल जाता हूँ। (English में translate करें)", answer: "I go to school daily." },
            { question: "भारत की राजधानी क्या है?", answer: "नई दिल्ली" }
        ];
        this.currentQuestionIndex = 0;
        this.gameState = 'setup';
        this.writingTimer = null;
        this.timeLeft = 120; // 2 minutes
        this.isPaused = false; // NEW: For timer
        this.scoringMode = 'team'; // NEW: 'team' or 'individual'
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDefaultTeams();
        this.updateTeamsUI();
        this.updatePlayersDisplay();
    }

    bindEvents() {
        document.getElementById('teamForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTeam();
        });
        document.getElementById('playerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPlayer();
        });
    }

    // ===== NEW: Team Management =====
    loadDefaultTeams() {
        this.teams = [
            { id: 'A', name: 'Alpha' }, { id: 'B', name: 'Beta' },
            { id: 'C', name: 'Gamma' }, { id: 'D', name: 'Delta' }
        ];
    }

    addTeam() {
        const teamNameInput = document.getElementById('teamName');
        const name = teamNameInput.value.trim();
        if (!name) {
            this.showToast('कृपया टीम का नाम दर्ज करें!', 'error');
            return;
        }
        if (this.teams.find(t => t.name.toLowerCase() === name.toLowerCase())) {
            this.showToast('यह टीम नाम पहले से मौजूद है!', 'error');
            return;
        }
        const newTeam = { id: String.fromCharCode(65 + this.teams.length), name: name };
        this.teams.push(newTeam);
        teamNameInput.value = '';
        this.updateTeamsUI();
        this.showToast(`टीम '${name}' जोड़ी गई!`, 'success');
    }

    removeTeam(teamId) {
        // Prevent removing a team if players are in it
        if (this.players.some(p => p.team === teamId)) {
            this.showToast('खिलाड़ियों वाली टीम को नहीं हटाया जा सकता!', 'error');
            return;
        }
        this.teams = this.teams.filter(t => t.id !== teamId);
        this.updateTeamsUI();
        this.showToast('टीम हटा दी गई', 'success');
    }

    updateTeamsUI() {
        const container = document.getElementById('teamsListContainer');
        const select = document.getElementById('teamSelect');
        
        container.innerHTML = this.teams.map(team => `
            <div class="team-list-item">
                <span class="team-name">${team.name}</span>
                <button class="btn-icon" onclick="gameManager.removeTeam('${team.id}')" title="हटाएं">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Update player form dropdown
        select.innerHTML = '<option value="" disabled selected>टीम चुनें</option>';
        this.teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            select.appendChild(option);
        });
    }

    getTeamName(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        return team ? team.name : 'Unknown';
    }

    // ===== Player Management =====
    addPlayer() {
        const nameInput = document.getElementById('playerName');
        const teamSelect = document.getElementById('teamSelect');
        const name = nameInput.value.trim();
        const teamId = teamSelect.value;
        
        if (!name || !teamId) {
            this.showToast('कृपया नाम और टीम दोनों भरें!', 'error');
            return;
        }
        if (this.players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
            this.showToast('यह नाम पहले से मौजूद है!', 'error');
            return;
        }
        
        const player = {
            id: Date.now(), name, team: teamId, correctAnswers: 0, wrongAnswers: 0,
            totalScore: 0, avatar: name.charAt(0).toUpperCase()
        };
        this.players.push(player);
        
        nameInput.value = '';
        teamSelect.value = '';
        nameInput.focus();
        
        this.updatePlayersDisplay();
        this.showToast(`${name} को टीम ${this.getTeamName(teamId)} में जोड़ा गया!`, 'success');
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.updatePlayersDisplay();
    }

    updatePlayersDisplay() {
        const container = document.getElementById('playersContainer');
        document.getElementById('totalPlayersCount').textContent = `${this.players.length} खिलाड़ी`;
        
        const startBtn = document.getElementById('startGameBtn');
        startBtn.disabled = this.players.length < 2;

        if (this.players.length === 0) {
            container.innerHTML = `<div class="empty-state"><h4>कोई खिलाड़ी नहीं</h4></div>`;
            return;
        }
        
        container.innerHTML = this.players.map(p => `
            <div class="player-item">
                <div class="player-info">
                    <div class="player-avatar">${p.avatar}</div>
                    <div>
                        <div class="player-name">${p.name}</div>
                        <div class="team-badge">${this.getTeamName(p.team)}</div>
                    </div>
                </div>
                <button class="btn-icon" onclick="gameManager.removePlayer(${p.id})"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    }

    // ===== Game Flow & Timer =====
    startGame() {
        this.gameState = 'playing';
        this.showScreen('game-screen');
        this.displayCurrentQuestion();
    }
    
    displayCurrentQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        // NEW: Use innerHTML for rich content
        document.getElementById('questionText').innerHTML = question.question;
        document.getElementById('answerText').textContent = question.answer;
        document.getElementById('questionNumber').textContent = `प्रश्न ${this.currentQuestionIndex + 1}`;
        document.getElementById('totalQuestions').textContent = `/ ${this.questions.length}`;
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;

        // Reset UI
        document.getElementById('answerSection').classList.remove('show');
        document.getElementById('scoringSection').classList.remove('show');
        document.getElementById('showAnswerBtn').style.display = 'inline-flex';
        document.getElementById('nextQuestionBtn').style.display = 'none';
        document.getElementById('saveScoresBtn').style.display = 'inline-flex';
        document.getElementById('saveScoresBtn').disabled = false;
        document.getElementById('saveScoresBtn').querySelector('span').textContent = 'स्कोर सेव करें';
        
        this.startWritingTimer();
    }

    startWritingTimer() {
        this.isPaused = false;
        this.timeLeft = 120; // Reset timer for each question
        const timerElement = document.querySelector('#writingTimer span');
        document.getElementById('pauseBtn').querySelector('span').textContent = 'रोकें';
        
        this.writingTimer = setInterval(() => {
            if (this.isPaused) return;

            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            timerElement.textContent = `लेखन समय: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.writingTimer);
                this.showAnswer(); // Auto-show answer when time is up
            }
            this.timeLeft--;
        }, 1000);
    }
    
    togglePause() { // NEW: Pause/Resume logic
        this.isPaused = !this.isPaused;
        const buttonText = document.getElementById('pauseBtn').querySelector('span');
        if (this.isPaused) {
            buttonText.textContent = 'जारी रखें';
            this.showToast('गेम रोक दिया गया', 'warning');
        } else {
            buttonText.textContent = 'रोकें';
        }
    }

    showAnswer() {
        clearInterval(this.writingTimer);
        document.getElementById('answerSection').classList.add('show');
        document.getElementById('scoringSection').classList.add('show');
        document.getElementById('showAnswerBtn').style.display = 'none';
        this.renderScoringUI();
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex < this.questions.length) {
            this.displayCurrentQuestion();
        } else {
            this.finishGame();
        }
    }
    
    finishGame() {
        this.gameState = 'results';
        this.showScreen('results-screen');
        this.displayResults();
    }

    // ===== NEW: Scoring System =====
    setScoringMode(mode) {
        this.scoringMode = mode;
        document.getElementById('teamScoreBtn').classList.toggle('active', mode === 'team');
        document.getElementById('individualScoreBtn').classList.toggle('active', mode === 'individual');
        document.getElementById('teamScoringContainer').style.display = mode === 'team' ? 'block' : 'none';
        document.getElementById('individualScoringContainer').style.display = mode === 'individual' ? 'block' : 'none';
        this.renderScoringUI();
    }

    renderScoringUI() {
        if (this.scoringMode === 'team') {
            this.generateTeamScoringInterface();
        } else {
            this.generateIndividualScoringInterface();
        }
    }

    generateTeamScoringInterface() {
        const teamsData = [...new Set(this.players.map(p => p.team))];
        const container = document.getElementById('teamsScoring');
        container.innerHTML = teamsData.map(teamId => {
            const teamPlayers = this.players.filter(p => p.team === teamId);
            return `
                <div class="team-scoring-card">
                    <h4>${this.getTeamName(teamId)} (${teamPlayers.length} खिलाड़ी)</h4>
                    <div class="score-input-group">
                        <label>सही उत्तरों की संख्या</label>
                        <input type="number" min="0" max="${teamPlayers.length}" value="0" id="correct-${teamId}">
                    </div>
                </div>
            `;
        }).join('');
    }

    generateIndividualScoringInterface() {
        const container = document.getElementById('individualScoringContainer');
        container.innerHTML = `
            <div class="individual-scoring-list">
            ${this.players.map(p => `
                <div class="individual-score-item" data-player-id="${p.id}">
                    <div class="player-name">${p.name} <span class="team-badge">${this.getTeamName(p.team)}</span></div>
                    <div class="individual-score-actions">
                        <button class="btn-score correct" onclick="this.parentElement.parentElement.dataset.score = 'correct'; this.classList.add('selected'); this.nextElementSibling.classList.remove('selected');">+10 सही</button>
                        <button class="btn-score incorrect" onclick="this.parentElement.parentElement.dataset.score = 'incorrect'; this.classList.add('selected'); this.previousElementSibling.classList.remove('selected');">-5 गलत</button>
                    </div>
                </div>
            `).join('')}
            </div>
        `;
    }

    saveScores() {
        if (this.scoringMode === 'team') {
            const teamsData = [...new Set(this.players.map(p => p.team))];
            teamsData.forEach(teamId => {
                const correctCount = parseInt(document.getElementById(`correct-${teamId}`).value) || 0;
                const teamPlayers = this.players.filter(p => p.team === teamId);
                const shuffledPlayers = [...teamPlayers].sort(() => 0.5 - Math.random());
                
                shuffledPlayers.forEach((player, index) => {
                    if (index < correctCount) {
                        player.correctAnswers++;
                        player.totalScore += 10;
                    } else {
                        player.wrongAnswers++;
                        player.totalScore -= 5;
                    }
                });
            });
        } else { // Individual scoring
            const scoreItems = document.querySelectorAll('.individual-score-item');
            scoreItems.forEach(item => {
                const playerId = parseInt(item.dataset.playerId);
                const score = item.dataset.score;
                const player = this.players.find(p => p.id === playerId);
                if (player && score) {
                    if (score === 'correct') {
                        player.correctAnswers++;
                        player.totalScore += 10;
                    } else {
                        player.wrongAnswers++;
                        player.totalScore -= 5;
                    }
                }
            });
        }
        
        this.showToast('स्कोर सफलतापूर्वक सेव किए गए!', 'success');
        document.getElementById('saveScoresBtn').style.display = 'none';
        document.getElementById('nextQuestionBtn').style.display = 'inline-flex';
        
        // Auto-advance
        setTimeout(() => this.nextQuestion(), 2000);
    }
    
    // ===== Results Management =====
    displayResults() {
        this.showWinner();
        this.showResults('individual'); // Default to individual
    }
    
    showWinner() {
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        const winner = sortedPlayers[0];
        document.getElementById('winnerTitle').textContent = `🏆 विजेता: ${winner.name}! 🏆`;
        document.getElementById('winnerSubtitle').textContent = `${this.getTeamName(winner.team)} टीम से, ${winner.totalScore} अंकों के साथ।`;
    }

    showResults(type) {
        document.querySelectorAll('.results-navigation .nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${type}Btn`).classList.add('active');
        
        const header = document.getElementById('leaderboardHeader');
        const content = document.getElementById('leaderboardContent');

        if (type === 'individual') {
            header.className = 'leaderboard-header individual';
            header.innerHTML = `<div>#</div><div>नाम</div><div>टीम</div><div>सही</div><div>गलत</div><div>कुल स्कोर</div>`;
            const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
            content.innerHTML = sortedPlayers.map((p, i) => `
                <div class="leaderboard-item individual rank-${i+1}">
                    <div>${i + 1}</div>
                    <div>${p.name}</div>
                    <div><span class="team-badge">${this.getTeamName(p.team)}</span></div>
                    <div>${p.correctAnswers}</div>
                    <div>${p.wrongAnswers}</div>
                    <div class="score-cell">${p.totalScore}</div>
                </div>
            `).join('');
        } else { // Team results
             header.className = 'leaderboard-header team';
            header.innerHTML = `<div>#</div><div>टीम</div><div>खिलाड़ी</div><div>सही</div><div>गलत</div><div>कुल स्कोर</div>`;
            const teamStats = this.teams.map(team => {
                const teamPlayers = this.players.filter(p => p.team === team.id);
                if(teamPlayers.length === 0) return null;
                return {
                    name: team.name,
                    players: teamPlayers.length,
                    correct: teamPlayers.reduce((sum, p) => sum + p.correctAnswers, 0),
                    wrong: teamPlayers.reduce((sum, p) => sum + p.wrongAnswers, 0),
                    totalScore: teamPlayers.reduce((sum, p) => sum + p.totalScore, 0),
                };
            }).filter(Boolean).sort((a,b) => b.totalScore - a.totalScore);
            
            content.innerHTML = teamStats.map((t, i) => `
                 <div class="leaderboard-item team rank-${i+1}">
                    <div>${i + 1}</div>
                    <div><span class="team-badge">${t.name}</span></div>
                    <div>${t.players}</div>
                    <div>${t.correct}</div>
                    <div>${t.wrong}</div>
                    <div class="score-cell">${t.totalScore}</div>
                </div>
            `).join('');
        }
    }
    
    // ===== Utility Functions =====
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    showModal(title, message, callback) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('modalOverlay').classList.add('show');
        this.pendingConfirmCallback = callback;
    }

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('show');
    }

    confirmModalAction() {
        if (this.pendingConfirmCallback) this.pendingConfirmCallback();
        this.closeModal();
    }
    
    endGameEarly() {
        this.showModal('गेम समाप्त करें', 'क्या आप वाकई गेम समाप्त करना चाहते हैं?', () => this.finishGame());
    }

    newGame() {
        window.location.reload();
    }
}

// ===== Global Functions for HTML onclick handlers =====
let gameManager;
document.addEventListener('DOMContentLoaded', () => {
    gameManager = new QuizGameManager();
});

function startGame() { gameManager.startGame(); }
function showAnswer() { gameManager.showAnswer(); }
function saveScores() { gameManager.saveScores(); }
function nextQuestion() { gameManager.nextQuestion(); }
function togglePause() { gameManager.togglePause(); }
function endGameEarly() { gameManager.endGameEarly(); }
function showResults(type) { gameManager.showResults(type); }
function newGame() { gameManager.newGame(); }
function closeModal() { gameManager.closeModal(); }
function confirmModalAction() { gameManager.confirmModalAction(); }
function setScoringMode(mode) { gameManager.setScoringMode(mode); }