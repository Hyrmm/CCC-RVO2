export default class Vector2 {

    static zero: Vector2 = new Vector2(0, 0)

    public x: number = 0
    public y: number = 0

    constructor(x: number = 0, y: number = 0) {
        this.x = x
        this.y = y
    }

    public abs(): number {
        return Math.sqrt(this.absSq())
    }

    public absSq(): number {
        return this.multiply(this)
    }

    public plus(vector: Vector2): Vector2 {
        return new Vector2(this.x + vector.x, this.y + vector.y)
    }

    public minus(vector: Vector2): Vector2 {
        return new Vector2(this.x - vector.x, this.y - vector.y)
    }

    public clone(): Vector2 {
        return new Vector2(this.x, this.y)
    }

    public scale(k: number): Vector2 {
        return new Vector2(this.x * k, this.y * k)
    }

    public multiply(vector: Vector2): number {
        return this.x * vector.x + this.y * vector.y
    }

    public normalize(): Vector2 {
        return this.scale(1 / this.abs())
    }
}