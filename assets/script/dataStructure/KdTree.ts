import { MaxHeap } from './Heap';
/*
 * @Author: hyrm 
 * @Date: 2024-05-20 00:28:15 
 * @Last Modified by: hyrm
 * @Last Modified time: 2024-06-13 11:36:16
 */
export type Pos = Array<number> | { x: number, y: number }


export class KdTree<T extends { pos: Pos }> {

    private axis: number
    private data: T
    private left: KdTree<T> | null
    private right: KdTree<T> | null

    constructor(data: T, left: KdTree<T>, right: KdTree<T>, axis: number) {
        this.axis = axis
        this.data = data
        this.left = left
        this.right = right
    }

    /**
     * 返回到叶节点访问路径
     * @param point 
     * @returns 
     */
    public serach2Leaf(point: Pos): Array<KdTree<T>> {
        if (!Array.isArray(point)) point = [point.x, point.y]

        const result: Array<KdTree<T>> = []

        let current: KdTree<T> | null = this
        while (current) {
            result.push(current)
            let currentPos = current.data.pos[current.axis]
            if (!Array.isArray(current.data.pos)) currentPos = [current.data.pos.x, current.data.pos.y][current.axis]

            if (point[current.axis] < currentPos) {
                current = current.left
            } else {
                current = current.right
            }
        }

        return result
    }

    /**
     * k-近邻搜索(k>=1),k=1即最近邻近点
     * @param point 目标点
     * @param k 近邻个数
     * @param maxHeap
     * @returns 
     */
    public searchKNearest(point: Pos, k: number = 1, maxHeap?: MaxHeap<{ value: number, data: T }>): Array<{ value: number, data: T }> {
        if (!Array.isArray(point)) point = [point.x, point.y]

        // 初始化大顶堆，类top-k算法，维护一个节点数为k的最大堆
        if (!maxHeap) {
            maxHeap = new MaxHeap<{ value: number, data: T }>([])
            for (let i = 0; i < k; i++) maxHeap.push({ value: Infinity, data: null })
        }

        let stack: Array<KdTree<T>> = this.serach2Leaf(point)

        //叶节点路径回溯
        while (stack.length) {
            const topNearestDistance = maxHeap.peek().value

            const current: KdTree<T> = stack.pop()
            const currentDistance = KdTree.distance(point, current.data.pos)

            // 小于大顶堆顶，替换加入堆中
            if (currentDistance < topNearestDistance && (point[0] !== current.data.pos[0] && point[1] !== current.data.pos[1])) {
                maxHeap.pop()
                maxHeap.push({ value: currentDistance, data: current.data })
            }

            // 判断与超平面分割线相交，子树加入搜索区间
            if (Math.abs(point[current.axis] - current.data.pos[current.axis]) < topNearestDistance) {

                let next: KdTree<T> | null
                if (point[current.axis] < current.data.pos[current.axis]) {
                    next = current.right
                } else {
                    next = current.left
                }

                // 子树存在，加入回溯栈
                if (next) stack = stack.concat(next.serach2Leaf(point))
            }
        }

        return maxHeap.toArray()
    }

    /**
     * 目标点给定范围(半径)搜索邻居
     * @param point 目标点
     * @param radius 半径
     * @param maxHeap 
     * @returns 
     */
    public searchNeiborRadius(pos: Pos, radius: number, maxHeap?: MaxHeap<{ value: number, data: T }>): Array<{ value: number, data: T }> {
        if (!Array.isArray(pos)) pos = [pos.x, pos.y]

        let stack: Array<KdTree<T>> = this.serach2Leaf(pos)

        // 初始化大顶堆，类top-k算法，维护一个节点数为k的最大堆
        if (!maxHeap) maxHeap = new MaxHeap<{ value: number, data: T }>([])

        while (stack.length) {

            const current: KdTree<T> = stack.pop()
            const currentDistance = KdTree.distance(pos, current.data.pos)

            if (currentDistance <= radius) {
                if (maxHeap.size >= 10) maxHeap.pop()
                maxHeap.push({ value: currentDistance, data: current.data })
            }

            // 判断与超平面分割线相交，子树加入搜索区间
            let currentPos = current.data.pos[current.axis]
            if (!Array.isArray(current.data.pos)) currentPos = [current.data.pos.x, current.data.pos.y][current.axis]

            if (Math.abs(pos[current.axis] - currentPos) < radius) {

                let next: KdTree<T> | null
                if (pos[current.axis] < currentPos) {
                    next = current.right
                } else {
                    next = current.left
                }

                // 子树存在，加入回溯栈
                if (next) stack = stack.concat(next.serach2Leaf(pos))
            }
        }

        return maxHeap.toArray()
    }

    /**
     * 构建k维树
     * @param points 点集
     * @param axis 切割轴(切割维度)
     * @param k 维度
     * @returns 
     */
    static build<T extends { pos: Pos }>(datas: Array<T>, axis: number = 0, k: number = 2): KdTree<T> | null {
        if (datas.length === 0) return null

        datas = KdTree.sortByAxis(datas, axis)

        const midIndex = Math.floor(datas.length / 2)
        const leftPoints = datas.slice(0, midIndex)
        const rightPoints = datas.slice(midIndex + 1)

        return new KdTree<T>(datas[midIndex], KdTree.build(leftPoints, (axis + 1) % k), KdTree.build(rightPoints, (axis + 1) % k), axis)

    }

    /**
     * 俩点之间距离
     * @param a 
     * @param b 
     * @returns 
     */
    static distance(a: Pos, b: Pos): number {
        if (!Array.isArray(a)) a = [a.x, a.y]
        if (!Array.isArray(b)) b = [b.x, b.y]
        return Math.sqrt(a.reduce((acc, cur, index) => acc + (cur - b[index]) ** 2, 0))
    }

    /**
     * 按照给定维度对点集排序
     * @param points 点集
     * @param axis 轴(维度)
     * @returns 
     */
    static sortByAxis<T extends { pos: Pos }>(datas: Array<T>, axis: number): Array<T> {
        return datas.sort((a, b) => {
            let aPos = a.pos[axis]
            let bPos = b.pos[axis]

            if (!Array.isArray(a.pos)) aPos = [a.pos.x, a.pos.y][axis]
            if (!Array.isArray(b.pos)) bPos = [b.pos.x, b.pos.y][axis]

            return aPos - bPos
        })
    }

}