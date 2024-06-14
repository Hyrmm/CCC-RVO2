/*
 * @Author: hyrm 
 * @Date: 2024-05-21 09:44:10 
 * @Last Modified by: hyrm
 * @Last Modified time: 2024-06-14 14:52:05
 */

import { KdTree } from '../dataStructure/KdTree';

export class Line {
    public point: cc.Vec2
    public direction: cc.Vec2
}

export class Agent {

    public id: number
    public radius: number
    public weight: number

    public pos: Array<number>
    public position: cc.Vec2
    public targetPos: cc.Vec2

    public velocity: cc.Vec2
    public prefVelocity: cc.Vec2

    constructor(pos: cc.Vec2) {
        this.id = Simulator.agents.push(this)

        this.pos = [pos.x, pos.y]
        this.position = pos

        this.radius = 5
        this.weight = 0.5

        this.velocity = cc.v2(0, 0)
        this.prefVelocity = cc.v2(0, 0)
    }

    public calcNewVelocity() {

        const neighbors = Simulator.agentsTree.searchNeiborRadius(this.pos, this.radius)

        for (const neighbor of neighbors) {

            const otherAgent = neighbor.data

            const relativePosition = otherAgent.position.sub(this.position)
            const relativeVelocity = this.velocity.sub(otherAgent.velocity)

            const distSq = relativePosition.mag() ** 2
            const combinedRadius = this.radius + otherAgent.radius
            const combinedRadiusSq = combinedRadius ** 2

            const invTimestep = 1 / Simulator.deltTime

            const line = new Line()
            let u: cc.Vec2

            if (distSq > combinedRadiusSq) {
                // 未碰撞
            } else {
                // 已碰撞
                const w = relativeVelocity.sub(relativePosition.mul(invTimestep))
                u = w.normalize().mul(combinedRadius * invTimestep - w.mag())
                line.direction = cc.v2(w.normalize().y, -w.normalize().x)
            }

            line.point = this.velocity.add(u)
            console.log(line)
        }
        console.log(this, neighbors)
    }
}

export class Simulator {

    static agents: Array<Agent> = []
    static agentsTree: KdTree<Agent> = null
    static deltTime: number = 0

    static execute(dt: number): void {

        // 更新帧时间
        this.deltTime = dt

        // 重新构建KdTree
        this.agentsTree = KdTree.build(this.agents)

        // 更新避障后的速度
        this.agents.forEach(agent => agent.calcNewVelocity())
    }

    static addAgent(pos: cc.Vec2): Agent {
        return new Agent(pos)
    }

    static getAgent(id: number): Agent {
        return this.agents[id]
    }

}