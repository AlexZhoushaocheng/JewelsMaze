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

class PosPair {
    posX: cc.Vec2
    posY: cc.Vec2
    constructor(pos1: cc.Vec2, pos2: cc.Vec2) {
        this.posX = pos1
        this.posY = pos2
    }
}

enum ActionType {
    TRY_SWAP,  //手动移动
    SWAP,       //手动移动后无可消除，被还原
    AUTO_MOVE,  //消除后降落
    CLEAR       //清空
}
const MaxChairCount = 2

export default class ItemModel {

    static EVENT = {
        TRY_SWAP: "TRY_SWAP"
    }

    view: BoardView //棋盘
    rowCount: number
    colCount: number
    itemNodePool: ItemNodePool
    dataTable: Array<Array<Data>> = []
    lastAction: ActionType

    isPlayerTurn: boolean = true

    player: Player
    robot: Player

    currentAllMovable: Array<PosPair>

    //待消除元素
    itemEraseMap: Map<string, cc.Vec2> = new Map<string, cc.Vec2>()

    //待移动元素 
    itemMoveMap: Map<string, cc.Vec2> = new Map<string, cc.Vec2>()

    //是否为手动移动，玩家点击后移动属于手动移动，降落属于自动自动
    //bManual:boolean

    //
    swapTemp: cc.Vec2[] = []

    //连续消除计数
    continuousEraseCount: number = 0

    //此次被消除元素的数量
    eraseItemCount: number = 0

    changeTurn() {
        this.isPlayerTurn = !this.isPlayerTurn

        if (!this.isPlayerTurn) {//机器人回合
            console.log("robot trun")
            this.robotAction()
        } else {//玩家回合
            console.log("player trun")
            //TODO 提示玩家可以行动了
        }
    }

    //检查是否有可消除，没有就重新初始化
    checkRebuild(){
        let pairs =  this.findErasable()
        if(0 == pairs.length){

        }
    }

    robotAction(){
        let pairs =  this.findErasable()
            // TODO 找一个最优的，也就是结果中重复的次数最多的
            if(pairs.length > 0 )
            {
                //随机取
                let index = Math.floor(pairs.length * Math.random())
                console.log("robot Move length",index)
                this.onTrySwap(pairs[index].posX,pairs[index].posY)
            }else{
                //没有可以移动消除的元素，重新初始化棋盘
                console.log("没有可以移动后消除的选项")
            }
    }

    //执行消除，消除itemEraseMap中的元素
    doErase() {
        this.itemEraseMap.forEach((index: cc.Vec2, uuid: string) => {
            this.eraseItemCount++
            this.dataTable[index.x][index.y].node.emit(GameItem.EVENT.ERASE)

            //model中清除
            this.dataTable[index.x][index.y].type = GameItem.ItemType.Undefine.type
            this.dataTable[index.x][index.y].mask = GameItem.ItemType.Undefine.mask
            this.dataTable[index.x][index.y].node = null
        })
    }

    //执行移动，移动itemMoveMap中的元素
    doMove() {
        //console.log("do move")
        this.itemMoveMap.forEach((index: cc.Vec2, uuid: string) => {
            this.dataTable[index.x][index.y].node.emit(GameItem.EVENT.MOVE, this.view.getPosition(index.x, index.y))
        })
    }

    //上
    posUp(pos: cc.Vec2) { return pos.add(cc.v2(1, 0)) }

    //左
    posLeft(pos: cc.Vec2) { return pos.add(cc.v2(0, -1)) }

    //右
    posRight(pos: cc.Vec2) { return pos.add(cc.v2(0, 1)) }

    //下
    posDown(pos: cc.Vec2) { return pos.add(cc.v2(-1, 0)) }

    //左上
    posLU(pos: cc.Vec2) { return pos.add(cc.v2(1, -1)) }

    //右上
    posRU(pos: cc.Vec2) { return pos.add(cc.v2(1, 1)) }

    //左下
    posLD(pos: cc.Vec2) { return pos.add(cc.v2(-1, -1)) }

    //右下
    posRD(pos: cc.Vec2) { return pos.add(cc.v2(-1, 1)) }

