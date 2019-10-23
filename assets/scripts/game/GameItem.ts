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

@ccclass
export default class GameItem extends cc.Component {

    static EVENT = {
        ERASE : "ERASE"  //消除
    }

    //static ItemTypeMask = 0000 0000 0011 1100
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

    // @property({displayName:"类型",tooltip:"必须为GameItem.ItemType中的值"})
    // type:string = ""

    _pool:cc.NodePool
    
    onLoad () {
        this.node.on(GameItem.EVENT.ERASE,()=>{
            this.onErase()
        },this)
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

    //被消除
    onErase(){
        if(this._pool){
            this._pool.put(this.node)
        }else{
            console.error("this is no valid NodePool in gameitem")
        }
    }
    // update (dt) {}
}
