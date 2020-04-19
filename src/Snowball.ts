import { Game, CollidableGameObject } from "./game";
import { PIXEL_PER_METER } from "./constants";
import { PhysicsEntity } from "./PhysicsEntity";
import { Environment } from "./World";

export class Snowball extends PhysicsEntity implements CollidableGameObject {
    public constructor(game: Game, x: number, y: number, velocityX: number, velocityY: number) {
        super(game, x, y, 0.25 * PIXEL_PER_METER, 0.25 * PIXEL_PER_METER);
        this.setVelocity(velocityX, velocityY);
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.beginPath();
        ctx.translate(this.x, -this.y);
        ctx.strokeStyle = "black";
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(0, -this.height / 2, this.width / 2, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    collidesWith(x: number, y: number, ignore?: Environment[]): number {
        if (x >= this.x - this.width / 2 && x <= this.x + this.width / 2
                && y >= this.y && y <= this.y + this.height) {
            return Environment.SOLID;
        }
        return Environment.AIR;
    }
}
