import { Agent, Simulator } from "./algorithm/RVO2";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {

    @property(cc.Prefab)
    prefeb_agent: cc.Prefab = null


    protected start(): void {

        this.initAgents()
        this.initEventListeners()
    }

    protected update(dt: number): void {
        Simulator.execute(dt)
    }

    private initAgents(): void {

        // red agent
        for (let i = 0; i < 10; i++) {

            const randomX = Math.random() * 1920
            const randomY = Math.random() * 1080

            const agentNode = cc.instantiate(this.prefeb_agent)
            agentNode.setPosition(cc.v2(randomX, randomY))
            const agent = Simulator.addAgent(agentNode)

            agentNode.color = cc.Color.RED
            agentNode.name = `r_${agent.id}`
            agentNode.getComponentInChildren(cc.Label).string = `${agent.id}`
            this.node.addChild(agentNode)
        }

        // blue agent
        for (let i = 0; i < 10; i++) {

            const randomX = Math.random() * 1920
            const randomY = Math.random() * 1080

            const agentNode = cc.instantiate(this.prefeb_agent)
            agentNode.setPosition(cc.v2(randomX, randomY))
            const agent = Simulator.addAgent(agentNode)

            agentNode.color = cc.Color.BLUE
            agentNode.name = `b_${agent.id}`
            agentNode.getComponentInChildren(cc.Label).string = `${agent.id}`

            this.node.addChild(agentNode)
        }

    }

    private initEventListeners(): void {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this)
    }

    private onMouseDown(event: cc.Event.EventMouse): void {

        const targetPos = this.node.convertToNodeSpaceAR(event.getLocation())

        let filterAgents: Array<Agent> = []

        switch (event.getButton()) {

            case cc.Event.EventMouse.BUTTON_LEFT: {
                filterAgents = Simulator.agents.filter(agent => agent.node.name.startsWith('r_'))
                break
            }

            case cc.Event.EventMouse.BUTTON_RIGHT: {
                filterAgents = Simulator.agents.filter(agent => agent.node.name.startsWith('b_'))
                break
            }

        }

        filterAgents.forEach(agent => Simulator.setAgentTargetPos(agent.id, cc.v3(targetPos.x, targetPos.y, 0)))
    }
}
