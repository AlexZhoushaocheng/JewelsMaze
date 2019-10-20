import BoardView from './BoardView';
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
    itemManager:BoardView
    
    onLoad () {
        
    }

    start () {
    }

    //node pool 调用get函数时会调用此函数
    reuse(manager:BoardView){
        if(!manager){
            return
        }

        this.itemManager = manager
    }

    //node pool 调用put函数时会调用此函数
    unuse(manager:BoardView){
        if(!manager){
            return
        }

        this.itemManager = manager
    }

    onTouchStart(event:cc.Event){

    }

    onTouchEnd(event:cc.Event){

    }

    onEliminate(){
        if(this.itemManager){
            this.itemManager.put(this.node)
        }
    }
    // update (dt) {}
}
