import spriteManager from "./SpritesManager.js";
import gameManager from './GameManager.js';
import mapManager from "./MapManager.js";


class Entity {
    constructor() {
        console.log('entity')
        this.pos_x = 0;
        this.pos_y = 0;
        this.size_x = 0;
        this.size_y = 0;
        this.visible = true
        // collider — область, которая сталкивается со стенами
        this.collider = {
            offsetX: 20,  // сдвиг вправо внутри спрайта
            offsetY: 32,  // сдвиг вниз (только нижняя половина)
            width: 20,    // уже чем спрайт
            height: 20    // только “ноги”
        };
  
    }

    extend(extendProto) {
        const object = Object.create(this);
        for (const property in extendProto) {
            if (this.hasOwnProperty(property) || typeof object[property] === 'undefined') {
                object[property] = extendProto[property];
            }
        }
        return object;
    }
}

export class Player extends Entity {
    constructor() {
        super();
        console.log('player')
        this.life = 5;
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 10;
        this.key = false;
        this.score = 0;
        this.timeOut = new Date().getTime();
        this.direction = 0;
        this.lastAttackTime = 0;
        this.attackCooldown = 1500; // Задержка между атаками в миллисекундах
        this.nickname = localStorage["maze.lastPlayer"];
        this.isAttacking = false; // Флаг атаки

        // размер хитбокса удара 
        this.attackBox = { w: 64, h: 20, offset: -32 };
        // сколько длится активная фаза удара (мс)
        this.attackActiveTime = 250;
    }

    move() {
        this.pos_x = this.pos_x + Math.floor(this.move_x * this.speed);
        this.pos_y = this.pos_y + Math.floor(this.move_y * this.speed);
    }

    canAttack() {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.lastAttackTime = currentTime;
            this.isAttacking = true;
            // атака активна только часть времени
            setTimeout(() => (this.isAttacking = false), this.attackActiveTime);   
            return true;
        }
        return false;
    }

    getAttackRect() {
        const W = this.attackBox.w;   // 3 клетки (ширина для up/down)
        const H = this.attackBox.h;   // 1 клетка (высота для up/down)
        const off = this.attackBox.offset;
    
        let x, y, w, h;
    
        // ВНИЗ — горизонтально
        if (this.direction === 0) {
            w = W; h = H;
            x = this.pos_x + this.size_x / 2 - w / 2;
            y = this.pos_y + this.size_y + off;
        }
    
        // ВВЕРХ — горизонтально
        else if (this.direction === 64) {
            w = W; h = H;
            x = this.pos_x + this.size_x / 2 - w / 2;
            y = this.pos_y - h - off;
        }
    
        // ВЛЕВО — вертикально 
        else if (this.direction === 128) {
            w = H; h = W;   
            x = this.pos_x - w - off;
            y = this.pos_y + this.size_y / 2 - h / 2;
        }
    
        // ВПРАВО — вертикально
        else if (this.direction === 192) {
            w = H; h = W;   
            x = this.pos_x + this.size_x + off;
            y = this.pos_y + this.size_y / 2 - h / 2;
        }
    
        else {
            w = W; h = H;
            x = this.pos_x; y = this.pos_y;
        }
    
        return { x, y, w, h };
    }
    
    

    addScore(amount) {
        this.score += amount;
    }

    draw(ctx, spriteCount) {
    
        if (this.isAttacking) {
            
            const attackFrames = 8; 
            const frame = spriteCount % attackFrames;

            const a = this.getAttackRect();
            // ctx.save();
            // ctx.strokeStyle = "lime";
            // ctx.lineWidth = 2;
            // ctx.strokeRect(
            // a.x - mapManager.view.x,
            // a.y - mapManager.view.y,
            // a.w, a.h
            // );
            // ctx.restore();

    
            let dirIndex = 0;
            if (this.direction === 0) dirIndex = 0;       // down
            else if (this.direction === 64) dirIndex = 1; // up
            else if (this.direction === 128) dirIndex = 2;// left
            else if (this.direction === 192) dirIndex = 3;// right
    
            const attackStartY = 0;                         // первая строка атаки вниз
            const attackY = attackStartY + dirIndex * 64;   // нужная строка атаки
            const attackX = frame * 64;                     // кадр атаки по X
    
            spriteManager.drawSprite(ctx, 'PlayerAttack', this.pos_x, this.pos_y, attackX, attackY);
            return;
        }
    
        // Ходьба
        if (this.move_x === 1) {
            spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 64 * spriteCount, 192);
            this.direction = 192;
            return;
        }
        if (this.move_x === -1) {
            spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 64 * spriteCount, 128);
            this.direction = 128;
            return;
        }
        if (this.move_y === -1) {
            spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 64 * spriteCount, 64);
            this.direction = 64;
            return;
        }
        if (this.move_y === 1) {
            spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 64 * spriteCount, 0);
            this.direction = 0;
            return;
        }
    
        // стоим
        spriteManager.drawSprite(ctx, 'Player', this.pos_x, this.pos_y, 0, this.direction);
    }
    
}

export class Enemy extends Entity {
    constructor() {
        super();
        this.move_x = 0;
        this.move_y = 0;
        this.speed = 5;
        this.stopDistance = 30;


        if (gameManager.level === 2) {
            this.life = 3;
            this.speed = 5;
        } else {
            this.life = 2;
            this.speed = 5;
        }
    }

