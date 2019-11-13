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
export default class Game extends cc.Component {

    // @property(cc.Label)
    // label: cc.Label = null;

    // @property
    // text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    
    //玩家1 元素显示
    @property(cc.Label)
    player1Item1:cc.Label = null

    @property(cc.Label)
    player1Item2:cc.Label = null

    @property(cc.Label)
    player1Item3:cc.Label = null

    @property(cc.Label)
    player1Item4:cc.Label = null

    //玩家2 元素显示
    @property(cc.Label)
    player2Item1:cc.Label = null

    @property(cc.Label)
    player2Item2:cc.Label = null

    @property(cc.Label)
    player2Item3:cc.Label = null

    @property(cc.Label)
    player2Item4:cc.Label = null
    
    static EVENT = {
        SWAP:"SWAP"
    }

    

    onLoad () {}

    start () {

    }

    // update (dt) {}
}
