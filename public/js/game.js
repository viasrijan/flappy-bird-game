class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game constants
        this.GRAVITY = 0.5;
        this.JUMP_FORCE = -8;
        this.PIPE_WIDTH = 60;
        this.PIPE_GAP = 160;
        this.PIPE_SPEED = 2.5;
        this.BIRD_SIZE = 20;
        
        // Game state
        this.bird = {
            x: 60,
            y: 300,
            velocity: 0,
            rotation: 0
        };
        
        this.pipes = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('flappyBest')) || 0;
        this.gameRunning = false;
        this.gameOver = false;
        this.frameCount = 0;
        
        // Background elements
        this.clouds = this.generateClouds();
        this.groundOffset = 0;
        
        // Initialize
        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    init() {
        document.getElementById('highScore').textContent = this.bestScore;
        document.getElementById('bestScore').textContent = this.bestScore;
        this.bird.y = 300;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.gameRunning = false;
        this.updateScoreDisplay();
    }
    
    generateClouds() {
        const clouds = [];
        for (let i = 0; i < 5; i++) {
            clouds.push({
                x: Math.random() * 400,
                y: Math.random() * 200 + 20,
                width: Math.random() * 60 + 30,
                speed: Math.random() * 0.3 + 0.1
            });
        }
        return clouds;
    }
    
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.handleJump();
            }
        });
        
        // Mouse/click events
        this.canvas.addEventListener('click', () => this.handleJump());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleJump();
        });
        
        // Button events
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    handleJump() {
        if (this.gameOver) {
            this.restartGame();
            return;
        }
        
        if (!this.gameRunning) {
            this.startGame();
            return;
        }
        
        this.bird.velocity = this.JUMP_FORCE;
        // Add slight rotation on jump
        this.bird.rotation = -0.3;
    }
    
    startGame() {
        if (this.gameRunning) return;
        this.init();
        this.gameRunning = true;
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
    
    restartGame() {
        this.init();
        this.gameRunning = true;
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.updateScoreDisplay();
    }
    
    updateScoreDisplay() {
        document.getElementById('scoreDisplay').textContent = this.score;
    }
    
    createPipe() {
        const minHeight = 60;
        const maxHeight = this.canvas.height - this.PIPE_GAP - minHeight;
        const height = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            height: height,
            scored: false
        });
    }
    
    update() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.frameCount++;
        
        // Update bird
        this.bird.velocity += this.GRAVITY;
        this.bird.y += this.bird.velocity;
        
        // Bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 0.05, -0.5), 0.5);
        
        // Check boundaries
        if (this.bird.y - this.BIRD_SIZE < 0) {
            this.bird.y = this.BIRD_SIZE;
            this.bird.velocity = 0;
        }
        
        if (this.bird.y + this.BIRD_SIZE > this.canvas.height - 50) {
            this.endGame();
            return;
        }
        
        // Spawn pipes
        if (this.frameCount % 90 === 0) {
            this.createPipe();
        }
        
        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.PIPE_SPEED;
            
            // Score
            if (!pipe.scored && pipe.x + this.PIPE_WIDTH < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.updateScoreDisplay();
                this.createParticles();
            }
            
            // Remove offscreen pipes
            if (pipe.x + this.PIPE_WIDTH < 0) {
                this.pipes.splice(i, 1);
                continue;
            }
            
            // Collision detection
            if (this.checkCollision(pipe)) {
                this.endGame();
                return;
            }
        }
        
        // Update clouds
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.width < 0) {
                cloud.x = this.canvas.width + 20;
                cloud.y = Math.random() * 200 + 20;
            }
        });
        
        // Ground animation
        this.groundOffset = (this.groundOffset + 1) % 20;
    }
    
    checkCollision(pipe) {
        const birdLeft = this.bird.x - this.BIRD_SIZE;
        const birdRight = this.bird.x + this.BIRD_SIZE;
        const birdTop = this.bird.y - this.BIRD_SIZE;
        const birdBottom = this.bird.y + this.BIRD_SIZE;
        
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + this.PIPE_WIDTH;
        const pipeTop = pipe.height;
        const pipeBottom = pipe.height + this.PIPE_GAP;
        
        // Check if bird is within pipe's horizontal range
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            // Check if bird is above or below the gap
            if (birdTop < pipeTop || birdBottom > pipeBottom) {
                return true;
            }
        }
        return false;
    }
    
    createParticles() {
        // Simple particle effect when scoring
        const ctx = this.ctx;
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf'];
        for (let i = 0; i < 15; i++) {
            const x = this.bird.x + Math.random() * 40 - 20;
            const y = this.bird.y + Math.random() * 40 - 20;
            const size = Math.random() * 4 + 2;
            ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    
    endGame() {
        if (this.gameOver) return;
        this.gameRunning = false;
        this.gameOver = true;
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappyBest', this.bestScore.toString());
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.6);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height * 0.6);
        
        // Draw clouds
        this.clouds.forEach(cloud => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.width * 0.3, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - cloud.width * 0.2, cloud.width * 0.4, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.6, cloud.y - cloud.width * 0.1, cloud.width * 0.35, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width * 0.8, cloud.y, cloud.width * 0.25, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw pipes
        this.pipes.forEach(pipe => {
            // Top pipe
            ctx.fillStyle = '#2e8b57';
            ctx.fillRect(pipe.x, 0, this.PIPE_WIDTH, pipe.height);
            
            // Top pipe cap
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x - 5, pipe.height - 30, this.PIPE_WIDTH + 10, 30);
            
            // Pipe highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(pipe.x + 5, 0, 10, pipe.height);
            
            // Bottom pipe
            ctx.fillStyle = '#2e8b57';
            ctx.fillRect(pipe.x, pipe.height + this.PIPE_GAP, this.PIPE_WIDTH, canvas.height - pipe.height - this.PIPE_GAP);
            
            // Bottom pipe cap
            ctx.fillStyle = '#228B22';
            ctx.fillRect(pipe.x - 5, pipe.height + this.PIPE_GAP, this.PIPE_WIDTH + 10, 30);
            
            // Bottom pipe highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(pipe.x + 5, pipe.height + this.PIPE_GAP + 30, 10, canvas.height - pipe.height - this.PIPE_GAP);
        });
        
        // Draw ground
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
        
        // Ground line
        ctx.fillStyle = '#1a6b1a';
        ctx.fillRect(0, canvas.height - 55, canvas.width, 5);
        
        // Ground pattern
        ctx.fillStyle = '#2e8b57';
        for (let i = -this.groundOffset; i < canvas.width + 20; i += 20) {
            ctx.fillRect(i, canvas.height - 35, 10, 15);
            ctx.fillRect(i + 10, canvas.height - 45, 10, 10);
        }
        
        // Draw bird with rotation
        ctx.save();
        ctx.translate(this.bird.x, this.bird.y);
        ctx.rotate(this.bird.rotation);
        
        // Bird body (gradient)
        const birdGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, this.BIRD_SIZE);
        birdGradient.addColorStop(0, '#FFD700');
        birdGradient.addColorStop(1, '#FFA500');
        ctx.fillStyle = birdGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.BIRD_SIZE, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -5, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(10, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(12, -7, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird beak
        ctx.fillStyle = '#FF6B35';
        ctx.beginPath();
        ctx.moveTo(this.BIRD_SIZE, 0);
        ctx.lineTo(this.BIRD_SIZE + 10, 3);
        ctx.lineTo(this.BIRD_SIZE, 6);
        ctx.closePath();
        ctx.fill();
        
        // Bird wing
        ctx.fillStyle = 'rgba(255, 165, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-8, -3, 12, 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Draw score on canvas (for visual flair)
        if (this.gameRunning) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = '100px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.score, this.canvas.width / 2, 120);
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    const game = new FlappyBird();
});

// Handle window resize
window.addEventListener('resize', () => {
    // Optional: add responsive scaling if needed
});