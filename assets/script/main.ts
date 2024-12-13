import Simulator from "./rvo2/Simulator"

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {

    @property(cc.Prefab)
    prefeb_agent: cc.Prefab = null

    @property(cc.Node)
    container_agents: cc.Node = null

    @property(cc.Node)
    container_graphics: cc.Node = null


    private agentsNodeList: Array<cc.Node> = []

    protected start(): void {

        this.initAgents()
        this.initEventListeners()
    }

    protected update(dt: number): void {

        Simulator.execute()

        this.agentsNodeList.forEach(agentNode => {
            const agent = Simulator.getAgent(agentNode['agentId'])
            agentNode.setPosition(cc.v2(agent.pos.x, agent.pos.y))
        })
    }

    private initAgents(): void {

        // red agent
        for (let i = 0; i < 100; i++) {

            const randomX = Math.random() * 1920
            const randomY = Math.random() * 1080

            const agentNode = cc.instantiate(this.prefeb_agent)
            agentNode.setPosition(cc.v2(randomX, randomY))
            const agent = Simulator.addAgent(agentNode.position)
            this.agentsNodeList.push(agentNode)

            agentNode.color = cc.Color.RED
            agentNode.name = `r_${agent.id}`
            agentNode['agentId'] = agent.id
            agentNode.getComponentInChildren(cc.Label).string = `${agent.id}`
            this.container_agents.addChild(agentNode)
        }

        // blue agent
        for (let i = 0; i < 100; i++) {

            const randomX = Math.random() * 1920
            const randomY = Math.random() * 1080

            const agentNode = cc.instantiate(this.prefeb_agent)
            agentNode.setPosition(cc.v2(randomX, randomY))
            const agent = Simulator.addAgent(agentNode)
            this.agentsNodeList.push(agentNode)

            agentNode.color = cc.Color.BLUE
            agentNode.name = `b_${agent.id}`
            agentNode['agentId'] = agent.id
            agentNode.getComponentInChildren(cc.Label).string = `${agent.id}`
            this.container_agents.addChild(agentNode)
        }

    }

    private initEventListeners(): void {
        this.container_agents.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this)
    }

    private onMouseDown(event: cc.Event.EventMouse): void {

        const targetPos = this.container_agents.convertToNodeSpaceAR(event.getLocation())

        let filterAgents: Array<cc.Node> = []

        switch (event.getButton()) {

            case cc.Event.EventMouse.BUTTON_LEFT: {
                filterAgents = this.agentsNodeList.filter(agentNode => agentNode.name.startsWith('r_'))
                break
            }

            case cc.Event.EventMouse.BUTTON_RIGHT: {
                filterAgents = this.agentsNodeList.filter(agentNode => agentNode.name.startsWith('b_'))
                break
            }

        }

        filterAgents.forEach(agentNode => Simulator.setAgentTargetPos(agentNode['agentId'], cc.v2(targetPos.x, targetPos.y)))
    }
}
