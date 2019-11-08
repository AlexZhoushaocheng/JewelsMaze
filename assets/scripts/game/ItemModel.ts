import BoardView from './BoardView';
import ItemNodePool from './ItemNodePool';
import GameItem from './GameItem';
import EventRouter from '../common/EventRouter';
import Robot from '../Robot';
import Player from '../Player';

//棋盘中的元素数据
//type 类型
//node 节点
class Data {
    type: string //GameItem.ItemType
    node: cc.Node
    mask: number
}


enum ActionType {
    UNDEFINE,
    TRY_SWAP,
    SWAP,
    MOVE,
    ERASE
}
const MaxChairCount = 2

export default class ItemModel {
    
    static EVENT = {
        TRY_SWAP : "TRY_SWAP"
    }

    view: BoardView //棋盘
    rowCount: number
    colCount: number
    itemNodePool: ItemNodePool
    dataTable: Array<Array<Data>> = []
    lastAction:ActionType = ActionType.UNDEFINE

    isPlayerTurn:boolean = true

    player:Player
    robot:Player

    //待消除元素
    itemEraseMap:Map<string,cc.Vec2> = new Map<string,cc.Vec2>()

    //待移动元素 
    itemMoveMap:Map<string,cc.Vec2> = new Map<string,cc.Vec2>()

    //移动完成后是否检查表，移动无效时进行恢复时无需检查
    bSwapBack = false

    //
    swapTemp:cc.Vec2[] = []

    //连续消除计数
    continuousEraseCount:number = 0
    
    //此次被消除元素的数量
    eraseItemCount:number = 0

    changeTurn(){
        this.isPlayerTurn = !this.isPlayerTurn

        if(! this.isPlayerTurn){//机器人回合
            

        }else{//玩家回合
            //TODO 提示玩家可以行动了
        }
    }

    //执行消除，消除itemEraseMap中的元素
    doErase(){
        this.eraseItemCount = this.itemEraseMap.size
        this.eraseItemCount++
        
        this.itemEraseMap.forEach((index:cc.Vec2,uuid:string)=>{
            this.dataTable[index.x][index.y].node.emit(GameItem.EVENT.ERASE)

            //model中清除
            this.dataTable[index.x][index.y].type = GameItem.ItemType.Undefine.type
            this.dataTable[index.x][index.y].mask = GameItem.ItemType.Undefine.mask
            this.dataTable[index.x][index.y].node = null
        })
    }

    //执行移动，移动itemMoveMap中的元素
    doMove(){
        //console.log("do move")
        this.itemMoveMap.forEach((index:cc.Vec2,uuid:string)=>{
            this.dataTable[index.x][index.y].node.emit(GameItem.EVENT.MOVE,this.view.getPosition(index.x,index.y))
        })
    }

    findErasable():Array<Array<cc.Vec2>>{
        let ret = Array<Array<cc.Vec2>>()

        return ret
    }

    onOneMoveEnd(uuid:string){
        if(this.itemMoveMap.has(uuid)){
            this.itemMoveMap.delete(uuid)
            if(this.itemMoveMap.size == 0){
                //所有移动完成
                let erasableItems = this.checkAll()

                if(erasableItems.length > 0){ //可以消除
                    this.bSwapBack = false

                    for (let item of erasableItems) {
                        //UI中消除
                        this.itemEraseMap.set(this.dataTable[item.x][item.y].node.uuid,item)
                    }
                    this.doErase()
                }else if(this.bSwapBack){ //如果上次操作是尝试交换两个元素，那么
                    this.bSwapBack = false
                    this.swap(this.swapTemp[0],this.swapTemp[1])
                }else{ //判断是否让当前玩家继续行动
                    if(this.continuousEraseCount >=2 || this.eraseItemCount > 3){
                        //TODO 提示可以继续行动
                        console.log("你可以继续行动")
                    }else{
                        this.changeTurn()
                    }
                }
            }
        }else{
            console.error("the uuid is not in itemMoveMap,",uuid)
        }
    }

