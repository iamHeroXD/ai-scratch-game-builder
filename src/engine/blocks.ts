/**
 * Scratch 3.0 Block Builder & AST Compiler
 */
import { Sb3Block, ScratchField, ScratchInput } from './types';

export class BlockNode {
  public id: string;
  public opcode: string;
  public next: BlockNode | null = null;
  public parent: BlockNode | null = null;
  public inputs: Record<string, ScratchInput | BlockNode> = {};
  public fields: Record<string, ScratchField> = {};
  public shadow: boolean = false;
  public topLevel: boolean = false;
  public x?: number;
  public y?: number;
  public mutation?: Sb3Block['mutation'];

  constructor(opcode: string, options: Partial<BlockNode> = {}) {
    this.id = options.id || BlockNode.generateId();
    this.opcode = opcode;
    this.shadow = options.shadow ?? false;
    this.topLevel = options.topLevel ?? false;
    this.x = options.x;
    this.y = options.y;
    this.mutation = options.mutation;
    if (options.fields) this.fields = { ...options.fields };
    if (options.inputs) this.inputs = { ...options.inputs };
  }

  public static generateId(): string {
    return 'b_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
  }

  /**
   * Chain another statement block after this one
   */
  public chain(nextBlock: BlockNode): BlockNode {
    this.next = nextBlock;
    nextBlock.parent = this;
    return nextBlock;
  }

  /**
   * Set an input (either a direct primitive or a sub-block reporter)
   */
  public setInput(name: string, input: ScratchInput | BlockNode): this {
    if (input instanceof BlockNode) {
      input.parent = this;
    }
    this.inputs[name] = input;
    return this;
  }

  /**
   * Set a field
   */
  public setField(name: string, value: ScratchField): this {
    this.fields[name] = value;
    return this;
  }

  /**
   * Flatten block tree into Scratch 3.0 blocks dictionary
   */
  public flatten(blocksMap: Record<string, Sb3Block> = {}): Record<string, Sb3Block> {
    const sb3Inputs: Record<string, ScratchInput> = {};

    for (const [key, val] of Object.entries(this.inputs)) {
      if (val instanceof BlockNode) {
        val.parent = this;
        val.flatten(blocksMap);
        // Shadow type 2 = sub-block reference
        sb3Inputs[key] = [2, val.id];
      } else {
        sb3Inputs[key] = val;
      }
    }

    const block: Sb3Block = {
      opcode: this.opcode,
      next: this.next ? this.next.id : null,
      parent: this.parent ? this.parent.id : null,
      inputs: sb3Inputs,
      fields: this.fields,
      shadow: this.shadow,
      topLevel: this.topLevel,
    };

    if (this.topLevel) {
      block.x = this.x ?? 50;
      block.y = this.y ?? 50;
    }
    if (this.mutation) {
      block.mutation = this.mutation;
    }

    blocksMap[this.id] = block;

    if (this.next) {
      this.next.parent = this;
      this.next.flatten(blocksMap);
    }

    return blocksMap;
  }
}

/**
 * Factory helpers for standard Scratch 3.0 blocks
 */
