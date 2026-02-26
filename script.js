// Variabel Global
const TILE_SIZE = 80;
const SPEED = 250;
const MAX_LEVEL = 5;
let namaUser = localStorage.getItem('hoax_name') || "Player";
let currentLevel = 1;
let skor = 0; // Skor berjalan (akan di-reset saat pindah phase)
let skorPre = parseInt(localStorage.getItem('last_skor_pre')) || 0;
let skorPost = 0;
let sedangKuis = false;
let kuisCooldown = false; 
let avatarIndex = parseInt(localStorage.getItem('hoax_avatar')) || 0; 
let joystickData = null;
let targetGate = null;
let player, walls, gates, playerText, bg, keys;
let currentZoom = 2.0; 

// --- STATE GAME ---
let gamePhase = 'pre-test'; // Bisa 'pre-test' atau 'post-test'
let pertanyaanSudahTerjawab = []; // Track pertanyaan yang sudah dijawab benar

// --- VARIABEL MULTIPLAYER ---
let socket;
let otherPlayers; 

// Variabel Audio
let sfxClick, sfxCorrect, sfxWrong, sfxLevelClear, sfxVictory, bgm;

// --- SISTEM PERTANYAAN ---
const preTestPool = {
    1: [
        { id: 101, text: "Membagikan KTP ke orang asing di internet itu aman", jawaban: "hoax" },
        { id: 102, text: "Broadcast tanpa sumber jelas di WA adalah fakta", jawaban: "hoax" },
        { id: 103, text: "Berita hoaks biasanya memakai judul provokatif", jawaban: "fakta" },
        { id: 104, text: "Kita dapat langsung mempercayai artikel yang memiliki judul heboh dan menarik.", jawaban: "hoax" },
        { id: 105, text: "Penyebaran hoax juga memiliki dampak positif ke masyarakat.", jawaban: "hoax" },
        { id: 106, text: "Jika berita dibagikan oleh teman dekat, kita tidak perlu lagi melakukan fact-check karena sudah pasti kebenarannya.", jawaban: "hoax" },
        { id: 107, text: "Malinformasi berasal dari informasi yang benar tetapi digunakan secara merugikan.", jawaban: "fakta" }
    ],
    2: [
        { id: 201, text: "Hoaks hanya berdampak pada individu yang kurang berpendidikan.", jawaban: "hoax" },
        { id: 202, text: "Mengecek URL termasuk bagian dari proses fact-check.", jawaban: "fakta" },
        { id: 203, text: "Jika berita terasa terlalu bagus untuk dipercaya, kita harus berhati-hati.", jawaban: "fakta" },
        { id: 204, text: "Phising adalah pencurian data melalui link palsu.", jawaban: "fakta" },
        { id: 205, text: "Di era modern seperti sekarang, literasi digital adalah ilmu penting yang harus dipelajari oleh semua kalangan masyarakat.", jawaban: "fakta" },
        { id: 206, text: "Tidak semua informasi salah termasuk disinformasi.", jawaban: "fakta" },
        { id: 207, text: "Memeriksa halaman “Tentang Kami” termasuk bagian dari langkah fact-check.", jawaban: "fakta" }
    ],
    3: [
        { id: 301, text: "Artikel yang hanya mengutip satu sumber dengan kepentingan tertentu berpotensi bias.", jawaban: "fakta" },
        { id: 302, text: "Mengecek latar pendidikan penting untuk mengecek kebenaran suatu artikel", jawaban: "fakta" },
        { id: 303, text: "Kita dapat mempercayai sebuah artikel yang menyertakan data penelitian tanpa menyertakan nama jurnal atau tautan sumber aslinya.", jawaban: "hoax" },
        { id: 304, text: "kita dapat langsung mempercayai sebuah informasi karena sudah di bagikan oleh banyak orang di sosial media", jawaban: "hoax" },
        { id: 305, text: "sebuah artikel yang mencantumkan data statistik tanpa mencantumkan asal datanya tidak boleh langsung dipercaya", jawaban: "fakta" },
        { id: 306, text: "Mengecek tanggal publikasi merupakan langkah penting dalam mengevaluasi informasi.", jawaban: "fakta" },
        { id: 307, text: "Hoaks hanya berdampak pada individu, tidak pada masyarakat luas.", jawaban: "hoax" },
    ],
    4: [
        { id: 401, text: "Literasi digital hanya penting untuk orang yang bekerja di bidang teknologi.", jawaban: "fakta" },
        { id: 402, text: "Informasi lama yang diunggah kembali tanpa penjelasan konteks waktu dapat menyesatkan.", jawaban: "fakta" },
        { id: 403, text: "makin banyak orang yang membagikan suatu informasi, semakin terbukti kebenarannya", jawaban: "hoax" },
        { id: 404, text: "Sebuah artikel yang mencantumkan nama lembaga terkenal sudah pasti terbukti kebenarannya.", jawaban: "hoax" },
        { id: 405, text: "Artikel bias adalah artikel yang baik karena hanya menyampaikan informasi yang subjektif.", jawaban: "hoax" },
        { id: 406, text: "Jika artikel mencantumkan data statistik, kita tidak perlu lagi mengecek sumbernya.", jawaban: "hoax" },
        { id: 407, text: "Kemampuan berpikir kritis tidak diperlukan jika informasi berasal dari lembaga terkenal", jawaban: "hoax" }
    ],
    5: [
        { id: 501, text: "Sebuah berita yang di bagikan oleh sebuah akun yang memiliki pengikut banyak belum tentu berita fakta", jawaban: "fakta" },
        { id: 502, text: "Sebuah artikel yang tidak mengandung kebohongan tapi judulnya di lebih lebihkan, sama saja akan menimbulkan masalah", jawaban: "hoax" },
        { id: 503, text: "Literasi digital hanya berkaitan dengan kemampuan teknis menggunakan perangkat tanpa melibatkan kemampuan berpikir kritis", jawaban: "hoax" },
        { id: 504, text: "Sebuah Informasi yang sesuai dengan pendapat pribadi kita bisa disebut fakta", jawaban: "hoax" },
        { id: 505, text: "Berita yang menyertakan data asli tapi di sajikan dengan statistik yang salah termasuk berita hoax", jawaban: "fakta" },
        { id: 506, text: "Artikel yang hanya mengutip satu sumber dengan kepentingan tertentu berpotensi bias.", jawaban: "fakta" },
        { id: 507, text: "Artikel bias selalu menyajikan gambaran yang lengkap dan objektif.", jawaban: "hoax" }
    ]
};

