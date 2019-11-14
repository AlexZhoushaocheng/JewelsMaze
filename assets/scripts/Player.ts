import ItemModel from './game/ItemModel';
import GameItem from './game/GameItem';

enum BuffTye{}

export type ItemChangeCallback = (player:Player)=>{}

export default class Player {
    
    //血量
    health:number
    
    //技能栏
    //skills

    //TODO
    //buff:BuffTye

    //活动的元素能量
    private items = {
    }

    private itemChangeCallList:Array<ItemChangeCallback> = []

    onItemChanged(callFunc: ItemChangeCallback){
        this.itemChangeCallList.push(callFunc)
    }

    addItem(type:string,delta:number){
        this.items[type] += delta

        if(this.itemChangeCallList.length > 0){
            for(let callFunc of this.itemChangeCallList){
                callFunc(this)
            }
        }
    }

    constructor() {
        this.items[GameItem.ItemType.Item1.type] = 0
        this.items[GameItem.ItemType.Item2.type] = 0
        this.items[GameItem.ItemType.Item3.type] = 0
        this.items[GameItem.ItemType.Item4.type] = 0
        this.items[GameItem.ItemType.ItemFlash.type] = 0
    }
}