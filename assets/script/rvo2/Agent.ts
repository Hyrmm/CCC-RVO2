import Line from "./Line";
import Vector2 from "../math/Vector2";
import Simulator from "./Simulator";
import Utils from "../utils/Utils";

export default class Agent {


    public id: number
    public radius: number
    public weight: number

    public pos: Vector2
    public targetPos: Vector2

    public velocity: Vector2
    public prefVelocity: Vector2

    public orcaLines: Array<Line>

    constructor(id: number, pos: Vector2, radius: number) {

        this.id = id
        this.pos = new Vector2(pos.x, pos.y)
        this.radius = radius
        this.targetPos = new Vector2(pos.x, pos.y)

        // 默认参数
        this.weight = 0.5
        this.velocity = new Vector2(0, 0)
        this.prefVelocity = new Vector2(0, 0)
        this.orcaLines = []

    }
    public update() {
        this.pos = this.pos.plus(this.velocity.scale(Simulator.deltTime))
    }


    public calcNewVelocity() {
        this.orcaLines = []

        const neighbors = Simulator.agentsTree.searchNeiborRadius(this.pos, this.radius)

        for (const neighbor of neighbors) {

            // 过滤自身
            if (neighbor.data.id === this.id) continue

            const otherAgent = neighbor.data

            const relativePosition = otherAgent.pos.minus(this.pos)
            const relativeVelocity = this.prefVelocity.minus(otherAgent.prefVelocity)

            const distSq = relativePosition.absSq()
            const combinedRadius = this.radius + otherAgent.radius
            const combinedRadiusSq = combinedRadius ** 2

            const invTimestep = 1 / Simulator.deltTime
            const invTimeHorizon = 1 / Simulator.deltTime + 3

            let u: Vector2
            const line = new Line()

            // 这里判断碰撞是预估值，比较俩个检测半径相和和距离

            if (distSq > combinedRadiusSq) {
                const w = relativeVelocity.minus(relativePosition.scale(invTimeHorizon))
                // 未碰撞 
                const dot = w.multiply(relativePosition)
                const leg = Math.sqrt(distSq - combinedRadiusSq)

                if (dot < 0 && dot ** 2 > combinedRadiusSq * (w.abs() ** 2)) {

                    line.direction = new Vector2(w.y, -w.x)
                    u = w.normalize().scale(combinedRadius * invTimeHorizon - w.abs())
                } else {

                    if (Utils.det(relativePosition, w) > 0) {
                        // 靠近左腿
                        const aux = new Vector2(relativePosition.x * leg - relativePosition.y * combinedRadius, relativePosition.x * combinedRadius + relativePosition.y * leg)
                        line.direction = aux.scale(1 / distSq)
                    } else {
                        // 靠近右腿
                        const aux = new Vector2(relativePosition.x * leg - relativePosition.y * combinedRadius, -relativePosition.x * combinedRadius + relativePosition.y * leg)
                        line.direction = aux.scale(-1 / distSq)
                    }

                    const dotProduct2 = relativeVelocity.multiply(line.direction)
                    u = line.direction.scale(dotProduct2).minus(relativeVelocity)
                }
            } else {

                // 已碰撞
                const w = relativeVelocity.minus(relativePosition.scale(invTimestep))
                line.direction = new Vector2(w.normalize().y, -w.normalize().x)
                u = w.normalize().scale(combinedRadius * invTimestep - w.abs())
            }

            line.point = u.scale(0.5).plus(this.prefVelocity)
            this.orcaLines.push(line)
        }
    }

    public calcPrefVelocity() {
        if (this.targetPos.minus(this.pos).abs() == 0) return this.prefVelocity = Vector2.zero

        let prefVelocity = this.targetPos.minus(this.pos)
        if (prefVelocity.abs() > 1) prefVelocity = prefVelocity.normalize().scale(1 / Simulator.deltTime * 2)

        this.prefVelocity = prefVelocity
    }



}