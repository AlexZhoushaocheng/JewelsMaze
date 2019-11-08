// Learn TypeScript:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

import EventRouter from '../common/EventRouter';

@ccclass
export default class GameItem extends cc.Component {
    static EVENT = {
        ERASE :         "ERASE",        //消除
        ERASE_END :     "ERASE_END",    //消除结束
        MOVE :          "MOVE",         //移动
        MOVE_END :      "MOVE_END"      //移动结束
    }

    static ItemType = {
        Undefine:{type:"Undefine",mask:0x0000},        //0x0000
        ItemFlash:{type:"ItemFlash",mask:0x0001},      //累计能量后使用特殊道具 0x0001
        ItemBoom:{type:"ItemBoom",mask:0x0002},        //消除后直接造成伤害 0x0002
        ItemRainbow:{type:"ItemRainbow",mask:0x003c},  //万能百搭元素，只能搭配普通元素 0x003c
        Item1:{type:"Item1",mask:0x0004},          //普通元素1 0x0004
        Item2:{type:"Item2",mask:0x0008},          //普通元素2 0x0008
        Item3:{type:"Item3",mask:0x0010},          //普通元素3 0x0010
        Item4:{type:"Item4",mask:0x0020},          //普通元素4 0x0020
    }

    _pool:cc.NodePool
    anim:cc.Animation
    animState:cc.AnimationState = null

    onLoad () {
        this.anim = this.getComponent(cc.Animation)
        if(this.anim){
            this.anim.on("finished",this.onEraseEnd,this)
        }

        this.node.on(GameItem.EVENT.ERASE,this.onErase,this)
        this.node.on(GameItem.EVENT.MOVE,this.onMove,this)
    }

    //消失动画完成
    onEraseEnd(){
        if(this._pool){
            this._pool.put(this.node)

            EventRouter.emit(GameItem.EVENT.ERASE_END,this.node.uuid)
        }else{
            console.error("this is no valid NodePool in gameitem")
        }
    }

    //移动动画完成
    onMoveEnd(){
        EventRouter.emit(GameItem.EVENT.MOVE_END,this.node.uuid)
    }

    onMove(pos:cc.Vec2){
        let act = cc.moveTo(0.4,pos)
        let finish = cc.callFunc(this.onMoveEnd,this)
        let moveAction = cc.sequence(act,finish)
        this.node.runAction(moveAction)
        //console.log("move move move..",pos.toString())
    }

    //消除，执行消失动画
    onErase(finishCall?:()=>void){
        if(!this.animState || !this.animState.isPlaying){
            this.animState = this.anim.play()
        }
    }

    start () {
    }

    //node pool 调用get函数时会调用此函数
    reuse(pool:cc.NodePool){
        if(!pool){
            return
        }

        this._pool = pool
    }

    //node pool 调用put函数时会调用此函数
    unuse(pool:cc.NodePool){
        if(!pool){
            return
        }

        //this._pool = pool
    }
    // update (dt) {}
}
