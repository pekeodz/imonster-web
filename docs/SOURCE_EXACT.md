# Source-exact status (audit "iMonster_Web_Audit_Can_Sua_SOURCE_EXACT_VI1")

Source of truth: APK/OBB 1.4.1 — `libMyGame.so` (arm64), `formular.lua`/`skill.lua`, data tables.
Everything marked **VERIFY/TODO** is not reversed yet and must not be "balanced".

## Done (verified in native)

| Item | Native evidence | Web |
|---|---|---|
| Stat aggregation | `Hero::getFinX` = `Unit::calAttribWithBuffs(a, Hero::calAttribWithEquipments(a, base))`. Equip layer: `int(f32(base + itemBaseBenefit) * (100 + affixGain) / 100) + affixBenefit`; buff layer: `int(v * (100 + gain) / 100 + benefit)`; attr 3 (ATK) also feeds attr 1/2 in both layers; float32 math, `fcvtzs` truncation | `stats.js` `equipLayer`, `buffLayer`, `playerStats`, `applyBuffLayer` |
| Property → UnitAttrib map | `EquipEffect_<id>::getAttribBenefit/getAttribGain` (`cmp w2,#attr`); 49/52 negate p1 | `PROP_ATTR` |
| Affix layer contents | `Equipment::getAttribBenefit(unit, attr, base, affix)`: base list vs affixes + extra list + 3 gems | `equipSums` |
| MP cost / cooldown | `Hero::getFinMPCost` (attr 29), `Hero::getFinSkillCooldown` (attr 30, base = int(cd*1000), result /1000) | `heroFinMPCost`, `heroFinCooldown` |
| Monster stats | `Monster::initWithData`: `int(rate*f32(stat*factor))` (HP, MP, dmg, elem dmg, def, hit, dodge, crit, crit dmg); resists `int(stat*factor + extraRes)`; ATK SPD/EXP/Gold `int(stat*factor)`; extraRes = rate>2.2 ? clamp(int((rate-2.2)*50),0,80) : 0; stat row = (lv+MonsterLevel)*10+rank; no 90 clamp, no min/max swap | `monsterStats` |
| Monster AtkTimes | `Monster::getFinMin/MaxAttack` + 4 elem attack getters: `int(f32(1+0.2*(n-1)) * buffed / n)` | `perHitAttack`, `Combat.stats` |
| Resist clamps | none in stat getters | removed 75 / 90 |
| `sw.randi` / `sw.rand` | both registered to `ScriptExecutor::Lrand`: both args integer subtype → `lo=min, hi=max, lo + arc4random() % (hi-lo+1)` (int32); otherwise float `lo + (hi-lo) * ((arc4random() % 100001) * 1e-5f)` | `engine/nativerng.js` (raw Lua host fn) |
| `sw.SuccessRandom(p)` | `(arc4random()%100001)*1e-5f <= f32(p * 0.01f)` | `LSuccessRandom` |
| Skill damage | `Unit::calSkillDamage`: atk=max(0,val+hook), def/res=max(0,stat+hook); phys `int(CalPhysicalDamage(lvA, atk, def))`; elem `int(CalEleDmg(atk, max(1,lvA), res, max(1,lvB)))`; `int(CalCriticalDamage(force, dmg, crit, critDmg))` | `Combat.skillDamage` (removed web crit/2 and 90% res clamp) |
| ATK SPD | internal value = AtkSpdMult (e.g. Simple Dagger 333); attack anim (2 s) plays at speed/100 (`AttackBehavior::startNewAttack`), no 0.2 s cap. **UI shows value/2** (`Equipment::getBasicDescription`, `PackageView::updatePlayerInfo`: `asr #1`) → 333 shows as 166 | `attackInterval`; `atkSpdText()` |
| Hard mode +100 LUC | no client-side bonus; original "hard rate" came from the server (`GameMap+0x68`) | removed |
| 9 equipment slots | no Type 13/45 rows in equip.csv | `EQUIP_SLOTS` (save migration moves offhand/ring2 to bag) |
| Specialization roll | `CalEquipmentSpecial(equID, specID)` incl. the 6 hard-coded overrides | `makeEquip` stores `it.spec=[{id,p1,p2}]`; old saves rolled once on load |
| DK Cobra Stick (spec 221) | `EquipEffect_221::beforeDamageCalculation`: mode 0 and target curHP >= finMaxHP → arm; `onHitEnemy`: armed → `SkillShortEffect(2.0, SkillFaint)` | `native/equipfx.js` `EQ[221]` |
| Affix option groups | `"30,43;31,44"` = one option holding 2 affixes | `makeEquip` |