export const Blocks = {
  // ===================
  // Events
  // ===================
  whenFlagClicked(x = 50, y = 50): BlockNode {
    return new BlockNode('event_whenflagclicked', { topLevel: true, x, y });
  },

  whenKeyPressed(key: string, x = 50, y = 50): BlockNode {
    const node = new BlockNode('event_whenkeypressed', { topLevel: true, x, y });
    node.setField('KEY_OPTION', [key, undefined]);
    return node;
  },

  whenThisSpriteClicked(x = 50, y = 50): BlockNode {
    return new BlockNode('event_whenthisspriteclicked', { topLevel: true, x, y });
  },

  whenBroadcastReceived(broadcastName: string, broadcastId: string, x = 50, y = 50): BlockNode {
    const node = new BlockNode('event_whenbroadcastreceived', { topLevel: true, x, y });
    node.setField('BROADCAST_OPTION', [broadcastName, broadcastId]);
    return node;
  },

  broadcast(broadcastName: string, broadcastId: string): BlockNode {
    const node = new BlockNode('event_broadcast');
    node.setInput('BROADCAST_INPUT', [1, [11, broadcastName, broadcastId]]);
    return node;
  },

  broadcastAndWait(broadcastName: string, broadcastId: string): BlockNode {
    const node = new BlockNode('event_broadcastandwait');
    node.setInput('BROADCAST_INPUT', [1, [11, broadcastName, broadcastId]]);
    return node;
  },

  // ===================
  // Motion
  // ===================
  moveSteps(steps: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_movesteps');
    if (steps instanceof BlockNode) {
      node.setInput('STEPS', steps);
    } else {
      node.setInput('STEPS', [1, [4, String(steps)]]);
    }
    return node;
  },

  turnRight(degrees: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_turnright');
    if (degrees instanceof BlockNode) {
      node.setInput('DEGREES', degrees);
    } else {
      node.setInput('DEGREES', [1, [4, String(degrees)]]);
    }
    return node;
  },

  turnLeft(degrees: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_turnleft');
    if (degrees instanceof BlockNode) {
      node.setInput('DEGREES', degrees);
    } else {
      node.setInput('DEGREES', [1, [4, String(degrees)]]);
    }
    return node;
  },

  goToXY(x: number | BlockNode, y: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_gotoxy');
    node.setInput('X', x instanceof BlockNode ? x : [1, [4, String(x)]]);
    node.setInput('Y', y instanceof BlockNode ? y : [1, [4, String(y)]]);
    return node;
  },

  changeXBy(dx: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_changexby');
    node.setInput('DX', dx instanceof BlockNode ? dx : [1, [4, String(dx)]]);
    return node;
  },

  setX(x: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_setx');
    node.setInput('X', x instanceof BlockNode ? x : [1, [4, String(x)]]);
    return node;
  },

  changeYBy(dy: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_changeyby');
    node.setInput('DY', dy instanceof BlockNode ? dy : [1, [4, String(dy)]]);
    return node;
  },

  setY(y: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_sety');
    node.setInput('Y', y instanceof BlockNode ? y : [1, [4, String(y)]]);
    return node;
  },

  pointInDirection(direction: number | BlockNode): BlockNode {
    const node = new BlockNode('motion_pointindirection');
    node.setInput('DIRECTION', direction instanceof BlockNode ? direction : [1, [8, String(direction)]]);
    return node;
  },

  ifOnEdgeBounce(): BlockNode {
    return new BlockNode('motion_ifonedgebounce');
  },

  setRotationStyle(style: 'all around' | 'left-right' | "don't rotate"): BlockNode {
    const node = new BlockNode('motion_setrotationstyle');
    node.setField('STYLE', [style, undefined]);
    return node;
  },

  xPosition(): BlockNode {
    return new BlockNode('motion_xposition');
  },

  yPosition(): BlockNode {
    return new BlockNode('motion_yposition');
  },

  // ===================
  // Looks
  // ===================
  say(message: string | BlockNode, durationSecs?: number): BlockNode {
    if (durationSecs !== undefined) {
      const node = new BlockNode('looks_sayforsecs');
      node.setInput('MESSAGE', message instanceof BlockNode ? message : [1, [10, String(message)]]);
      node.setInput('SECS', [1, [4, String(durationSecs)]]);
      return node;
    }
    const node = new BlockNode('looks_say');
    node.setInput('MESSAGE', message instanceof BlockNode ? message : [1, [10, String(message)]]);
    return node;
  },

  switchCostumeTo(costumeName: string): BlockNode {
    const node = new BlockNode('looks_switchcostumeto');
    const menuNode = new BlockNode('looks_costume', { shadow: true });
    menuNode.setField('COSTUME', [costumeName, undefined]);
    node.setInput('COSTUME', menuNode);
    return node;
  },

  nextCostume(): BlockNode {
    return new BlockNode('looks_nextcostume');
  },

  switchBackdropTo(backdropName: string): BlockNode {
    const node = new BlockNode('looks_switchbackdropto');
    const menuNode = new BlockNode('looks_backdrops', { shadow: true });
    menuNode.setField('BACKDROP', [backdropName, undefined]);
    node.setInput('BACKDROP', menuNode);
    return node;
  },

  setSizeTo(sizePercent: number | BlockNode): BlockNode {
    const node = new BlockNode('looks_setsizeto');
    node.setInput('SIZE', sizePercent instanceof BlockNode ? sizePercent : [1, [4, String(sizePercent)]]);
    return node;
  },

  changeSizeBy(delta: number | BlockNode): BlockNode {
    const node = new BlockNode('looks_changesizeby');
    node.setInput('CHANGE', delta instanceof BlockNode ? delta : [1, [4, String(delta)]]);
    return node;
  },

  show(): BlockNode {
    return new BlockNode('looks_show');
  },

  hide(): BlockNode {
    return new BlockNode('looks_hide');
  },

  goToFront(): BlockNode {
    const node = new BlockNode('looks_gotofrontback');
    node.setField('FRONT_BACK', ['front', undefined]);
    return node;
  },

  goToBack(): BlockNode {
    const node = new BlockNode('looks_gotofrontback');
    node.setField('FRONT_BACK', ['back', undefined]);
    return node;
  },

  // ===================
  // Sound
  // ===================
  playSoundUntilDone(soundName: string): BlockNode {
    const node = new BlockNode('sound_playuntildone');
    const menu = new BlockNode('sound_sounds_menu', { shadow: true });
    menu.setField('SOUND_MENU', [soundName, undefined]);
    node.setInput('SOUND_MENU', menu);
    return node;
  },

  startSound(soundName: string): BlockNode {
    const node = new BlockNode('sound_play');
    const menu = new BlockNode('sound_sounds_menu', { shadow: true });
    menu.setField('SOUND_MENU', [soundName, undefined]);
    node.setInput('SOUND_MENU', menu);
    return node;
  },

  stopAllSounds(): BlockNode {
    return new BlockNode('sound_stopallsounds');
  },

  // ===================
  // Control
  // ===================
  wait(seconds: number | BlockNode): BlockNode {
    const node = new BlockNode('control_wait');
    node.setInput('DURATION', seconds instanceof BlockNode ? seconds : [1, [4, String(seconds)]]);
    return node;
  },

  repeat(times: number | BlockNode, substack?: BlockNode): BlockNode {
    const node = new BlockNode('control_repeat');
    node.setInput('TIMES', times instanceof BlockNode ? times : [1, [6, String(times)]]);
    if (substack) node.setInput('SUBSTACK', substack);
    return node;
  },

  forever(substack?: BlockNode): BlockNode {
    const node = new BlockNode('control_forever');
    if (substack) node.setInput('SUBSTACK', substack);
    return node;
  },

  ifThen(condition: BlockNode, substack?: BlockNode): BlockNode {
    const node = new BlockNode('control_if');
    node.setInput('CONDITION', condition);
    if (substack) node.setInput('SUBSTACK', substack);
    return node;
  },

  ifElse(condition: BlockNode, substack?: BlockNode, elseSubstack?: BlockNode): BlockNode {
    const node = new BlockNode('control_if_else');
    node.setInput('CONDITION', condition);
    if (substack) node.setInput('SUBSTACK', substack);
    if (elseSubstack) node.setInput('SUBSTACK2', elseSubstack);
    return node;
  },

  waitUntil(condition: BlockNode): BlockNode {
    const node = new BlockNode('control_wait_until');
    node.setInput('CONDITION', condition);
    return node;
  },

  repeatUntil(condition: BlockNode, substack?: BlockNode): BlockNode {
    const node = new BlockNode('control_repeat_until');
    node.setInput('CONDITION', condition);
    if (substack) node.setInput('SUBSTACK', substack);
    return node;
  },

  stopAll(): BlockNode {
    const node = new BlockNode('control_stop');
    node.setField('STOP_OPTION', ['all', undefined]);
    node.mutation = {
      tagName: 'mutation',
      children: [],
      hasnext: 'false',
    };
    return node;
  },

  stopThisScript(): BlockNode {
    const node = new BlockNode('control_stop');
    node.setField('STOP_OPTION', ['this script', undefined]);
    node.mutation = {
      tagName: 'mutation',
      children: [],
      hasnext: 'false',
    };
    return node;
  },

  createCloneOf(spriteName: string): BlockNode {
    const node = new BlockNode('control_create_clone_of');
    const menu = new BlockNode('control_create_clone_of_menu', { shadow: true });
    menu.setField('CLONE_OPTION', [spriteName, undefined]);
    node.setInput('CLONE_OPTION', menu);
    return node;
  },

  startAsClone(x = 50, y = 50): BlockNode {
    return new BlockNode('control_start_as_clone', { topLevel: true, x, y });
  },

  deleteThisClone(): BlockNode {
    return new BlockNode('control_delete_this_clone');
  },

  // ===================
  // Sensing
  // ===================
  touchingObject(targetName: string): BlockNode {
    const node = new BlockNode('sensing_touchingobject');
    const menu = new BlockNode('sensing_touchingobjectmenu', { shadow: true });
    menu.setField('TOUCHINGOBJECTMENU', [targetName, undefined]);
    node.setInput('TOUCHINGOBJECTMENU', menu);
    return node;
  },

  touchingColor(colorHex: string): BlockNode {
    const node = new BlockNode('sensing_touchingcolor');
    node.setInput('COLOR', [1, [9, colorHex]]);
    return node;
  },

  keyPressed(key: string): BlockNode {
    const node = new BlockNode('sensing_keypressed');
    const menu = new BlockNode('sensing_keyoptions', { shadow: true });
    menu.setField('KEY_OPTION', [key, undefined]);
    node.setInput('KEY_OPTION', menu);
    return node;
  },

  distanceTo(targetName: string): BlockNode {
    const node = new BlockNode('sensing_distanceto');
    const menu = new BlockNode('sensing_distancetomenu', { shadow: true });
    menu.setField('DISTANCETOMENU', [targetName, undefined]);
    node.setInput('DISTANCETOMENU', menu);
    return node;
  },

  timer(): BlockNode {
    return new BlockNode('sensing_timer');
  },

  resetTimer(): BlockNode {
    return new BlockNode('sensing_resettimer');
  },

  // ===================
  // Operators
  // ===================
  add(a: number | string | BlockNode, b: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_add');
    node.setInput('NUM1', a instanceof BlockNode ? a : [1, [4, String(a)]]);
    node.setInput('NUM2', b instanceof BlockNode ? b : [1, [4, String(b)]]);
    return node;
  },

  subtract(a: number | string | BlockNode, b: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_subtract');
    node.setInput('NUM1', a instanceof BlockNode ? a : [1, [4, String(a)]]);
    node.setInput('NUM2', b instanceof BlockNode ? b : [1, [4, String(b)]]);
    return node;
  },

  multiply(a: number | string | BlockNode, b: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_multiply');
    node.setInput('NUM1', a instanceof BlockNode ? a : [1, [4, String(a)]]);
    node.setInput('NUM2', b instanceof BlockNode ? b : [1, [4, String(b)]]);
    return node;
  },

  divide(a: number | string | BlockNode, b: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_divide');
    node.setInput('NUM1', a instanceof BlockNode ? a : [1, [4, String(a)]]);
    node.setInput('NUM2', b instanceof BlockNode ? b : [1, [4, String(b)]]);
    return node;
  },

  random(min: number, max: number): BlockNode {
    const node = new BlockNode('operator_random');
    node.setInput('FROM', [1, [4, String(min)]]);
    node.setInput('TO', [1, [4, String(max)]]);
    return node;
  },

  gt(a: number | string | BlockNode, b: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_gt');
    node.setInput('OPERAND1', a instanceof BlockNode ? a : [1, [10, String(a)]]);
    node.setInput('OPERAND2', b instanceof BlockNode ? b : [1, [10, String(b)]]);
    return node;
  },

  lt(a: number | string | BlockNode, b: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_lt');
    node.setInput('OPERAND1', a instanceof BlockNode ? a : [1, [10, String(a)]]);
    node.setInput('OPERAND2', b instanceof BlockNode ? b : [1, [10, String(b)]]);
    return node;
  },

  equals(a: number | string | BlockNode, b: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_equals');
    node.setInput('OPERAND1', a instanceof BlockNode ? a : [1, [10, String(a)]]);
    node.setInput('OPERAND2', b instanceof BlockNode ? b : [1, [10, String(b)]]);
    return node;
  },

  and(a: BlockNode, b: BlockNode): BlockNode {
    const node = new BlockNode('operator_and');
    node.setInput('OPERAND1', a);
    node.setInput('OPERAND2', b);
    return node;
  },

  or(a: BlockNode, b: BlockNode): BlockNode {
    const node = new BlockNode('operator_or');
    node.setInput('OPERAND1', a);
    node.setInput('OPERAND2', b);
    return node;
  },

  not(condition: BlockNode): BlockNode {
    const node = new BlockNode('operator_not');
    node.setInput('OPERAND', condition);
    return node;
  },

  join(a: string | BlockNode, b: string | BlockNode): BlockNode {
    const node = new BlockNode('operator_join');
    node.setInput('STRING1', a instanceof BlockNode ? a : [1, [10, String(a)]]);
    node.setInput('STRING2', b instanceof BlockNode ? b : [1, [10, String(b)]]);
    return node;
  },

  round(num: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_round');
    node.setInput('NUM', num instanceof BlockNode ? num : [1, [4, String(num)]]);
    return node;
  },

  mod(num1: number | string | BlockNode, num2: number | string | BlockNode): BlockNode {
    const node = new BlockNode('operator_mod');
    node.setInput('NUM1', num1 instanceof BlockNode ? num1 : [1, [4, String(num1)]]);
    node.setInput('NUM2', num2 instanceof BlockNode ? num2 : [1, [4, String(num2)]]);
    return node;
  },

  // ===================
  // Variables & Lists
  // ===================
  setVariable(varName: string, varId: string, value: number | string | BlockNode): BlockNode {
    const node = new BlockNode('data_setvariableto');
    node.setField('VARIABLE', [varName, varId]);
    if (value instanceof BlockNode) {
      node.setInput('VALUE', value);
    } else {
      node.setInput('VALUE', [1, [10, String(value)]]);
    }
    return node;
  },

  changeVariableBy(varName: string, varId: string, delta: number | BlockNode): BlockNode {
    const node = new BlockNode('data_changevariableby');
    node.setField('VARIABLE', [varName, varId]);
    if (delta instanceof BlockNode) {
      node.setInput('VALUE', delta);
    } else {
      node.setInput('VALUE', [1, [4, String(delta)]]);
    }
    return node;
  },

  showVariable(varName: string, varId: string): BlockNode {
    const node = new BlockNode('data_showvariable');
    node.setField('VARIABLE', [varName, varId]);
    return node;
  },

  hideVariable(varName: string, varId: string): BlockNode {
    const node = new BlockNode('data_hidevariable');
    node.setField('VARIABLE', [varName, varId]);
    return node;
  },

  getVariable(varName: string, varId: string): BlockNode {
    const node = new BlockNode('data_variable');
    node.setField('VARIABLE', [varName, varId]);
    return node;
  },

  addToList(listName: string, listId: string, item: string | BlockNode): BlockNode {
    const node = new BlockNode('data_addtolist');
    node.setField('LIST', [listName, listId]);
    if (item instanceof BlockNode) {
      node.setInput('ITEM', item);
    } else {
      node.setInput('ITEM', [1, [10, String(item)]]);
    }
    return node;
  },

  deleteAllOfList(listName: string, listId: string): BlockNode {
    const node = new BlockNode('data_deletealloflist');
    node.setField('LIST', [listName, listId]);
    return node;
  },

  chainBlocks(blocks: BlockNode[]): BlockNode {
    if (blocks.length === 0) return Blocks.wait(0);
    for (let i = 0; i < blocks.length - 1; i++) {
      blocks[i].chain(blocks[i + 1]);
    }
    return blocks[0];
  },
};
