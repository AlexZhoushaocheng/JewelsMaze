import GameItem from './GameItem';
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
    }

    public preLoad(completeCall?:()=>void){
        cc.loader.loadResArray
        cc.loader.loadResDir("prefabs/itemNode/",cc.Prefab,(error: Error, resource: any[], urls: string[])=>{
            for(let res of resource)
            {
                this.prefabs.push(res)
                this.prefabPools.push(new cc.NodePool())
            }
            if(completeCall){
                completeCall()
            }
        })
    }

    createItem(index:number){
        if(index<0 || index >= this.prefabs.length){
            return null
        }
        let node:cc.Node
        if(this.prefabPools[index].size() > 0){
            node = this.prefabPools[index].get(this.prefabPools[index])
        }else{
            node = cc.instantiate(this.prefabs[index])
            let comp = node.getComponent("GameItem") as GameItem
            if(comp){
                comp._pool = this.prefabPools[index]
            }
        }

        return node
    }

    GetItemTypeCount(){
        return this.prefabs.length
    }

    prefabPools:Array<cc.NodePool>=[]
    prefabs:Array<cc.Prefab>=[]
}

export default ItemNodePool