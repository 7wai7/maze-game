import Collider from "./collider";
import RectangleCollider from "./rectangleCollider";
import CircleCollider from "./circleCollider";
import Vec from "./vector";

export default class CollisionSystem {
    colliders: Collider[];

    constructor() {
        this.colliders = [];
    }

    hasCollision(col1: Collider, col2: Collider): { collision: boolean, normal?: Vec, penetration?: number } {
        const type1 = col1.getType();
        const type2 = col2.getType();

        if (type1 === "rectangle" && type2 === "rectangle") {
            const rect1 = col1 as RectangleCollider;
            const rect2 = col2 as RectangleCollider;
            return this.rectangleVsRectangle(rect1, rect2);
        } else if (type1 === "circle" && type2 === "circle") {
            const circle1 = col1 as CircleCollider;
            const circle2 = col2 as CircleCollider;
            return this.circleVsCircle(circle1, circle2);
        } else if (type1 === "circle" && type2 === "rectangle") {
            const circle = col1 as CircleCollider;
            const rect = col2 as RectangleCollider;
            const result = this.circleVsRectangle(circle, rect);
            if (result.penetration) result.penetration *= -1;
            return result;
        } else if (type1 === "rectangle" && type2 === "circle") {
            const rect = col1 as RectangleCollider;
            const circle = col2 as CircleCollider;
            return this.circleVsRectangle(circle, rect);
        }

        return { collision: false };
    }

    private rectangleVsRectangle(rect1: RectangleCollider, rect2: RectangleCollider): { collision: boolean, normal?: Vec, penetration?: number } {
        const min1 = rect1.getMin();
        const max1 = rect1.getMax();
        const min2 = rect2.getMin();
        const max2 = rect2.getMax();

        const collision = (
            min1.x < max2.x &&
            max1.x > min2.x &&
            min1.y < max2.y &&
            max1.y > min2.y
        );

        if (!collision) return { collision: false };

        // Обчислюємо нормаль і глибину проникнення (опціонально)
        const overlapX = Math.min(max1.x - min2.x, max2.x - min1.x);
        const overlapY = Math.min(max1.y - min2.y, max2.y - min1.y);
        const penetration = -Math.min(overlapX, overlapY);
        const normal = overlapX < overlapY
            ? new Vec(max1.x > max2.x ? -1 : 1, 0)
            : new Vec(0, max1.y > max2.y ? -1 : 1);

        return { collision: true, normal, penetration };
    }

    private circleVsCircle(circle1: CircleCollider, circle2: CircleCollider): { collision: boolean, normal?: Vec, penetration?: number } {
        const distance = Vec.distance(circle1.center, circle2.center);
        const combinedRadius = circle1.radius + circle2.radius;

        if (distance > combinedRadius) return { collision: false };

        const penetration = distance - combinedRadius;
        const normal = circle2.center.sub(circle1.center).normalize();

        return { collision: true, normal, penetration };
    }

    private circleVsRectangle(circle: CircleCollider, rect: RectangleCollider): { collision: boolean, normal?: Vec, penetration?: number } {
        const rectMin = rect.getMin();
        const rectMax = rect.getMax();
        const closestX = Math.max(rectMin.x, Math.min(circle.center.x, rectMax.x));
        const closestY = Math.max(rectMin.y, Math.min(circle.center.y, rectMax.y));

        const distanceX = circle.center.x - closestX;
        const distanceY = circle.center.y - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        if (distanceSquared > circle.radius * circle.radius) {
            return { collision: false };
        }

        const distance = Math.sqrt(distanceSquared);
        const penetration = distance - circle.radius;
        let normal: Vec;

        if (distance === 0) {
            // Центр круга всередині прямокутника, обираємо найближчу сторону
            const dxLeft = circle.center.x - rectMin.x;
            const dxRight = rectMax.x - circle.center.x;
            const dyTop = circle.center.y - rectMin.y;
            const dyBottom = rectMax.y - circle.center.y;
            const min = Math.min(dxLeft, dxRight, dyTop, dyBottom);

            if (min === dxLeft) normal = new Vec(-1, 0);
            else if (min === dxRight) normal = new Vec(1, 0);
            else if (min === dyTop) normal = new Vec(0, -1);
            else normal = new Vec(0, 1);
        } else {
            normal = new Vec(distanceX, distanceY).normalize();
        }

        return { collision: true, normal, penetration };
    }



    calculateCollisions() {
        // Перебираємо всі пари колайдерів, але лише раз для кожної пари
        for (let i = 0; i < this.colliders.length; i++) {
            const col1 = this.colliders[i];
            for (let j = i + 1; j < this.colliders.length; j++) {
                const col2 = this.colliders[j];

                // Пропускаємо, якщо обидва колайдери статичні або це однаковий колайдер
                if (col1 === col2 || (col1.isStatic && col2.isStatic)) continue;

                const result = this.hasCollision(col1, col2);
                if (!result.collision || !result.normal || !result.penetration) continue;

                const obj1 = col1.object;
                const obj2 = col2.object;

                // Визначаємо маси (нескінченна маса для статичних об’єктів)
                const mass1 = col1.isStatic ? Infinity : (obj1 ? obj1.mass : 1);
                const mass2 = col2.isStatic ? Infinity : (obj2 ? obj2.mass : 1);

                // Обчислюємо коефіцієнти розподілу зіткнення
                let factor1, factor2;
                if (mass1 === Infinity && mass2 === Infinity) {
                    // Обидва статичні — нічого не рухаємо
                    factor1 = 0;
                    factor2 = 0;
                } else if (mass1 === Infinity) {
                    // col1 статичний, весь рух на col2
                    factor1 = 0;
                    factor2 = 1;
                } else if (mass2 === Infinity) {
                    // col2 статичний, весь рух на col1
                    factor1 = 1;
                    factor2 = 0;
                } else {
                    // Обидва динамічні, розподіляємо за масами
                    factor1 = mass2 / (mass1 + mass2);
                    factor2 = mass1 / (mass1 + mass2);
                }

                // Коригуємо позицію
                if (obj1 && !col1.isStatic) {
                    obj1.position.addLocal(result.normal.scale(result.penetration * factor1));
                    // col1.center.setVec(obj1.position);
                }
                if (obj2 && !col2.isStatic) {
                    obj2.position.subLocal(result.normal.scale(result.penetration * factor2));
                    // col2.center.setVec(obj2.position);
                }

                // Коригуємо швидкість для ковзання
                if (obj1 && !col1.isStatic) {
                    const dot1 = obj1.velocity.dot(result.normal);
                    if (dot1 < 0) {
                        obj1.velocity.subLocal(result.normal.scale(dot1));
                    }
                }
                if (obj2 && !col2.isStatic) {
                    const dot2 = obj2.velocity.dot(result.normal.scale(-1));
                    if (dot2 < 0) {
                        obj2.velocity.addLocal(result.normal.scale(dot2));
                    }
                }
            }
        }
    }
}