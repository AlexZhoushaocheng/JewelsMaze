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

    @property(cc.Node)
    chessBoard: cc.Node = null

    itemPool: cc.NodePool

    itemModel: ItemModel

    touchStartPos:cc.Vec2
    touchEndPos:cc.Vec2

    itemWidth:number
    itemHeighth:number

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
        let row = 0
        let col = 0
        for (let arr of this.itemModel.dataTable) {
            for (let id of arr) {
                let itemNode = this.createItem()
                this.chessBoard.addChild(itemNode)

                //let pos = cc.v2(itemNode.width/2 -this.chessBoard.width/2,itemNode.height/2-this.chessBoard.height/2).add(cc.v2(col * itemNode.width,row * itemNode.height))
                let pos = cc.v2(itemNode.width/2,itemNode.height/2).add(cc.v2(col * itemNode.width,row * itemNode.height))
                itemNode.setPosition(pos)
                col++
            }
            col = 0
            row++
        }

        this.itemWidth = this.chessBoard.children[0].width
        this.itemHeighth = this.chessBoard.children[0].height
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


    onTouchStart(event:cc.Event.EventTouch){
        event.stopPropagation()
        
        console.log("touch start",this.convertToIndex(this.node.convertToNodeSpaceAR(event.getLocation())))
        //计算出触碰的第一个 并记录

        
    }

    onTouchEnd(event:cc.Event.EventTouch){
        event.stopPropagation()
        console.log("touch end",this.convertToIndex(this.node.convertToNodeSpaceAR(event.getLocation())))
    }

    //
    convertToIndex(touchPos:cc.Vec2){
        return cc.v2(Math.floor(touchPos.x/this.itemWidth), Math.floor(touchPos.y/this.itemWidth))

    }
    // 判断开始和结束的两个元素是否相邻
    isAdjacent(posStart:cc.Vec2, posEnd:cc.Vec2){
        let ret = false
        ret = (posStart.x == posEnd.x && Math.abs(posStart.y - posEnd.y) == 0) ||(posStart.y == posEnd.y && Math.abs(posStart.x - posEnd.x) == 0)
        return ret
    }
    // update (dt) {}
}
