import Vector2 from "../math/Vector2"

export default class Utils {

    public static det<T extends Vector2>(vector1: T, vector2: T) {
        return vector1.x * vector2.y - vector1.y * vector2.x
    }

    public static sqr(x: number): number {
        return x * x
    }

    public static abs(v): number {
        return Math.sqrt(this.absSq(v))
    }

    public static absSq(v: Vector2): number {
        return v.multiply(v)
    }

    static normalize(v: Vector2): Vector2 {
        return v.scale(1 / Math.sqrt(v.absSq()))
    }

}
