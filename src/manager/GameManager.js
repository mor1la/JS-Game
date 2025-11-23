import mapManager from "./MapManager.js";
import spriteManager from "./SpritesManager.js";
import eventsManager from "./EventsManager.js";
import {Player, Coin, Key, Enemy, Door, Heart, Portal} from "./Entities.js";
import physicManager from "./PhysicManager.js";
import soundManager from "./SoundManager.js";


const canvas = document.getElementById("canvasId");
const ctx = canvas.getContext("2d");

const canvasStats = document.getElementById("canvasStats")
const ctxStats = canvasStats.getContext("2d")

ctx.textAlign = "center"
ctxStats.textAlign = "center"
ctxStats.fillStyle = "rgb(44, 117, 44)"
const x = canvasStats.width / 2

class GameManager {
    constructor() {
        console.log('game')
        this.factory = {};
        this.level = parseInt(localStorage["maze.level"]);
        this.entities = [];
        this.player = null;
        this.spriteCount = 0
        this.attackRadius = 50;
        this.attackCooldown = false;

        if (!localStorage["maze.storage"]){
            localStorage["maze.storage"] = "[]"
        }
    }

    initPlayer(obj) {
        if (this.player !== null){
            let score = this.player.score
            let life = this.player.life
            let speed = this.player.speed
            let attackCooldown = this.player.attackCooldown
            this.player = obj
            this.player.score = score
            this.player.life = life
            this.player.speed = speed
            this.player.attackCooldown = attackCooldown
        }
        else{
            this.player = obj;
        }
    }

    kill(obj) {
        for (const [index, entity] of this.entities.entries()) {
            if (obj === entity) {
                this.entities.splice(index, 1)
                break
            }
        }
    }

    draw() {
        for (let i = 0; i < this.entities.length; i++) {
            const ent = this.entities[i];
            ent.draw(ctx, this.spriteCount);
            
            // Для проверки зоны агрессивности 
            // if (ent.name === "Enemy") {
            //     physicManager.drawAggroZone(ctx, ent);
            // }
        }
        this.drawStats();
    }
    
    drawStats() {
        if (!this.player) return;
    
        const w = 300;
        const h = 500;
    
        ctxStats.clearRect(0, 0, w, h);
    
        const x = 35; 
        let y = 20;
    
        ctxStats.fillStyle = "#c9c16a";
        ctxStats.textAlign = "left";
        ctxStats.textBaseline = "top";
    
        // --- LEVEL ---
        ctxStats.fillText(`LEVEL: ${this.level}`, x, y);
        y += 70;
    
        // --- PLAYER STATS ---
        ctxStats.fillText(`NAME:  ${this.player.nickname}`, x, y); y += 40;
        ctxStats.fillText(`SCORE: ${this.player.score}`, x, y);    y += 40;
        ctxStats.fillText(`LIFE:  ${this.player.life}`, x, y);     y += 70;
    
        // --- CONTROLS ---
        ctxStats.font = "bold 22px GoldmanB";
        ctxStats.fillText("CONTROLS:", x, y); y += 40;
    
        ctxStats.fillText("Up / Down:     W / S", x, y); y += 30;
        ctxStats.fillText("Left / Right:  A / D", x, y); y += 30;
        ctxStats.fillText("Attack:        SPACE", x, y);
    }
    
    

    save() {
        const data = localStorage["maze.storage"]
        const jsonData = JSON.parse(data);
        let user = null

        if (jsonData !== []) {
            user = jsonData.find(user => user.name === this.player.nickname)
        }

        if (user){
            if (user.score < this.player.score){
                user.score = this.player.score
                localStorage["maze.storage"] = JSON.stringify(jsonData)
            }
        }
        else {
            jsonData.push({
                name: this.player.nickname,
                score: this.player.score
            })
            localStorage["maze.storage"] = JSON.stringify(jsonData)
        }

    }

    getSortRecords() {
        const data = localStorage["maze.storage"]
        const jsonData = JSON.parse(data);

        if (jsonData) {
            jsonData.sort((user1, user2) => user1.score > user2.score ? -1 : 1)
        }

        return jsonData
    }

