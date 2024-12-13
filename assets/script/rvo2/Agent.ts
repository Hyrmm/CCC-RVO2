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

    public maxSpeed: number
    public velocity: Vector2
    public prefVelocity: Vector2

    public orcaLines: Array<Line>

    constructor(id: number, pos: Vector2, radius: number) {

        this.id = id
        this.pos = new Vector2(pos.x, pos.y)
        this.radius = 20
        this.targetPos = new Vector2(pos.x, pos.y)

        // 默认参数
        this.weight = 0.5
        this.maxSpeed = 2
        this.velocity = new Vector2(0, 0)
        this.prefVelocity = new Vector2(0, 0)
        this.orcaLines = []

    }
    public update() {
        this.pos = this.pos.plus(this.velocity.scale(2))
    }


    public calcNewVelocity() {
        this.orcaLines = []

        const neighbors = Simulator.agentsTree.searchNeiborRadius(this.pos, 80)

        if (neighbors.length <= 0) return this.velocity = this.prefVelocity


        for (const neighbor of neighbors) {

            // 过滤自身
            if (neighbor.data.id === this.id) continue

            const otherAgent = neighbor.data

            const relativePosition = otherAgent.pos.minus(this.pos)
            const relativeVelocity = this.prefVelocity.minus(otherAgent.prefVelocity)

            const distSq = Utils.absSq(relativePosition)
            const combinedRadius = this.radius + otherAgent.radius
            const combinedRadiusSq = Utils.sqr(combinedRadius)

            const invTimestep = 1 / Simulator.deltTime
            const invTimeHorizon = 1 / Simulator.deltTime

            let u: Vector2
            const line = new Line()

            // 这里判断碰撞是预估值，比较俩个检测半径相和和距离

            if (distSq > combinedRadiusSq) {
                // 未碰撞 

                const w = relativeVelocity.minus(relativePosition.scale(invTimeHorizon))
                const wLengthSq = Utils.absSq(w)

                const dot = w.multiply(relativePosition)


                if (dot < 0 && Utils.sqr(dot) > combinedRadiusSq * wLengthSq) {

                    const wLength = Math.sqrt(wLengthSq)
                    const unitW = w.scale(1 / wLength)

                    line.direction = new Vector2(unitW.y, -unitW.x)
                    u = unitW.scale(combinedRadius * invTimeHorizon - wLength)
                } else {

                    const leg = Math.sqrt(distSq - combinedRadiusSq)

                    if (Utils.det(relativePosition, w) > 0) {
                        // 靠近左腿
                        const aux = new Vector2(relativePosition.x * leg - relativePosition.y * combinedRadius, relativePosition.x * combinedRadius + relativePosition.y * leg)
                        line.direction = aux.scale(1 / distSq)
                    } else {
                        // 靠近右腿
                        const aux = new Vector2(relativePosition.x * leg - relativePosition.y * combinedRadius, -relativePosition.x * combinedRadius + relativePosition.y * leg)
                        line.direction = aux.scale(-1 / distSq)
                    }

                    const dot2 = relativeVelocity.multiply(line.direction)
                    u = line.direction.scale(dot2).minus(relativeVelocity)
                }
            } else {

                // 已碰撞
                const w = relativeVelocity.minus(relativePosition.scale(invTimestep))
                const wLength = Utils.abs(w)
                const unitW = w.scale(1 / wLength)

                line.direction = new Vector2(unitW.y, -unitW.x)
                u = unitW.scale(combinedRadius * invTimestep - wLength)
            }

            line.point = u.scale(this.weight).plus(this.prefVelocity)
            this.orcaLines.push(line)
        }

        this.velocity = Vector2.zero

        let lineFail = this.linearProgram2(this.orcaLines, this.maxSpeed, this.prefVelocity, false)

        if (lineFail < this.orcaLines.length) {
            this.linearProgram3(this.orcaLines, 0, lineFail, this.maxSpeed)
        }
    }

    public calcPrefVelocity() {


        const distance = this.targetPos.minus(this.pos).abs()
        let prefVelocity = this.targetPos.minus(this.pos).normalize()

        if (distance == 0 || distance <= 0.001) {
            return this.prefVelocity = Vector2.zero
        }

        if (prefVelocity.scale(2).abs() > distance) {
            prefVelocity = this.targetPos.minus(this.pos).scale(1 / 2)
        } else {
            prefVelocity = prefVelocity.scale(1 / 2)
        }


        this.prefVelocity = prefVelocity
    }

    private linearProgram2(lines: Line[], radius: number, optVelocity: Vector2, directionOpt: boolean): number {

        if (directionOpt) {
            this.velocity = optVelocity.scale(radius)
        }
        else if (Utils.absSq(optVelocity) > Utils.sqr(radius)) {
            this.velocity = Utils.normalize(optVelocity).scale(radius)
        }
        else {
            this.velocity = optVelocity
        }


        for (let i = 0; i < lines.length; ++i) {
            if (Utils.det(lines[i].direction, lines[i].point.minus(this.velocity)) > 0.0) {

                const tempResult = this.velocity
                if (!this.linearProgram1(lines, i, this.radius, optVelocity, directionOpt)) {
                    this.velocity = tempResult
                    return i
                }

            }
        }

        return lines.length
    }

    private linearProgram1(lines: Line[], lineNo: number, radius: number, optVelocity: Vector2, directionOpt: boolean): boolean {

        const dotProduct = lines[lineNo].point.multiply(lines[lineNo].direction)
        const discriminant = Utils.sqr(dotProduct) + Utils.sqr(radius) - Utils.absSq(lines[lineNo].point)

        if (discriminant < 0.0) return false

        const sqrtDiscriminant = Math.sqrt(discriminant)
        let tLeft = -dotProduct - sqrtDiscriminant
        let tRight = -dotProduct + sqrtDiscriminant

        for (let i = 0; i < lineNo; ++i) {

            const denominator = Utils.det(lines[lineNo].direction, lines[i].direction)
            const numerator = Utils.det(lines[i].direction, lines[lineNo].point.minus(lines[i].point))

            if (Math.abs(denominator) <= 0.00001) {
                if (numerator < 0.0) {
                    return false
                } else {
                    continue
                }
            }

            const t = numerator / denominator

            if (denominator >= 0.0) {
                tRight = Math.min(tRight, t)
            } else {
                tLeft = Math.max(tLeft, t)
            }

            if (tLeft > tRight) {
                return false
            }
        }

        if (directionOpt) {
            if (optVelocity.multiply(lines[lineNo].direction) > 0.0) {
                this.velocity = lines[lineNo].direction.scale(tRight).plus(lines[lineNo].point);
            } else {
                this.velocity = lines[lineNo].direction.scale(tLeft).plus(lines[lineNo].point);
            }
        } else {
            const t = lines[lineNo].direction.multiply(optVelocity.minus(lines[lineNo].point));

            if (t < tLeft) {
                this.velocity = lines[lineNo].direction.scale(tLeft).plus(lines[lineNo].point);
            } else if (t > tRight) {
                this.velocity = lines[lineNo].direction.scale(tRight).plus(lines[lineNo].point);
            } else {
                this.velocity = lines[lineNo].direction.scale(t).plus(lines[lineNo].point);
            }
        }

        if (isNaN(this.velocity.x) || isNaN(this.velocity.y)) {
            return false
        }

        return true
    }

    private linearProgram3(lines: Line[], numObstLines: number, beginLine: number, radius: number) {

        var distance = 0.0

        for (var i = beginLine; i < lines.length; ++i) {

            if (Utils.det(lines[i].direction, lines[i].point.minus(this.velocity)) > distance) {

                let projLines = []
                for (var ii = 0; ii < numObstLines; ++ii) {
                    projLines.push(lines[ii]);
                }

                for (var j = numObstLines; j < i; ++j) {
                    var line = new Line();

                    let determinant = Utils.det(lines[i].direction, lines[j].direction);

                    if (Math.abs(determinant) <= 0.0001) {
                        if (lines[i].direction.multiply(lines[j].direction) > 0.0) {
                            continue
                        } else {
                            line.point = lines[i].point.plus(lines[j].point).scale(0.5)
                        }
                    } else {
                        var aux = lines[i].direction.scale(Utils.det(lines[j].direction, lines[i].point.minus(lines[j].point)) / determinant)
                        line.point = lines[i].point.plus(aux)
                    }

                    line.direction = Utils.normalize(lines[j].direction.minus(lines[i].direction))
                    projLines.push(line)
                }

                var tempResult = this.velocity
                if (this.linearProgram2(projLines, radius, new Vector2(-lines[i].direction.y, lines[i].direction.x), true) < projLines.length) {
                    this.velocity = tempResult
                }

                distance = Utils.det(lines[i].direction, lines[i].point.minus(this.velocity))
            }
        }
    }

}