import BoardView from './BoardView';

let ItemEnum = {
    Undefine: { id: 1, src: "", node: null },
    Purple1: { id: 2, src: "Purple1", node: null },
    Purple2: { id: 3, src: "Purple2", node: null },
    Purple3: { id: 4, src: "Purple3", node: null },
    Blue1: { id: 5, src: "Blue1", node: null },
    Blue2: { id: 6, src: "Blue2", node: null },
    Blue3: { id: 7, src: "Blue3", node: null },
    Yellow1: { id: 8, src: "Yellow1", node: null },
    Yellow2: { id: 9, src: "Yellow2", node: null },
    Yellow3: { id: 10, src: "Yellow3", node: null }
}

export default class ItemModel {

    constructor(view: BoardView) {
        this.view = view

        this.rowCount = 3
        this.colCount = 3
    }

    view: BoardView

    init() {
        for (let i = 0; i < this.rowCount; i++) {
            this.dataTable.push([])
            for (let j = 0; j < this.colCount; j++) {
                this.dataTable[i][j] = ItemEnum.Purple1.id
            }
        }
    }


    _checkLeft(row: number, col: number): boolean {
        let ret = false
        if (col >= 3) {
            ret = this.dataTable[row][col] == this.dataTable[row][col - 1] && this.dataTable[row][col] == this.dataTable[row][col - 2]
        }
        return ret
    }

    _checkUp(row: number, col: number): boolean {
        let ret = false
        if (row >= 3) {
            ret = this.dataTable[row][col] == this.dataTable[row - 1][col] && this.dataTable[row][col] == this.dataTable[row - 2][col]
        }
        return ret
    }

    //返回ItemEnum的一个索引；excpet 要排除的项，ItemEnum中的索引
    _createItem(excpet: number[]): number {
        let excpetLen = excpet ? excpet.length : 0
        let typeCount = Object.keys(ItemEnum).length - 1 //-1 减去未定义类型
        let v = Math.floor(Math.random() * (typeCount - excpetLen)) + 1 // 

        let item = 1
        if (excpetLen > 0) {
            for (let itemIndex = 1; itemIndex <= typeCount; itemIndex++) {
                if (excpet.indexOf(itemIndex) >= 0) {
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

    //private:
    rowCount: number
    colCount: number

    dataTable: Array<Array<number>> = []
}