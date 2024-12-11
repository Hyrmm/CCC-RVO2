export default class Utils {

    public static det<T extends { x: number, y: number }>(vector1: T, vector2: T) {
        return vector1.x * vector2.y - vector1.y * vector2.x
    }


    // 计算过原点的切线和切点
    public static findTangentsAndPoints(circle: { centerX: number, centerY: number, radius: number }): { tangentEquations: string[], tangentPoints: { x: number, y: number }[] } {
        const { centerX, centerY, radius } = circle;

        // 圆心到原点的距离
        const distanceToOrigin = Math.sqrt(centerX ** 2 + centerY ** 2);

        // 检查是否有切线（原点必须在圆外）
        if (distanceToOrigin < radius) {
            throw new Error("No tangents exist because the origin is inside the circle.");
        }

        // 计算斜率 k 的值（双解）
        const k1 = (centerY + radius * centerX / distanceToOrigin) / (centerX - radius * centerY / distanceToOrigin);
        const k2 = (centerY - radius * centerX / distanceToOrigin) / (centerX + radius * centerY / distanceToOrigin);

        // 切线方程 y = kx
        const tangentEquations = [`y = ${k1.toFixed(4)}x`, `y = ${k2.toFixed(4)}x`];

        // 计算切点
        const tangentPoints = [
            {
                x: (radius ** 2 * centerX + radius * centerY * Math.sqrt(distanceToOrigin ** 2 - radius ** 2)) / distanceToOrigin ** 2,
                y: (radius ** 2 * centerY - radius * centerX * Math.sqrt(distanceToOrigin ** 2 - radius ** 2)) / distanceToOrigin ** 2
            },
            {
                x: (radius ** 2 * centerX - radius * centerY * Math.sqrt(distanceToOrigin ** 2 - radius ** 2)) / distanceToOrigin ** 2,
                y: (radius ** 2 * centerY + radius * centerX * Math.sqrt(distanceToOrigin ** 2 - radius ** 2)) / distanceToOrigin ** 2
            }
        ];

        return { tangentEquations, tangentPoints };
    }

}
