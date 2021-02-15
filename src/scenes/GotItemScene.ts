import { Aseprite } from "../Aseprite";
import { asset } from "../Assets";
import { BitmapFont } from "../BitmapFont";
import { DIALOG_FONT } from "../constants";
import { easeInExpo, easeOutExpo } from "../easings";
import { FriendlyFire } from "../FriendlyFire";
import { Scene } from "../Scene";
import { SlideTransition } from "../transitions/SlideTransition";
import { Sound } from "../Sound";
import { ImageNode } from "../scene/ImageNode";
import { Direction } from "../geom/Direction";
import { AsepriteNode } from "../scene/AsepriteNode";
import { SceneNode } from "../scene/SceneNode";
import { TextNode } from "../scene/TextNode";

export enum Item { RUNNING, DOUBLEJUMP, MULTIJUMP, RAINDANCE, FRIENDSHIP }

export class GotItemScene extends Scene<FriendlyFire, Item> {
    @asset(DIALOG_FONT)
    private static font: BitmapFont;

    @asset("fonts/headline.font.json")
    private static headlineFont: BitmapFont;

    @asset("sounds/item/fanfare.mp3")
    private static sound: Sound;

    @asset([
        "sprites/powerup_running.png",
        "sprites/powerup_doublejump.png",
        "sprites/powerup_multijump.png",
        "sprites/powerup_raindance.png",
        "sprites/powerup_friendship.aseprite.json"
    ])
    private static itemImages: (HTMLImageElement | Aseprite)[];

    private floatAmount = 3;
    private floatSpeed = 4;

    private titles = [
        "对黑暗的恐惧",
        "双跳靴",
        "翅膀被击败",
        "跳舞戴夫",
        "永恒的友谊"
    ];

    private subtitles = [
        [
            "奔跑，永不回头",
            "一个杰出的盟友",
            "黑暗的角落里有东西"
        ],
        [
            "不适合跳踢踏舞",
            "永恒的经典",
            "仍处于薄荷状态",
            "即使不穿也可以上班",
            "为什么一个树会有这个？"
        ],
        [
            "鸟儿很喜欢它！",
            "感觉像作弊",
            "免费的东西是最好的",
            "多.多..多级跳"
        ],
        [
            "像雨中的眼泪"
        ],
        [
            "狗是最好的！",
            "这可能有什么好处？",
            "由无条件的爱驱动",
            "没有什么可以阻止我们！"
        ]
    ];

    public setup(item: Item): void {
        GotItemScene.sound.setVolume(0.7);
        GotItemScene.sound.play();

        this.inTransition = new SlideTransition({ duration: .5, direction: "bottom", easing: easeOutExpo });
        this.outTransition = new SlideTransition({ duration: .5, direction: "bottom", easing: easeInExpo });

        const subtitle = "“" + this.subtitles[item][Math.floor(Math.random() * this.subtitles[item].length)] + "”";
        const image = GotItemScene.itemImages[item];

        // The powerup name
        new TextNode({
            font: GotItemScene.headlineFont,
            text: this.titles[item],
            x: this.game.width >> 1,
            y: (this.game.height >> 1) + 17,
            color: "white"
        }).appendTo(this.rootNode);

        // The powerup subtitle
        new TextNode({
            font: GotItemScene.font,
            text: subtitle,
            color: "white",
            x: this.game.width >> 1,
            y: (this.game.height >> 1) + 36
        }).appendTo(this.rootNode);

        // The power up image bobbling up and down
        new SceneNode({
            x: this.game.width >> 1,
            y: this.game.height >> 1
        }).animate({
            animator: node => node.transform(m => m.setScale(2).translateY(Math.sin(Date.now() / 1000
                * this.floatSpeed) * this.floatAmount)),
            duration: Infinity
        }).appendChild(image instanceof HTMLImageElement
            ? new ImageNode({ image, anchor: Direction.BOTTOM })
            : new AsepriteNode({ aseprite: image, tag: "idle", anchor: Direction.BOTTOM })
        ).appendTo(this.rootNode);
    }

    public activate(): void {
        // Close this scene after 4 seconds
        setTimeout(() => this.scenes.popScene(), 4000);
    }

    public cleanup(): void {
        this.rootNode.clear();
    }

    public draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, (height >> 1) - 1, width, 50);
        ctx.restore();
        super.draw(ctx, width, height);
    }
}
