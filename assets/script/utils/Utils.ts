export default class Utils {
    
    public static det<T extends { x: number, y: number }>(vector1: T, vector2: T) {
        return vector1.x * vector2.y - vector1.y * vector2.x
    }

}
