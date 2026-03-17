// Gamification Application
class GamificationApp {
    constructor() {
        this.currentUser = null;
        this.canvasSize = 32;
        this.currentColor = '#8b5cf6';
        this.isDrawing = false;
        this.gardenAnimationId = null;
        this.quickColors = [
            '#000000', '#FFFFFF', '#8b5cf6', '#06b6d4', '#4ade80', '#fbbf24', '#ef4444', '#a855f7',
            '#3b82f6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#10b981'
        ];

        this.xpRewards = {
            easy: 10,
            medium: 25,
            hard: 50,
            expert: 100
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeCanvas();
        this.setupCanvasEvents();
        this.initializeQuickColors();
        this.initializePresetCharacters();
        this.checkUser();
    }

    checkUser() {
        const savedUser = localStorage.getItem('gamification_currentUser');
        if (savedUser) {
            this.currentUser = savedUser;
            this.loadUserData();
        } else {
            this.showUserModal();
        }
    }

    showUserModal() {
        const modal = document.getElementById('userModal');
        modal.classList.add('active');
        const input = document.getElementById('usernameInput');
        input.focus();
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveUsername();
            }
        });
    }

    saveUsername() {
        const input = document.getElementById('usernameInput');
        const passwordInput = document.getElementById('passwordInput');
        const username = input.value.trim();
        const password = passwordInput ? passwordInput.value.trim() : '';
        const btn = document.getElementById('saveUsernameBtn');

        if (username && password) {
            // Simulate login
            const originalText = btn.textContent;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> BAĞLANIYOR...';
            btn.disabled = true;

            setTimeout(() => {
                this.currentUser = username;
                localStorage.setItem('gamification_currentUser', username);
                this.initializeUserData();
                this.loadUserData();
                document.getElementById('userModal').classList.remove('active');

                btn.innerHTML = originalText;
                btn.disabled = false;

                if (this.showNotification) this.showNotification('Sisteme giriş yapıldı.', 'success');
            }, 800);
        } else {
            alert('Lütfen tüm alanları doldurun!');
        }
    }

    initializeUserData() {
        const userData = {
            level: 1,
            xp: 0,
            tasks: [],
            completedTasks: [],
            characters: [],
            currentCharacter: null,
            gardenLevel: 1
        };
        localStorage.setItem(`gamification_user_${this.currentUser}`, JSON.stringify(userData));
    }

    loadUserData() {
        const data = localStorage.getItem(`gamification_user_${this.currentUser}`);
        if (data) {
            this.userData = JSON.parse(data);
        } else {
            this.initializeUserData();
            this.loadUserData();
            return;
        }
        // Update UI after loading data
        this.updateUI();
        this.renderTasks();
        this.updateCharacterSelect();

        // Start garden animation
        setTimeout(() => {
            this.startGardenAnimation();
        }, 100);
    }

    saveUserData() {
        localStorage.setItem(`gamification_user_${this.currentUser}`, JSON.stringify(this.userData));
    }

    setupEventListeners() {
        // Username modal
        document.getElementById('saveUsernameBtn').addEventListener('click', () => this.saveUsername());
        document.getElementById('changeUserBtn').addEventListener('click', () => {
            localStorage.removeItem('gamification_currentUser');
            this.currentUser = null;
            this.showUserModal();
        });

        // Canvas size change
        document.getElementById('canvasSize').addEventListener('change', (e) => {
            this.canvasSize = parseInt(e.target.value);
            this.initializeCanvas();
            this.setupCanvasEvents();
        });

        // Color picker
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });

        // Canvas tools
        document.getElementById('clearCanvas').addEventListener('click', () => this.clearCanvas());
        document.getElementById('fillCanvas').addEventListener('click', () => this.fillCanvas());

        // Character management
        document.getElementById('saveCharacter').addEventListener('click', () => this.saveCharacter());
        document.getElementById('loadCharacter').addEventListener('click', () => this.loadCharacter());
        document.getElementById('deleteCharacter').addEventListener('click', () => this.deleteCharacter());

        // Task management
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());

        // Panel toggles
        document.getElementById('toggleCharacterEditor').addEventListener('click', () => this.togglePanel('characterEditorContent'));
        document.getElementById('toggleTasksPanel').addEventListener('click', () => this.togglePanel('tasksPanelContent'));
        document.getElementById('toggleTreePanel').addEventListener('click', () => this.togglePanel('treePanelContent'));

        // Level up modal
        document.getElementById('closeLevelUpBtn').addEventListener('click', () => {
            document.getElementById('levelUpModal').classList.remove('active');
        });

        // Change character button
        document.getElementById('changeCharacterBtn').addEventListener('click', () => {
            this.openCharacterEditor();
        });
    }

    openCharacterEditor() {
        const panel = document.getElementById('characterEditorContent');
        const toggle = document.getElementById('toggleCharacterEditor');
        panel.classList.remove('collapsed');
        toggle.classList.add('active');
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    closeCharacterEditor() {
        const panel = document.getElementById('characterEditorContent');
        const toggle = document.getElementById('toggleCharacterEditor');
        panel.classList.add('collapsed');
        toggle.classList.remove('active');
    }

    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        const toggle = event.target.closest('.btn-toggle');
        panel.classList.toggle('collapsed');
        toggle.classList.toggle('active');
    }

    initializeCanvas() {
        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');

        // Set actual canvas size
        canvas.width = this.canvasSize;
        canvas.height = this.canvasSize;

        // Set display size (always 320x320 for consistent UI)
        canvas.style.width = '320px';
        canvas.style.height = '320px';

        // Clear canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

        // Draw grid
        this.drawGrid();
    }

    setupCanvasEvents() {
        const canvas = document.getElementById('pixelCanvas');
        if (!canvas) return;

        // Remove existing listeners if any (by cloning)
        const newCanvas = canvas.cloneNode(true);
        canvas.parentNode.replaceChild(newCanvas, canvas);

        // Re-attach event listeners
        const canvasEl = document.getElementById('pixelCanvas');
        canvasEl.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvasEl.addEventListener('mousemove', (e) => this.draw(e));
        canvasEl.addEventListener('mouseup', () => this.stopDrawing());
        canvasEl.addEventListener('mouseleave', () => this.stopDrawing());

        // Touch events for mobile
        canvasEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvasEl.getBoundingClientRect();
            const scale = rect.width / this.canvasSize;
            const x = Math.floor((touch.clientX - rect.left) / scale);
            const y = Math.floor((touch.clientY - rect.top) / scale);
            this.drawPixel(x, y);
        });
    }

    drawGrid() {
        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;

        for (let i = 0; i <= this.canvasSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, this.canvasSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(this.canvasSize, i);
            ctx.stroke();
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const canvas = document.getElementById('pixelCanvas');
        const rect = canvas.getBoundingClientRect();
        const scale = rect.width / this.canvasSize;
        const x = Math.floor((e.clientX - rect.left) / scale);
        const y = Math.floor((e.clientY - rect.top) / scale);

        this.drawPixel(x, y);
    }

    drawPixel(x, y) {
        if (x < 0 || x >= this.canvasSize || y < 0 || y >= this.canvasSize) return;

        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = this.currentColor;
        ctx.fillRect(x, y, 1, 1);
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearCanvas() {
        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
        this.drawGrid();
    }

    fillCanvas() {
        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = this.currentColor;
        ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
        this.drawGrid();
    }

    initializeQuickColors() {
        const container = document.getElementById('quickColors');
        container.innerHTML = '';

        this.quickColors.forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'quick-color';
            colorDiv.style.backgroundColor = color;
            colorDiv.addEventListener('click', () => {
                this.currentColor = color;
                document.getElementById('colorPicker').value = color;
                document.querySelectorAll('.quick-color').forEach(c => c.classList.remove('active'));
                colorDiv.classList.add('active');
            });
            container.appendChild(colorDiv);
        });
    }

    initializePresetCharacters() {
        const presetChars = this.createPresetCharacterData();
        const container = document.getElementById('presetCharactersGrid');
        container.innerHTML = '';

        presetChars.forEach((char, index) => {
            const charDiv = document.createElement('div');
            charDiv.className = 'preset-character-item';
            charDiv.dataset.index = index;

            const canvas = document.createElement('canvas');
            canvas.className = 'preset-character-canvas';
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');

            // Clear canvas
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 32, 32);

            // Draw character
            char.draw(ctx);

            const name = document.createElement('div');
            name.className = 'preset-character-name';
            name.textContent = char.name;

            charDiv.appendChild(canvas);
            charDiv.appendChild(name);

            charDiv.addEventListener('click', () => {
                this.selectPresetCharacter(char, index);
            });

            container.appendChild(charDiv);
        });
    }

    createPresetCharacterData() {
        // Create actual pixel art characters programmatically
        return [
            {
                name: 'Mor Kahraman',
                draw: (ctx) => {
                    // Head (purple)
                    ctx.fillStyle = '#8b5cf6';
                    ctx.fillRect(10, 4, 12, 12);
                    // Eyes (white)
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(13, 8, 2, 2);
                    ctx.fillRect(17, 8, 2, 2);
                    // Body (purple)
                    ctx.fillStyle = '#8b5cf6';
                    ctx.fillRect(12, 16, 8, 10);
                    // Arms
                    ctx.fillRect(8, 18, 4, 6);
                    ctx.fillRect(20, 18, 4, 6);
                    // Legs
                    ctx.fillRect(12, 26, 3, 6);
                    ctx.fillRect(17, 26, 3, 6);
                }
            },
            {
                name: 'Mavi Maceracı',
                draw: (ctx) => {
                    // Head (blue)
                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(10, 4, 12, 12);
                    // Eyes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(13, 8, 2, 2);
                    ctx.fillRect(17, 8, 2, 2);
                    // Body
                    ctx.fillStyle = '#3b82f6';
                    ctx.fillRect(12, 16, 8, 10);
                    // Arms
                    ctx.fillRect(8, 18, 4, 6);
                    ctx.fillRect(20, 18, 4, 6);
                    // Legs
                    ctx.fillRect(12, 26, 3, 6);
                    ctx.fillRect(17, 26, 3, 6);
                    // Hat
                    ctx.fillStyle = '#1e40af';
                    ctx.fillRect(11, 2, 10, 4);
                }
            },
            {
                name: 'Yeşil Savaşçı',
                draw: (ctx) => {
                    // Head
                    ctx.fillStyle = '#4ade80';
                    ctx.fillRect(10, 4, 12, 12);
                    // Eyes
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(13, 8, 2, 2);
                    ctx.fillRect(17, 8, 2, 2);
                    // Body
                    ctx.fillStyle = '#4ade80';
                    ctx.fillRect(12, 16, 8, 10);
                    // Arms
                    ctx.fillRect(8, 18, 4, 6);
                    ctx.fillRect(20, 18, 4, 6);
                    // Legs
                    ctx.fillRect(12, 26, 3, 6);
                    ctx.fillRect(17, 26, 3, 6);
                    // Shield
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(22, 18, 3, 6);
                }
            },
            {
                name: 'Pembe Prenses',
                draw: (ctx) => {
                    // Head
                    ctx.fillStyle = '#ec4899';
                    ctx.fillRect(10, 4, 12, 12);
                    // Eyes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(13, 8, 2, 2);
                    ctx.fillRect(17, 8, 2, 2);
                    // Body
                    ctx.fillStyle = '#ec4899';
                    ctx.fillRect(12, 16, 8, 10);
                    // Arms
                    ctx.fillRect(8, 18, 4, 6);
                    ctx.fillRect(20, 18, 4, 6);
                    // Legs (dress)
                    ctx.fillRect(11, 26, 10, 6);
                    // Crown
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillRect(12, 2, 8, 3);
                    ctx.fillRect(14, 0, 4, 2);
                }
            },
            {
                name: 'Turuncu Kaşif',
                draw: (ctx) => {
                    // Head
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(10, 4, 12, 12);
                    // Eyes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(13, 8, 2, 2);
                    ctx.fillRect(17, 8, 2, 2);
                    // Body
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(12, 16, 8, 10);
                    // Arms
                    ctx.fillRect(8, 18, 4, 6);
                    ctx.fillRect(20, 18, 4, 6);
                    // Legs
                    ctx.fillRect(12, 26, 3, 6);
                    ctx.fillRect(17, 26, 3, 6);
                    // Backpack
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(6, 18, 3, 8);
                }
            },
            {
                name: 'Kırmızı Şövalye',
                draw: (ctx) => {
                    // Head
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(10, 4, 12, 12);
                    // Eyes
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(13, 8, 2, 2);
                    ctx.fillRect(17, 8, 2, 2);
                    // Body
                    ctx.fillStyle = '#ef4444';
                    ctx.fillRect(12, 16, 8, 10);
                    // Arms
                    ctx.fillRect(8, 18, 4, 6);
                    ctx.fillRect(20, 18, 4, 6);
                    // Legs
                    ctx.fillRect(12, 26, 3, 6);
                    ctx.fillRect(17, 26, 3, 6);
                    // Helmet
                    ctx.fillStyle = '#991b1b';
                    ctx.fillRect(11, 1, 10, 5);
                    ctx.fillRect(15, 0, 2, 2);
                }
            }
        ];
    }

    selectPresetCharacter(char, index) {
        // Remove previous selection
        document.querySelectorAll('.preset-character-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Mark as selected
        const selectedItem = document.querySelector(`[data-index="${index}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Load character to canvas
        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');

        // Clear and draw
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 32, 32);
        char.draw(ctx);

        // Set character name
        document.getElementById('characterName').value = char.name;

        // Auto-save and select
        setTimeout(() => {
            this.saveCharacter(true);
        }, 300);
    }

    saveCharacter(autoClose = false) {
        const canvas = document.getElementById('pixelCanvas');
        const nameInput = document.getElementById('characterName');
        const name = nameInput.value.trim() || `Karakter_${Date.now()}`;

        const imageData = canvas.toDataURL('image/png');

        if (!this.userData.characters) {
            this.userData.characters = [];
        }

        // Check if character with same name exists
        const existingIndex = this.userData.characters.findIndex(c => c.name === name);

        const character = {
            id: Date.now(),
            name: name,
            imageData: imageData,
            size: this.canvasSize
        };

        if (existingIndex >= 0) {
            // Update existing
            this.userData.characters[existingIndex] = character;
        } else {
            // Add new
            this.userData.characters.push(character);
        }

        this.userData.currentCharacter = character.id;
        this.saveUserData();
        this.updateCharacterSelect();
        this.updateAvatar();

        nameInput.value = '';
        this.showNotification('Karakter kaydedildi ve seçildi!', 'success');

        // Close editor after saving
        if (autoClose || this.userData.currentCharacter) {
            setTimeout(() => {
                this.closeCharacterEditor();
            }, 500);
        }
    }

    loadCharacter() {
        const select = document.getElementById('savedCharacters');
        const characterId = parseInt(select.value);

        if (!characterId) return;

        const character = this.userData.characters.find(c => c.id === characterId);
        if (!character) return;

        const canvas = document.getElementById('pixelCanvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            this.canvasSize = character.size || 32;
            document.getElementById('canvasSize').value = this.canvasSize;
            canvas.width = this.canvasSize;
            canvas.height = this.canvasSize;
            ctx.clearRect(0, 0, this.canvasSize, this.canvasSize);
            ctx.drawImage(img, 0, 0);
            this.drawGrid();
            this.userData.currentCharacter = character.id;
            this.saveUserData();
            this.updateAvatar();
        };

        img.src = character.imageData;
    }

    deleteCharacter() {
        const select = document.getElementById('savedCharacters');
        const characterId = parseInt(select.value);

        if (!characterId) return;

        if (confirm('Bu karakteri silmek istediğinize emin misiniz?')) {
            this.userData.characters = this.userData.characters.filter(c => c.id !== characterId);
            if (this.userData.currentCharacter === characterId) {
                this.userData.currentCharacter = null;
            }
            this.saveUserData();
            this.updateCharacterSelect();
            this.updateAvatar();
            this.showNotification('Karakter silindi!', 'info');
        }
    }

    updateCharacterSelect() {
        const select = document.getElementById('savedCharacters');
        select.innerHTML = '<option value="">Yeni karakter oluştur</option>';

        if (this.userData.characters && this.userData.characters.length > 0) {
            this.userData.characters.forEach(char => {
                const option = document.createElement('option');
                option.value = char.id;
                option.textContent = char.name;
                if (char.id === this.userData.currentCharacter) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    }

    updateAvatar() {
        const avatarCanvas = document.getElementById('userAvatar');
        const ctx = avatarCanvas.getContext('2d');

        if (this.userData.currentCharacter) {
            const character = this.userData.characters.find(c => c.id === this.userData.currentCharacter);
            if (character) {
                const img = new Image();
                img.onload = () => {
                    ctx.clearRect(0, 0, 64, 64);
                    ctx.imageSmoothingEnabled = false;
                    ctx.drawImage(img, 0, 0, 64, 64);
                };
                img.src = character.imageData;
                return;
            }
        }

        // Default avatar
        ctx.fillStyle = '#8b5cf6';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.currentUser ? this.currentUser[0].toUpperCase() : '?', 32, 32);
    }

    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const difficulty = document.getElementById('taskDifficulty').value;

        if (!title) {
            this.showNotification('Lütfen görev başlığı girin!', 'error');
            return;
        }

        const task = {
            id: Date.now(),
            title: title,
            description: description,
            difficulty: difficulty,
            xp: this.xpRewards[difficulty],
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (!this.userData.tasks) {
            this.userData.tasks = [];
        }

        this.userData.tasks.push(task);
        this.saveUserData();
        this.renderTasks();

        // Clear form
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDifficulty').value = 'medium';

        this.showNotification('Görev eklendi!', 'success');
    }

    completeTask(taskId) {
        const task = this.userData.tasks.find(t => t.id === taskId);
        if (!task || task.completed) return;

        task.completed = true;
        this.gainXP(task.xp);
        this.saveUserData();
        this.renderTasks();
        this.showXPAnimation(task.xp);
    }

    deleteTask(taskId) {
        if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
            this.userData.tasks = this.userData.tasks.filter(t => t.id !== taskId);
            this.saveUserData();
            this.renderTasks();
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksList');
        container.innerHTML = '';

        if (!this.userData.tasks || this.userData.tasks.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.6); padding: 2rem;">Henüz görev eklenmedi. İlk görevinizi ekleyin!</p>';
            return;
        }

        // Sort: incomplete first, then by creation date
        const sortedTasks = [...this.userData.tasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        sortedTasks.forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;

            taskDiv.innerHTML = `
                <div class="task-header">
                    <div class="task-title ${task.completed ? 'completed' : ''}">${task.title}</div>
                    <span class="task-difficulty ${task.difficulty}">${this.getDifficultyText(task.difficulty)}</span>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-xp">+${task.xp} XP</div>
                <div class="task-actions">
                    ${!task.completed ? `
                        <button class="btn btn-success btn-small" onclick="app.completeTask(${task.id})">
                            <i class="fas fa-check"></i> Tamamla
                        </button>
                    ` : `
                        <span style="color: #4ade80;"><i class="fas fa-check-circle"></i> Tamamlandı</span>
                    `}
                    <button class="btn btn-danger btn-small" onclick="app.deleteTask(${task.id})">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            `;

            container.appendChild(taskDiv);
        });
    }

    getDifficultyText(difficulty) {
        const texts = {
            easy: 'Kolay',
            medium: 'Orta',
            hard: 'Zor',
            expert: 'Uzman'
        };
        return texts[difficulty] || difficulty;
    }

    gainXP(amount) {
        this.userData.xp += amount;
        const oldLevel = this.userData.level;
        this.checkLevelUp();

        if (this.userData.level > oldLevel) {
            this.showLevelUpModal();
            this.updateGarden();
        }

        this.saveUserData();
        this.updateUI();
    }

    checkLevelUp() {
        const xpNeeded = this.getXPForLevel(this.userData.level + 1);
        if (this.userData.xp >= xpNeeded) {
            this.userData.level++;
            this.userData.gardenLevel = this.userData.level;
            this.checkLevelUp(); // Recursive for multiple level ups
        }
    }

    getXPForLevel(level) {
        // Exponential XP requirement: 100 * level^1.5
        return Math.floor(100 * Math.pow(level, 1.5));
    }

    showLevelUpModal() {
        const modal = document.getElementById('levelUpModal');
        document.getElementById('newLevel').textContent = this.userData.level;
        modal.classList.add('active');

        setTimeout(() => {
            modal.classList.remove('active');
        }, 5000);
    }

    showXPAnimation(xp) {
        const animation = document.createElement('div');
        animation.className = 'xp-gain';
        animation.textContent = `+${xp} XP`;
        document.body.appendChild(animation);

        setTimeout(() => {
            animation.remove();
        }, 1000);
    }

    updateUI() {
        document.getElementById('currentUsername').textContent = this.currentUser || 'Misafir';
        document.getElementById('userLevel').textContent = this.userData.level;
        document.getElementById('userXP').textContent = this.userData.xp;

        const nextLevelXP = this.getXPForLevel(this.userData.level + 1);
        const currentLevelXP = this.getXPForLevel(this.userData.level);
        const xpInCurrentLevel = this.userData.xp - currentLevelXP;
        const xpNeededForNext = nextLevelXP - currentLevelXP;
        const percentage = (xpInCurrentLevel / xpNeededForNext) * 100;

        document.getElementById('nextLevelXP').textContent = nextLevelXP;
        document.getElementById('xpBarFill').style.width = `${Math.min(100, Math.max(0, percentage))}%`;

        this.updateGarden();
        this.updateAvatar();
    }

    updateGarden() {
        const canvas = document.getElementById('gardenCanvas');
        const ctx = canvas.getContext('2d');
        const level = this.userData.gardenLevel || 1;

        // Clear canvas
        ctx.clearRect(0, 0, 400, 400);

        // Draw sky with enhanced gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, 250);
        skyGradient.addColorStop(0, '#4A90E2');
        skyGradient.addColorStop(0.3, '#6BB6FF');
        skyGradient.addColorStop(0.6, '#87CEEB');
        skyGradient.addColorStop(1, '#B0E0E6');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, 400, 250);

        // Draw stars for higher levels
        if (level >= 5) {
            this.drawStars(ctx, level);
        }

        // Draw clouds
        this.drawClouds(ctx, level);

        // Draw sun with glow effect
        if (level >= 3) {
            this.drawSun(ctx, 350, 50, level);
        }

        // Draw rainbow for high levels
        if (level >= 15) {
            this.drawRainbow(ctx, 200, 200);
        }

        // Draw ground with enhanced texture
        const groundGradient = ctx.createLinearGradient(0, 250, 0, 400);
        groundGradient.addColorStop(0, '#A8E6CF');
        groundGradient.addColorStop(0.2, '#90EE90');
        groundGradient.addColorStop(0.5, '#7CB342');
        groundGradient.addColorStop(1, '#558B2F');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, 250, 400, 150);

        // Draw grass texture
        this.drawGrass(ctx, level);

        // Draw tree shadow first
        this.drawTreeShadow(ctx, 200, 380, level);

        // Draw tree with glow effect
        this.drawTree(ctx, 200, 380, level);

        // Draw sparkles around tree for higher levels
        if (level >= 6) {
            this.drawSparkles(ctx, 200, 200, level);
        }

        // Draw floating hearts for high levels
        if (level >= 10) {
            this.drawFloatingHearts(ctx, level);
        }

        // Draw decorations based on level
        if (level >= 2) {
            this.drawFlower(ctx, 120, 360, '#FF69B4', level);
        }
        if (level >= 3) {
            this.drawFlower(ctx, 280, 360, '#FFD700', level);
        }
        if (level >= 4) {
            this.drawFlower(ctx, 80, 370, '#FF6347', level);
        }
        if (level >= 5) {
            this.drawFlower(ctx, 320, 370, '#32CD32', level);
            this.drawFlower(ctx, 150, 370, '#00CED1', level);
        }
        if (level >= 6) {
            this.drawFlower(ctx, 250, 370, '#9370DB', level);
        }
        if (level >= 7) {
            this.drawRock(ctx, 60, 390);
            this.drawRock(ctx, 340, 390);
        }
        if (level >= 8) {
            this.drawMushroom(ctx, 50, 370);
            this.drawMushroom(ctx, 350, 370);
        }
        if (level >= 10) {
            this.drawButterfly(ctx, 50 + (Date.now() / 50) % 300, 150 + Math.sin(Date.now() / 800) * 30);
        }
        if (level >= 12) {
            this.drawBird(ctx, 100 + (Date.now() / 30) % 200, 80);
        }

        document.getElementById('gardenLevel').textContent = level;
    }

    startGardenAnimation() {
        // Stop existing animation if any
        this.stopGardenAnimation();

        // Animate at ~30fps for smooth but not too heavy
        this.gardenAnimationId = setInterval(() => {
            if (document.getElementById('gardenCanvas')) {
                this.updateGarden();
            } else {
                this.stopGardenAnimation();
            }
        }, 33);
    }

    stopGardenAnimation() {
        if (this.gardenAnimationId) {
            clearInterval(this.gardenAnimationId);
            this.gardenAnimationId = null;
        }
    }

    drawClouds(ctx, level) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const cloudCount = Math.min(3, Math.floor(level / 2));
        for (let i = 0; i < cloudCount; i++) {
            const x = 50 + i * 120;
            const y = 30 + i * 20;
            this.drawCloud(ctx, x, y);
        }
    }

    drawCloud(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y - 15, 20, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSun(ctx, x, y, level) {
        const time = Date.now() / 1000;
        const size = 25 + (level * 2);

        // Sun glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size + 20);
        glowGradient.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
        glowGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.2)');
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, size + 20, 0, Math.PI * 2);
        ctx.fill();

        // Sun with pulsing effect
        const pulseSize = size + Math.sin(time * 2) * 2;
        const sunGradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize);
        sunGradient.addColorStop(0, '#FFF8DC');
        sunGradient.addColorStop(0.3, '#FFD700');
        sunGradient.addColorStop(0.7, '#FFA500');
        sunGradient.addColorStop(1, '#FF8C00');
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Animated sun rays
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(time * 3) * 0.3})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + (time * 0.5);
            const rayLength = 18 + Math.sin(time * 2 + i) * 3;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * pulseSize, y + Math.sin(angle) * pulseSize);
            ctx.lineTo(x + Math.cos(angle) * (pulseSize + rayLength), y + Math.sin(angle) * (pulseSize + rayLength));
            ctx.stroke();
        }
    }

    drawStars(ctx, level) {
        const time = Date.now() / 1000;
        const starCount = Math.min(15, level - 4);
        ctx.fillStyle = '#FFFFFF';

        for (let i = 0; i < starCount; i++) {
            const x = (i * 27) % 400;
            const y = 30 + (i * 15) % 100;
            const twinkle = Math.sin(time * 2 + i) * 0.5 + 0.5;
            const size = 2 + twinkle;

            ctx.globalAlpha = 0.6 + twinkle * 0.4;
            ctx.beginPath();
            // Draw star shape
            for (let j = 0; j < 5; j++) {
                const angle = (j / 5) * Math.PI * 2 - Math.PI / 2;
                const px = x + Math.cos(angle) * size;
                const py = y + Math.sin(angle) * size;
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    drawRainbow(ctx, x, y) {
        const time = Date.now() / 1000;
        const alpha = 0.6 + Math.sin(time) * 0.2;
        const radius = 80;

        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

        for (let i = 0; i < colors.length; i++) {
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 8;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, radius - i * 8, Math.PI, 0, false);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    drawSparkles(ctx, x, y, level) {
        const time = Date.now() / 1000;
        const sparkleCount = Math.min(8, level - 5);

        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + (time * 0.5);
            const radius = 70 + Math.sin(time * 2 + i) * 20;
            const sparkleX = x + Math.cos(angle) * radius;
            const sparkleY = y + Math.sin(angle) * radius;
            const twinkle = Math.sin(time * 4 + i) * 0.5 + 0.5;

            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Cross lines
            ctx.strokeStyle = `rgba(255, 255, 255, ${twinkle * 0.7})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sparkleX - 5, sparkleY);
            ctx.lineTo(sparkleX + 5, sparkleY);
            ctx.moveTo(sparkleX, sparkleY - 5);
            ctx.lineTo(sparkleX, sparkleY + 5);
            ctx.stroke();
        }
    }

    drawFloatingHearts(ctx, level) {
        const time = Date.now() / 1000;
        const heartCount = Math.min(5, level - 9);

        for (let i = 0; i < heartCount; i++) {
            const x = 50 + (i * 70) % 350;
            const y = 200 + Math.sin(time * 0.8 + i) * 30;
            const size = 8 + Math.sin(time * 2 + i) * 2;
            const alpha = 0.6 + Math.sin(time * 1.5 + i) * 0.3;

            ctx.fillStyle = `rgba(255, 105, 180, ${alpha})`;
            ctx.beginPath();
            // Heart shape
            ctx.moveTo(x, y + size * 0.3);
            ctx.bezierCurveTo(x, y, x - size * 0.5, y, x - size * 0.5, y + size * 0.3);
            ctx.bezierCurveTo(x - size * 0.5, y + size * 0.7, x, y + size * 0.9, x, y + size);
            ctx.bezierCurveTo(x, y + size * 0.9, x + size * 0.5, y + size * 0.7, x + size * 0.5, y + size * 0.3);
            ctx.bezierCurveTo(x + size * 0.5, y, x, y, x, y + size * 0.3);
            ctx.fill();
        }
    }

    drawGrass(ctx, level) {
        // Static grass - no animation to avoid eye strain
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 1;
        const grassCount = 25 + (level * 3);

        // Use seeded random for consistent grass positions
        const seed = level * 1000;
        for (let i = 0; i < grassCount; i++) {
            const x = (i * 16) % 400;
            const y = 250 + ((i * 7) % 15);
            const angle = ((i * 13) % 20) / 20 - 0.5;
            const height = 4 + ((i * 11) % 6);

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + angle * 8, y - height);
            ctx.stroke();
        }
    }

    drawTreeShadow(ctx, x, y, level) {
        const trunkHeight = Math.min(120, 40 + (level * 8));
        const shadowSize = 40 + (level * 3);

        // Tree shadow on ground
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(x, y + 5, shadowSize, shadowSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    drawTree(ctx, x, y, level) {
        const baseY = y;
        const trunkHeight = Math.min(140, 50 + (level * 9));
        const trunkWidth = Math.min(35, 15 + (level * 1.8));
        const treeBaseY = baseY - trunkHeight;
        const time = Date.now() / 1000;
        const gentleSway = Math.sin(time * 0.3) * 1; // Very gentle sway

        // Draw tree glow effect for higher levels (subtle)
        if (level >= 5) {
            const glowSize = 120 + (level * 6);
            const glowAlpha = 0.15 + Math.sin(time * 1.5) * 0.05;
            const glowGradient = ctx.createRadialGradient(x, treeBaseY - 60, 0, x, treeBaseY - 60, glowSize);
            glowGradient.addColorStop(0, `rgba(144, 238, 144, ${glowAlpha})`);
            glowGradient.addColorStop(0.5, `rgba(76, 175, 80, ${glowAlpha * 0.4})`);
            glowGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, treeBaseY - 60, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw trunk with organic shape
        const trunkGradient = ctx.createLinearGradient(x - trunkWidth / 2, treeBaseY, x + trunkWidth / 2, baseY);
        trunkGradient.addColorStop(0, '#4E342E');
        trunkGradient.addColorStop(0.2, '#5D4037');
        trunkGradient.addColorStop(0.5, '#654321');
        trunkGradient.addColorStop(0.8, '#8B4513');
        trunkGradient.addColorStop(1, '#A0522D');
        ctx.fillStyle = trunkGradient;

        // Organic trunk shape (slightly curved)
        ctx.beginPath();
        ctx.moveTo(x - trunkWidth / 2, baseY);
        ctx.quadraticCurveTo(x - trunkWidth / 3, treeBaseY + trunkHeight * 0.3, x - trunkWidth / 2.5, treeBaseY);
        ctx.lineTo(x - trunkWidth / 3, treeBaseY);
        ctx.quadraticCurveTo(x, treeBaseY + trunkHeight * 0.1, x + trunkWidth / 3, treeBaseY);
        ctx.lineTo(x + trunkWidth / 2.5, treeBaseY);
        ctx.quadraticCurveTo(x + trunkWidth / 3, treeBaseY + trunkHeight * 0.3, x + trunkWidth / 2, baseY);
        ctx.closePath();
        ctx.fill();

        // Trunk highlight
        ctx.fillStyle = 'rgba(160, 82, 45, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x - trunkWidth / 4, baseY);
        ctx.quadraticCurveTo(x, treeBaseY + trunkHeight * 0.2, x, treeBaseY);
        ctx.lineTo(x + trunkWidth / 4, treeBaseY);
        ctx.quadraticCurveTo(x, treeBaseY + trunkHeight * 0.2, x - trunkWidth / 4, baseY);
        ctx.closePath();
        ctx.fill();

        // Trunk texture (bark lines)
        ctx.strokeStyle = '#3E2723';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
            const lineY = treeBaseY + (i * trunkHeight / 8);
            const curve = (i % 2 === 0) ? 2 : -2;
            ctx.beginPath();
            ctx.moveTo(x - trunkWidth / 2 + 4, lineY);
            ctx.quadraticCurveTo(x, lineY + curve, x + trunkWidth / 2 - 4, lineY);
            ctx.stroke();
        }

        // Draw branches
        const branchCount = Math.min(6, Math.floor(level / 2) + 2);
        const branches = [];
        for (let i = 0; i < branchCount; i++) {
            const branchY = treeBaseY + trunkHeight * (0.3 + i * 0.15);
            const branchAngle = (i % 2 === 0 ? 1 : -1) * (0.4 + i * 0.2);
            const branchLength = 20 + (level * 1.5);
            branches.push({
                startX: x + (i % 2 === 0 ? trunkWidth / 3 : -trunkWidth / 3),
                startY: branchY,
                angle: branchAngle,
                length: branchLength
            });
        }

        // Draw branches
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 3 + (level * 0.2);
        branches.forEach(branch => {
            const endX = branch.startX + Math.cos(branch.angle) * branch.length;
            const endY = branch.startY + Math.sin(branch.angle) * branch.length;
            ctx.beginPath();
            ctx.moveTo(branch.startX, branch.startY);
            ctx.quadraticCurveTo(
                branch.startX + Math.cos(branch.angle) * branch.length * 0.5,
                branch.startY + Math.sin(branch.angle) * branch.length * 0.5 - 5,
                endX, endY
            );
            ctx.stroke();
        });

        // Draw organic leaf clusters on branches (not circular balls)
        const leafClusters = [];
        branches.forEach((branch, i) => {
            const endX = branch.startX + Math.cos(branch.angle) * branch.length;
            const endY = branch.startY + Math.sin(branch.angle) * branch.length;
            const clusterCount = 2 + Math.floor(level / 3);

            for (let j = 0; j < clusterCount; j++) {
                const offset = (j - clusterCount / 2) * 15;
                leafClusters.push({
                    x: endX + Math.cos(branch.angle + Math.PI / 2) * offset + gentleSway * (i % 2 === 0 ? 1 : -1),
                    y: endY + Math.sin(branch.angle + Math.PI / 2) * offset,
                    size: 25 + (level * 2) - j * 3,
                    branchIndex: i
                });
            }
        });

        // Main canopy at top
        const topCanopyY = treeBaseY - 20;
        leafClusters.push({
            x: x + gentleSway * 0.5,
            y: topCanopyY,
            size: 50 + (level * 4),
            branchIndex: -1
        });

        // Draw organic leaf clusters
        leafClusters.forEach((cluster, index) => {
            const alpha = 0.85 - (index * 0.02);
            const greenShade = level >= 10 ?
                ['#66BB6A', '#4CAF50', '#388E3C', '#2E7D32'] :
                ['#81C784', '#66BB6A', '#4CAF50', '#388E3C'];

            // Draw organic leaf shape (not perfect circle)
            ctx.beginPath();
            const points = 12;
            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const radiusVariation = 0.85 + Math.sin(angle * 3) * 0.15; // Organic variation
                const px = cluster.x + Math.cos(angle) * cluster.size * radiusVariation;
                const py = cluster.y + Math.sin(angle) * cluster.size * radiusVariation;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();

            // Leaf gradient
            const leafGradient = ctx.createRadialGradient(
                cluster.x - cluster.size * 0.2,
                cluster.y - cluster.size * 0.2,
                0,
                cluster.x, cluster.y, cluster.size
            );
            leafGradient.addColorStop(0, greenShade[0]);
            leafGradient.addColorStop(0.4, greenShade[1]);
            leafGradient.addColorStop(0.7, greenShade[2]);
            leafGradient.addColorStop(1, greenShade[3]);
            ctx.fillStyle = leafGradient;
            ctx.fill();

            // Highlight
            const highlightGradient = ctx.createRadialGradient(
                cluster.x - cluster.size * 0.3,
                cluster.y - cluster.size * 0.3,
                0,
                cluster.x - cluster.size * 0.3,
                cluster.y - cluster.size * 0.3,
                cluster.size * 0.6
            );
            highlightGradient.addColorStop(0, 'rgba(200, 255, 200, 0.6)');
            highlightGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = highlightGradient;
            ctx.fill();
        });

        // Add fruits on branches
        if (level >= 4) {
            const fruitCount = Math.min(8, level - 2);
            branches.forEach((branch, branchIdx) => {
                if (branchIdx < fruitCount / 2) {
                    const fruitX = branch.startX + Math.cos(branch.angle) * branch.length * 0.7;
                    const fruitY = branch.startY + Math.sin(branch.angle) * branch.length * 0.7;

                    // Fruit glow
                    if (level >= 6) {
                        const fruitGlow = ctx.createRadialGradient(fruitX, fruitY, 0, fruitX, fruitY, 12);
                        fruitGlow.addColorStop(0, `rgba(255, 215, 0, ${0.25 + Math.sin(time * 2) * 0.15})`);
                        fruitGlow.addColorStop(1, 'transparent');
                        ctx.fillStyle = fruitGlow;
                        ctx.beginPath();
                        ctx.arc(fruitX, fruitY, 12, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Fruit
                    const fruitGradient = ctx.createRadialGradient(fruitX, fruitY, 0, fruitX, fruitY, 8);
                    if (level >= 8) {
                        fruitGradient.addColorStop(0, '#FFD700');
                        fruitGradient.addColorStop(0.6, '#FFA500');
                        fruitGradient.addColorStop(1, '#FF8C00');
                    } else {
                        fruitGradient.addColorStop(0, '#FF6B6B');
                        fruitGradient.addColorStop(0.7, '#FF5252');
                        fruitGradient.addColorStop(1, '#E53935');
                    }
                    ctx.fillStyle = fruitGradient;
                    ctx.beginPath();
                    ctx.arc(fruitX, fruitY, 8, 0, Math.PI * 2);
                    ctx.fill();

                    // Fruit highlight
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.beginPath();
                    ctx.arc(fruitX - 2, fruitY - 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        // Add flowers on tree
        if (level >= 8) {
            const flowerCount = Math.min(4, Math.floor(level / 3));
            branches.slice(0, flowerCount).forEach((branch, i) => {
                const flowerX = branch.startX + Math.cos(branch.angle) * branch.length * 0.8;
                const flowerY = branch.startY + Math.sin(branch.angle) * branch.length * 0.8;
                this.drawSmallFlower(ctx, flowerX, flowerY, '#FFB6C1');
            });
        }
    }

    drawSmallFlower(ctx, x, y, color) {
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const petalX = x + Math.cos(angle) * 4;
            const petalY = y + Math.sin(angle) * 4;
            ctx.beginPath();
            ctx.arc(petalX, petalY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFlower(ctx, x, y, color, level) {
        const stemHeight = 15 + (level * 2);
        const flowerY = y - stemHeight;

        // Stem with gradient
        const stemGradient = ctx.createLinearGradient(x, y, x, flowerY);
        stemGradient.addColorStop(0, '#2E7D32');
        stemGradient.addColorStop(1, '#4CAF50');
        ctx.strokeStyle = stemGradient;
        ctx.lineWidth = 2 + (level * 0.3);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, flowerY);
        ctx.stroke();

        // Leaves on stem
        if (level >= 3) {
            ctx.fillStyle = '#66BB6A';
            ctx.beginPath();
            ctx.ellipse(x - 3, y - stemHeight / 2, 4, 2, -0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 3, y - stemHeight / 3, 4, 2, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Petals with gradient
        const petalSize = 6 + (level * 0.5);
        const petalCount = 5 + Math.floor(level / 3);

        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalX = x + Math.cos(angle) * (8 + level);
            const petalY = flowerY + Math.sin(angle) * (8 + level);

            const petalGradient = ctx.createRadialGradient(petalX, petalY, 0, petalX, petalY, petalSize);
            petalGradient.addColorStop(0, color);
            petalGradient.addColorStop(1, this.darkenColor(color, 0.3));
            ctx.fillStyle = petalGradient;
            ctx.beginPath();
            ctx.arc(petalX, petalY, petalSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center with gradient
        const centerGradient = ctx.createRadialGradient(x, flowerY, 0, x, flowerY, 4 + (level * 0.3));
        centerGradient.addColorStop(0, '#FFD700');
        centerGradient.addColorStop(1, '#FFA500');
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(x, flowerY, 4 + (level * 0.3), 0, Math.PI * 2);
        ctx.fill();
    }

    darkenColor(color, amount) {
        // Simple color darkening
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgb(${Math.floor(r * (1 - amount))}, ${Math.floor(g * (1 - amount))}, ${Math.floor(b * (1 - amount))})`;
        }
        return color;
    }

    drawMushroom(ctx, x, y) {
        // Stem
        ctx.fillStyle = '#F5F5DC';
        ctx.fillRect(x - 3, y, 6, 12);

        // Cap
        const capGradient = ctx.createRadialGradient(x, y, 0, x, y, 10);
        capGradient.addColorStop(0, '#FF6B6B');
        capGradient.addColorStop(1, '#E53935');
        ctx.fillStyle = capGradient;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Spots
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 4, y + 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBird(ctx, x, y) {
        // Body
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.ellipse(x, y, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(x - 6, y - 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 2);
        ctx.lineTo(x - 13, y - 1);
        ctx.lineTo(x - 10, y);
        ctx.closePath();
        ctx.fill();

        // Wing
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(x + 2, y - 1, 5, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(x - 7, y - 3, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRock(ctx, x, y) {
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#808080';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawButterfly(ctx, x, y) {
        // Wings
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(x - 8, y, 6, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 8, y, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Body
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 1, y - 3, 2, 6);
    }

    showNotification(message, type = 'info') {
        // Simple notification (can be enhanced with a proper notification system)
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GamificationApp();
});

