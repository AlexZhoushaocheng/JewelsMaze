import GameItem from './GameItem';
import ItemModel from './ItemModel';
import { Integer } from '../../../creator';
// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

// 棋盘
@ccclass
export default class BoardView extends cc.Component {
    @property(cc.Prefab)
    gameItemPrefab: cc.Prefab = null

    itemPool: cc.NodePool

    itemModel: ItemModel

    touchStartPos:cc.Vec2
    touchEndPos:cc.Vec2

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START,this.onTouchStart,this)
        this.node.on(cc.Node.EventType.TOUCH_END,this.onTouchEnd,this)

        this.itemPool = new cc.NodePool("Item")
        this.itemModel = new ItemModel(this)

        let initCount = 6 * 7
        for (let i = 0; i < initCount; i++) {
            this.itemPool.put(cc.instantiate(this.gameItemPrefab))
        }

        this.itemModel.init()

        this.show()
    }

    show() {
        let temp = this.node.getChildByName("game_item0_0")
        if (! temp) {
            return
        }
        temp.active = false

        let row = 0
        let col = 0
        for (let arr of this.itemModel.dataTable) {
            for (let id of arr) {
                let itemNode = this.createItem()
                this.node.addChild(itemNode)
                let pos = temp.getPosition().add(cc.v2(col * temp.width,- row * temp.height))
                itemNode.setPosition(pos)
                col++
            }
            col = 0
            row++
        }
    }

    createItem() {
        let itemNode: cc.Node = null
        if (this.itemPool.size() > 0) {
            itemNode = this.itemPool.get(this)
        }
        else {
            itemNode = cc.instantiate(this.gameItemPrefab)
            let gameItem = itemNode.getComponent("GameItem") as GameItem
            gameItem.itemManager = this
        }

        return itemNode
    }

    put(gameItemNode: cc.Node) {
        this.itemPool.put(gameItemNode)
    }

    start() {

    }


    onTouchStart(event:cc.Event){
        event.stopPropagation()
        console.log("touch start")
        //计算出触碰的第一个 并记录
    }

    onTouchEnd(event:cc.Event){
        event.stopPropagation()
        console.log("touch end")
    }

    // 判断开始和结束的两个元素是否相邻
    isAdjacent(posStart:cc.Vec2, posEnd:cc.Vec2){
        let ret = false
        ret = (posStart.x == posEnd.x && Math.abs(posStart.y - posEnd.y) == 0) ||(posStart.y == posEnd.y && Math.abs(posStart.x - posEnd.x) == 0)
        return ret
    }
    // update (dt) {}
}