    winGame() {
        soundManager.play("../sounds/win.wav");
    
        const w = canvas.width;
        const h = canvas.height;
    
        ctx.save();
    
        // затемнение
        ctx.fillStyle = "rgba(5,5,5,0.85)";
        ctx.fillRect(0, 0, w, h);
    
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
    
        let y = 70;
    
        // --- YOU WIN ---
        ctx.fillStyle = "#c9c16a"; // золотой
        ctx.font = "bold 64px 'Times New Roman', serif";
        ctx.fillText("YOU WIN!", w / 2, y);
        y += 90;
    
        // декоративная линия
        ctx.strokeStyle = "#2a2a2a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 160, y);
        ctx.lineTo(w / 2 + 160, y);
        ctx.stroke();
        y += 35;
    
        // --- RECORDS TITLE ---
        ctx.fillStyle = "#e6e6e6";
        ctx.font = "bold 34px 'Times New Roman', serif";
        ctx.fillText("RECORDS:", w / 2, y);
        y += 60;
    
        const records = this.getSortRecords();
        const top = records.slice(0, 5);
    
        // --- RECORDS LIST ---
        ctx.textAlign = "left";
        ctx.fillStyle = "#c9c16a"; // золотой текст
        ctx.font = "bold 28px 'Times New Roman', serif";
    
        const left = Math.max(80, w * 0.25);
    
        for (let i = 0; i < top.length; i++) {
            const r = top[i];
            ctx.fillText(`${i + 1}. ${r.name}  —  ${r.score}`, left, y + i * 45);
        }
    
        ctx.restore();
    }
    

    loseGame() {
        soundManager.play("../sounds/lose.wav");
    
        const w = canvas.width;
        const h = canvas.height;
    
        ctx.save();
    
        // затемнение
        ctx.fillStyle = "rgba(5,5,5,0.85)";
        ctx.fillRect(0, 0, w, h);
    
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
    
        let y = 70;
    
        // --- YOU LOSE ---
        ctx.fillStyle = "#7a2b2b"; // кровавый красный
        ctx.font = "bold 64px 'Times New Roman', serif";
        ctx.fillText("YOU LOSE!", w / 2, y);
        y += 90;
    
        // декоративная линия
        ctx.strokeStyle = "#2a2a2a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(w / 2 - 160, y);
        ctx.lineTo(w / 2 + 160, y);
        ctx.stroke();
        y += 35;
    
        // --- RECORDS TITLE ---
        ctx.fillStyle = "#e6e6e6";
        ctx.font = "bold 34px 'Times New Roman', serif";
        ctx.fillText("RECORDS:", w / 2, y);
        y += 60;
    
        const records = this.getSortRecords();
        const top = records.slice(0, 5);
    
        // список
        ctx.textAlign = "left";
        ctx.fillStyle = "#c9c16a"; // старое золото
        ctx.font = "bold 28px 'Times New Roman', serif";
    
        const left = Math.max(80, w * 0.25);
    
        for (let i = 0; i < top.length; i++) {
            const r = top[i];
            ctx.fillText(`${i + 1}. ${r.name}  —  ${r.score}`, left, y + i * 45);
        }
    
        ctx.restore();
    }
    
    

    endGame(str) {
        clearInterval(this.interval)
        const result = str

        this.save()

        if (result === 'Win'){
            if (this.level === 2){
                this.winGame()
            }
            if (this.level === 1){
                this.level = 2
                localStorage["maze.level"] = 2
                this.entities = []
                this.loadAll()
                // this.winGame()
            }
        }
        if (result === 'Lose'){
            this.loseGame()
        }
    }

    checkObjects() {
        for (const entity of this.entities) {
    
            // --- Подбор предметов ---
            if (entity.name === 'Coin' || entity.name === 'Key' || entity.name === 'Heart') {
    
                if (physicManager.isClose(this.player, entity)) {
    
                    if (entity.name === 'Coin') {
                        physicManager.getCoin(this.player);
                    }
    
                    if (entity.name === 'Heart') {
                        physicManager.getHeart(this.player);
                    }
    
                    if (entity.name === 'Key') {
                        soundManager.play('../sounds/key.wav');
                        this.player.key = true;
    
                        if (this.level === 1) {
                            // 1 уровень: открываем портал
                            for (const e of this.entities) {
                                if (e.name === "Portal" && e.startOpening) {
                                    e.startOpening();
                                }
                            }
                        }
    
                        if (this.level === 2) {
                            // 2 уровень: открываем дверь
                            for (const e of this.entities) {
                                if (e.name === "Door") {
                                    physicManager.openDoor(e);
                                }
                            }
                        }
                    }
    
                    this.kill(entity);
                }
            }
    
            // --- Победа через портал (только 1 уровень) ---
            if (this.level === 1 && entity.name === 'Portal' && this.player.key) {
                if (physicManager.isClose(this.player, entity)) {
                    console.log("PORTAL");
                    soundManager.play('../sounds/level_up.wav');
                    this.endGame('Win');
                    return "Exit";
                }
            }
    
            // --- Победа через дверь (только 2 уровень) ---
            if (this.level === 2 && entity.name === 'Door') {
                if (entity.isOpen && physicManager.isClose(this.player, entity)) {
                    console.log("DOOR EXIT");
                    this.endGame('Win');
                    return "Exit";
                }
            }
        }
    }
    

