import { describe, it, expect } from 'vitest';
import { Blocks, BlockNode } from '@/engine/blocks';

describe('Blocks AST & Factories', () => {
  it('creates top-level hat blocks correctly', () => {
    const hat = Blocks.whenFlagClicked(100, 150);
    expect(hat.opcode).toBe('event_whenflagclicked');
    expect(hat.topLevel).toBe(true);
    expect(hat.x).toBe(100);
    expect(hat.y).toBe(150);
    expect(hat.parent).toBeNull();
  });

  it('chains blocks with mutual parent and next pointers', () => {
    const hat = Blocks.whenFlagClicked();
    const move = Blocks.moveSteps(10);
    const say = Blocks.say('Hello');

    hat.chain(move).chain(say);

    expect(hat.next).toBe(move);
    expect(move.parent).toBe(hat);
    expect(move.next).toBe(say);
    expect(say.parent).toBe(move);
    expect(say.next).toBeNull();
  });

  it('flattens a script into valid Scratch 3.0 blocks dictionary', () => {
    const hat = Blocks.whenFlagClicked();
    const move = Blocks.moveSteps(15);
    hat.chain(move);

    const blocksMap = hat.flatten({});

    expect(Object.keys(blocksMap).length).toBe(2);
    expect(blocksMap[hat.id].opcode).toBe('event_whenflagclicked');
    expect(blocksMap[hat.id].next).toBe(move.id);
    expect(blocksMap[hat.id].parent).toBeNull();

    expect(blocksMap[move.id].opcode).toBe('motion_movesteps');
    expect(blocksMap[move.id].parent).toBe(hat.id);
    expect(blocksMap[move.id].next).toBeNull();
    expect(blocksMap[move.id].inputs['STEPS']).toEqual([1, [4, '15']]);
  });

  it('correctly handles nested sub-block reporters', () => {
    const addOp = Blocks.add(5, 10);
    const move = Blocks.moveSteps(addOp);

    const blocksMap = move.flatten({});
    expect(blocksMap[move.id].inputs['STEPS'][0]).toBe(2); // sub-block reference
    expect(blocksMap[move.id].inputs['STEPS'][1]).toBe(addOp.id);
    expect(blocksMap[addOp.id].opcode).toBe('operator_add');
  });
});
