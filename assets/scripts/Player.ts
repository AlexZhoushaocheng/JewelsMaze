import ItemModel from './game/ItemModel';
import GameItem from './game/GameItem';

export default class Player {
    itemModel: ItemModel

    //type1:string = 

    items = {
    }

    constructor(itemModel: ItemModel) {
        this.itemModel = itemModel

        this.items[GameItem.ItemType.Item1.type] = 0
        this.items[GameItem.ItemType.Item2.type] = 0
        this.items[GameItem.ItemType.Item3.type] = 0
        this.items[GameItem.ItemType.Item4.type] = 0
        this.items[GameItem.ItemType.ItemFlash.type] = 0
    }
}