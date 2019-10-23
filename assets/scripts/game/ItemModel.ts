import BoardView from './BoardView';
import ItemNodePool from './ItemNodePool';
import GameItem from './GameItem';
import EventRouter from '../common/EventRouter'

//棋盘中的元素数据
//type 类型
//node 节点
class Data {
    type: string //GameItem.ItemType
    node: cc.Node
    mask: number
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
                let exclude = this.getExclude(i, j)
                let type = this._generateItem(exclude)
                let node = this.itemNodePool.createItem(type)
                this.dataTable[i].push(new Data())
                this.dataTable[i][j].type = type
                this.dataTable[i][j].node = node
                this.dataTable[i][j].mask = GameItem.ItemType[type].mask
            }
        }
        let erasable = this.checkAll()
        if(erasable.length > 0)
        {
            console.log("init done, check all: ",erasable )
        }
    }

    isValidIndex(index: cc.Vec2) {
        return index.x >= 0 && index.x < this.rowCount && index.y >= 0 && index.y < this.colCount
    }

    //交换两个元素
    swap(index1: cc.Vec2, index2: cc.Vec2, check: boolean) {
        if (this.isValidIndex(index1) && this.isValidIndex(index2)) {
            let tempData = this.dataTable[index1.x][index1.y]
            this.dataTable[index1.x][index1.y] = this.dataTable[index2.x][index2.y]
            this.dataTable[index2.x][index2.y] = tempData

            //TODO 使用动画在ui中交换位置
            let tempPos = this.dataTable[index2.x][index2.y].node.position
            this.dataTable[index2.x][index2.y].node.setPosition(this.dataTable[index1.x][index1.y].node.getPosition())
            this.dataTable[index1.x][index1.y].node.setPosition(tempPos)

            if (check) {
                let erasableItems = this.checkAll()
                if (erasableItems.length <= 0) { //交换元素后未触发消除，则撤销该操作
                    this.swap(index1, index2, false)
                } else {
                    do {
                        //消除
                        for (let item of erasableItems) {
                            //UI中消除
                            this.dataTable[item.x][item.y].node.emit(GameItem.EVENT.ERASE)

                            //model中清除
                            this.dataTable[item.x][item.y].type = GameItem.ItemType.Undefine.type
                            this.dataTable[item.x][item.y].mask = GameItem.ItemType.Undefine.mask
                            this.dataTable[item.x][item.y].node = null
                        }

                        //消除结束后降落
                        this.fall()

                        //降落后重新检查
                        erasableItems = this.checkAll()
                    } while (erasableItems.length > 0)
                }
                console.log("可消除项：",erasableItems)
            }
        }
    }

    //检测整个棋盘数据中的可消除项
    checkAll() {
        let retArr: cc.Vec2[] = []
        let tempArr: cc.Vec2[] = []

        //横向检查
        for (let row = 0; row < this.rowCount; row++) {
            for (let col = 0; col < this.colCount; col++) {
                if (tempArr.length > 0) {
                    if (this.isSameType(cc.v2(row, col), tempArr)) { // 如果当前的元素类型和暂存队列所有元素的类型可消除，则将其加入暂存队列
                        tempArr.push(cc.v2(row, col))
                    } else { // 如果不同，则先判断暂存队列是否大于3个（即达到消除条件），达到则记录到结果队列中（retArr），
                        
                        //清空暂存
                        if (tempArr.length >= 3) { //大于3可消除是可以清空暂存队列 TODO:如结尾时百搭元素应该检查后续元素和百搭元素组成的可消除长度，选择最长的可消除组合进行消除
                            retArr = retArr.concat(tempArr)
                            tempArr = []
                        }else{ // 如果不大于3，清空时应保留队尾的百搭元素 和 同类型元素
                            let arr = tempArr
                            tempArr = []
                            for(let index = arr.length - 1; index>=0; index--){
                                if(this.isSameType(cc.v2(row, col),cc.v2(arr[index].x,arr[index].y))){
                                    tempArr.push(arr[index])
                                }else{
                                    break
                                }
                            }
                        }
                        
                        //清空后放入新元素
                        tempArr.push(cc.v2(row, col))
                    }
                } else {
                    tempArr.push(cc.v2(row, col))
                }
            } // 检测完一行

            if (tempArr.length >= 3) {
                retArr = retArr.concat(tempArr)
            }
            tempArr = []
        }

        //纵向检查
        for (let col = 0; col < this.colCount; col++) {
            for (let row = 0; row < this.rowCount; row++) {
                if (tempArr.length > 0) {
                    if (this.isSameType(cc.v2(row, col), tempArr)) { //如果当前的元素类型和暂存队列所有元素的类型可消除，则将其加入暂存队列
                        tempArr.push(cc.v2(row, col))
                    } else { //如果不同，则先判断暂存队列是否大于3个（即达到消除条件），达到则记录到结果队列中（retArr），
                        //清空暂存
                        if (tempArr.length >= 3) { //大于3可消除是可以清空暂存队列
                            retArr = retArr.concat(tempArr)
                            tempArr = []
                        }else{ // 如果不大于3，清空时应保留队尾的百搭元素
                            let arr = tempArr
                            tempArr = []
                            for(let index = arr.length - 1; index>=0; index--){
                                if(this.isSameType(cc.v2(row, col),cc.v2(arr[index].x,arr[index].y))){
                                    tempArr.push(arr[index])
                                }else{
                                    break
                                }
                            }
                        }

                        //清空后放入新元素
                        tempArr.push(cc.v2(row, col))
                    }
                } else {
                    tempArr.push(cc.v2(row, col))
                }
            } //检测完一列

            if (tempArr.length >= 3) {
                retArr = retArr.concat(tempArr)
            }
            tempArr = []
        }
        return this.distinct<cc.Vec2>(retArr,(v:cc.Vec2)=>{return v.toString()})
    }

    getEmptyIndex(){
        let arr:cc.Vec2[] =[]
        for (let row =0; row < this.dataTable.length;row++){
            for(let col = 0; col < this.dataTable[row].length; col++){
                if(this.dataTable[row][col].type == GameItem.ItemType.Undefine.type){
                    arr.push(cc.v2(row,col))
                }
            }
        }

        return arr
    }

    //使空白上方的元素落下
    fall(){
        //this.printDataTable()
        let emptyIndexs = this.getEmptyIndex()
        let nodeMap:Map<number,Array<Data>> = new Map<number,Array<Data>>() //存放每列新增的对象
        for (let index of emptyIndexs){
            let type = this._generateItem()
            let data = new Data()
            data.type = type
            data.mask = GameItem.ItemType[type].mask
            data.node = ItemNodePool.GetInstance().createItem(type)

            if(nodeMap.has(index.y)){
                nodeMap.get(index.y).push(data)
            }else{
                nodeMap.set(index.y,new Array<Data>())
                nodeMap.get(index.y).push(data)
            }
        }

        let emptyCount = 0 //元素下方的空格子数
        nodeMap.forEach((value:Data[],key:number)=>{
            let rowCount = this.dataTable.length

            for(let row = 0; row < rowCount; row++){ //key 就是列索引
                if(this.dataTable[row][key].type == GameItem.ItemType.Undefine.type){
                    emptyCount++
                }else if(emptyCount > 0){
                    this.move(cc.v2(row,key),cc.v2(row - emptyCount,key))
                }
            }

            for(let data of value){
                this.put(data,cc.v2(rowCount -(emptyCount--),key))
            }
            emptyCount = 0
        })

        //this.printDataTable()
    }

    printDataTable(){
        for(let row = this.dataTable.length -1; row >=0; row--){
            let types = []
            for(let data of this.dataTable[row]){
                types.push(data.type)
            }
            console.log(types.join("\t"))
        }
    }

    put(itemData:Data, to: cc.Vec2){
        //model中数据移动
        this.dataTable[to.x][to.y] = itemData

        //添加到棋盘中
        this.view.chessBoard.addChild(itemData.node)

        //UI中位置移动 TODO：做成动画
        this.dataTable[to.x][to.y].node.setPosition(this.view.getPosition(to.x,to.y))
    }

    //移动节点 from是棋盘上未被消除的元素，to是消除了的空格
    move(from: cc.Vec2, to: cc.Vec2){
        //model中数据移动
        this.dataTable[to.x][to.y] = this.dataTable[from.x][from.y]

        //UI中位置移动 TODO：做成动画
        this.dataTable[to.x][to.y].node.setPosition(this.view.getPosition(to.x,to.y))

        EventRouter.emit(GameItem.EVENT.MOVE)
    }

    //去重 据说这个方法比set快
    distinct<T>(arr:T[],feature:(v:T)=>string) {
        let ret: T[] = []
        let obj = {}

        for (let node of arr) {
 
            if (!obj[feature(node)]) {
                ret.push(node)
                obj[feature(node)] = 1
            }
        }
        return ret
    }

    isSameType(index1: cc.Vec2, indexs: cc.Vec2):boolean;
    isSameType(index1: cc.Vec2, indexs: cc.Vec2[]):boolean;

    isSameType(index1: cc.Vec2, indexs:any):boolean {
        let maskRet = this.dataTable[index1.x][index1.y].mask

        if(indexs instanceof Array){
            for(let index of (indexs as Array<cc.Vec2>)){
                maskRet = maskRet & this.dataTable[index.x][index.y].mask
                if(0 == maskRet){
                    break
                }
            }
        }else{
            let index = indexs as cc.Vec2
            maskRet = maskRet & this.dataTable[index.x][index.y].mask
        }
        
        
        return maskRet != 0
    }

    //TODO 删除此函数
    //以一个点为中心检查可消除项 此函数用不到  暂时保留
    check(index: cc.Vec2) {
        if (!this.isValidIndex(index)) {
            //出错返回
            return []
        }

        let lLen = 0 //左侧计数
        let rLen = 0 //右侧计数
        let uLen = 0 //上方计数
        let dLen = 0 //下方计数

        let vArr: cc.Vec2[] = [] //垂直
        let hArr: cc.Vec2[] = [] //水平

        //下
        for (let i = 1; ; i++) {
            let row = index.x - i
            if (row >= 0 && this.dataTable[row][index.y].type == this.dataTable[index.x][index.y].type) {
                vArr.push(cc.v2(row, index.y))
            } else {
                break
            }
        }

        //上
        for (let i = 1; ; i++) {
            let row = index.x + i
            if (row < this.rowCount && this.dataTable[row][index.y].type == this.dataTable[index.x][index.y].type) {
                vArr.push(cc.v2(row, index.y))
            } else {
                break
            }
        }

        //左
        for (let i = 1; ; i++) {
            let col = index.x - i
            if (col >= 0 && this.dataTable[index.x][col].type == this.dataTable[index.x][index.y].type) {
                hArr.push(cc.v2(index.x, col))
            } else {
                break
            }
        }

        //右
        for (let i = 1; ; i++) {
            let col = index.x - i
            if (col < this.colCount && this.dataTable[index.x][col].type == this.dataTable[index.x][index.y].type) {
                hArr.push(cc.v2(index.x, col))
            } else {
                break
            }
        }

        //结果拼接
        let retArr: cc.Vec2[] = []
        if (vArr.length >= 2) {
            retArr = retArr.concat(vArr)
        }
        if (hArr.length >= 2) {
            retArr = retArr.concat(hArr)
        }
        if (retArr.length > 0) { //如果结果不为空，中心的节点也放入结果中
            retArr.push(index)
        }
        return retArr
    }

    //初始化过程中检查改坐标点不该出现的元素（如果出现会引起三个连续的同色）
    getExclude(row: number, col: number): string[] {
        let arr: string[] = []
        if (row > 1) {
            //if (this.dataTable[row - 1][col].type == this.dataTable[row - 2][col].type) {
            if (this.isSameType(cc.v2(row - 1,col),cc.v2(row - 2,col))) {
                arr.push(this.dataTable[row - 1][col].type)
                arr.push(this.dataTable[row - 2][col].type)
                if((this.dataTable[row - 1][col].mask & GameItem.ItemType.ItemRainbow.mask) > 0){ //如果其中的元素和百搭元素可消除则把百搭元素添加到排除列表中
                    arr.push(GameItem.ItemType.ItemRainbow.type)

                    //如果两个元素都为百搭元素，则把普通元素都加到排除列表中
                    if((this.dataTable[row - 2][col].type == GameItem.ItemType.ItemRainbow.type) && 
                    (this.dataTable[row - 1][col].type == GameItem.ItemType.ItemRainbow.type)){ 
                        arr.push(GameItem.ItemType.Item1.type,GameItem.ItemType.Item2.type,GameItem.ItemType.Item3.type,GameItem.ItemType.Item4.type)
                    }
                }
            }
        }

        if (col > 1) {
            //if (this.dataTable[row][col - 1].type == this.dataTable[row][col - 2].type) {
            if (this.isSameType(cc.v2(row,col-1),cc.v2(row,col-2))) {
                arr.push(this.dataTable[row][col - 1].type)
                arr.push(this.dataTable[row][col - 2].type)
                if((this.dataTable[row][col - 2].mask & GameItem.ItemType.ItemRainbow.mask) > 0){ //如果其中的元素和百搭元素可消除则把百搭元素添加到排除列表中
                    arr.push(GameItem.ItemType.ItemRainbow.type)

                    //如果两个元素都为百搭元素，则把普通元素都加到排除列表中
                    if((this.dataTable[row][col - 1].type == GameItem.ItemType.ItemRainbow.type) && 
                    (this.dataTable[row][col - 2].type == GameItem.ItemType.ItemRainbow.type)){ 
                        arr.push(GameItem.ItemType.Item1.type,GameItem.ItemType.Item2.type,GameItem.ItemType.Item3.type,GameItem.ItemType.Item4.type)
                    }
                }
            }
        }
        return this.distinct<string>(arr,(v:string)=>{return v});
    }

    //返回ItemEnum的一个索引；exclude 要排除的项
    _generateItem(exclude: string[] = []): string {
        if (exclude.indexOf(GameItem.ItemType.Undefine.type) < 0) { //排除Undefine，即保证生成结果不会是Undefine
            exclude.push(GameItem.ItemType.Undefine.type)
        }
        exclude = this.distinct(exclude,(v)=>{return v}) //去重

        let arrLen = exclude.length
        let keys = Object.keys(GameItem.ItemType)
        let typeCount = keys.length
        let v = Math.floor(Math.random() * (typeCount - arrLen)) // 

        let item = 0
        if (arrLen > 0) {
            for (let itemIndex = 0; itemIndex < typeCount; itemIndex++) {
                if (exclude.indexOf(GameItem.ItemType[keys[itemIndex]].type) >= 0) {
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
        
        return GameItem.ItemType[keys[item]].type
    }
}