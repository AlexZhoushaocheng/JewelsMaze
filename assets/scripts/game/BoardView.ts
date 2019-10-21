import ItemModel from './ItemModel';
import ItemNodePool from './ItemNodePool';
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

// 棋盘  x，y表示行，列
// 行：从下往上；列：从左至右

@ccclass
export default class BoardView extends cc.Component {
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

        this.itemPool = new cc.NodePool("GameItem")
        this.itemModel = new ItemModel(this)

        //预加载资源
        ItemNodePool.GetInstance().preLoad(()=>{
            this.loadDone()
        })
    }

    loadDone(){
        this.itemModel.init()
        this.show()
    }

    show(){
        let row = 0
        let col = 0
        for (let arr of this.itemModel.dataTable) {
            for (let itemData of arr) {

                let itemNode = itemData.node
                this.chessBoard.addChild(itemNode)

                //let pos = cc.v2(itemNode.width/2 -this.chessBoard.width/2,itemNode.height/2-this.chessBoard.height/2).add(cc.v2(col * itemNode.width,row * itemNode.height))
                let pos = cc.v2(itemNode.width / 2, itemNode.height / 2).add(cc.v2(col * itemNode.width, row * itemNode.height))
                itemNode.setPosition(pos)
                col++
            }
            col = 0
            row++
        }

        this.itemWidth = this.chessBoard.children[0].width
        this.itemHeighth = this.chessBoard.children[0].height
    }

    start() {

    }


    onTouchStart(event:cc.Event.EventTouch){
        event.stopPropagation()
        this.touchStartPos = this.convertToIndex(this.node.convertToNodeSpaceAR(event.getLocation()))
        console.log("touch start",this.touchStartPos)
        //计算出触碰的第一个 并记录

        
    }

    onTouchEnd(event:cc.Event.EventTouch){
        event.stopPropagation()
        this.touchEndPos = this.convertToIndex(this.node.convertToNodeSpaceAR(event.getLocation()))
        console.log("touch end",this.touchEndPos)
        

        if(this.isAdjacent(this.touchStartPos,this.touchEndPos)){ //点击和弹起的元素相邻
            console.log("swap")
           this.itemModel.swap(this.touchStartPos,this.touchEndPos);
        }else{
            console.log("no swap")
        }
    }

    //x:行 y:列
    convertToIndex(touchPos:cc.Vec2){
        return cc.v2(Math.floor(touchPos.y/this.itemWidth),Math.floor(touchPos.x/this.itemWidth))
    }

    // 判断开始和结束的两个元素是否相邻
    isAdjacent(posStart:cc.Vec2, posEnd:cc.Vec2){
        let ret = false
        ret = (posStart.x == posEnd.x && Math.abs(posStart.y - posEnd.y) == 1) ||(posStart.y == posEnd.y && Math.abs(posStart.x - posEnd.x) == 1)
        return ret
    }
    // update (dt) {}
}