    checkEnemies() {
        const now = Date.now(); // Текущее время
    
        for (const entity of this.entities) {
            if (entity.name === 'Enemy') {
                // Если враг видит игрока, двигаемся к нему
                if (physicManager.inActiveSpace(this.player, entity)) {
                    physicManager.clearDirection(entity);
                    physicManager.enemyDirection(this.player, entity); // Двигаемся к игроку
                    
                    const isLive = physicManager.getDamage(this.player, entity);
                    if (!isLive) {
                        this.endGame('Lose');
                        return "Dead";
                    }
    
                    if (physicManager.move(entity) === 'move') {
                        entity.move();
                    }
                    continue; // Пропускаем случайное движение, если враг преследует игрока
                }
    
                // Если игрок далеко, переключаемся на случайное движение
                if (!entity.nextMoveTime || now > entity.nextMoveTime) {
                    entity.nextMoveTime = now + 2000; // Таймер для смены направления
    
                    // Выбираем случайное направление
                    const randomDirection = Math.floor(Math.random() * 4);
                    switch (randomDirection) {
                        case 0:
                            entity.move_x = 0;
                            entity.move_y = -1; // Вверх
                            break;
                        case 1:
                            entity.move_x = 0;
                            entity.move_y = 1; // Вниз
                            break;
                        case 2:
                            entity.move_x = -1;
                            entity.move_y = 0; // Влево
                            break;
                        case 3:
                            entity.move_x = 1;
                            entity.move_y = 0; // Вправо
                            break;
                    }
                }
    
                // Проверяем движение и столкновения
                const result = physicManager.move(entity);
                if (result === "break") {
                    // Если враг столкнулся со стеной, меняем направление немедленно
                    entity.nextMoveTime = 0; // Принудительная смена направления
                    entity.move_x = 0;
                    entity.move_y = 0;
                } else if (result === "move") {
                    entity.move(); // Обновляем позицию врага
                }
            }
        }
    }
    
    

    update() {
        if (this.player === null)
            return;

        this.spriteCount = (this.spriteCount + 1) % 6

        physicManager.clearDirection(this.player)
        physicManager.playerDirection(this.player, this.entities)

        if (this.checkEnemies() === "Dead"){
            this.drawStats()
            return;
        }

        if (this.player.move_x || this.player.move_y) {

            if (this.checkObjects() === "Exit"){
                this.drawStats()
                return;
            }

            if (physicManager.move(this.player) === 'move') {
                this.player.move()
            }
        }
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        mapManager.draw(ctx);
        this.draw();
    }

    loadAll() {
        mapManager.loadMap();
        spriteManager.loadAtlas('/src/sprites/sprites.json', '/src/sprites/spritesheet.png');
        this.factory["Player"] = Player;
        this.factory["Coin"] = Coin;
        this.factory["Key"] = Key;
        this.factory["Heart"] = Heart;
        this.factory["Portal"] = Portal;
        this.factory["Door"] = Door;
        this.factory["Enemy"] = Enemy;

        mapManager.parseEntities();
        mapManager.draw();

        eventsManager.setup(canvas);

        soundManager.init();
        soundManager.loadArray(soundManager.sounds);
        this.play();
    }


    play() {
        this.interval = setInterval(updateWorld, 100);
    }
}

function updateWorld() {
    gameManager.update();
}

function clearRecords() {
    localStorage["maze.storage"] = JSON.stringify([]);
    console.log("Records table cleared.");
}

const gameManager = new GameManager();
export default gameManager;

gameManager.loadAll();