    move() {
        this.pos_x = this.pos_x + Math.floor(this.move_x * this.speed);
        this.pos_y = this.pos_y + Math.floor(this.move_y * this.speed);
    }

    takeDamage() {
        this.life -= 1;
        if (this.life <= 0) {
            gameManager.kill(this);
            if (gameManager.level === 2) {
                gameManager.player.addScore(200);
            } else {
                gameManager.player.addScore(100);
            }
        }
    }

    isAlive() {
        return this.health > 0;
    }

    draw(ctx, spriteCount) {
        if (this.move_x === 1) {
            spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 64 *  spriteCount, 192);
            this.direction = 192;
            return;
        }
        if (this.move_x === -1) {
            spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 64 *  spriteCount, 128);
            this.direction = 128;
            return;
        }
        if (this.move_y === -1) {
            spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 64 *  spriteCount, 64);
            this.direction = 64;
            return;
        }
        if (this.move_y === 1) {
            spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 64 *  spriteCount, 0);
            this.direction = 0;
            return;
        }
        spriteManager.drawSprite(ctx, 'Enemy', this.pos_x, this.pos_y, 0, this.direction);
    }
}

export class Coin extends Entity {
    constructor() {
        super();
        this.frameWidth = 32;
        this.framesCount = 4;

        this.tick = 0;          // счётчик кадров
        this.animationSpeed = 2; // чем больше — тем медленнее анимация
    }

    draw(ctx) {
        this.tick++;

        const frameIndex = Math.floor(this.tick / this.animationSpeed) % this.framesCount;

        const offsetX = frameIndex * this.frameWidth;

        spriteManager.drawSprite(ctx, 'Coin', this.pos_x, this.pos_y, offsetX, 0);
    }
}


export class Key extends Entity {
    constructor() {
        super();
        this.frameWidth = 32;   // ширина одного кадра
        this.framesCount = 8;   // всего 8 спрайтов (кадров анимации)
    }

    draw(ctx, spriteCount) {
        // вычисляем индекс кадра (по циклу)
        const frameIndex = spriteCount % this.framesCount;
        const offsetX = frameIndex * this.frameWidth;

        spriteManager.drawSprite(ctx, 'Key', this.pos_x, this.pos_y, offsetX, 0);
    }
}

export class Heart extends Entity {
    constructor() {
        super();
        this.frameWidth = 32;   // ширина одного кадра (как у тайла)
        this.frameHeight = 32;  // высота одного кадра
        this.framesCount = 2;   // два кадра по вертикали
    }

    draw(ctx, spriteCount) {
        const frameIndex = spriteCount % this.framesCount;

        const offsetX = 0;                            // кадры идут вертикально
        const offsetY = frameIndex * this.frameHeight; // переключаемся между 0 и 32

        spriteManager.drawSprite(ctx, 'Heart', this.pos_x, this.pos_y, offsetX, offsetY);
    }
}

export class Portal extends Entity {
    constructor() {
        super();
        this.state = "closed"; // "closed" | "opening" | "active"
        
        // для анимации открытия
        this.openFrames = 6;       // сколько кадров у анимации открытия
        this.openFrameW = 64;      // ширина кадра 
        this.openFrameH = 64;      // высота кадра 
        this.openFrame = 0;

        // для вечной анимации
        this.activeFrames = 8;     // сколько кадров “крутилки”
        this.activeFrame = 0;
        this.activeSpeed = 0.25;   // скорость анимации
    }

    startOpening() {
        if (this.state === "closed") {
            this.state = "opening";
            this.openFrame = 0;
        }
    }

    update() {
        if (this.state === "opening") {
            this.openFrame++;
            if (this.openFrame >= this.openFrames) {
                this.state = "active";
                this.openFrame = this.openFrames - 1;
            }
        }

        if (this.state === "active") {
            this.activeFrame = (this.activeFrame + this.activeSpeed) % this.activeFrames;
        }
    }

    draw(ctx, spriteCount) {
        this.update();

        if (this.state === "closed") {
            spriteManager.drawSprite(ctx, "PortalClosed", this.pos_x, this.pos_y);
            return;
        }

        if (this.state === "opening") {
            const frame = this.openFrame;
            const ox = frame * this.openFrameW;
            const oy = 0;
            spriteManager.drawSprite(ctx, "PortalOpen", this.pos_x, this.pos_y, ox, oy);
            return;
        }

        if (this.state === "active") {
            const frame = Math.floor(this.activeFrame);
            const ox = frame * this.openFrameW;
            const oy = 0;
            spriteManager.drawSprite(ctx, "PortalActive", this.pos_x, this.pos_y, ox, oy);
        }
    }
}

export class Door extends Entity {
    constructor() {
        super();
        this.isOpen = false; // false — закрыта, true — открыта
    }

    open() {
        this.isOpen = true;
    }

    close() {
        this.isOpen = false;
    }

    toggle() {
        this.isOpen = !this.isOpen;
    }

    draw(ctx) {
        if (this.isOpen) {
            spriteManager.drawSprite(ctx, "DoorOpen", this.pos_x, this.pos_y);
        } else {
            spriteManager.drawSprite(ctx, "DoorClosed", this.pos_x, this.pos_y);
        }
    }
}