const postTestPool = {
    1: preTestPool[1].map(q => ({...q, id: q.id + 1000})),
    2: preTestPool[2].map(q => ({...q, id: q.id + 1000})),
    3: preTestPool[3].map(q => ({...q, id: q.id + 1000})),
    4: preTestPool[4].map(q => ({...q, id: q.id + 1000})),
    5: preTestPool[5].map(q => ({...q, id: q.id + 1000}))
};

let kuisTerpakai = [];

class MainScene extends Phaser.Scene {
    constructor() { super({ key: 'MainScene' }); }

    preload() {
        this.load.image('bg-game', 'background rumput.jpg'); 
        this.load.image('wall', 'Wall maze.png');
        this.load.image('gate', 'question box.png'); 
        this.load.spritesheet('hero0', 'player cowo.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('hero1', 'player cewe.png', { frameWidth: 32, frameHeight: 32 });
        this.load.audio('bgm', 'background.mp3');
        this.load.audio('click', 'click.wav');
        this.load.audio('correct', 'correct.mp3');
        this.load.audio('wrong', 'wrong.mp3');
        this.load.audio('level_clear', 'levelclear.wav'); 
        this.load.audio('victory', 'victory.mp3');
    }

    create() {
        const addSnd = (k, c={}) => this.cache.audio.exists(k) ? this.sound.add(k, c) : null;
        sfxClick = addSnd('click');
        sfxCorrect = addSnd('correct');
        sfxWrong = addSnd('wrong');
        sfxLevelClear = addSnd('level_clear');
        sfxVictory = addSnd('victory');
        bgm = addSnd('bgm', { loop: true, volume: 0.3 });

        bg = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'bg-game').setOrigin(0, 0).setScrollFactor(0); 
        walls = this.physics.add.staticGroup();
        gates = this.physics.add.staticGroup();
        
        player = this.physics.add.sprite(140, 140, 'hero' + avatarIndex).setScale(1.5).setDepth(10);
        playerText = this.add.text(player.x, player.y - 45, namaUser, { 
            fontSize: '14px', fill: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 
        }).setOrigin(0.5).setDepth(100);

        this.createHeroAnims(0); 
        this.createHeroAnims(1);
        
        this.cameras.main.startFollow(player, true, 0.1, 0.1);
        this.cameras.main.setZoom(currentZoom);

        this.physics.add.collider(player, walls);
        this.physics.add.overlap(player, gates, (p, g) => { 
            if (!sedangKuis && !kuisCooldown) { targetGate = g; bukaKuis(); } 
        });

        keys = this.input.keyboard.addKeys({ 
            up: 'W', down: 'S', left: 'A', right: 'D',
            zoomIn: 'Q', zoomOut: 'E'
        });
        
        this.buatLabirin(currentLevel);
        setupJoystick();

        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (deltaY > 0) currentZoom = Math.max(1, currentZoom - 0.1);
            else currentZoom = Math.min(4, currentZoom + 0.1);
            this.cameras.main.setZoom(currentZoom);
        });

        otherPlayers = this.physics.add.group();
        
        if (typeof io !== 'undefined') {
            socket = io(); 
            socket.emit('playerJoin', { nama: namaUser, avatar: avatarIndex, level: currentLevel });

            socket.on('currentPlayers', (players) => {
                Object.keys(players).forEach((id) => {
                    if (players[id].playerId !== socket.id) {
                        this.addOtherPlayer(players[id]);
                    }
                });
            });

            socket.on('newPlayer', (playerInfo) => {
                this.addOtherPlayer(playerInfo);
            });

            socket.on('playerMoved', (playerInfo) => {
                otherPlayers.getChildren().forEach((otherP) => {
                    if (playerInfo.playerId === otherP.playerId) {
                        if (playerInfo.level !== currentLevel) {
                            otherP.setVisible(false);
                            otherP.nameTag.setVisible(false);
                        } else {
                            otherP.setVisible(true);
                            otherP.nameTag.setVisible(true);
                            otherP.setPosition(playerInfo.x, playerInfo.y);
                            if (playerInfo.anim) otherP.play(playerInfo.anim, true);
                            else otherP.anims.stop();
                            otherP.nameTag.setPosition(playerInfo.x, playerInfo.y - 45);
                        }
                    }
                });
            });

            socket.on('playerDisconnected', (playerId) => {
                otherPlayers.getChildren().forEach((otherP) => {
                    if (playerId === otherP.playerId) {
                        otherP.nameTag.destroy();
                        otherP.destroy();
                    }
                });
            });
        }
    }

    addOtherPlayer(playerInfo) {
        const otherP = this.physics.add.sprite(playerInfo.x, playerInfo.y, 'hero' + playerInfo.avatar).setScale(1.5);
        otherP.playerId = playerInfo.playerId;
        otherP.nameTag = this.add.text(playerInfo.x, playerInfo.y - 45, playerInfo.nama, {
            fontSize: '12px', fill: '#ffff00', fontStyle: 'bold', stroke: '#00', strokeThickness: 2
        }).setOrigin(0.5);
        if (playerInfo.level !== currentLevel) {
            otherP.setVisible(false);
            otherP.nameTag.setVisible(false);
        }
        otherPlayers.add(otherP);
    }

    update() {
        if (!player || !player.body) return;
        if (sedangKuis) {
            player.setVelocity(0, 0);
            player.anims.stop();
            return;
        }

        if (keys.zoomIn.isDown) {
            currentZoom = Math.min(4, currentZoom + 0.02);
            this.cameras.main.setZoom(currentZoom);
        } else if (keys.zoomOut.isDown) {
            currentZoom = Math.max(1, currentZoom - 0.02);
            this.cameras.main.setZoom(currentZoom);
        }

        bg.tilePositionX = this.cameras.main.scrollX;
        bg.tilePositionY = this.cameras.main.scrollY;

        let vx = 0, vy = 0;
        if (keys.left.isDown) vx = -SPEED; else if (keys.right.isDown) vx = SPEED;
        if (keys.up.isDown) vy = -SPEED; else if (keys.down.isDown) vy = SPEED;
        
        if (joystickData && joystickData.distance > 0) {
            vx = Math.cos(joystickData.angle.radian) * SPEED; 
            vy = -Math.sin(joystickData.angle.radian) * SPEED;
        }
        player.setVelocity(vx, vy);

        let p = "h" + avatarIndex + "_";
        let animName = null;
        if (vx !== 0 || vy !== 0) {
            if (Math.abs(vx) > Math.abs(vy)) animName = vx < 0 ? p+'left' : p+'right';
            else animName = vy < 0 ? p+'up' : p+'down';
            player.play(animName, true);
        } else {
            player.anims.stop();
        }
        playerText.setPosition(player.x, player.y - 45);

        if (socket) {
            socket.emit('playerMovement', { x: player.x, y: player.y, anim: animName, level: currentLevel });
        }
    }

    createHeroAnims(idx) {
        let k = 'hero' + idx, p = 'h' + idx + '_';
        if (!this.anims.exists(p+'down')) {
            this.anims.create({ key: p+'down', frames: this.anims.generateFrameNumbers(k, { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
            this.anims.create({ key: p+'left', frames: this.anims.generateFrameNumbers(k, { start: 3, end: 5 }), frameRate: 10, repeat: -1 });
            this.anims.create({ key: p+'right', frames: this.anims.generateFrameNumbers(k, { start: 6, end: 8 }), frameRate: 10, repeat: -1 });
            this.anims.create({ key: p+'up', frames: this.anims.generateFrameNumbers(k, { start: 9, end: 11 }), frameRate: 10, repeat: -1 });
        }
    }

    buatLabirin(lvl) {
        if (!walls) return;
        currentLevel = lvl;
        const lvlEl = document.getElementById('level-display');
        if(lvlEl) lvlEl.innerText = (gamePhase === 'pre-test' ? "PRE " : "POST ") + "LVL " + currentLevel;
        walls.clear(true, true); 
        gates.clear(true, true);
        levelData[lvl].map.forEach((row, y) => {
            row.forEach((tile, x) => {
                let px = x * TILE_SIZE + 60, py = y * TILE_SIZE + 60;
                if (tile === 1) walls.create(px, py, 'wall').setScale(0.136).refreshBody();
                else if (tile === 2) gates.create(px, py, 'gate').setScale(0.15).refreshBody();
            });
        });
        player.setPosition(140, 140);
        sedangKuis = false;
        if(socket) socket.emit('playerMovement', { x: 140, y: 140, anim: null, level: currentLevel });
    }
}

// --- FUNGSI GLOBAL ---
function playSFX(snd) {
    if (!snd) return;
    if (game.sound.context.state === 'suspended') game.sound.context.resume();
    snd.play();
}

window.mulaiGame = () => {
    playSFX(sfxClick);
    if (bgm) bgm.play();
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('top-nav-right').classList.remove('hidden');
    document.getElementById('ui-container-left').classList.remove('hidden');
};

function bukaKuis() {
    if (sedangKuis) return;
    sedangKuis = true;
    kuisCooldown = true;

    let currentPool = (gamePhase === 'pre-test') ? preTestPool[currentLevel] : postTestPool[currentLevel];
    
    // Filter pertanyaan agar tidak mengulang yang sudah dijawab benar
    let available = currentPool.filter(q => !pertanyaanSudahTerjawab.includes(q.id));

    // Jika semua sudah terjawab, reset list filter untuk level ini saja
    if (available.length === 0) {
        available = currentPool; 
    }

    let k = available[Math.floor(Math.random() * available.length)];
    
    const qText = document.getElementById('q-text');
    qText.innerText = k.text;
    qText.dataset.answer = k.jawaban;
    qText.dataset.qid = k.id; // Simpan ID untuk filter nanti

    document.getElementById('quiz-modal').classList.remove('hidden');
    document.getElementById('quiz-options').classList.remove('hidden');
    document.getElementById('feedback').classList.add('hidden');
}

window.jawab = (p) => {
    const qEl = document.getElementById('q-text');
    const bnr = qEl.dataset.answer;
    const qid = parseInt(qEl.dataset.qid);

    if (p === bnr) { 
        skor += 20; 
        playSFX(sfxCorrect);
        pertanyaanSudahTerjawab.push(qid); // Tandai agar tidak keluar lagi
        document.getElementById('feedback-text').innerText = "TRUE! +20"; 
    } else { 
        playSFX(sfxWrong);
        document.getElementById('feedback-text').innerText = "FALSE!"; 
    }
    
    const scoreDisplay = document.getElementById('score-display');
    if(scoreDisplay) scoreDisplay.innerText = skor; 
    document.getElementById('quiz-options').classList.add('hidden');
    document.getElementById('feedback').classList.remove('hidden');
    
    if(gamePhase === 'pre-test') {
        skorPre = skor;
        localStorage.setItem('last_skor_pre', skorPre);
    } else {
        skorPost = skor;
    }

    simpanKeLeaderboard();
};

window.tutupKuis = () => {
    playSFX(sfxClick);
    document.getElementById('quiz-modal').classList.add('hidden');
    if(targetGate) { targetGate.destroy(); targetGate = null; }
    sedangKuis = false;
    setTimeout(() => { kuisCooldown = false; }, 500);
    if (gates.countActive() === 0) { setTimeout(cekStatusLevel, 500); }
};

function cekStatusLevel() {
    sedangKuis = true;
    const statsEl = document.getElementById('level-stats');
    if(statsEl) statsEl.innerText = "Your current score: " + skor;
    
    if (currentLevel < MAX_LEVEL) {
        playSFX(sfxLevelClear);
        document.getElementById('level-modal').classList.remove('hidden');
    } else {
        if (gamePhase === 'pre-test') {
            simpanKeLeaderboard();
            tampilkanLeaderboardPreTest();
        } else {
            simpanKeLeaderboard();
            if (bgm) bgm.stop();
            playSFX(sfxVictory);
            
            const finalScoreEl = document.getElementById('final-score-text');
            if(finalScoreEl) {
                finalScoreEl.innerHTML = `
                    <h1 style='color:#FFD700; font-size:60px; margin: 30px 0; font-family: sans-serif;'>THANK YOU</h1>
                    <div style="display:flex; flex-direction:column; gap:15px; align-items:center;">
                        <button onclick="window.bukaPeringkat()" 
                                style="padding:12px 25px; font-size:18px; cursor:pointer; background:#007bff; color:white; border:none; border-radius:10px; font-weight:bold; width:250px; font-family: sans-serif;">
                                VIEW LEADERBOARD
                        </button>
                        <button onclick="window.keLobby()" 
                                style="padding:12px 25px; font-size:18px; cursor:pointer; background:#6c757d; color:white; border:none; border-radius:10px; font-weight:bold; width:250px; font-family: sans-serif;">
                                BACK TO LOBBY
                        </button>
                    </div>
                `;
            }
            document.getElementById('victory-modal').classList.remove('hidden');
        }
    }
}

function tampilkanLeaderboardPreTest() {
    playSFX(sfxLevelClear);
    const data = JSON.parse(localStorage.getItem('hoax_ranks_pre')) || [];
    const vicModal = document.getElementById('victory-modal');
    const finalScoreEl = document.getElementById('final-score-text');
    
    // Avatar Style (Face crop)
    const avatarCropStyle = `width:30px; height:30px; object-fit:none; object-position: 50% 0%; scale:1.5;`;

    let listHTML = data.map((x, i) => {
        let img = (x.avatar === 1) ? 'player cewe.png' : 'player cowo.png';
        return `<div style="background:rgba(255,255,255,0.1); margin:5px; padding:10px; border-radius:10px; display:flex; align-items:center; gap:10px; width:300px; font-family: sans-serif;">
            <span style="font-weight:bold; color:#FFD700;">#${i+1}</span>
            <div style="width:30px; height:30px; overflow:hidden; border-radius:50%; background:rgba(0,0,0,0.3); display:flex; justify-content:center;">
                <img src="${img}" style="${avatarCropStyle}">
            </div>
            <span style="flex:1; text-align:left; color:white;">${x.name.toUpperCase()}</span>
            <span style="font-weight:bold; color:white;">⭐ ${x.score}</span>
        </div>`;
    }).join('');

    finalScoreEl.innerHTML = `
        <h2 style="color:#FFF; margin-bottom:10px; font-family: sans-serif;">PRE-TEST COMPLETED!</h2>
        <div style="background:rgba(0,0,0,0.5); padding:15px; border-radius:15px; margin-bottom:20px; display:flex; flex-direction:column; align-items:center;">
            <h4 style="color:#00FF00; margin-top:0; font-family: sans-serif;">PRE-TEST RANKINGS</h4>
            ${listHTML}
        </div>
        <p style="margin-bottom:20px; color:white; font-family: sans-serif;">Ready to learn before the final test?</p>
        <div style="display:flex; flex-direction:column; gap:10px; align-items:center;">
            <button onclick="document.getElementById('victory-modal').classList.add('hidden'); bukaLiterasiOtomatis();" 
                    style="padding:12px 30px; font-size:18px; cursor:pointer; background:#28a745; color:white; border:none; border-radius:10px; font-weight:bold; width:280px; font-family: sans-serif;">
                    LEARAN DIGITAL LITERACY
            </button>
            <button onclick="window.keLobby()" 
                    style="padding:12px 30px; font-size:18px; cursor:pointer; background:#6c757d; color:white; border:none; border-radius:10px; font-weight:bold; width:280px; font-family: sans-serif;">
                    QUIT TO LOBBY
            </button>
        </div>
    `;
    vicModal.classList.remove('hidden');
}

function bukaLiterasiOtomatis() {
    const closeBtn = document.querySelector('#literasi-modal .wiki-header button');
    closeBtn.innerText = "START POST-TEST";
    closeBtn.setAttribute("onclick", "mulaiPostTest()");
    document.getElementById('literasi-modal').classList.remove('hidden');
}

window.mulaiPostTest = () => {
    playSFX(sfxClick);
    document.getElementById('literasi-modal').classList.add('hidden');
    gamePhase = 'post-test';
    currentLevel = 1;
    skor = 0; 
    pertanyaanSudahTerjawab = []; // Reset tracker buat post-test
    document.getElementById('score-display').innerText = "0";
    game.scene.getScene('MainScene').buatLabirin(1);
};

window.lanjutLevel = () => {
    playSFX(sfxClick);
    document.getElementById('level-modal').classList.add('hidden');
    sedangKuis = false;
    game.scene.getScene('MainScene').buatLabirin(currentLevel + 1);
};

function simpanKeLeaderboard() {
    const storageKey = (gamePhase === 'pre-test') ? 'hoax_ranks_pre' : 'hoax_ranks_post';
    let data = JSON.parse(localStorage.getItem(storageKey)) || [];
    
    let userIndex = data.findIndex(x => x.name.toLowerCase() === namaUser.toLowerCase());
    if (userIndex !== -1) {
        if (skor > data[userIndex].score) { 
            data[userIndex].score = skor; 
            data[userIndex].avatar = avatarIndex; 
        }
    } else {
        data.push({ name: namaUser, score: skor, avatar: avatarIndex });
    }
    
    data.sort((a, b) => b.score - a.score);
    localStorage.setItem(storageKey, JSON.stringify(data.slice(0, 5)));
}

window.bukaPeringkat = () => {
    playSFX(sfxClick);
    sedangKuis = true; // Pause player saat leaderboard buka
    
    const vicModal = document.getElementById('victory-modal');
    if (vicModal) vicModal.classList.add('hidden');

    const dataPre = JSON.parse(localStorage.getItem('hoax_ranks_pre')) || [];
    const dataPost = JSON.parse(localStorage.getItem('hoax_ranks_post')) || [];
    const list = document.getElementById('rank-list');
    
    const headerStyle = `text-align:center; color:#FFD700; font-family:sans-serif; margin: 15px 0 5px 0; font-size: 18px;`;
    const btnStyle = `padding:12px 20px; font-size:16px; cursor:pointer; color:white; border:none; border-radius:8px; font-weight:bold; width:180px; font-family:sans-serif;`;
    const avatarCropStyle = `width:32px; height:32px; object-fit:none; object-position: 50% 0%; scale:1.8;`;

    let html = `<div style="max-height: 400px; overflow-y: auto; padding: 10px;">`;
    
    // Section Post-Test
    html += `<h3 style="${headerStyle}">POST-TEST RANKINGS</h3>`;
    html += dataPost.map((x, i) => {
        let img = (x.avatar === 1) ? 'player cewe.png' : 'player cowo.png';
        return `<div class="rank-item" style="font-family:sans-serif; display:flex; align-items:center; background:rgba(255,255,255,0.1); margin:4px; padding:12px; border-radius:8px;">
            <span style="width:30px; font-weight:bold; color:#FFD700;">#${i+1}</span>
            <div style="width:32px; height:32px; overflow:hidden; border-radius:5px; background:rgba(255,255,255,0.2); margin-right:15px; display:flex; justify-content:center;">
                <img src="${img}" style="${avatarCropStyle}">
            </div>
            <span style="flex:1; color:white; font-weight:bold; text-align:left;">${x.name.toUpperCase()}</span>
            <span style="font-weight:bold; color:white;">⭐ ${x.score}</span>
        </div>`;
    }).join('') || `<p style="text-align:center; color:white;">No Post-Test Data</p>`;

    // Section Pre-Test
    html += `<h3 style="${headerStyle}">PRE-TEST RANKINGS</h3>`;
    html += dataPre.map((x, i) => {
        let img = (x.avatar === 1) ? 'player cewe.png' : 'player cowo.png';
        return `<div class="rank-item" style="font-family:sans-serif; display:flex; align-items:center; background:rgba(255,255,255,0.05); margin:4px; padding:12px; border-radius:8px; opacity: 0.9;">
            <span style="width:30px; font-weight:bold; color:#CCC;">#${i+1}</span>
            <div style="width:32px; height:32px; overflow:hidden; border-radius:5px; background:rgba(255,255,255,0.1); margin-right:15px; display:flex; justify-content:center;">
                <img src="${img}" style="${avatarCropStyle}">
            </div>
            <span style="flex:1; color:white; text-align:left;">${x.name.toUpperCase()}</span>
            <span style="font-weight:bold; color:white;">⭐ ${x.score}</span>
        </div>`;
    }).join('') || `<p style="text-align:center; color:white;">No Pre-Test Data</p>`;

    html += `</div>`;
    
    html += `
        <div style="display:flex; justify-content:center; gap:10px; margin-top:20px;">
            <button onclick="window.keLobby()" style="${btnStyle} background:#28a745;">BACK</button>
            <button onclick="window.tutupPeringkat()" style="${btnStyle} background:#dc3545;">CLOSE</button>
        </div>
    `;

    list.innerHTML = html;
    document.getElementById('leaderboard-modal').classList.remove('hidden');
};

window.bukaLiterasi = () => { playSFX(sfxClick); document.getElementById('literasi-modal').classList.remove('hidden'); };
window.tutupLiterasi = () => { document.getElementById('literasi-modal').classList.add('hidden'); };
window.showWiki = (id) => {
    playSFX(sfxClick);
    document.querySelectorAll('.wiki-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.wiki-menu-item').forEach(m => m.classList.remove('active'));
    const t = document.getElementById('content-'+id); if(t) t.classList.add('active');
    const m = document.getElementById('menu-'+id); if(m) m.classList.add('active');
};
window.pilihAvatar = (idx, el) => {
    playSFX(sfxClick); avatarIndex = idx;
    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
};
window.simpanProfil = () => {
    playSFX(sfxClick);
    const inputNama = document.getElementById('input-nama').value.trim();
    if(inputNama) { namaUser = inputNama; localStorage.setItem('hoax_name', namaUser); }
    localStorage.setItem('hoax_avatar', avatarIndex);
    if(playerText) playerText.setText(namaUser);
    if(player) player.setTexture('hero' + avatarIndex);
    if(socket) socket.emit('playerJoin', { nama: namaUser, avatar: avatarIndex, level: currentLevel });
    document.getElementById('profile-modal').classList.add('hidden');
};
window.bukaEditProfil = () => { playSFX(sfxClick); document.getElementById('profile-modal').classList.remove('hidden'); };
window.tutupEditProfil = () => { document.getElementById('profile-modal').classList.add('hidden'); };

// PERBAIKAN: Fungsi Tutup Peringkat (CLOSE)
window.tutupPeringkat = () => { 
    playSFX(sfxClick);
    document.getElementById('leaderboard-modal').classList.add('hidden'); 
    
    // Cek apakah game sudah selesai (Level 5 Post Test beres)
    if (currentLevel >= MAX_LEVEL && gamePhase === 'post-test' && gates.countActive() === 0) {
        document.getElementById('victory-modal').classList.remove('hidden'); // Kembali ke tampilan Thank You
    } else {
        sedangKuis = false; // Karakter bisa jalan lagi jika masih dalam permainan
    }
};

window.keLobby = () => { 
    playSFX(sfxClick);
    location.reload(); 
};

function setupJoystick() {
    const container = document.getElementById('joystick-container');
    if (container && typeof nipplejs !== 'undefined') {
        const manager = nipplejs.create({ zone: container, mode: 'static', position: { left: '75px', bottom: '75px' }, size: 100 });
        manager.on('move', (e, data) => { joystickData = data; });
        manager.on('end', () => { joystickData = null; });
    }
}

const config = {
    type: Phaser.AUTO, parent: 'game-container',
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade' }, scene: MainScene
};
const game = new Phaser.Game(config);

const levelData = {
    1: { map: [[0,0,1,1,1,1,1,1,1,1,1],[0,0,0,0,1,2,0,0,1,2,1],[0,0,1,0,1,0,1,0,1,0,1],[0,0,1,2,0,2,1,2,0,0,1],[0,0,1,1,1,1,1,1,1,1,1]] },
    2: { map: [[0,0,1,1,1,1,1,1,1,1,1],[0,0,0,2,0,0,1,0,0,2,1],[0,0,1,1,1,0,1,0,1,1,1],[0,0,1,2,0,0,2,0,0,2,1],[0,0,1,1,1,1,1,1,1,1,1]] },
    3: { map: [[0,0,1,1,1,1,1,1,1,1,1],[0,0,0,0,2,0,1,2,0,0,1],[0,0,1,0,1,2,1,1,1,0,1],[0,0,1,2,1,0,0,0,2,0,1],[0,0,1,1,1,1,1,1,1,1,1]] },
    4: { map: [[0,0,1,1,1,1,1,1,1,1,1,1,1],[0,0,0,0,1,2,0,0,1,0,2,0,1],[0,0,1,0,1,1,1,0,1,0,1,0,1],[0,0,1,2,0,2,0,0,2,0,0,0,1],[0,0,1,1,1,1,1,1,1,1,1,1,1]] },
    5: { map: [[0,0,1,1,1,1,1,1,1,1,1,1,1],[0,0,0,2,1,0,0,0,0,0,1,2,1],[0,0,1,0,1,0,1,1,1,0,1,0,1],[0,0,1,2,0,0,0,0,2,0,0,2,1],[0,0,1,1,1,1,1,1,1,1,1,1,1]] }
};