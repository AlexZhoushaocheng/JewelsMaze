import BoardView from './BoardView';
import ItemNodePool from './ItemNodePool';

class Data{
    type:number
    node:cc.Node
}

const { ccclass, property } = cc._decorator;

export default class ItemModel {
    view: BoardView //棋盘
    rowCount: number
    colCount: number
    itemNodePool: ItemNodePool
    dataTable: Array<Array<Data>> = []

    constructor(view: BoardView) {
        this.view = view

        this.rowCount = 6
        this.colCount = 7

        this.itemNodePool = ItemNodePool.GetInstance()
    }


    init() {
        for (let i = 0; i < this.rowCount; i++) {
            this.dataTable.push([])
            for (let j = 0; j < this.colCount; j++) {
                let exclude = this.getExclude(i,j)
                let index = this._createItem(exclude)
                let node = this.itemNodePool.createItem(index)
                this.dataTable[i].push(new Data())
                this.dataTable[i][j].type = index
                this.dataTable[i][j].node = node
            }
        }
    }

    isValidIndex(index:cc.Vec2){
        return index.x >= 0 && index.x < this.rowCount && index.y >=0 && index.y < this.colCount
    }

    swap(index1:cc.Vec2,index2:cc.Vec2){
        if(this.isValidIndex(index1) && this.isValidIndex(index2)){
            let tempData = this.dataTable[index1.x][index1.y]
            this.dataTable[index1.x][index1.y] = this.dataTable[index2.x][index2.y]
            this.dataTable[index2.x][index2.y] = tempData

            let tempPos = this.dataTable[index2.x][index2.y].node.position
            this.dataTable[index2.x][index2.y].node.setPosition(this.dataTable[index1.x][index1.y].node.getPosition())
            this.dataTable[index1.x][index1.y].node.setPosition(tempPos)
        }
    }

    //初始化过程中检查改坐标点不该出现的元素（如果出现会引起三个连续的同色）
    getExclude(row:number,col:number):number[]{
        let arr:number[] = []
        if(row>1)
        {
            if(this.dataTable[row - 1][col].type == this.dataTable[row - 2][col].type){
                arr.push(Number(this.dataTable[row - 1][col].type))
            }
        }

        if(col>1)
        {
            if(this.dataTable[row][col - 1].type == this.dataTable[row][col - 2].type){
                arr.push(Number(this.dataTable[row][col - 1].type))
            }
        }
        return arr;
    }

    //返回ItemEnum的一个索引；exclude 要排除的项
    _createItem(exclude: number[] = []): number {
        let arrLen = exclude ? exclude.length : 0
        let typeCount = this.itemNodePool.GetItemTypeCount()
        let v = Math.floor(Math.random() * (typeCount - arrLen)) // 

        let item = 0
        if (arrLen > 0) {
            for (let itemIndex = 0; itemIndex < typeCount; itemIndex++) {
                if (exclude.indexOf(itemIndex) >= 0) {
                    continue
                }

                if (item == v) {
                    item = itemIndex
                    break
                } else {
                    item++
                }

            }
        } else {
            item = v
        }

        return item
    }
}