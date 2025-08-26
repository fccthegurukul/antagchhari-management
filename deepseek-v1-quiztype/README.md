#gemini code fine work! but leaderboard NOT:

<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <title>शानदार अंताक्षरी</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary: #2c3e50;
            --secondary: #3498db;
            --accent: #e74c3c;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }

        .section {
            background: rgba(255, 255, 255, 0.95);
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .player-input {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }

        input, select, button {
            padding: 12px 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        button {
            background: var(--secondary);
            color: white;
            font-weight: bold;
            cursor: pointer;
            border: none;
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
        }

        button:hover {
            background: var(--primary);
            transform: scale(1.02);
        }

        .game-screen {
            display: none;
        }

        .question-box {
            font-size: 28px;
            margin: 2rem 0;
            padding: 2rem;
            background: linear-gradient(45deg, var(--primary), var(--secondary));
            color: white;
            border-radius: 12px;
            text-align: center;
            animation: pulse 2s infinite;
        }

        .question-info {
            text-align: center;
            margin-bottom: 1rem;
            font-weight: bold;
            font-size: 18px;
        }

        .answers {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 2rem 0;
        }

        .answer-btn {
            padding: 1.5rem;
            font-size: 18px;
            background: white;
            color: var(--primary);
            border: 2px solid var(--secondary);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .answer-btn:hover {
            background: var(--secondary);
            color: white;
            transform: translateY(-3px);
        }

        .answer-type-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-bottom: 1rem;
        }

        .answer-type-btn {
            padding: 1rem 1.5rem;
            font-size: 16px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        .answer-type-btn:hover {
            background-color: var(--secondary);
        }


        .leaderboard-item {
            display: grid;
            grid-template-columns: 50px 2fr 1fr 1fr 100px;
            align-items: center;
            padding: 1rem;
            margin: 0.5rem 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }

        .hidden-audio { display: none; }

        .group-A { background: #3498db20; color: #3498db; }
        .group-B { background: #e74c3c20; color: #e74c3c; }
        .group-C { background: #2ecc7120; color: #2ecc71; }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }

        @media (max-width: 768px) {
            .player-input, .answers, .leaderboard-item {
                grid-template-columns: 1fr;
            }
            .answer-type-buttons {
                flex-direction: column;
                align-items: stretch;
            }
        }
    </style>
</head>
<body>
    <!-- Player Setup -->
    <div class="section player-setup">
        <h2><i class="fas fa-users"></i> खिलाड़ी जोड़ें</h2>
        <div class="player-input">
            <input type="text" id="playerName" placeholder="नाम">
            <select id="groupSelect">
                <option value="A">ग्रुप A</option>
                <option value="B">ग्रुप B</option>
                <option value="C">ग्रुप C</option>
            </select>
            <button onclick="addPlayer()">
                <i class="fas fa-plus"></i> जोड़ें
            </button>
        </div>
        <button onclick="startGame()" style="width:100%">
            <i class="fas fa-play"></i> गेम शुरू करें
        </button>
    </div>

    <!-- Game Screen -->
    <div class="section game-screen">
        <h2 id="currentGroup"></h2>
        <div class="question-info">
            <span id="currentPlayerName"></span>, आपकी बारी!
        </div>
        <div class="question-box" id="question"></div>
        <div class="answers" id="answers"></div>
        <div class="answer-type-buttons">
            <button class="answer-type-btn" onclick="setAnswerType('member')">सदस्य जवाब</button>
            <button class="answer-type-btn" onclick="setAnswerType('team')">टीम जवाब</button>
        </div>
        <div class="score-board">
            <h3><i class="fas fa-chart-line"></i> स्कोर</h3>
            <div id="scoreList"></div>
        </div>
        <button onclick="endGame()" style="background:var(--accent);width:100%">
            <i class="fas fa-flag-checkered"></i> गेम समाप्त करें
        </button>
    </div>

     <!-- Sound Elements -->
     <audio id="correctSound" class="hidden-audio">
        <source src="sounds/correct-answer.mp3" type="audio/mpeg">
    </audio>
    <audio id="incorrectSound" class="hidden-audio">
        <source src="sounds/incorect.mp3" type="audio/mpeg">
    </audio>

    <!-- Leaderboard -->
    <div class="section leaderboard">
        <h2><i class="fas fa-trophy"></i> लीडरबोर्ड</h2>
        <div id="leaderboard"></div>
    </div>

<script>
const GameManager = {
    currentQuestion: null,
    players: [],
    currentGroupIndex: 0,
    currentPlayerIndex: 0, // Track current player within the group
    questions: [
    {
        "question": "‘राजकुमार’ में कौन-सा समास है?",
        "correct": "तत्पुरुष",
        "options": ["तत्पुरुष", "द्वंद्व", "बहुव्रीहि", "अव्ययीभाव"],
        "difficulty": 2
    },
    {
        "question": "‘राम-लक्ष्मण’ में कौन-सा समास है?",
        "correct": "द्वंद्व",
        "options": ["द्वंद्व", "तत्पुरुष", "बहुव्रीहि", "अव्ययीभाव"],
        "difficulty": 1
    },
    {
        "question": "‘चतुरानन’ शब्द में कौन-सा समास है?",
        "correct": "बहुव्रीहि",
        "options": ["द्वंद्व", "बहुव्रीहि", "तत्पुरुष", "अव्ययीभाव"],
        "difficulty": 2
    },
    {
        "question": "‘अच्छा-बुरा’ में कौन-सा समास है?",
        "correct": "द्वंद्व",
        "options": ["द्वंद्व", "तत्पुरुष", "बहुव्रीहि", "अव्ययीभाव"],
        "difficulty": 1
    },
    {
        "question": "‘अच्छा’ शब्द किस समास का उदाहरण है?",
        "correct": "अव्ययीभाव",
        "options": ["द्वंद्व", "तत्पुरुष", "बहुव्रीहि", "अव्ययीभाव"],
        "difficulty": 3
    },
    {
        "question": "‘अच्छा’ शब्द किस समास का उदाहरण है? (Repeat Question 1)",
        "correct": "अव्ययीभाव",
        "options": ["द्वंद्व", "तत्पुरुष", "बहुव्रीहि", "अव्ययीभाव"],
        "difficulty": 3
    },
    {
        "question": "‘अच्छा’ शब्द किस समास का उदाहरण है? (Repeat Question 2)",
        "correct": "अव्ययीभाव",
        "options": ["द्वंद्व", "तत्पुरुष", "बहुव्रीहि", "अव्ययीभाव"],
        "difficulty": 3
    }
    ],
    usedQuestionIndices: [], // To track used questions
    answerType: 'member', // Default answer type

    addPlayer(name, group) {
        this.players.push({
            id: Date.now(),
            name,
            group,
            score: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            history: []
        });
    },

    saveGameState() {
        const gameData = {
            date: new Date().toISOString(),
            players: this.players,
            totalRounds: this.currentGroupIndex,
            usedQuestionIndices: this.usedQuestionIndices
        };
        localStorage.setItem('antakshariHistory', JSON.stringify(gameData));
    },

    loadHistory() {
        const history = localStorage.getItem('antakshariHistory');
        if(history) {
            const savedData = JSON.parse(history);
            this.players = savedData.players;
            this.usedQuestionIndices = savedData.usedQuestionIndices || []; // Load used questions, default to empty array
        }
    },

    getGroups() {
        return [...new Set(this.players.map(p => p.group))];
    },

    getCurrentGroup() {
        const groups = this.getGroups();
        return groups[this.currentGroupIndex % groups.length];
    },

    getCurrentPlayer() {
        const currentGroup = this.getCurrentGroup();
        const playersInGroup = this.players.filter(player => player.group === currentGroup);
        if (playersInGroup.length === 0) return null; // Handle case if group has no players
        return playersInGroup[this.currentPlayerIndex % playersInGroup.length];
    },

    moveToNextPlayer() {
        const currentGroup = this.getCurrentGroup();
        const playersInGroup = this.players.filter(player => player.group === currentGroup);
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % playersInGroup.length;
        if (this.currentPlayerIndex === 0) { // Move to next group when all players in current group have had a turn
            this.currentGroupIndex++;
        }
    },

    updateScores(group, isCorrect, selectedAnswer, answerType) {
        let scoreToAdd = 0;
        if (isCorrect) {
            scoreToAdd = answerType === 'member' ? 10 : 5; // 10 points for member, 5 for team
        } else {
            scoreToAdd = -5; // -5 points for incorrect regardless of answer type
        }

        this.players.forEach(player => {
            if(player.group === group) {
                player.score += scoreToAdd;
                if (isCorrect) player.correctAnswers++; else player.wrongAnswers++;
                player.history.push({
                    question: this.currentQuestion.question,
                    answer: selectedAnswer,
                    correct: isCorrect,
                    answerType: answerType, // Store answer type
                    points: scoreToAdd, // Store points awarded
                    timestamp: new Date().toISOString()
                });
            }
        });
        this.saveGameState();
    },

    getUnusedQuestionIndex() {
        const availableIndices = Array.from({ length: this.questions.length }, (_, i) => i)
                                    .filter(index => !this.usedQuestionIndices.includes(index));
        if (availableIndices.length === 0) {
            return -1; // No unused questions left
        }
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        return randomIndex;
    }

};

// Game Functions
function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const group = document.getElementById('groupSelect').value;

    if(name) {
        GameManager.addPlayer(name, group);
        updateScoreList();
        document.getElementById('playerName').value = '';
    }
}

function startGame() {
    if(GameManager.players.length === 0) return alert("कम से कम 1 खिलाड़ी जोड़ें!");
    document.querySelector('.player-setup').style.display = 'none';
    document.querySelector('.game-screen').style.display = 'block';
    showNextQuestion();
}

function showNextQuestion() {
    const currentGroup = GameManager.getCurrentGroup();
    const currentPlayer = GameManager.getCurrentPlayer();

    if (!currentPlayer) { // Handle case where no players in group or game over
        alert("खेल समाप्त! लीडरबोर्ड देखें।"); // Or handle game end logic
        endGame();
        return;
    }

    document.getElementById('currentGroup').textContent = `चालू पाली: ग्रुप ${currentGroup}`;
    document.getElementById('currentPlayerName').textContent = currentPlayer.name;


    const unusedQuestionIndex = GameManager.getUnusedQuestionIndex();
    if (unusedQuestionIndex === -1) {
        alert("सभी प्रश्न समाप्त हो गए! गेम समाप्त।");
        endGame();
        return;
    }

    GameManager.currentQuestion = GameManager.questions[unusedQuestionIndex];
    GameManager.usedQuestionIndices.push(unusedQuestionIndex); // Mark question as used

    document.getElementById('question').textContent = GameManager.currentQuestion.question;

    const answersDiv = document.getElementById('answers');
    answersDiv.innerHTML = '';

    GameManager.currentQuestion.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = option;
        btn.onclick = () => checkAnswer(option); // Now answer type is already set before checkAnswer call
        answersDiv.appendChild(btn);
    });

}

const audio = {
    correct: document.getElementById('correctSound'),
    incorrect: document.getElementById('incorrectSound')
};

function setAnswerType(type) {
    GameManager.answerType = type;
    // Optionally visually indicate which answer type is selected
}


function checkAnswer(selectedAnswer) {
    const isCorrect = selectedAnswer === GameManager.currentQuestion.correct;
    const currentGroup = GameManager.getCurrentGroup();
    const answerType = GameManager.answerType; // Get the current answer type (member/team)

    // Play sound
    if(isCorrect) {
        audio.correct.currentTime = 0;
        audio.correct.play();
    } else {
        audio.incorrect.currentTime = 0;
        audio.incorrect.play();
    }

    GameManager.updateScores(currentGroup, isCorrect, selectedAnswer, answerType);

    const pointsMessage = isCorrect ? (answerType === 'member' ? "+10 अंक" : "+5 अंक (टीम)") : "-5 अंक";
    alert(`${isCorrect ? "सही जवाब! 🎉" : "गलत जवाब! ❌"} ${pointsMessage}`);

    updateScoreList();
    GameManager.moveToNextPlayer();
    showNextQuestion();
}


function endGame() {
    document.querySelector('.game-screen').style.display = 'none';
    showLeaderboard();
}

function updateScoreList() {
    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = GameManager.players
        .map(player => `
            <div class="leaderboard-item">
                <div class="badge group-${player.group}">${player.group}</div>
                <div>${player.name}</div>
                <div>${player.score} अंक</div>
                <div>${player.correctAnswers} ✔️</div>
                <div>${player.wrongAnswers} ❌</div>
            </div>
        `).join('');
}

function showLeaderboard() {
    const sortedPlayers = [...GameManager.players].sort((a, b) => b.score - a.score);
    const leaderboard = document.getElementById('leaderboard');

    leaderboard.innerHTML = sortedPlayers.map((player, index) => `
        <div class="leaderboard-item">
            <div>#${index + 1}</div>
            <div>${player.name}</div>
            <div class="badge group-${player.group}">ग्रुप ${player.group}</div>
            <div><strong>${player.score}</strong> अंक</div>
            <div>${((player.correctAnswers/(player.correctAnswers+player.wrongAnswers))*100 || 0).toFixed(1)}%</div>
        </div>
    `).join('');

    document.querySelector('.leaderboard').style.display = 'block';
}

// Initialize
window.onload = () => {
    GameManager.loadHistory();
    if(GameManager.players.length > 0) {
        updateScoreList();
        showLeaderboard();
    }
};
</script>
</body>
</html>

.............................

Deepseek:

