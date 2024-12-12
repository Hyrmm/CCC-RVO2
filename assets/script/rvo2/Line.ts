import Vector2 from "../math/Vector2";

export default class Line {

    public point: Vector2
    public direction: Vector2

    constructor(point: Vector2 = Vector2.zero, direction: Vector2 = Vector2.zero) {
        this.point = point
        this.direction = direction
    }
}