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
    _pool:cc.NodePool
    
    onLoad () {
        
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
    onEliminate(){
        if(this._pool){
            this._pool.put(this.node)
        }
    }
    // update (dt) {}
}