    findErasable(): Array<PosPair> {
        let allRet: Array<PosPair> = []
        //let sameTypeArr:Array<cc.Vec2> = []
        for (let row = 0; row < this.rowCount; row++) {
            for (let col = 0; col < this.colCount; col++) {  //12种情况
                let posM = cc.v2(row, col)
                /******** 1表示相同的类型，0表示随意类型 1
                * 010
                * 101
                ********/
                if (this.isSameType(posM, this.posLD(posM), this.posRD(posM))) {
                    allRet.push(new PosPair(posM, this.posDown(posM)))
                }

                /******** 1表示相同的类型，0表示随意类型 2
                * 101
                * 010
                ********/
                if (this.isSameType(posM, this.posLU(posM), this.posRU(posM))) {
                    allRet.push(new PosPair(posM, this.posUp(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 3
                    * 010
                    * 100
                    * 010
                    ********/
                if (this.isSameType(posM, this.posRD(posM), this.posRU(posM))) {
                    allRet.push(new PosPair(posM, this.posRight(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 4
                    * 010
                    * 001
                    * 010
                    ********/
                if (this.isSameType(posM, this.posLU(posM), this.posLD(posM))) {
                    allRet.push(new PosPair(posM, this.posLeft(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 5
                    * 110
                    * 001
                    ********/
                if (this.isSameType(posM, this.posLeft(posM), this.posRD(posM))) {
                    allRet.push(new PosPair(this.posRD(posM), this.posRight(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 6
                    * 001
                    * 110
                    ********/
                if (this.isSameType(posM, this.posLeft(posM), this.posRU(posM))) {
                    allRet.push(new PosPair(this.posRU(posM), this.posRight(posM)))
                }

                /******** 1表示相同的类型，0表示随意类型 7
                    * 100
                    * 011
                    ********/
                if (this.isSameType(posM, this.posRight(posM), this.posLU(posM))) {
                    allRet.push(new PosPair(this.posLU(posM), this.posLeft(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 8
                    * 011
                    * 100
                    ********/
                if (this.isSameType(posM, this.posLD(posM), this.posRight(posM))) {
                    allRet.push(new PosPair(this.posLD(posM), this.posLeft(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 9
                    * 010
                    * 010
                    * 100
                    ********/
                if (this.isSameType(posM, this.posLD(posM), this.posUp(posM))) {
                    allRet.push(new PosPair(this.posLD(posM), this.posDown(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 10
                    * 010
                    * 010
                    * 001
                    ********/
                if (this.isSameType(posM, this.posRD(posM), this.posUp(posM))) {
                    allRet.push(new PosPair(this.posRD(posM), this.posDown(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 11
                    * 100
                    * 010
                    * 010
                    ********/
                if (this.isSameType(posM, this.posLU(posM), this.posDown(posM))) {
                    allRet.push(new PosPair(this.posLU(posM), this.posUp(posM)))
                }
                /******** 1表示相同的类型，0表示随意类型 12
                    * 001
                    * 010
                    * 010
                    ********/
                if (this.isSameType(posM, this.posDown(posM), this.posRU(posM))) {
                    allRet.push(new PosPair(this.posRU(posM), this.posUp(posM)))
                }
            }
        }
        
        return allRet
    }

    //
    onOneMoveEnd(uuid: string) {
        if (this.itemMoveMap.has(uuid)) {
            this.itemMoveMap.delete(uuid)

            if (this.itemMoveMap.size == 0) {//所有移动完成

                if(ActionType.SWAP == this.lastAction){
                    console.log("移动无效，请重新操作")
                    return
                }

                let erasableItems = this.checkAll()

                if (erasableItems.length > 0) { //可以消除

                    for (let item of erasableItems) {
                        //UI中消除
                        this.itemEraseMap.set(this.dataTable[item.x][item.y].node.uuid, item)
                    }
                    this.doErase()
                } else {
                    if (ActionType.TRY_SWAP == this.lastAction) { //如果上次操作是尝试交换两个元素，那么可以还原
                        this.swap(this.swapTemp[0], this.swapTemp[1])
                    } else if(ActionType.AUTO_MOVE == this.lastAction){ //判断是否让当前玩家继续行动
                        //检查是否有可移动消除的元素，没有则重新初始化棋盘

                        this.currentAllMovable = this.findErasable()
                        if(this.currentAllMovable.length == 0){
                            this.clear()
                            return
                        }

                        if (this.continuousEraseCount > 2 || this.eraseItemCount > 5) {
                            //TODO 提示可以继续行动
                            if(this.isPlayerTurn){
                                console.log("玩家可以继续行动")
                            }else{
                                console.log("机器人可以继续行动")
                                this.robotAction()
                            }
                        } else {
                            this.changeTurn()
                        }
                    }
                }
            }
        } else {
            console.error("the uuid is not in itemMoveMap,", uuid)
        }
    }

    //
    onOneEraseEnd(uuid: string) {
        if (this.itemEraseMap.has(uuid)) {
            //被消除的元素记录到对应的玩家
            let index: cc.Vec2 = this.itemEraseMap.get(uuid)
            if(ActionType.CLEAR != this.lastAction) {
                if (this.isPlayerTurn) {
                    this.player.addItem(this.dataTable[index.x][index.y].type,1)
                } else {
                    this.robot.addItem(this.dataTable[index.x][index.y].type,1)
                }
            }

            //TODO 跟新能量变化数据到客户端

            this.itemEraseMap.delete(uuid)
            if (this.itemEraseMap.size == 0) { //所有消除动作完成

                if(ActionType.CLEAR == this.lastAction){
                    console.log("移动无效，请重新操作")

                    this.build()
                    this.view.show()

                    if (this.continuousEraseCount > 2 || this.eraseItemCount > 5) {
                        //TODO 提示可以继续行动
                        if(this.isPlayerTurn){
                            console.log("玩家可以继续行动")
                        }else{
                            console.log("机器人可以继续行动")
                            this.robotAction()
                        }
                    } else {
                        this.changeTurn()
                    }
                    
                    return
                }else{
                    this.fall()
                }
            }
        }
    }

    //玩家行动后
    onTrySwap(index1: cc.Vec2, index2: cc.Vec2) {
        this.eraseItemCount = 0;

        this.lastAction = ActionType.TRY_SWAP
        this.swap(index1, index2)
    }

    constructor(view: BoardView) {
        this.view = view

        this.rowCount = 6
        this.colCount = 7

        this.itemNodePool = ItemNodePool.GetInstance()
        this.player = new Player()
        this.robot = new Player()
    }

    clear(){
        for (let i = 0; i < this.rowCount; i++) {
            for (let j = 0; j < this.colCount; j++) {
                this.dataTable[i][j].node.emit(GameItem.EVENT.ERASE)
            }
        }

        this.dataTable = []
    }

    build(){
        //build
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


        if(this.findErasable().length == 0){ //rebuild
            console.log("rebuild......")
            this.build()
        }else{ //createItem

        }
    }

    init() {
        EventRouter.register(GameItem.EVENT.ERASE_END, this.onOneEraseEnd, this)
        EventRouter.register(GameItem.EVENT.MOVE_END, this.onOneMoveEnd, this)
        EventRouter.register(ItemModel.EVENT.TRY_SWAP, this.onTrySwap, this)

        this.build()

        let erasable = this.checkAll()
        if (erasable.length > 0) {
            console.log("fuck !!!! ERROR!!! init done, check all: ", erasable)
        }

        this.isPlayerTurn = true;
    }

    //游戏开始
    gameStart() {
        if (this.isPlayerTurn) {
            //TODO 提示玩家可以行动， 时钟开始计时
        }
    }

    isValidIndex(index: cc.Vec2) {
        return index.x >= 0 && index.x < this.rowCount && index.y >= 0 && index.y < this.colCount
    }


    //交换两个元素
    private swap(index1: cc.Vec2, index2: cc.Vec2) {
        this.swapTemp = []

        if (this.isValidIndex(index1) && this.isValidIndex(index2)) {
            let tempData = this.dataTable[index1.x][index1.y]
            this.dataTable[index1.x][index1.y] = this.dataTable[index2.x][index2.y]
            this.dataTable[index2.x][index2.y] = tempData

            //使用动画在ui中交换位置
            this.itemMoveMap.set(this.dataTable[index2.x][index2.y].node.uuid, index1)
            this.itemMoveMap.set(this.dataTable[index1.x][index1.y].node.uuid, index2)
            this.lastAction = ActionType.SWAP

            this.swapTemp.push(index1, index2)
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
                        } else { // 如果不大于3，清空时应保留队尾的百搭元素 和 同类型元素
                            let arr = tempArr
                            tempArr = []
                            for (let index = arr.length - 1; index >= 0; index--) {
                                if (this.isSameType(cc.v2(row, col), cc.v2(arr[index].x, arr[index].y))) {
                                    tempArr.push(arr[index])
                                } else {
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
                        } else { // 如果不大于3，清空时应保留队尾的百搭元素
                            let arr = tempArr
                            tempArr = []
                            for (let index = arr.length - 1; index >= 0; index--) {
                                if (this.isSameType(cc.v2(row, col), cc.v2(arr[index].x, arr[index].y))) {
                                    tempArr.push(arr[index])
                                } else {
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
        return this.distinct<cc.Vec2>(retArr, (v: cc.Vec2) => { return v.toString() })
    }

    private getEmptyIndex() {
        let arr: cc.Vec2[] = []
        for (let row = 0; row < this.dataTable.length; row++) {
            for (let col = 0; col < this.dataTable[row].length; col++) {
                if (this.dataTable[row][col].type == GameItem.ItemType.Undefine.type) {
                    arr.push(cc.v2(row, col))
                }
            }
        }

        return arr
    }

    //使空白上方的元素落下
    private fall() {
        //this.printDataTable()
        let emptyIndexs = this.getEmptyIndex()
        if(emptyIndexs.length >0 ){
            this.lastAction = ActionType.AUTO_MOVE
        }else{
            console.error("big error： 没有可下落的元素！！！")
        }
        let nodeMap: Map<number, Array<Data>> = new Map<number, Array<Data>>() //存放每列新增的对象
        for (let index of emptyIndexs) {
            let type = this._generateItem()
            let data = new Data()
            data.type = type
            data.mask = GameItem.ItemType[type].mask
            data.node = ItemNodePool.GetInstance().createItem(type)

            if (nodeMap.has(index.y)) {
                nodeMap.get(index.y).push(data)
            } else {
                nodeMap.set(index.y, new Array<Data>())
                nodeMap.get(index.y).push(data)
            }
        }

        let emptyCount = 0 //元素下方的空格子数
        nodeMap.forEach((value: Data[], key: number) => {
            let rowCount = this.dataTable.length

            for (let row = 0; row < rowCount; row++) { //key 就是列索引
                if (this.dataTable[row][key].type == GameItem.ItemType.Undefine.type) {
                    emptyCount++
                } else if (emptyCount > 0) {
                    this.move(cc.v2(row, key), cc.v2(row - emptyCount, key))
                }
            }


            let count = emptyCount

            for (let data of value) { //value 是一列新增的元素

                let from = cc.v2(rowCount + (emptyCount - (count)), key)
                let to = cc.v2(rowCount - (count--), key)

                //初始化位置
                //data.node.setPosition()
                if (!data.node) {
                    console.log("BIG ERROR")
                }
                //UI中位置移动 
                this.put(data, from, to)
            }
            emptyCount = 0
        })
        //this.printDataTable()
        this.doMove()
    }

    printDataTable() {
        for (let row = this.dataTable.length - 1; row >= 0; row--) {
            let types = []
            for (let data of this.dataTable[row]) {
                types.push(data.type)
            }
            console.log(types.join("\t"))
        }
    }

    private put(itemData: Data, from: cc.Vec2, to: cc.Vec2) {


        //console.log("put ", itemData.type,"from ",from.toString(), " to ", to.toString())
        //model中数据移动
        this.dataTable[to.x][to.y] = itemData

        //添加到棋盘中
        this.view.chessBoard.addChild(itemData.node)

        //初始化位置
        itemData.node.setPosition(this.view.getPosition(from.x, from.y))

        //UI中位置移动,加入移动队列
        this.itemMoveMap.set(itemData.node.uuid, to)
    }

    //移动节点 from是棋盘上未被消除的元素，to是消除了的空格
    private move(from: cc.Vec2, to: cc.Vec2) {
        // console.log("move from ", from.toString() ," to ", to.toString())
        //model中数据移动
        this.dataTable[to.x][to.y] = this.dataTable[from.x][from.y]

        //UI中位置移动,加入移动队列
        this.itemMoveMap.set(this.dataTable[to.x][to.y].node.uuid, to)
    }

    //去重 据说这个方法比set快 feature取元素的特征值，即唯一值。
    distinct<T>(arr: T[], feature: (v: T) => string) {
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

    isSameType(index1: cc.Vec2, index2: cc.Vec2): boolean;
    isSameType(index1: cc.Vec2, index2: cc.Vec2[]): boolean;
    isSameType(index1: cc.Vec2, index2: cc.Vec2, index3: cc.Vec2): boolean;

    isSameType(index1: cc.Vec2, index2: any, index3?: cc.Vec2): boolean {
        let maskRet = this.dataTable[index1.x][index1.y].mask

        if (index2 instanceof Array) {
            for (let index of (index2 as Array<cc.Vec2>)) {
                maskRet = maskRet & this.dataTable[index.x][index.y].mask
                if (0 == maskRet) {
                    break
                }
            }
        } else if (!index3) {
            let index = index2 as cc.Vec2
            maskRet = maskRet & this.dataTable[index.x][index.y].mask
        } else {
            if (this.isValidIndex(index1) && this.isValidIndex(index2) && this.isValidIndex(index3)) {
                maskRet = (maskRet & this.dataTable[index2.x][index2.y].mask) == 0 || (maskRet & this.dataTable[index3.x][index3.y].mask) == 0 ? 0 : 1
            }else{
                maskRet = 0
            }
        }


        return maskRet != 0
    }

    //初始化过程中检查改坐标点不该出现的元素（如果出现会引起三个连续的同色）
    private getExclude(row: number, col: number): string[] {
        let arr: string[] = []
        if (row > 1) {
            //if (this.dataTable[row - 1][col].type == this.dataTable[row - 2][col].type) {
            if (this.isSameType(cc.v2(row - 1, col), cc.v2(row - 2, col))) {
                arr.push(this.dataTable[row - 1][col].type)
                arr.push(this.dataTable[row - 2][col].type)
                if ((this.dataTable[row - 1][col].mask & GameItem.ItemType.ItemRainbow.mask) > 0) { //如果其中的元素和百搭元素可消除则把百搭元素添加到排除列表中
                    arr.push(GameItem.ItemType.ItemRainbow.type)

                    //如果两个元素都为百搭元素，则把普通元素都加到排除列表中
                    if ((this.dataTable[row - 2][col].type == GameItem.ItemType.ItemRainbow.type) &&
                        (this.dataTable[row - 1][col].type == GameItem.ItemType.ItemRainbow.type)) {
                        arr.push(GameItem.ItemType.Item1.type, GameItem.ItemType.Item2.type, GameItem.ItemType.Item3.type, GameItem.ItemType.Item4.type)
                    }
                }
            }
        }

        if (col > 1) {
            //if (this.dataTable[row][col - 1].type == this.dataTable[row][col - 2].type) {
            if (this.isSameType(cc.v2(row, col - 1), cc.v2(row, col - 2))) {
                arr.push(this.dataTable[row][col - 1].type)
                arr.push(this.dataTable[row][col - 2].type)
                if ((this.dataTable[row][col - 2].mask & GameItem.ItemType.ItemRainbow.mask) > 0) { //如果其中的元素和百搭元素可消除则把百搭元素添加到排除列表中
                    arr.push(GameItem.ItemType.ItemRainbow.type)

                    //如果两个元素都为百搭元素，则把普通元素都加到排除列表中
                    if ((this.dataTable[row][col - 1].type == GameItem.ItemType.ItemRainbow.type) &&
                        (this.dataTable[row][col - 2].type == GameItem.ItemType.ItemRainbow.type)) {
                        arr.push(GameItem.ItemType.Item1.type, GameItem.ItemType.Item2.type, GameItem.ItemType.Item3.type, GameItem.ItemType.Item4.type)
                    }
                }
            }
        }
        return this.distinct<string>(arr, (v: string) => { return v });
    }

    //返回ItemEnum的一个索引；exclude 要排除的项
    private _generateItem(exclude: string[] = []): string {
        if (exclude.indexOf(GameItem.ItemType.Undefine.type) < 0) { //排除Undefine，即保证生成结果不会是Undefine
            exclude.push(GameItem.ItemType.Undefine.type)
        }
        exclude = this.distinct(exclude, (v) => { return v }) //去重

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