## VERIFY / TODO

- Hero extra base fields (`Hero+0x154..0x170`, 2nd addend in `getFinMinAttack/MaxHP/...`) → web uses 0.
- Abnormal status 4/5 branch in min-attack getters (min attack returns another getter) → not ported.
- Option pick for affix/specialization lists (assumed uniform `arc4random() % n`).
- Map `ResInc`: consumer not reversed; web adds it to monster resists.
- Monster `rate` from `GameMap::genRandomMap` (lv>=21 maps + server bonus) → web uses 1. Web hard mode (`Modes.hardScale`) is **non-original**.
- `applyHeroSpecials`, pet stat effects, speed-up buffs, damage-change buffs, `applyDamage` (`max(1, round)`), gold ±20% random on kill, EXP rounding: web-side, not yet compared with native.
- Drop path `calItemIDWithDropSet` retry logic.
- `CalEquipmentAttrib/Affix` results are `Math.round`ed — native conversion not checked.

## Doc 2 – P0 Equipment Specialization runtime (v6)

| Item | Native evidence | Web |
|---|---|---|
| Property objects | every base / affix / special / gem property of an item is one `EquipEffect_<id>` object (p1 `+0x34`, p2 `+0x38`, state `+0x40/+0x60/+0xf0`, MyTimer `+0x60/+0x70`) | `native/equipfx.js` – all **412** classes (`EQ[id]`), every method (553/553 checked by `build/covm_probe.js`) |
| Iteration order | `Equipment::forEachProperty`: base (`+0xb0`) → affix (`+0xc8`) → special (`+0xe0`) → gems (`+0xf8..`, `Consumable::forEachAffix`); `Hero::forEachEquipment` slot order | `bridge.heroEquipEffects()` (objects cached per item, battle state kept) |
| Equipment layer | `Hero::calAttribWithEquipments` lambda `0117e8d8`: base-list benefits join the base value, other lists → benefit + gain; attr 1/2 also add attr 3; `bene + int((gain+100)*base/100)` | `bridge.calAttribWithEquipments` (live, used by `finAttr`, `finMPCost`, `finCooldown`) – identical to the old flat layer for plain properties (40 random sets, 0 diff) |
| Skill level props 1000–1092, 99 | `getSkillBenefit(skill)`; `isFffective` = `MyPlayer::getOwnSkill` | `SKILL_PROPS` → `finSkillLevel` |
| Hooks | onEnterBattle / onLeaveBattle / onHitEnemy / onDamagedByEnemy / onUsedSkill / onKillEnemy / before/after(Be)DamageCalculation / afterRecoverCalculation / beDamaging / onTriggerEffect / onDodgeEnemy / afterTrapDamageCalculation | dispatched by `U.forEachEffect` (equip effects first); equip MyTimers updated from `U.update` |
| Anonymous effects | vtable `01187f08` = SkillFaint, `01184c20` = SkillFroze(qte=false), `01187c80` = SkillProtect | `shortFaint`, `SkillFroze(false)`, `SkillProtect` |
| C_UNIT_TRIGGER | 625/626 post `{ek}`; MyPlayer forwards to `onTriggerEffect` (627 ← "626", 628 ← "625") | `postTrigger` |
| Unit raw fields | `+0x74` HP, `+0x7c` MP, `+0x80` base max MP (= HeroTemplate MaxMP), `+0x78` base max HP | `rawMaxMP`, `rawHeroHP` |

### VERIFY / TODO (doc 2 equipment)
- Fashion system is not in the web build: `getFashion()` → none, so fashion doubling (634–637, 652–659), 629/630/632 fashion branches and 650 (fashion gems) use the no-fashion path.
- 531: two float slots of the mode array are not visible in the decomp (assumed 0). 645: decomp adds the change to the enemy with `-(p2/100)` integer division – ported as decompiled.
- 553: SkillFreeEffect trigger inside a SkillShortEffect never fires (ShortEffect does not trigger its child) – ported as is.
- `Unit+0x78` (662) assumed HeroTemplate MaxHP; monsters use fin max HP/MP.
- `Hero::getEquipmentWithType(t)` mapped to `EQUIP_SLOTS[t]`.
- `MsgCenter::postMsg` assumed synchronous.

## Doc 2 – P0 Boss / Monster AI / elite / rank (v7)

