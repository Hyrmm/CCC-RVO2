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
        const neighbors = Simulator.agentsTree.searchNeiborRadius(this.pos, 50)

        if (neighbors.length <= 1) return this.velocity = this.prefVelocity


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
            this.orcaLines.push(line)
        }

        this.velocity = cc.v3(0, 0, 0)
        const lineFail = this.linearProgram2(this.orcaLines, this.radius / 2, this.prefVelocity, false, this.velocity)

        if (lineFail < this.orcaLines.length) {
            this.linearProgram3(this.orcaLines, 0, lineFail, this.radius, this.velocity)
        }
    }

    public calcPrefVelocity() {
        let prefVelocity = this.targetPos.sub(this.node.position).normalize()

        if (this.targetPos.sub(this.node.position).mag() <= 5) return this.prefVelocity = prefVelocity.mul(1 / Simulator.deltTime)

        this.prefVelocity = prefVelocity
    }

    public linearProgram2(lines: Line[], radius: number, optVelocity: cc.Vec3, directionOpt: boolean, result: cc.Vec3): number {


        if (directionOpt) {
            result.set(optVelocity.mul(radius))
        }
        else if (Math.abs(optVelocity.mag()) ** 2 < radius ** 2) {
            result.set(optVelocity.normalize().mul(radius))
        }
        else {
            result.set(optVelocity)
        }

        for (const [index, line] of lines.entries()) {

            if (Utils.det(line.direction, line.point.sub(result)) > 0) {
                let tempResult = result.clone()
                if (!this.linearProgram1(lines, index, radius, optVelocity, directionOpt, result)) {
                    result.set(tempResult)
                    return index
                }
            }
        }

        return lines.length
    }

    public linearProgram1(lines: Line[], index: number, radius: number, optVelocity: cc.Vec3, directionOpt: boolean, result: cc.Vec3): boolean {

        const dotProduct = lines[index].point.dot(lines[index].direction)
        const discriminant = dotProduct ** 2 + radius ** 2 - optVelocity.mag() ** 2

        if (discriminant < 0) return false

        const sqrtDiscriminant = Math.sqrt(discriminant)

        let tLeft = -dotProduct - sqrtDiscriminant
        let tRigt = -dotProduct + sqrtDiscriminant

        for (let i = 0; i < index; i++) {
            const denominator = Utils.det(lines[index].direction, lines[i].direction)
            const numerator = Utils.det(lines[i].direction, lines[index].point.sub(lines[i].point))

            if (Math.abs(denominator) < 0.00001) {
                if (numerator < 0) return false
                continue
            }


            const t = numerator / denominator

            if (denominator > 0) {
                tRigt = Math.min(tRigt, t)
            } else {
                tLeft = Math.max(tLeft, t)
            }

            if (tLeft > tRigt) return false


        }


        if (directionOpt) {

            if (optVelocity.dot(lines[index].direction) > 0) {
                result.set(lines[index].point.add(lines[index].direction.mul(tRigt)))
            } else {
                result.set(lines[index].point.add(lines[index].direction.mul(tLeft)))
            }

        } else {

            const t = lines[index].direction.dot(optVelocity.sub(lines[index].point))

            if (t < tLeft) {
                result.set(lines[index].point.add(lines[index].direction.mul(tLeft)))
            }
            else if (t > tRigt) {
                result.set(lines[index].point.add(lines[index].direction.mul(tRigt)))
            }
            else {
                result.set(lines[index].point.add(lines[index].direction.mul(t)))
            }

        }

        return true
    }

    public linearProgram3(lines: Line[], numObstLines: number, beginLine: number, radius: number, result: cc.Vec3): void {

        let distance = 0

        for (let i = beginLine; i < lines.length; i++) {
            if (Utils.det(lines[i].direction, lines[i].point.sub(result)) > distance) {

                const projLines = []

                // for (let j = 0; j < numObstLines; j++) {
                //     // projLines.push(lines[j])
                // }
                // 2.动态阻挡的orca线需要重新计算line，从第一个非静态阻挡到当前的orca线
                for (let k = numObstLines; k < i; k++) {
                    let line = new Line();

                    let determinant = Utils.det(lines[i].direction, lines[k].direction)

                    if (Math.abs(determinant) <= 0.00001) {

                        if (lines[i].direction.dot(lines[k].direction) > 0.0) {
                            continue
                        }
                        else {
                            line.point = lines[i].point.add(lines[k].point).mul(0.5)
                        }
                    }
                    else {

                        const v1 = Utils.det(line[k].direction, line[i].point.sub(line[k].point)) / determinant
                        line.point = lines[i].point.add(lines[i].direction.mul(v1))
                    }

                    line.direction = lines[k].direction.sub(lines[i].direction).normalize()
                    projLines.push(line)
                }

                const tempResult = result.clone()
                if (this.linearProgram2(projLines, radius, cc.v3(-lines[i].direction.y, lines[i].direction.x, 0), true, result) < projLines.length) {
                    result.set(tempResult)
                }
                distance = Utils.det(lines[i].direction, lines[i].point.sub(result))
            }


        }
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