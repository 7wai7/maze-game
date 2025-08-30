import Collider from "./collider";
import RectangleCollider from "./rectangleCollider";
import CircleCollider from "./circleCollider";
import Vec from "./vector";
import type Ray from "./ray";

export default class CollisionSystem {
    colliders: Collider[];

    constructor() {
        this.colliders = [];
    }

    hasCollision(col1: Collider, col2: Collider): { collision: boolean, normal?: Vec, penetration?: number } {
        const type1 = col1.getType();
        const type2 = col2.getType();

        // Промінь проти інших колайдерів
        if (type1 === "ray" && type2 !== "ray") {
            const ray = col1 as Ray;
            if (type2 === "circle") return this.rayVsCircle(ray, col2 as CircleCollider);
            if (type2 === "rectangle") return this.rayVsRectangle(ray, col2 as RectangleCollider);
        } else if (type2 === "ray" && type1 !== "ray") {
            const ray = col2 as Ray;
            if (type1 === "circle") return this.rayVsCircle(ray, col1 as CircleCollider);
            if (type1 === "rectangle") return this.rayVsRectangle(ray, col1 as RectangleCollider);
        }

        // Звичайні колізії (без променів)
        if (type1 === "rectangle" && type2 === "rectangle") {
            return this.rectangleVsRectangle(col1 as RectangleCollider, col2 as RectangleCollider);
        } else if (type1 === "circle" && type2 === "circle") {
            return this.circleVsCircle(col1 as CircleCollider, col2 as CircleCollider);
        } else if (type1 === "circle" && type2 === "rectangle") {
            const result = this.circleVsRectangle(col1 as CircleCollider, col2 as RectangleCollider);
            if (result.penetration) result.penetration *= -1;
        } else if (type1 === "rectangle" && type2 === "circle") {
            return this.circleVsRectangle(col2 as CircleCollider, col1 as RectangleCollider);
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

    private rayVsCircle(ray: Ray, circle: CircleCollider): { collision: boolean, normal?: Vec, penetration?: number } {
        console.log("rayVsCircle", ray);

        const rayStart = ray.center;
        const rayEnd = ray.center.add(ray.dir.scale(ray.length));
        const toCircle = circle.center.sub(rayStart);
        const projection = toCircle.dot(ray.dir);

        // Знаходимо найближчу точку на промені до центру круга
        let closestPoint: Vec;
        if (projection < 0) {
            closestPoint = rayStart;
        } else if (projection > ray.length) {
            closestPoint = rayEnd;
        } else {
            closestPoint = rayStart.add(ray.dir.scale(projection));
        }

        const distanceSquared = circle.center.sub(closestPoint).lengthSquared();
        if (distanceSquared > circle.radius * circle.radius) {
            return { collision: false };
        }

        // Знаходимо точку перетину
        const distance = Math.sqrt(distanceSquared);
        const penetration = circle.radius - distance;
        const normal = circle.center.sub(closestPoint).normalize();
        const point = closestPoint.add(normal.scale(penetration));

        // Зберігаємо результат у промені
        ray.collision = circle;
        ray.point = point;

        return { collision: true, normal, penetration };
    }

    private rayVsRectangle(ray: Ray, rect: RectangleCollider): { collision: boolean, normal?: Vec, penetration?: number } {
        const rayStart = ray.center;
        const rayEnd = rayStart.add(ray.dir.scale(ray.length));
        const min = rect.getMin();
        const max = rect.getMax();

        // Обчислюємо параметри для перетину з площинами прямокутника
        let tmin = -Infinity;
        let tmax = Infinity;
        let normal: Vec | undefined;
        let hitSide: string | undefined;

        const dir = ray.dir;
        const invDirX = dir.x !== 0 ? 1 / dir.x : Infinity;
        const invDirY = dir.y !== 0 ? 1 / dir.y : Infinity;

        // Перевірка по осі X
        let tx1 = (min.x - rayStart.x) * invDirX;
        let tx2 = (max.x - rayStart.x) * invDirX;
        if (tx1 > tx2) [tx1, tx2] = [tx2, tx1];

        if (tx1 > tmin) {
            tmin = tx1;
            normal = new Vec(dir.x > 0 ? -1 : 1, 0);
            hitSide = dir.x > 0 ? "left" : "right";
        }
        tmax = Math.min(tmax, tx2);

        // Перевірка по осі Y
        let ty1 = (min.y - rayStart.y) * invDirY;
        let ty2 = (max.y - rayStart.y) * invDirY;
        if (ty1 > ty2) [ty1, ty2] = [ty2, ty1];

        if (ty1 > tmin) {
            tmin = ty1;
            normal = new Vec(0, dir.y > 0 ? -1 : 1);
            hitSide = dir.y > 0 ? "top" : "bottom";
        }
        tmax = Math.min(tmax, ty2);

        if (tmin > tmax || tmin > ray.length || tmax < 0) {
            ray.collision = undefined;
            ray.point.setVec(rayEnd);
            return { collision: false };
        }

        const t = tmin < 0 ? tmax : tmin;
        if (t < 0 || t > ray.length) {
            ray.collision = undefined;
            ray.point.setVec(rayEnd);
            return { collision: false };
        }

        const point = rayStart.add(dir.scale(t));
        const penetration = ray.length - t;

        // Зберігаємо результат у промені
        ray.collision = rect;
        ray.point.setVec(point);
        console.log(ray.point);
        


        return { collision: true, normal, penetration };
    }



    calculateCollisions() {
        for (let i = 0; i < this.colliders.length; i++) {
            const col1 = this.colliders[i];
            for (let j = i + 1; j < this.colliders.length; j++) {
                const col2 = this.colliders[j];

                // Пропускаємо, якщо це один і той же колайдер або обидва статичні
                if (col1 === col2 || (col1.isStatic && col2.isStatic)) continue;


                const result = this.hasCollision(col1, col2);
                if (!result.collision || !result.normal || !result.penetration) continue;

                // Якщо один із колайдерів — промінь, не коригуємо позицію чи швидкість
                if (col1.getType() === "ray" || col2.getType() === "ray") continue;

                const obj1 = col1.object;
                const obj2 = col2.object;

                // Визначаємо маси
                const mass1 = col1.isStatic ? Infinity : (obj1 ? obj1.mass : 1);
                const mass2 = col2.isStatic ? Infinity : (obj2 ? obj2.mass : 1);

                // Обчислюємо коефіцієнти розподілу
                let factor1, factor2;
                if (mass1 === Infinity && mass2 === Infinity) {
                    factor1 = 0;
                    factor2 = 0;
                } else if (mass1 === Infinity) {
                    factor1 = 0;
                    factor2 = 1;
                } else if (mass2 === Infinity) {
                    factor1 = 1;
                    factor2 = 0;
                } else {
                    factor1 = mass2 / (mass1 + mass2);
                    factor2 = mass1 / (mass1 + mass2);
                }

                // Коригуємо позицію
                if (obj1 && !col1.isStatic) {
                    obj1.position.addLocal(result.normal.scale(result.penetration * factor1));
                }
                if (obj2 && !col2.isStatic) {
                    obj2.position.subLocal(result.normal.scale(result.penetration * factor2));
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