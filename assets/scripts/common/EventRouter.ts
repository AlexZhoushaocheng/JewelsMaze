//事件广播，观察者

class EventRouter{

    static node:cc.Node = new cc.Node()

    static emit(type: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any){
        this.node.emit(type)
    }
    static register<T extends Function>(type: string, callback: T, target?: any, useCapture?: boolean): T{
        return this.node.on(type,callback,target,useCapture)
    }

}

export default EventRouter