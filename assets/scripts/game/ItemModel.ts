import BoardView from './BoardView';
import ItemNodePool from './ItemNodePool';
import GameItem from './GameItem';

//棋盘中的元素数据
//type 类型
//node 节点
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

    //交换两个元素
    swap(index1:cc.Vec2,index2:cc.Vec2,check:boolean){
        if(this.isValidIndex(index1) && this.isValidIndex(index2)){
            let tempData = this.dataTable[index1.x][index1.y]
            this.dataTable[index1.x][index1.y] = this.dataTable[index2.x][index2.y]
            this.dataTable[index2.x][index2.y] = tempData

            //TODO 使用动画在ui中交换位置
            let tempPos = this.dataTable[index2.x][index2.y].node.position
            this.dataTable[index2.x][index2.y].node.setPosition(this.dataTable[index1.x][index1.y].node.getPosition())
            this.dataTable[index1.x][index1.y].node.setPosition(tempPos)

            if(check){
                let erasableItems = this.checkAll()
                if(erasableItems.length <= 0){ //交换元素后未触发消除，则撤销该操作
                    this.swap(index1,index2,false)
                }else{
                    for (let item of erasableItems){
                        this.dataTable[item.x][item.y].node.emit(GameItem.EVENT.ERASE)
                        this.dataTable[item.x][item.y].type = -1
                    }
                }
                console.log(erasableItems)
            }
        }
    }

    //检测整个棋盘数据中的可消除项
    checkAll(){
        let retArr:cc.Vec2[] = []
        let tempArr:cc.Vec2[] = [] 

        for(let row = 0; row < this.rowCount; row++){
            for(let col = 0; col < this.colCount; col++){
                if(tempArr.length>0){
                    if(this.isSameType(cc.v2(row,col),tempArr[tempArr.length-1])){ //如果当前的元素类型和暂存队列最后一个元素的类型相同，则将其加入暂存队列
                        tempArr.push(cc.v2(row,col))
                    }else{ //如果不同，则先判断暂存队列是否大于3个（即达到消除条件），达到则记录到结果队列中（retArr），
                        if(tempArr.length >= 3){
                            retArr = retArr.concat(tempArr)
                        }
                        tempArr = []
                        tempArr.push(cc.v2(row,col))
                    }
                }else{
                    tempArr.push(cc.v2(row,col))
                }
            }
            if(tempArr.length >= 3){
                retArr = retArr.concat(tempArr)
            }
            tempArr = []
        }

        for(let col = 0; col < this.colCount; col++){
            for(let row = 0; row < this.rowCount; row++){
                if(tempArr.length>0){
                    if(this.isSameType(cc.v2(row,col),tempArr[tempArr.length-1])){ //如果当前的元素类型和暂存队列最后一个元素的类型相同，则将其加入暂存队列
                        tempArr.push(cc.v2(row,col))
                    }else{ //如果不同，则先判断暂存队列是否大于3个（即达到消除条件），达到则记录到结果队列中（retArr），
                        if(tempArr.length >= 3){
                            retArr = retArr.concat(tempArr)
                        }
                        tempArr = []
                        tempArr.push(cc.v2(row,col))
                    }
                }else{
                    tempArr.push(cc.v2(row,col))
                }
            }
            if(tempArr.length >= 3){
                retArr = retArr.concat(tempArr)
            }
            tempArr = []
        }
        return this.distinct(retArr)
    }

    //据说这个方法比set快
    distinct(arr:cc.Vec2[]){
        let ret:cc.Vec2[] = []
        let obj = {}
        for (let node of arr){
            if(!obj[node.toString()]){
                ret.push(node)
                obj[node.toString()] = 1
            }
        }
        return ret
    }

    isSameType(index1:cc.Vec2, index2:cc.Vec2){
        let ret = false
        if(this.isValidIndex(index1) && this.isValidIndex(index2))
        {
            ret = this.dataTable[index1.x][index1.y].type == this.dataTable[index2.x][index2.y].type
        }
        return ret
    }

    //以一个点为中心检查可消除项
    check(index:cc.Vec2){
        if(!this.isValidIndex(index))
        {
            //出错返回
            return []
        }

        let lLen = 0 //左侧计数
        let rLen = 0 //右侧计数
        let uLen = 0 //上方计数
        let dLen = 0 //下方计数

        let vArr:cc.Vec2[] = [] //垂直
        let hArr:cc.Vec2[] = [] //水平

        //下
        for(let i = 1;;i++){
            let row = index.x - i
            if( row >=0 && this.dataTable[row][index.y].type == this.dataTable[index.x][index.y].type){
                vArr.push(cc.v2(row,index.y))
            }else{
                break
            }
        }

        //上
        for(let i = 1;;i++){
            let row = index.x + i
            if( row < this.rowCount && this.dataTable[row][index.y].type == this.dataTable[index.x][index.y].type){
                vArr.push(cc.v2(row,index.y))
            }else{
                break
            }
        }

        //左
        for(let i = 1;;i++){
            let col = index.x - i
            if( col>=0 && this.dataTable[index.x][col].type == this.dataTable[index.x][index.y].type){
                hArr.push(cc.v2(index.x,col))
            }else{
                break
            }
        }

        //右
        for(let i = 1;;i++){
            let col = index.x - i
            if( col < this.colCount && this.dataTable[index.x][col].type == this.dataTable[index.x][index.y].type){
                hArr.push(cc.v2(index.x,col))
            }else{
                break
            }
        }

        //结果拼接
        let retArr:cc.Vec2[] = []
        if(vArr.length >=2){
            retArr = retArr.concat(vArr)
        }
        if(hArr.length >= 2){
            retArr = retArr.concat(hArr)
        }
        if(retArr.length > 0){ //如果结果不为空，中心的节点也放入结果中
            retArr.push(index)
        }
        return 
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