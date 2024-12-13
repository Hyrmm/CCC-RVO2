import { KdTree } from "../dataStructure/KdTree"
import Vector2 from "../math/Vector2"
import Agent from "./Agent"


type Vector2Like = { x: number, y: number }

export default class Simulator {

    static agents: Array<Agent> = []
    static agentsTree: KdTree<Agent> = null
    static agentId2Agent: Map<number, Agent> = new Map()

    static deltTime: number = 0

    static execute(): void {

        // 更新帧时间
        this.deltTime = 7

        // 重新构建KdTree
        this.agentsTree = KdTree.build([].concat(this.agents))

        // 更新期望速度
        this.agents.forEach(agent => agent.calcPrefVelocity())

        // 更新避障后的速度
        this.agents.forEach(agent => agent.calcNewVelocity())

        // 更新新速度确定后的位置
        this.agents.forEach(agent => agent.update())
    }

    static addAgent<T extends Vector2Like>(pos: T, radius: number = 10): Agent {
        const agent = new Agent(this.agents.length, new Vector2(pos.x, pos.y), radius)
        this.agents.push(agent)
        return agent
    }

    static getAgent(id: number): Agent {
        return this.agents[id]
    }

    static setAgentTargetPos<T extends Vector2Like>(id: number, targetPos: T): void {
        this.getAgent(id).targetPos = new Vector2(targetPos.x, targetPos.y)
    }

}