import gameManager from "./GameManager.js";

class MapManager {
    constructor(props) {
        console.log('map')
        this.canvas = document.getElementById("canvasId");
        this.ctx = this.canvas.getContext("2d");
        this.mapData = null;
        this.available = null;
        this.tLayer = null;
        this.xCount = 0;
        this.yCount = 0;
        this.tSize = {x: 64, y: 64};
        this.mapSize = {x: 1920, y: 1920};
        this.tilesets = [];
        this.imgLoadCount = 0;
        this.imgLoaded = false;
        this.jsonLoaded = false;
        this.view = {x: 0, y: 0, w: this.canvas.width, h: this.canvas.height};
        this.path = {
            1 : "/src/maps/map1.json",
            2 : "/src/maps/map2.json"
        }
    }

    loadMap() {
        console.log("MAP LOADED")
        this.jsonLoaded = false
        this.imgLoaded = false
        this.imgLoadCount = 0
        const path = this.path[gameManager.level]
        const request = new XMLHttpRequest();
        request.onreadystatechange = () => {
            if (request.readyState === 4 && request.status === 200) {
                console.log(request.responseText);
                this.parseMap(request.responseText);
            }
        };
        request.open("GET", path, true);
        request.send();
    }

    parseMap(tilesJSON) {
        console.log("MAP PARSED")
        this.mapData = JSON.parse(tilesJSON);
        this.available = this.mapData.layers[0].data
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize.x = this.mapData.tilewidth;
        this.tSize.y = this.mapData.tileheight;
        this.mapSize.x = this.xCount * this.tSize.x;
        this.mapSize.y = this.yCount * this.tSize.y;

        for (let i = 0; i < this.mapData.tilesets.length; i++) {
            const img = new Image();
            img.onload = () => {
                this.imgLoadCount++;
                if (this.imgLoadCount === this.mapData.tilesets.length) {
                    this.imgLoaded = true;
                }
            };
            img.onerror = (error) => {
                console.error('Image load error:', error);
            };
            img.src = "maps/" + this.mapData.tilesets[i].image;
            const t = this.mapData.tilesets[i];
            const ts = {
                firstgid: t.firstgid,
                image: img,
                name: t.name,
                xCount: Math.floor(t.imagewidth / this.tSize.x),
                yCount: Math.floor(t.imageheight / this.tSize.y)
            };
            this.tilesets.push(ts);
        }
        this.jsonLoaded = true;
    }

    draw() {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => this.draw(), 100);
        } else {
            for (let id = 0; id < this.mapData.layers.length; id++) {
                const layer = this.mapData.layers[id];
                if (layer.type === "tilelayer") {
                    this.tLayer = layer;
                    this.drawLayer();
                } else
                    break;
            }
            gameManager.draw(this.ctx);
        }
    }

    drawLayer() {
        for (let i = 0; i < this.tLayer.data.length; i++) {
            if (this.tLayer.data[i] !== 0) {
                const tile = this.getTile(this.tLayer.data[i]);
                let pX = (i % this.xCount) * this.tSize.x;
                let pY = Math.floor(i / this.xCount) * this.tSize.y;

                if (!this.isVisible(pX, pY, this.tSize.x, this.tSize.y)) {
                    continue;
                }

                pX -= this.view.x;
                pY -= this.view.y;

                this.ctx.drawImage(
                    tile.img,
                    tile.px,
                    tile.py,
                    this.tSize.x,
                    this.tSize.y,
                    pX,
                    pY,
                    this.tSize.x,
                    this.tSize.y
                );
            }
        }
    }

    isVisible(x, y, width, height) {
        return !(x + width < this.view.x ||
            y + height < this.view.y ||
            x > this.view.x + this.view.w ||
            y > this.view.y + this.view.h);

    }


    getTile(tileIndex) {
        const tile = {
            img: null,
            px: 0,
            py: 0
        };
        const tileset = this.getTileset(tileIndex);
        tile.img = tileset.image;
        const id = tileIndex - tileset.firstgid;
        const x = id % tileset.xCount;
        const y = Math.floor(id / tileset.xCount);
        tile.px = x * this.tSize.x;
        tile.py = y * this.tSize.y;
        return tile;
    }

    getTileset(tileIndex) {
        for (let i = this.tilesets.length - 1; i >= 0; i--) {
            if (this.tilesets[i].firstgid <= tileIndex) {
                return this.tilesets[i];
            }
        }
        return null;
    }

    getAvailableInfo(x, y) {
        let wX = x;
        let wY = y;
        let idx = Math.floor(wY / this.tSize.y) * this.xCount + Math.floor(wX / this.tSize.x);
        return this.available[idx];
    }

    centerAt(x, y) {
        if (x < this.view.w / 2) this.view.x = 0;
        else if (x > this.mapSize.x - this.view.w / 2)
            this.view.x = this.mapSize.x - this.view.w;
        else this.view.x = x - this.view.w / 2;

        if (y < this.view.h / 2) this.view.y = 0;
        else if (y > this.mapSize.y - this.view.h / 2) {
            this.view.y = this.mapSize.y - this.view.h;
        } else {
            this.view.y = y - this.view.h / 2;
        }
    }

    parseEntities() {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => this.parseEntities(), 100);
        } else {
            console.log("ENTITY PARSED")
            for (let j = 0; j < this.mapData.layers.length; j++) {
                if (this.mapData.layers[j].type === 'objectgroup') {
                    const entities = this.mapData.layers[j];
                    for (let i = 0; i < entities.objects.length; i++) {
                        const e = entities.objects[i];
                        console.log("raw object:", e.name, "type:", e.type, "class:", e.class);
                        try {
                            if (e.type !== "") {
                                const obj = new gameManager.factory[e.type];
                                console.log("entity from map:", obj.name);
                                obj.name = e.name;
                                obj.pos_x = e.x;
                                obj.visible = e.visible;
                                if (e.type === 'Door' || e.type === 'Door_closed'){
                                    obj.pos_y = e.y - 64;

                                }
                                else{
                                    obj.pos_y = e.y - 32;
                                }
                                obj.size_x = e.width;
                                obj.size_y = e.height;
                                gameManager.entities.push(obj);
                                if (e.type === "Player") {
                                    gameManager.initPlayer(obj);
                                }
                            }
                        } catch (ex) {
                            console.log("Error while creating: [" + e.gid + "] " + e.type + ", " + ex);
                        }
                    }
                }
            }
        }
    }

}

const mapManager = new MapManager()
export default mapManager

