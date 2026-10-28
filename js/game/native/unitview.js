// Unit state / direction and the UnitNode animation layer (view only).
//   Unit::setState / setDirection / getState / getDirection          (model, libMyGame.so 1.4.1)
//   Unit::notifyChangeState -> C_UNIT_CHANGE_STATE -> TowerView::msg_C_UNIT_CHANGE_STATE
//     -> UnitNode::animateWithState(loop, rate) -> getAnimateWithState() + spineAnimate(state, name, loop, rate)
//   SkillAction::onTriggered -> C_SKILL_ACTION -> UnitNode::spineAnimate(2, getSkillAnimate(act), false, rate)
//   UnitNode::appearAnimate -> spineAnimates(state, ["appear-1-D", "stand-1-D"], true, -1)
// The Spine track index is the unit state, and C_UNIT_ANIM_EVENT / C_UNIT_ANIM_COMPLETE report it as "state".
// Nothing here decides gameplay: events/completes are routed back to the combat owner (combat.js).
import { arc4random } from '../../engine/nativerng.js';
import { U } from './core.js';

// UnitState
export const ST = { STAND: 0, RUN: 1, ATTACK: 2, DEAD: 3, READY: 4, HIDE: 5, ESCAPE: 6 };
// Direction 1 up, 2 down, 3 left, 4 right; the art faces left, direction 4 mirrors it (UnitNode scaleX -1)
export const OPPOSITE = [0, 2, 1, 4, 3];   // DAT_00ef6d9c

export const UV = {
  state: u => u.ustate | 0,
  setState(u, s) { u.ustate = s; },
  dir: u => u.udir || (u.flip ? 3 : 4),
  setDir(u, d) {   // Unit::setDirection (the node applies the mirror on its next animateWithState)
    u.udir = d;
  },
  applyDir(u) { const d = UV.dir(u); u.flip = d !== 4; if (u.isHero) u.dir = d < 2 ? 1 : d > 2 ? 3 : 2; },
  // UnitNode::getAnimateWithState (+ HeroNode / BossNode overrides)
  animName(u) {
    let d = UV.dir(u); if (2 < d) d = 3; if (d < 2) d = 1;
    const s = UV.state(u);
    let name;
    if (U.isAbnormal(u, 1)) name = `stand-1-${d}`;
    else switch (s) {
      case 0: name = `stand-1-${d}`; break;
      case 1: name = `run-1-${d}`; break;
      case 2: name = `attack-1-${d}`; break;
      case 4: name = `ready-1-${d}`; break;
      case 5: name = `hide-1-${d}`; break;
      case 6: name = `run-1-${d}`; break;
      default: name = '';
    }
    if (name.startsWith('attack')) {
      if (u.isHero) name = `attack-${(arc4random() & 1) + 1}-${d}`;            // HeroNode::getAnimateWithState
      else if (u.bossNode) name = `attack-${(arc4random() % 5) + 1}-${d}`;     // BossNode::getAnimateWithState
    } else if (u.bossNode && s === 3) name = 'deathloop-1-3';
    return name;
  },
  // UnitNode::animateWithState(loop, rate)
  changeState(u, loop, rate) {
    const a = u.actor; if (!a) return null;
    const name = UV.animName(u);
    const e = name ? a.spineAnimate(UV.state(u), name, loop, rate) : null;
    UV.applyDir(u);
    return e;
  },
  // TowerView::msg_C_SKILL_ACTION
  skillAction(u, act, rate) {
    const a = u.actor; if (!a) return null;
    let d = UV.dir(u); if (2 < d) d = 3; if (d < 2) d = 1;
    return a.spineAnimate(2, `skill-${act}-${d}`, false, rate);
  },
  // UnitNode::appearAnimate
  appear(u) {
    const a = u.actor; if (!a) return null;
    let d = UV.dir(u); if (2 < d) d = 3; if (d < 2) d = 1;
    const e = a.spineAnimates(UV.state(u), [`appear-1-${d}`, `stand-1-${d}`], true, -1);
    UV.applyDir(u);
    return e;
  },
  // UnitNode::onAnimationComplete(track, ...): after feedbackUnitAnimationComplete, a completed cycle on track 0
  // counts down this+0x660 (UnitNode ctor: arc4random()%3+3); at 0 -> relaxAnimate(), reset to arc4random()%6+4.
  //   HeroNode::relaxAnimate:    spineAnimates(state, ["stand-(arc4random()%3+2)-D", "stand-1-D"], true, -1)
  //   MonsterNode::relaxAnimate: spineAnimates(state, ["stand-2-3", "stand-1-3"], true, -1)   (BossNode inherits)
  //   UnitNode::relaxAnimate:    nothing
  relaxInit(u) { u.relaxN = (arc4random() % 3) + 3; },
  animComplete(u, track) {
    if (track !== 0) return;
    if (u.relaxN === undefined) UV.relaxInit(u);
    const c = u.relaxN; u.relaxN = c - 1;
    if (u.relaxN === 0 || c < 1) { UV.relax(u); u.relaxN = (arc4random() % 6) + 4; }
  },
  relax(u) {
    const a = u.actor; if (!a) return;
    if (u.isHero) {
      const k = (arc4random() % 3) + 2;
      const d = UV.mapDir(u);
      a.spineAnimates(UV.state(u), [`stand-${k}-${d}`, `stand-1-${d}`], true, -1);
    } else if (!u.isPet) a.spineAnimates(UV.state(u), ['stand-2-3', 'stand-1-3'], true, -1);
  },
  // the hero's getDirection clamped to the 1..3 animation suffix (map movement keeps it in u.dir)
  mapDir: u => (u.isHero && u.dir ? u.dir : (() => { let d = UV.dir(u); if (2 < d) d = 3; if (d < 2) d = 1; return d; })()),
  // UnitNode::setActionRate (C_UNIT_ACTION_RATE)
  setActionRate(u, rate) { u.actor?.setActionRate(rate); },
};
