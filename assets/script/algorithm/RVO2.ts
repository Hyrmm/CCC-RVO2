/*
 * @Author: hyrm 
 * @Date: 2024-05-21 09:44:10 
 * @Last Modified by: hyrm
 * @Last Modified time: 2024-06-14 14:52:05
 */

import { KdTree } from '../dataStructure/KdTree';

export class Line {
    public point: cc.Vec3
    public direction: cc.Vec3
}

export class Agent {

    public id: number
    public radius: number
    public weight: number

    public pos: Array<number>
    public targetPos: cc.Vec3

    public velocity: cc.Vec3 = cc.v3(0, 0, 0)
    public prefVelocity: cc.Vec3 = cc.v3(0, 0, 0)

    public node: cc.Node

    constructor(node: cc.Node) {
        this.id = Simulator.agents.push(this) - 1
        Simulator.agentId2Agent.set(this.id, this)

        this.pos = [node.position.x, node.position.y]
        this.targetPos = node.position

        this.radius = 35
        this.weight = 0.5
        this.node = node
    }


    public calcNewVelocity() {

        const neighbors = Simulator.agentsTree.searchNeiborRadius(this.pos, this.radius)

        for (const neighbor of neighbors) {

            const otherAgent = neighbor.data

            const relativePosition = otherAgent.node.position.sub(this.node.position)
            const relativeVelocity = this.prefVelocity.sub(otherAgent.prefVelocity)

            const distSq = relativePosition.mag() ** 2
            const combinedRadius = this.radius + otherAgent.radius
            const combinedRadiusSq = combinedRadius ** 2

            const invTimestep = 1 / Simulator.deltTime

            let u: cc.Vec3
            const line = new Line()


            if (distSq > combinedRadiusSq) {
                // 未碰撞
            } else {
                // 已碰撞
                const w = relativeVelocity.sub(relativePosition.mul(invTimestep))
                u = w.normalize().mul(combinedRadius * invTimestep - w.mag())
                line.direction = cc.v3(w.normalize().y, -w.normalize().x, 0)
            }

            // line.point = this.velocity.add(u)
        }

        this.velocity = this.prefVelocity
    }

    public calcPrefVelocity() {
        if (this.targetPos.sub(this.node.position).mag() == 0) return this.prefVelocity = cc.v3(0, 0, 0)

        let prefVelocity = this.targetPos.sub(this.node.position)
        if (prefVelocity.mag() > 1) prefVelocity = prefVelocity.normalize()

        this.prefVelocity = prefVelocity
    }
}

export class Simulator {

    static agents: Array<Agent> = []
    static agentsTree: KdTree<Agent> = null
    static agentId2Agent: Map<number, Agent> = new Map()

    static deltTime: number = 0

    static execute(dt: number): void {

        // 更新帧时间
        this.deltTime = dt

        // 重新构建KdTree
        this.agentsTree = KdTree.build([].concat(this.agents))

        // 更新期望速度
        this.agents.forEach(agent => agent.calcPrefVelocity())

        // 更新避障后的速度
        this.agents.forEach(agent => agent.calcNewVelocity())

        // 更新新速度确定后的位置
        this.agents.forEach(agent => { agent.node.position = agent.node.position.add(agent.velocity) })
    }

    static addAgent(node: cc.Node): Agent {
        return new Agent(node)
    }

    static getAgent(id: number): Agent {
        return this.agents[id]
    }

    static setAgentTargetPos(id: number, targetPos: cc.Vec3): void {
        const agent = this.getAgent(id)
        agent.targetPos = targetPos
    }

}