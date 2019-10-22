import GameItem from './GameItem';
 
class ItemPrefab{
    prefab:cc.Prefab
    nodePool:cc.NodePool

   constructor(prefab:cc.Prefab){
        this.prefab = prefab
        this.nodePool = new cc.NodePool() //TODO 是否要传参？
   }
}

class ItemNodePool {

    static GetInstance(){
        if(! ItemNodePool.instance)
        {
            ItemNodePool.instance = new ItemNodePool() 
        }

        return ItemNodePool.instance
    }

    static instance:ItemNodePool

    private constructor(){
        this.prefabMap = new Map<string,ItemPrefab>()
    }

    //存储所有元素资源
    private prefabMap:Map<string,ItemPrefab>

    public preLoad(completeCall?:()=>void){
        cc.loader.loadResArray
        cc.loader.loadResDir("prefabs/itemNode/",cc.Prefab,(error: Error, resource: any[], urls: string[])=>{
            for(let res of resource)
            {
                let prefab = <cc.Prefab>res
                if(prefab){
                    if(GameItem.ItemType[prefab.name]){
                        if(!this.prefabMap.has(prefab.name)){
                            this.prefabMap.set(prefab.name,new ItemPrefab(prefab))
                        }else{ //元素资源名称重复
                            console.error(prefab.name," 元素资源名称重复,在编辑器中检查预制体的名称")
                        }
                    }else{  //加载的资源不在预先定义的资源中，所有资源必须是在GameItem.ItemType中定义过
                        console.error(prefab.name," 加载的资源不在预先定义的资源中,检查预制体的名称和GameItem.ItemType")
                    }
                }else{ //所加载的资源不是cc.Prefab类型，这个应该不可能发生
                    console.error(prefab.name," 所加载的资源不是cc.Prefab类型")
                }
                // this.prefabs.push(res)
                // this.prefabPools.push(new cc.NodePool())
            }
            if(completeCall){
                if(this.prefabMap.size != Object.keys(GameItem.ItemType).length - 1){ //加载元素资源数量和资源的类型数量不相等,减1是因为有个Undefine类型
                    console.error("加载元素资源数量和资源的类型数量不相等")
                }
                completeCall()
            }
        })
    }

    createItem(type:string){
        if(!this.prefabMap.has(type)){
            console.error("类型：",type," 资源不存在")
            return null
        }
        let node:cc.Node
        let nodepool = this.prefabMap.get(type).nodePool
        let prefab = this.prefabMap.get(type).prefab
        if(nodepool.size() > 0){
            node = nodepool.get(nodepool)
        }else{
            node = cc.instantiate(prefab)
            let comp = node.getComponent("GameItem") as GameItem
            if(comp){
                comp._pool = nodepool
            }else{
                console.trace("获取GameItem组件失败")
            }
        }

        return node
    }

    // createItem(index:number){
    //     if(index<0 || index >= this.prefabs.length){
    //         return null
    //     }
    //     let node:cc.Node
    //     if(this.prefabPools[index].size() > 0){
    //         node = this.prefabPools[index].get(this.prefabPools[index])
    //     }else{
    //         node = cc.instantiate(this.prefabs[index])
    //         let comp = node.getComponent("GameItem") as GameItem
    //         if(comp){
    //             comp._pool = this.prefabPools[index]
    //         }
    //     }

    //     return node
    // }

    // GetItemTypeCount(){
    //     return Object.keys(GameItem.ItemType).length
    // }

    //prefabPools:Array<cc.NodePool>=[]
    //prefabs:Array<cc.Prefab>=[]
}

export default ItemNodePool