    onOneEraseEnd(uuid:string){
        if(this.itemEraseMap.has(uuid)){
            //被消除的元素记录到对应的玩家
            let index:cc.Vec2 = this.itemEraseMap[uuid]
            if(this.isPlayerTurn){
                this.player.items[this.dataTable[index.x][index.y].type] += 1
            }else{
                this.robot.items[this.dataTable[index.x][index.y].type] += 1
            }

            //TODO 跟新能量变化数据到客户端

            this.itemEraseMap.delete(uuid)
            if(this.itemEraseMap.size == 0){ //所有消除动作完成
                this.fall()
            }
        }
    }

    //玩家行动后
    onTrySwap(index1:cc.Vec2, index2:cc.Vec2){
        this.eraseItemCount = 0;

        this.bSwapBack =true
        this.swap(index1,index2)
    }

    constructor(view: BoardView) {
        this.view = view

        this.rowCount = 6
        this.colCount = 7

        this.itemNodePool = ItemNodePool.GetInstance()
        this.player = new Player(this)
        this.robot = new Player(this)
    }


    init() {
        EventRouter.register(GameItem.EVENT.ERASE_END,this.onOneEraseEnd,this)
        EventRouter.register(GameItem.EVENT.MOVE_END,this.onOneMoveEnd,this)
        EventRouter.register(ItemModel.EVENT.TRY_SWAP,this.onTrySwap,this)

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
            console.log("fuck !!!! ERROR!!! init done, check all: ",erasable )
        }

        this.isPlayerTurn = true;
    }

    //游戏开始
    gameStart(){
        if(this.isPlayerTurn){
            //TODO 提示玩家可以行动， 时钟开始计时
        }
    }

    isValidIndex(index: cc.Vec2) {
        return index.x >= 0 && index.x < this.rowCount && index.y >= 0 && index.y < this.colCount
    }


    //交换两个元素
    private swap(index1: cc.Vec2, index2: cc.Vec2) {
        this.swapTemp=[]

        if (this.isValidIndex(index1) && this.isValidIndex(index2)) {
            let tempData = this.dataTable[index1.x][index1.y]
            this.dataTable[index1.x][index1.y] = this.dataTable[index2.x][index2.y]
            this.dataTable[index2.x][index2.y] = tempData

            //使用动画在ui中交换位置
            this.itemMoveMap.set(this.dataTable[index2.x][index2.y].node.uuid,index1)
            this.itemMoveMap.set(this.dataTable[index1.x][index1.y].node.uuid,index2)
            this.lastAction = ActionType.TRY_SWAP

            this.swapTemp.push(index1,index2)
            this.doMove()
        }
    }

    //检测整个棋盘数据中的可消除项
    private checkAll() {
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

    private getEmptyIndex(){
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
    private fall(){
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


            let count = emptyCount

            for(let data of value){ //value 是一列新增的元素

                let from = cc.v2(rowCount + (emptyCount-(count)),key)
                let to = cc.v2(rowCount -(count--),key)
                
                //初始化位置
                //data.node.setPosition()
                if(!data.node){
                    console.log("BIG ERROR")
                }
                //UI中位置移动 
                this.put(data,from,to)
            }
            emptyCount = 0
        })
        //this.printDataTable()
        this.doMove()
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

    private put(itemData:Data,from:cc.Vec2, to: cc.Vec2){

        
        //console.log("put ", itemData.type,"from ",from.toString(), " to ", to.toString())
        //model中数据移动
        this.dataTable[to.x][to.y] = itemData

        //添加到棋盘中
        this.view.chessBoard.addChild(itemData.node)

        //初始化位置
        itemData.node.setPosition(this.view.getPosition(from.x,from.y))

        //UI中位置移动,加入移动队列
        this.itemMoveMap.set(itemData.node.uuid,to)
    }

    //移动节点 from是棋盘上未被消除的元素，to是消除了的空格
    private move(from: cc.Vec2, to: cc.Vec2){
       // console.log("move from ", from.toString() ," to ", to.toString())
        //model中数据移动
        this.dataTable[to.x][to.y] = this.dataTable[from.x][from.y]

        //UI中位置移动,加入移动队列
        this.itemMoveMap.set(this.dataTable[to.x][to.y].node.uuid,to)
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
    private getExclude(row: number, col: number): string[] {
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
    private _generateItem(exclude: string[] = []): string {
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