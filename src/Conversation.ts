import { NPC } from './NPC';

export interface Interaction {
    npcLine: ConversationLine | null;
    options: ConversationLine[];
    spoiledOptions: ConversationLine[];
};

// Actions that shall be executed before an NPC talks, not after
const earlyActions = [
    "angry",
    "sad",
    "amused",
    "neutral",
    "bored"
];

const globalVariables: Record<string, string> = {};

export class Conversation {
    private states: string[];
    private data: {[key: string]: ConversationLine[]};
    private state!: string;
    private stateIndex = 0;
    private endConversation = false;
    private localVariables: Record<string, string> = {};

    constructor(json: any, private readonly npc: NPC) {
        this.states = Object.keys(json);
        this.data = {};
        for (const state of this.states) {
            this.data[state] = json[state].map((line: string) => new ConversationLine(line, this));
        }
        this.setState("entry");
        this.endConversation = false;
    }

    public setState(name = "entry") {
        if (!this.states.includes(name)) {
            throw new Error("State name " + name + " does not exist in conversation");
        }
        this.state = name;
        this.stateIndex = 0;
    }

    public getNextInteraction(): Interaction | null {
        if (this.endConversation) {
            this.endConversation = false;
            return null;
        }
        const result: Interaction = {
            npcLine: null,
            options: [],
            spoiledOptions: []
        };
        // Does NPC speak?
        const line = this.getNextLine()
        if (line == null) {
            // Conversation is over without changing state or anything
            return null;
        } else {
            if (line.isNpc) {
                result.npcLine = line;
            } else {
                this.goBack();
            }
        }
        // Does Player react?
        let option = this.getNextLine();
        while (option && !option.isNpc) {
            // TODO identify spoiled options (that don't lead to anything new for the player) and sort accordingly
            result.options.push(option);
            option = this.getNextLine();
        }
        if (option) {
            this.goBack();
        }
        // shuffle(result.options);
        return result;
    }

    public runAction(action: string[]) {
        switch (action[0]) {
            case "end":
                this.endConversation = true;
                break;
            case "set":
                this.setVariable(action[1], action[2]);
                break;
            default:
                this.npc.game.campaign.runAction(action[0], this.npc, action.slice(1));
        }
    }

    private setVariable(name = "", value = "true"): void {
        console.log("Setting conversation variable", name, "to", value);
        if (name.startsWith("$")) {
            // Global variable
            globalVariables[name] = value;
        } else {
            // Local variable
            this.localVariables[name] = value;
        }
    }

    private goBack() {
        this.stateIndex--;
    }

    private getNextLine(): ConversationLine | null {
        if (this.stateIndex >= this.data[this.state].length) {
            return null;
        }
        return this.data[this.state][this.stateIndex++];
    }

    public hasEnded() {
        return this.endConversation;
    }
}


const MAX_CHARS_PER_LINE = 50;

export class ConversationLine {
    public readonly line: string;
    public readonly targetState: string | null;
    public readonly actions: string[][];
    public readonly isNpc: boolean;
    private visited = false;

    constructor(
        public readonly full: string,
        public readonly conversation: Conversation
    ) {
        this.isNpc = !full.startsWith(">");
        this.line = ConversationLine.extractText(full, this.isNpc);
        this.targetState = ConversationLine.extractState(full);
        this.actions = ConversationLine.extractActions(full);
        this.visited = false;
    }

    public executeBeforeLine() {
        if (this.actions.length > 0) {
            for (const action of this.actions) {
                if (this.isEarlyAction(action[0])) {
                    this.conversation.runAction(action);
                }
            }
        }
    }

    public execute() {
        this.visited = true;
        if (this.targetState != null) {
            this.conversation.setState(this.targetState);
        }
        if (this.actions.length > 0) {
            for (const action of this.actions) {
                if (!this.isEarlyAction(action[0])) {
                    this.conversation.runAction(action);
                }
            }
        }
    }

    public isEarlyAction(s: string): boolean {
        return earlyActions.includes(s);
    }

    public wasVisited(): boolean {
        return this.visited;
    }

    private static extractText(line: string, autoWrap = false): string {
        // Remove player option sign
        if (line.startsWith(">")) { line = line.substr(1); }
        // Remove actions and state changes
        const atPos = line.indexOf("@"), exclPos = line.search(/\![a-z]/);
        if (atPos >= 0 || exclPos >= 0) {
            const minPos = (atPos >= 0 && exclPos >= 0) ? Math.min(atPos, exclPos) : (atPos >= 0) ? atPos : exclPos;
            line = line.substr(0, minPos);
        }
        // Auto wrap to some character count
        if (autoWrap) {
            return ConversationLine.wrapString(line, MAX_CHARS_PER_LINE);
        }
        return line;
    }

    private static extractState(line: string): string | null {
        const stateChanges = line.match(/(@[a-zA-Z]+)/g);
        if (stateChanges && stateChanges.length > 0) {
            const stateName = stateChanges[0].substr(1);
            return stateName;
        }
        return null;
    }

    private static extractActions(line: string): string[][] {
        let actions = line.match(/(\![a-zA-Z][a-zA-Z0-9 ]*)+/g);
        const result = [];
        if (actions) {
            actions = actions.join(" ").split("!").map(action => action.trim()).filter(s => s.length > 0);
            for (const action of actions) {
                const segments = action.split(" ");
                result.push(segments);
            }
        }
        return result;
    }

    public static wrapString(s: string, charsPerLine: number): string {
        let currentLength = 0, lastSpace = -1;
        for (let i = 0; i < s.length; i++) {
            const char = s[i];
            if (char === "\n") {
                // New line
                currentLength = 0;
            } else {
                if (char === " ") {
                    lastSpace = i;
                }
                currentLength++;
                if (currentLength >= charsPerLine) {
                    if (lastSpace >= 0) {
                        // Add cut at last space
                        s = s.substr(0, lastSpace) + "\n" + s.substr(lastSpace + 1);
                        currentLength = i - lastSpace;
                        lastSpace = -1;
                    } else {
                        // Cut mid-word
                        s = s.substr(0, i + 1) + "\n" + s.substr(i + 1);
                        currentLength = 0;
                    }
                }
            }
        }
        return s;
    }
}
