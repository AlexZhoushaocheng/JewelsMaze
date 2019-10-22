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

    static ItemType = {
        Undefine:"Undefine",
        ItemFlash:"ItemFlash",      //累计能量后使用特殊道具
        ItemBoom:"ItemBoom",        //消除后直接造成伤害
        ItemRainbow:"ItemRainbow",  //万能百搭元素，只能搭配普通元素
        Item1:"Item1",          //普通元素1
        Item2:"Item2",          //普通元素2
        Item3:"Item3",          //普通元素3
        Item4:"Item4",          //普通元素4
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
