import { Simulator } from "./algorithm/RVO2";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {

    @property(cc.Prefab)
    prefeb_agent: cc.Prefab = null

    protected start(): void {


        this.initEventListeners()

        const tempPos = [[300, 700], [200, 600], [0, 500], [100, 800], [700, 500], [500, 400], [600, 700]]

        for (const pos of tempPos) {
            const agentNode = cc.instantiate(this.prefeb_agent)
            Simulator.addAgent(cc.v2(pos[0], pos[1]))

            agentNode.setPosition(cc.v2(pos[0], pos[1]))
            this.node.addChild(agentNode)
        }

        Simulator.execute(16.66)
    }

    private initEventListeners(): void {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this)
    }

    private onMouseDown(event: cc.Event.EventMouse): void {

        switch (event.getButton()) {

            case cc.Event.EventMouse.BUTTON_LEFT:
                break;

            case cc.Event.EventMouse.BUTTON_RIGHT:
                break;
        }
    }
}
