import { KdTree } from "../dataStructure/KdTree"
import Vector2 from "../math/Vector2"
import Agent from "./Agent"

export default class Simulator {

    static agents: Array<Agent> = []
    static agentsTree: KdTree<Agent> = null
    static agentId2Agent: Map<number, Agent> = new Map()

    static deltTime: number = 0

    static execute(dt: number): void {
        if (!dt) return

        // 更新帧时间
        this.deltTime = dt * 1000

        // 重新构建KdTree
        this.agentsTree = KdTree.build([].concat(this.agents))

        // 更新期望速度
        this.agents.forEach(agent => agent.calcPrefVelocity())

        // 更新避障后的速度
        this.agents.forEach(agent => agent.calcNewVelocity())

        // 更新新速度确定后的位置
        this.agents.forEach(agent => agent.update())
    }

    static addAgent(pos: Vector2, radius: number = 50): Agent {
        const agent = new Agent(this.agents.length, pos, radius)
        this.agents.push(agent)
        return agent
    }

    static getAgent(id: number): Agent {
        return this.agents[id]
    }

    static setAgentTargetPos(id: number, targetPos: Vector2): void {
        this.getAgent(id).targetPos = targetPos
    }

}