| Item | Native evidence | Web |
|---|---|---|
| Map kinds | `GameMap::resetWithID`: Generate 0 `genRandomMap`, 1 `genFixedMap`, 2 `genBossMap` | `Tower.enter` (boss maps 1002…1020, 6001 were random maps before) |
| Fixed-map monsters | `MapTemplate::loadObjectLayer`: `mon_<id>_<rank>`, rank 0/missing → **3**; object name = key name, properties = scripts; `genFixedMap`: lv = map Level, Content 2 → direction 3 | `buildFixed` |
| Boss map | `genBossMap`: only the first FixMonster, **rank 4**, lv = Level, state 5 (hidden), direction 3; none on maps 1012/1016 (`MapTemplate::hasBoss`); `setBossID` | `buildFixed(m, true)` |
| Random-map counts | `genRandomMap`: `monster`; `blue_monster` only Floor ≥ 6; `gold_monster` only Floor ≥ 21; Level > 50 and ID>>4 < 625: 3/10 of normal → blue, 1/10 → gold; ID>>4 ≥ 625 and Level ≥ 21: rate = (Level−20)·0.02 + 1 + GameMap+0x68 | `placeRandomMonsters` |
| Random-map IDs / order | random start index in MonsterID, +1 per monster (cycling); ranks placed 3 → 2 → 1; failed template = skipped but counted | same |
| Random-map tiles | 50 % from the round-floor list (4 neighbours of objects, push_front; type 19 ×3; not types 20–23/25/27/28), else pop the shuffled road list with 80 % “no entity on a 4-neighbour”; never entity/born/pass; road list empty → rest of the rank skipped; map 1 before story 40: first normal monster next to the born tile | same rules on the web grid |
| Script spawn | `LAddMonster(id, rank[, lv[, col, row]])`: lv is an **absolute** level (default map level); tile 0/0 → random `getRoads` tile except hero/pet | `spawnMonster` (was “level offset”) |
| GetMonsterCount | r1+r2+r3, r1, r2, r3 (bosses not counted) | story.js |
| Who starts a fight | only `MyPlayer::attack` (tap, `RushBehavior::touchEntity`); monsters never attack first | random ambush removed |
| Boss fight | `MyPlayer::attack` rank 4 → MoveBehavior + **FightBehavior**: hidden boss → `C_BOSS_APPEAR` (veil, BossBGM, "appear", 501233 walls the tile left of the hero, story "boss appear"), battle starts when the appear animation completes; no walk-in at state 7, ends on the attacker's next attack-animation end; end() result table 4→1, 6→2, 7/8→0 | `FightBehavior` in combat.js, `Tower.bossAppear` |
| Battle story events | `notifyEnterBattle` at AttackBehavior::init (FightBehavior: after appear) → "battle begin" {mon_id}; `notifyLeaveBattle` → "battle end" {result, mon_id, mon_rank, mon_lv} | `notifyEnterBattle`, `onBattleEnd` |
| Monster death | `Monster::die`: run `OnDead` script, `Unit::die`, `removeMonster`; one random DeathSound; BossNode: death-1-3 → deathloop-1-3 (body stays) | `monsterDie` |
| AI | `monsterAIAction` pushes `_battle._hit/_critical/_time`; `_time` = gettimeofday double − AttackBehavior+0x40 (wall clock); onHit/beDamage do not touch `_time`; `resetBattle` = `{_time = 0}` | bridge `__nAI`, `wallSeconds()` |
| Elite visuals | `TowerView::_addMonster`: rank 3 scale 1.2 (others 1.0); rank 2 `ccb/object/leaderfx-1`, rank 3 `leaderfx-2`; no tint | `loadMonsterActor`, `drawUnit` (rings added to towerfx.json by tools/ornaments.py) |

### VERIFY / TODO (doc 2 boss/monster)
- The random-map generator itself (`paveRoads`, `resetWidths`, objects) is still the web one → road list / object tiles differ; the web generator also gives up early on big `deep` values (floor 120: ~112 tiles for deep 434), so high floors get fewer monsters than the config. Port in P1 Map.
- QTE in FightBehavior (`C_QTE_END`) not implemented (QTE state 0).
- Monster popup words (`C_POPUP_DIALOG`, chance 30−6·n %) not shown.
- `triggerBattleBegin` return 2 → "battle-1" UI animation not shown.
- Pet runtime (P1) now only acts while the battle is entered (states 3/5).
- Fixed-map object scripts (`OnOpened`) and triggers (`OnPlayerEnter`) are parsed/kept but not run yet (P1 Story).
