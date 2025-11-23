    import mapManager from "./MapManager.js";
    import eventsManager from "./EventsManager.js";
    import soundManager from "./SoundManager.js";
    import gameManager from "./GameManager.js";

    class PhysicManager {
        move(obj) {
            // Если нет движения, просто выходим
            if (obj.move_x === 0 && obj.move_y === 0) return "stop";
        
            const col = obj.collider ?? {
                offsetX: 0, offsetY: 0,
                width: obj.size_x, height: obj.size_y
            };
            
            // Рассчитываем новые координаты на основе движения
            let newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
            let newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);
        
            // точки проверки по X (ведущая грань)
            let checkX, checkYforX;
            if (obj.move_x > 0) { 
                // вправо -> правый край
                checkX = newX + col.offsetX + col.width;
            } else {             
                // влево -> левый край
                checkX = newX + col.offsetX;
            }
            checkYforX = obj.pos_y + col.offsetY + col.height / 2;
        
            // точки проверки по Y (ведущая грань)
            let checkY, checkXforY;
            if (obj.move_y > 0) { 
                // вниз -> нижний край
                checkY = newY + col.offsetY + col.height;
            } else {             
                // вверх -> верхний край
                checkY = newY + col.offsetY;
            }
            checkXforY = obj.pos_x + col.offsetX + col.width / 2;
        
            let tsX = mapManager.getAvailableInfo(checkX, checkYforX);
            let tsY = mapManager.getAvailableInfo(checkXforY, checkY);
            
            // Если столкновение по оси X, блокируем движение по X, но сохраняем движение по Y
            if (tsX !== 0) obj.move_x = 0;
            // Если столкновение по оси Y, блокируем движение по Y, но сохраняем движение по X
            if (tsY !== 0) obj.move_y = 0;
        
            if (obj.move_x !== 0 || obj.move_y !== 0) return "move";
            return "break";
        }
        
        playerDirection(player, enemies) {
            if (eventsManager.action["up"]) {
                player.move_y = -1;
            }
            if (eventsManager.action["down"]) {
                player.move_y = 1;
            }
            if (eventsManager.action["left"]) {
                player.move_x = -1;
            }
            if (eventsManager.action["right"]) {
                player.move_x = 1;
            }

            if (eventsManager.action['attack'] && player.canAttack()) {
                physicManager.attackDamage(player, enemies);
                soundManager.play('../sounds/attack.wav');
                eventsManager.action['attack'] = false;
            }
            
        }
        
        areaDamage(player, enemies, radius) {
            enemies.forEach(enemy => {
                const dx = player.pos_x - enemy.pos_x;
                const dy = player.pos_y - enemy.pos_y;
                const distance = Math.sqrt(dx * dx + dy * dy);
        
                if (distance <= radius) {
                    // Вызов метода получения урона
                    if (enemy.takeDamage) {
                        enemy.takeDamage(); // Наносим 1 единицу урона
                        console.log('Enemy damaged!');
                        soundManager.play('../sounds/enemy_hit.wav')
                    }
                }
            });
        }

        attackDamage(player, enemies) {
            const a = player.getAttackRect();
          
            enemies.forEach(enemy => {
              if (!enemy.takeDamage) return;
          
              const e = {
                x: enemy.pos_x,
                y: enemy.pos_y,
                w: enemy.size_x,
                h: enemy.size_y
              };
          
              // AABB пересечение прямоугольников
              const hit =
                a.x < e.x + e.w &&
                a.x + a.w > e.x &&
                a.y < e.y + e.h &&
                a.y + a.h > e.y;
          
              if (hit) {
                enemy.takeDamage();
                soundManager.play('../sounds/enemy_hit.wav');
              }
            });
          }
          

        enemyDirection(player, entity) {
            const dx = player.pos_x - entity.pos_x;
            const dy = player.pos_y - entity.pos_y;
            const distance = Math.sqrt(dx*dx + dy*dy);
        
            // 1) если уже достаточно близко — останавливаемся
            if (distance <= entity.stopDistance) {
                entity.move_x = 0;
                entity.move_y = 0;
        
                // чтобы враг "смотрел" на игрока и не дёргался
                if (Math.abs(dx) > Math.abs(dy)) {
                    entity.direction = dx > 0 ? 192 : 128; // right/left
                } else {
                    entity.direction = dy > 0 ? 0 : 64;    // down/up
                }
                return;
            }
        
            // 2) если далеко — обычное преследование
            if (Math.abs(dx) > Math.abs(dy)) {
                entity.move_x = dx > 0 ? 1 : -1;
                entity.move_y = 0;
            } else {
                entity.move_y = dy > 0 ? 1 : -1;
                entity.move_x = 0;
            }

            const col = entity.collider ?? {
                offsetX: 0, offsetY: 0,
                width: entity.size_x, height: entity.size_y
            };
        
            // 3) небольшая проверка на стенку (чтобы не упирался и не дрожал)
            const newX = entity.pos_x + Math.floor(entity.move_x * entity.speed);
            const newY = entity.pos_y + Math.floor(entity.move_y * entity.speed);

            const cxNewX = newX + col.offsetX + col.width / 2;
            const cyNewX = entity.pos_y + col.offsetY + col.height / 2;
        
            const cxNewY = entity.pos_x + col.offsetX + col.width / 2;
            const cyNewY = newY + col.offsetY + col.height / 2;
        
            let tsX = mapManager.getAvailableInfo(cxNewX, cyNewX);
            let tsY = mapManager.getAvailableInfo(cxNewY, cyNewY);
        
            if (tsX !== 0) entity.move_x = 0;
            if (tsY !== 0) entity.move_y = 0;
        }
        

        moveRandomly(entity) {
            // Проверяем, движется ли враг и не заблокировано ли движение
            if (entity.move_x === 0 && entity.move_y === 0) {
                // Если враг остановился, задаем новое случайное направление
                const randomDirection = Math.floor(Math.random() * 4);
                switch (randomDirection) {
                    case 0: // Двигаться вверх
                        entity.move_x = 0;
                        entity.move_y = -1;
                        break;
                    case 1: // Двигаться вниз
                        entity.move_x = 0;
                        entity.move_y = 1;
                        break;
                    case 2: // Двигаться влево
                        entity.move_x = -1;
                        entity.move_y = 0;
                        break;
                    case 3: // Двигаться вправо
                        entity.move_x = 1;
                        entity.move_y = 0;
                        break;
                }
            }
        
            // Проверяем, не столкнулся ли враг со стеной
            const result = this.move(entity);
            if (result === "break") {
                // Если столкнулся со стеной, останавливаем и сбрасываем направление
                entity.move_x = 0;
                entity.move_y = 0;
            }
        }
        
        
        clearDirection(obj) {
            obj.move_x = 0;
            obj.move_y = 0;
        }

        inActiveSpace(player, entity) {
            if (
                ((player.pos_x - entity.pos_x) > -100 &&
                    (player.pos_x - entity.pos_x) < 140)
                &&
                ((player.pos_y - entity.pos_y) < 100 &&
                    -140 < (player.pos_y - entity.pos_y))
            ) {
                return 1
            }
            return 0
        }

        getDamage(player, entity) {
            if (
                ((player.pos_x - entity.pos_x) > -40 &&
                    (player.pos_x - entity.pos_x) < 30) &&
                ((player.pos_y - entity.pos_y) < 30 &&
                    -40 < (player.pos_y - entity.pos_y))
            ) {
                let cur_date = new Date().getTime();
                
                let damageTimeout = gameManager.level === 2 ? 1000 : 2000;
                
                if (player && player.life && cur_date - player.timeOut > damageTimeout) {
                    soundManager.play('../sounds/player_hit.wav');
                    player.life -= 1;
                    player.timeOut = cur_date;
                    console.log('current hp: ', player.life);
                }
                return player.life;
            }
            return true;
        }

        getCoin(obj) {
            if (obj && obj.life) {
                soundManager.play('../sounds/get_coin.wav')
                if (gameManager.level === 2) {
                    obj.speed += 1
                    obj.score += 100
                } else {
                    //gameManager.player.addScore(50);
                    obj.speed += 1
                    obj.score += 100
                    //obj.attackCooldown -= 50
                }
            }
            console.log("COIN BONUS: current speed:", obj.speed)
        }

        getHeart(obj) {
            if (!obj) return;
        
            soundManager.play('../sounds/heart.wav');
            obj.life += 1;
            console.log("HEART BONUS: current hp:", obj.life)

            if (obj.life <= 0) {
                gameManager.endGame("Lose");
                return;
            }
        }
        

        openDoor(obj) {
            if (!obj || obj.name !== "Door") return;
            obj.open();
            soundManager.play('../sounds/minecraft_door_open.wav');
            console.log("Door opened");
        }           

        isClose(player, entity) {
            if (
                ((player.pos_x - entity.pos_x) > -50 &&
                    (player.pos_x - entity.pos_x) < 10)
                &&
                ((player.pos_y - entity.pos_y) < 20 &&
                    -50 < (player.pos_y - entity.pos_y))
            ) {
                return 1
            }
            return 0
        }

        drawAggroZone(ctx, entity) {
            
            const left   = entity.pos_x - 100;
            const right  = entity.pos_x + 140;
            const top    = entity.pos_y - 100;
            const bottom = entity.pos_y + 140;
        
            const width  = right - left;
            const height = bottom - top;
        
            ctx.save();
            ctx.strokeStyle = "rgba(255,0,0,0.6)";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                left - mapManager.view.x,
                top - mapManager.view.y,
                width,
                height
            );
        
            ctx.restore();
        }
        

    }

    const physicManager = new PhysicManager();
    export default physicManager;