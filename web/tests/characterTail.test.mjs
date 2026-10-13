import test from 'node:test';
import assert from 'node:assert/strict';
import { tailPose } from '../js/components/CharacterTail.js';
import { characterSpriteSVG } from '../js/components/CharacterSprite.js';
test('tails are behind body except rear, with longer cat tail and seated hold',()=>{
    assert.equal(tailPose('dog','right_walk').foreground,false);
    assert.equal(tailPose('dog','up_walk').foreground,true);
    assert.ok(tailPose('black-cat','right_walk').width>tailPose('dog','right_walk').width);
    assert.equal(tailPose('black-cat','right_sit',0,true).angle,tailPose('black-cat','right_sit',2,true).angle);
    assert.notEqual(tailPose('dog','right_walk',0,true).angle,tailPose('dog','right_walk',2,true).angle);
});
test('integrated tails mirror with the body without an additional tail overlay',()=>{
    for (const styleId of ['dog','black-cat']) {
        const left=characterSpriteSVG({styleId,direction:'left',moving:true,time:0});
        assert.match(left,/scale\(-1 1\)/);
        assert.ok(!left.includes('data-character-tail'));
        assert.ok(!left.includes('tails-v1'));
        const back=characterSpriteSVG({styleId,direction:'up',moving:true,time:0});
        assert.ok(!back.includes('data-character-tail'));
    }
});
