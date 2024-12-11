/*
 * @Author: hyrm 
 * @Date: 2024-05-21 09:44:10 
 * @Last Modified by: hyrm
 * @Last Modified time: 2024-06-26 13:44:54
 */

import { KdTree } from '../dataStructure/KdTree';
import Utils from '../utils/Utils';

export class Line {
    public point: cc.Vec3
    public direction: cc.Vec3
}

export class Agent {
    public node: cc.Node

    public id: number
    public radius: number
    public weight: number

    public pos: Array<number>
    public targetPos: cc.Vec3

    public velocity: cc.Vec3 = cc.v3(0, 0, 0)
    public prefVelocity: cc.Vec3 = cc.v3(0, 0, 0)

    public orcaLines: Array<Line> = []

    constructor(node: cc.Node) {
        this.id = Simulator.agents.push(this) - 1
        Simulator.agentId2Agent.set(this.id, this)

        this.pos = [node.position.x, node.position.y]
        this.targetPos = node.position.clone()

        this.radius = 25
        this.weight = 0.5
        this.node = node
        this.velocity = cc.v3(0, 0, 0)
    }


    public calcNewVelocity() {
        this.orcaLines = []

        let newVelocity = this.prefVelocity.clone()
        const neighbors = Simulator.agentsTree.searchNeiborRadius(this.pos, 50)

        const invTimestep = 1 / Simulator.deltTime
        const invTimeHorizon = 1 / (Simulator.deltTime + 7)

        for (const neighbor of neighbors) {

            // 过滤自身
            if (neighbor.data.id === this.id) continue

            const otherAgent = neighbor.data

            const relativePosition = otherAgent.node.position.sub(this.node.position)
            const relativeVelocity = this.prefVelocity.sub(otherAgent.prefVelocity)

            const distSq = relativePosition.mag() ** 2
            const combinedRadius = this.radius + otherAgent.radius
            const combinedRadiusSq = combinedRadius ** 2



            let u: cc.Vec3
            const line = new Line()

            // 这里判断碰撞是预估值，比较俩个检测半径相和和距离
            if (distSq > combinedRadiusSq) {
                const w = relativeVelocity.sub(relativePosition.mul(invTimeHorizon))
                // 未碰撞 
                const dot = w.dot(relativePosition)
                const leg = Math.sqrt(distSq - combinedRadiusSq)

                if (dot < 0 && dot ** 2 > combinedRadiusSq * (w.mag() ** 2)) {

                    u = w.normalize().mul(combinedRadius * invTimeHorizon - w.mag())
                    line.direction = cc.v3(w.normalize().y, -w.normalize().x, 0)
                } else {

                    if (Utils.det(relativePosition, w) > 0) {
                        // 靠近左腿
                        line.direction = cc.v3(relativePosition.x * leg - relativePosition.y * combinedRadius, relativePosition.x * combinedRadius + relativePosition.y * leg, 0).div(distSq)
                    } else {
                        // 靠近右腿
                        line.direction = cc.v3(relativePosition.x * leg - relativePosition.y * combinedRadius, -relativePosition.x * combinedRadius + relativePosition.y * leg, 0).div(distSq).neg()
                    }

                    const dotProduct2 = relativeVelocity.dot(line.direction)
                    u = line.direction.mul(dotProduct2).sub(relativeVelocity)
                }

            } else {

                // 已碰撞
                const w = relativeVelocity.sub(relativePosition.mul(invTimestep))
                u = w.normalize().mul(combinedRadius * invTimestep - w.mag())
                line.direction = cc.v3(w.normalize().y, -w.normalize().x, 0)
            }

            line.point = this.velocity.add(u.mul(this.weight))
            newVelocity = this.prefVelocity.add(u.mul(this.weight))
            this.orcaLines.push(line)
        }

        this.velocity = newVelocity


    }

    public calcPrefVelocity() {
        let prefVelocity = this.targetPos.sub(this.node.position).normalize()

        if (this.targetPos.sub(this.node.position).mag() <= 5) return this.prefVelocity = prefVelocity.mul(1 / Simulator.deltTime)

        this.prefVelocity = prefVelocity
    }
}

export class Simulator {

    static agents: Array<Agent> = []
    static agentsTree: KdTree<Agent> = null
    static agentId2Agent: Map<number, Agent> = new Map()

    static deltTime: number = 0

    static execute(dt: number): void {
        if (!dt) return

        // 更新帧时间
        this.deltTime = dt * 1000 / 6
        // 重新构建KdTree
        this.agentsTree = KdTree.build([].concat(this.agents))

        // 更新期望速度
        this.agents.forEach(agent => agent.calcPrefVelocity())

        // 更新避障后的速度
        this.agents.forEach(agent => agent.calcNewVelocity())

        // 更新新速度确定后的位置
        this.agents.forEach(agent => {
            agent.node.position = agent.node.position.add(agent.velocity.mul(this.deltTime))
            agent.pos = [agent.node.position.x, agent.node.position.y]
        })
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