--[[***************************************************************************************
* Copyright (c) 2014, Pixss.Com.Ltd. All rights reserved.
*****************************************************************************************--]]


--[[
 delay: 延迟
    time: 延迟的时间，秒

 body effect: 在指定单位上播放特效
    file: 特效文件名
    src: 单位。"caster" 施法者，"enemy" 敌人
    slot: 插槽名。可选

 scene effect: 以指定实体的锚点为坐标，在场景上播放特效
    file: 特效文件名
    root: 添加层级。"scene_front" 场景的顶层效果，"scene_bottom" 场景的底层效果，"scene_tile" 地块层，"scene_orna" 装饰层，"scene_unit" 单位层
    src: 指定实体。"caster" 施法者，"enemy" 敌人，"skbn" 技能按钮
    slot: 可选，如果目标是单位，则可指定插槽

 fly effect: 播放飞行特效
    file: 特效文件名
    mode: 0 - 直线，1 - 曲线
    track: 0 - 不拖尾，1 - 拖尾
    dir: 0 - 不旋转，1 - 朝向目标
    src: 飞行起点。"caster" 施法者，"enemy" 敌人，"skbn" 技能按钮
    src_slot: 起点插槽，可选
    tgt: 飞行目标。"caster" 施法者，"enemy" 敌人，"skbn" 技能按钮
    tgt_slot: 目标插槽，可选
	time: 飞行时间，秒
	
qte start: 触发qte
	perc: 触发概率，百分比

-------------------------------------------------------------------------------------------------
 玩家角色专用
-------------------------------------------------------------------------------------------------
 double attack: 二次攻击
    src: 固定"caster"
    perc: 概率，百分比

 single skill: 特殊的技能效果，单独实现
    src: 固定"caster"
    id: 技能id

-------------------------------------------------------------------------------------------------
 1、以下效果，每一项均会标记 instant 或 buff，instant表示立即作用，buff表示持续生效
 2、instant效果可增加 period、loop 两个可选字段，此时该效果为周期性触发，period为间隔周期，loop为触发次数
 3、buff效果可增加 duration 字段，此时该效果仅持续一段时间，时间由duration指定，单位秒
 4、每一种buff效果，均可以增加 unique_id 字段，该字段的值可自由设置，但必须为正整数。其作用为：当该效果被添加到单位
    上时，如果单位已经附有相同unique_id的效果，则新效果将覆盖旧的效果。
    该字段对instant效果无效。但如果instant效果增加了period、loop字段，则其本质上也转为一类buff，此时该id也将有效
-------------------------------------------------------------------------------------------------
 (instant) action: 指定单位进行动作
    src: 进行动作的单位。"caster" 施法者，"enemy" 敌人
    idx: 动作编号（skill-idx-3）

 (instant) skill damage: 技能伤害
    src: 伤害源。"caster" 施法者，"enemy" 敌人
    tgt: 伤害目标。"caster" 施法者，"enemy" 敌人
    elem: 伤害类型。0物理，1火焰，2冰霜，3闪电，4毒素，参照定义表 AttackType
    val: 伤害值
    crit: true表示强制暴击

 (instant) suck damage: 吸血伤害，造成伤害的同时，根据伤害量恢复一定生命值
    src: 伤害源。"caster" 施法者，"enemy" 敌人
    tgt: 伤害目标。"caster" 施法者，"enemy" 敌人
    elem: 伤害类型。0物理，1火焰，2冰霜，3闪电，4毒素，参照定义表 AttackType
    val: 伤害值
    suck: 吸血百分比

 (instant) skill attack: 技能攻击（由技能触发，但执行类似于普通攻击的计算）
    src: 伤害源。"caster" 施法者，"enemy" 敌人
    tgt: 伤害目标。"caster" 施法者，"enemy" 敌人
    perc: 攻击力百分比。30表示以30%的攻击力计算（同时影响5种类型的攻击力）
    hit: true表示强制命中
    crit: true表示强制暴击

 (instant) skill recover: 恢复
    src: 恢复的单位。"caster" 施法者，"enemy" 敌人
    hp: 恢复hp量。可选
    mp: 恢复mp量。可选

 (instant) mp loss: 损失法力
    src: 释放源
    tgt: 损失法力的单位
    loss: 损失量，净值，非百分比

 (instant) steal: 偷血瓶
    rate: 成功率

 (buff) attrib benefit: 属性加成
    src: 单位。"caster" 施法者，"enemy" 敌人
    attr: 属性类型。参见AttribType
    bene: 加成值。负数表示减少

 (buff) attrib gain: 属性百分比加成
    src: 单位。"caster" 施法者，"enemy" 敌人
    attr: 属性类型。参见AttribType
    gain: 加成百分比。30 表示增加30%

 (buff) weapon benefit: 根据武器类型获得属性加成
    src: 单位。"caster" 施法者，"enemy" 敌人
    attr: 属性类型。参见AttribType
    bene: 加成值。负数表示减少
    weap: 武器类型，10-轻型，11-重型，12-长柄

 (buff) weapon gain: 根据武器类型获得属性百分比加成
    src: 单位。"caster" 施法者，"enemy" 敌人
    attr: 属性类型。参见AttribType
    gain: 加成百分比。30 表示增加30%
    weap: 武器类型，10-轻型，11-重型，12-长柄

 (buff) cause damage change: 造成伤害变化
    src: 单位。"caster" 施法者，"enemy" 敌人
    physics: 物理伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    fire: 火焰伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    cold: 冰霜伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    light: 闪电伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    poison: 毒素伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    attack: 普通攻击伤害时
    skill: 技能伤害时

 (buff) damage back: 反伤。受伤时，按照伤害值，自动对攻击者造成一定比例伤害
    src: 携带反伤效果的单位。"caster" 施法者，"enemy" 敌人
    perc: 反伤百分比

 (buff) suck red: 吸血。攻击命中时，按照伤害值，以一定比例恢复生命
    src: 携带吸血效果的单位。"caster" 施法者，"enemy" 敌人
    perc: 吸血百分比

 (buff) be damage change: 受伤变化。携带该效果的单位受到伤害时，伤害值会被改变
    src: 单位
    physics: 受物理伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    fire: 受火焰伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    cold: 受冰霜伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    light: 受闪电伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    poison: 受毒素伤害时，伤害值的变化。20表示增加20%，-30表示减少30%。缺省时不改变
    attack: 受普通攻击伤害时
    skill: 受技能伤害时
    trap: 受机关伤害时

 (buff) recover change: 治疗变化。携带该效果的单位受到治疗时，值会被改变
    src: 单位
    perc: 值的变化百分点。20表示增加20%，-30表示减少30%

 (buff) additional attack: 攻击附加。每次攻击命中时，额外计算一部分攻击力
    src: 单位
    physics: 附加的物理攻击力
    fire: 附加的火焰攻击力
    cold: 附加的冰霜攻击力
    light: 附加的闪电攻击力
    poison: 附加的毒素攻击力

 (buff) shield: 护盾
    src: 单位
    val: 吸收的总伤害值

 (buff) speed up: 动作加速（或减速）
    src: 单位
    val: 增减量。20表示动作加快20%，-20表示减缓20%

 (buff) froze: 冰冻
    src: 单位

 (buff) faint: 昏迷
    src: 单位
--]]


AttribType = {
    MIN_ATTACK          = 1,    -- 最小攻击
    MAX_ATTACK          = 2,    -- 最大攻击
    ATTACK              = 3,    -- 攻击
    DEFENSE             = 4,    -- 防御
    HP                  = 5,    -- 生命值
    MP                  = 6,    -- 魔法值
    FIRE_RESIST         = 7,    -- 火抗
    COLD_RESIST         = 8,    -- 冰抗
    LIGHT_RESIST        = 9,    -- 雷抗
    POISON_RESIST       = 10,   -- 毒抗
    FIRE_ATTACK         = 11,   -- 火攻
    COLD_ATTACK         = 12,   -- 冰攻
    LIGHT_ATTACK        = 13,   -- 雷攻
    POISON_ATTACK       = 14,   -- 毒攻
    HIT                 = 15,   -- 命中
    DODGE               = 16,   -- 闪避
    CRITICAL            = 17,   -- 暴击
    CRIT_DAMAGE         = 18,   -- 暴击伤害
    ATTACK_SPEED        = 19,   -- 攻击速度
    LUCK                = 20,   -- 幸运
    EXTRA_EXP           = 21,   -- 额外经验
    EXTRA_GOLD          = 22,   -- 额外黄金
    HPRECOVER_HIT       = 23,   -- 命中恢复生命值
    HPRECOVER_WIN       = 24,   -- 击杀恢复生命值
    MPRECOVER_HIT       = 25,   -- 命中恢复魔法值
    MPRECOVER_WIN       = 26,   -- 击杀恢复魔法值
    EXTRA_RED           = 27,   -- 额外红瓶
    EXTRA_BLUE          = 28,   -- 额外蓝瓶
    MP_COST             = 29,   -- 法力消耗
    SKILL_COOLDOWN      = 30,   -- 技能冷却
    DEBUFF_RESIST       = 31,   -- 减益抗性
    CONTROL_RESIST      = 32,   -- 控制抗性
};

-- 攻击类型定义
AttackType = {
	Physics = 0,
	Fire = 1,
	Ice = 2,
	Light = 3,
	Poison = 4
}


-- 针对1阶技能的强化，为方便起见，直接在这里增加效果
function SkillGroup12(lst, caster, enemy, skillLv)
    -- 107000	施放1#战斗技能会使敌人的防御降低 6%+1%/级，持续 5 秒
    if (sw.IsSkillLearned(107000)) then
        lst[#lst + 1] = {
            type    = "attrib gain",
            src     = "enemy",
            attr    = AttribType.DEFENSE,
            gain    = -(6 + 1 * sw.GetSkillLevel(107000)),
            duration= 5,
        };
    -- 107001	施放1#战斗技能后，你的普通攻击伤害提高 6%+1%/级，持续 5 秒
    elseif (sw.IsSkillLearned(107001)) then
        lst[#lst + 1] = {
            type    = "cause damage change",
            src     = "caster",
            attack  = 6 + 1 * sw.GetSkillLevel(107001),
            duration= 5,
        };
    -- 107002	1#战斗技能会使目标的速度降低 8%+1.75%/级，持续 3 秒
    elseif (sw.IsSkillLearned(107002)) then
        lst[#lst + 1] = {
            type    = "speed up",
            src     = "enemy",
            val     = -(8 + 1.75 * sw.GetSkillLevel(107002)),
            duration= 3,
        };
    -- 107003	施放1#战斗技能会使目标受到暴击的几率提高 3%+0.75%/级，持续 5 秒
    elseif (sw.IsSkillLearned(107003)) then
        lst[#lst + 1] = {
            type    = "attrib benefit",
            src     = "caster",
            attr    = AttribType.CRITICAL,
            bene    = 3 + 0.75 * sw.GetSkillLevel(107003),
            duration= 5,
        };
    -- 107004	施放1#战斗技能后，你的攻击速度提高 6%+1%/级，持续 3 秒
    elseif (sw.IsSkillLearned(107004)) then
        lst[#lst + 1] = {
            type    = "attrib gain",
            src     = "caster",
            attr    = AttribType.ATTACK_SPEED,
            gain    = 6 + 1 * sw.GetSkillLevel(107004),
            duration= 3,
        };
    -- 107005	施放1#战斗技能后，立即恢复 7%+0.75%/级 的生命
    elseif (sw.IsSkillLearned(107005)) then
        lst[#lst + 1] = {
            type    = "skill recover",
            src     = "caster",
            hp      = caster.max_hp * (0.07 + 0.0075 * sw.GetSkillLevel(107005)),
        };
    end
end

-- 针对2阶技能的强化，前半部分
function SkillGroup17Before(lst, caster, enemy, skillLv)
    local res = {type = "skill damage", suck_perc = 0, atk_rate = 0};
    -- 2#战斗技能可以偷取生命，效果相当于所造成伤害的 6%+1%/级
    if (sw.IsSkillLearned(110000)) then
        res.type = "suck damage";
        res.suck_perc = 6 + 1 * sw.GetSkillLevel(110000);
    -- 2#战斗技能对于生命高于 85%-1.25%/级 的目标必定暴击
    elseif (sw.IsSkillLearned(110001) and enemy.cur_hp > enemy.max_hp * (0.85 - 0.0125 * sw.GetSkillLevel(110001))) then
        res.crit = true;
    -- 2#战斗技能对生命低于自身的目标（按百分比）提高 4%+1.5%/级 攻击力
    elseif (sw.IsSkillLearned(110004) and (enemy.cur_hp / enemy.max_hp) < (caster.cur_hp / caster.max_hp)) then
        res.atk_rate = 0.04 + 0.015 * sw.GetSkillLevel(110004);
    end
    return res;
end
-- 针对2阶技能的强化，后半部分
function SkillGroup17After(lst, caster, enemy, skillLv)
    -- 2#战斗技能有 9%+1.5%/级 的几率冰冻目标，对被减速的敌人有额外的冰冻几率加成。冰冻几率加成为基础冰冻几率×（1+减速比例×0.5）
    if (sw.IsSkillLearned(110002)) then
        local prob = 900 + 150 * sw.GetSkillLevel(110002);
        if (enemy.act_rate < 1) then
            prob = prob * ( 1 + ( 1 - math.max( 0, enemy.act_rate ) ) * 0.5 );
        end

        if (sw.randi(1, 10000) <= prob) then
            lst[#lst + 1] = {
                type    = "froze",
                src     = "enemy",
                duration= 2,
            };
        end
    -- 施放2#战斗技能可以使你的下一个技能伤害提高 6%+1%/级
    elseif (sw.IsSkillLearned(110003)) then
        lst[#lst + 1] = {
            type    = "single skill",
            src     = "caster",
            id      = 110003,
            p1      = 6 + 1 * sw.GetSkillLevel(110003),
        };
    -- 施放2#战斗技能可恢复 6%+1%/级 法力
    elseif (sw.IsSkillLearned(110005)) then
        lst[#lst + 1] = {
            type    = "skill recover",
            src     = "caster",
            mp      = caster.max_mp * (0.06 + 0.01 * sw.GetSkillLevel(110005)),
        };
    end
end

-- 针对3阶技能的强化，为方便起见，直接在这里增加效果
function SkillGroup22(lst, caster, enemy, skillLv, seconds)
    -- 3#技能效果持续期间，造成的所有伤害提高 6%+1%/级
    if (sw.IsSkillLearned(113000)) then
        lst[#lst + 1] = {
            type    = "cause damage change",
            src     = "caster",
            attack  = 6 + 1 * sw.GetSkillLevel(113000),
            skill   = 6 + 1 * sw.GetSkillLevel(113000),
            duration= seconds,
        };
    -- 3#技能效果持续期间，暴击伤害提高 12%+2%/级
    elseif (sw.IsSkillLearned(113001)) then
        lst[#lst + 1] = {
            type    = "attrib benefit",
            src     = "caster",
            attr    = AttribType.CRIT_DAMAGE,
            bene    = 12 + 2 * sw.GetSkillLevel(113001),
            duration= seconds,
        };
    -- 3#技能效果持续期间，技能冷却速度提高 8%+1.75%/级
    elseif (sw.IsSkillLearned(113002)) then
        lst[#lst + 1] = {
            type    = "attrib benefit",
            src     = "caster",
            attr    = AttribType.SKILL_COOLDOWN,
            bene    = -(8 + 1.75 * sw.GetSkillLevel(113002)),
            duration= seconds,
        };
    -- 3#技能效果持续期间，每秒对敌人造成攻击力 12%+2%/级 的闪电伤害
    elseif (sw.IsSkillLearned(113003)) then
        lst[#lst + 1] = {
            type    = "skill damage",
            src     = "caster",
            tgt     = "enemy",
            elem    = AttackType.Light,
            val     = (caster.min_atk + caster.max_atk) / 2 * (1.2 + 0.02 * sw.GetSkillLevel(113003)),
            period  = 1,
            loop    = math.floor(seconds),
        };
    -- 3#技能效果持续期间，受到的所有伤害额外降低 8%+0.5%/级
    elseif (sw.IsSkillLearned(113004)) then
        lst[#lst + 1] = {
            type    = "be damage change",
            src     = "caster",
            attack  = -(8 + 0.5 * sw.GetSkillLevel(113004)),
            skill   = -(8 + 0.5 * sw.GetSkillLevel(113004)),
            duration= seconds,
        }
    -- 3#技能效果持续期间，所受伤害的 7%+0.75%/级 将转化为对你的治疗
    elseif (sw.IsSkillLearned(113005)) then
        lst[#lst + 1] = {
            type    = "single skill",
            src     = "caster",
            id      = 113005,
            p1      = 7 + 0.75 * sw.GetSkillLevel(113005),
            duration= seconds,
        };
    end
end


--------------------------------------------------------------------------------------------------
g_skills = {

    [100000] =
    {
        -- 普通攻击有 4%+1.5%/级 几率连续攻击 2 次
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "double attack",
                src     = "caster",
                perc    = 4 + 1.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 4 + 1.5 * skillLv)};
        end,
    },
    [101000] =
    {
        -- 每到达一个新的楼层，即可恢复 6%+1%/级的生命并获得 1+0.25/级 瓶生命药水和法力药水
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 101000,
                p1      = 6 + 1.5 * skillLv,
                p2      = 1 + math.floor(0.25 * skillLv),
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1.5 * skillLv),
                    p2 = tostring(1 + math.floor(0.25 * skillLv)),
                };
        end,
    },
    [101100] =
    {
        -- 所有药水的使用次数上限提高 4+1.5/级
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.EXTRA_BLUE,
                bene = 4 + math.floor(1.5 * skillLv),
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.EXTRA_RED,
                bene = 4 + math.floor(1.5 * skillLv),
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = tostring(4 + math.floor(1.5 * skillLv))};
        end,
    },
	-- 造成攻击力 112%+5%/级 的物理伤害
	[102000] =
	{
		-- 技能被使用或触发
		use = function(caster, enemy, skillLv)
			local lst = {};
			lst[#lst + 1] = {
				type    = "action",
				src     = "caster",
				idx     = 1};

			lst[#lst + 1] = {
				type    = "delay",
				time    = 0.33};

			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-2-3-1",
				src     = "caster",
				slot    = "fx-1"};

			lst[#lst + 1] = {
				type    = "skill damage",
				src     = "caster",
				tgt     = "enemy",
				elem    = 0,
				val     = (caster.min_atk + caster.max_atk) / 2 * (1.12 + 0.05 * skillLv)};

            SkillGroup12(lst, caster, enemy, skillLv);
			return lst;
		end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 112 + 5 * skillLv)};
        end,
	},

	-- 造成攻击力 135%+7.5%/级 的火焰伤害
	[102001] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};

			lst[#lst + 1] = {
				type    = "fly effect",
				file    = "pe-2-7-1",
				mode    = 1,
				track   = 1,
				dir     = 0,
				src     = "skbn",
				tgt     = "enemy",
				time    = 1.5,
                tgt_slot= "dp-3"};

			lst[#lst + 1] = {
				type    = "delay",
				time    = 1.5};

			lst[#lst + 1] = {
				type    = "scene effect",
                root    = "scene_front",
				file    = "pe-3-7-1",
				src     = "enemy",};

			lst[#lst + 1] = {
				type    = "skill damage",
				src     = "caster",
				tgt     = "enemy",
				elem    = 1,
				val     = (caster.min_atk + caster.max_atk) / 2 * (1.35 + 0.075 * skillLv)};

            SkillGroup12(lst, caster, enemy, skillLv);
			return lst;
		end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 135 + 7.5 * skillLv)};
        end,
	},

	-- 造成攻击力 85%+5%/级 的冰霜伤害并使其减速 15%+1.25%/级，持续 3 秒
	[102002] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};
			lst[#lst + 1] = {
				type    = "action",
				src     = "caster",
				idx     = 2,
			};

			lst[#lst + 1] = {
				type    = "delay",
				time    = 0.33,
			};

			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-2-4-1",
				src     = "caster",
				slot    = "fx-1",
			};

			lst[#lst + 1] = {
				type    = "skill damage",
				src     = "caster",
				tgt     = "enemy",
				elem    = 2,
				val     = (caster.min_atk + caster.max_atk) / 2 * (0.85 + 0.05 * skillLv),
			};

            lst[#lst + 1] = {
                type    = "speed up",
                src     = "enemy",
				val     = -(20 + 1.25 * skillLv),
                duration= 3,
            };

            SkillGroup12(lst, caster, enemy, skillLv);
			return lst;
		end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 85 + 5 * skillLv), p2 = string.format("%g", 15 + 1.25 * skillLv)};
        end,
	},

	-- 造成攻击力 114%+6%/级 的闪电伤害
	[102003] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};

            lst[#lst + 1] = {
                type    = "scene effect",
                file    = "pe-1-1-1",
                root    = "scene_front",
                src     = "skbn",
            };

			lst[#lst + 1] = {
				type    = "scene effect",
				file    = "pe-3-1-1",
                root    = "scene_orna",
				src     = "enemy",
			};

			lst[#lst + 1] = {
				type    = "skill damage",
				src     = "caster",
				tgt     = "enemy",
				elem    = 3,
				val     = (caster.min_atk + caster.max_atk) / 2 * (1.14 + 0.06 * skillLv),
			};

            SkillGroup12(lst, caster, enemy, skillLv);
			return lst;
		end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 114 + 6 * skillLv)};
        end,
	},

	-- 每秒造成攻击力 76%+4%/级 的毒素伤害，持续 4 秒
	[102004] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};
			lst[#lst + 1] = {
				type    = "action",
				src     = "caster",
				idx     = 2,
			};


			lst[#lst + 1] = {
				type    = "scene effect",
                root    = "scene_front",
				file    = "pe-3-8-1",
				src     = "enemy",
			};

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.5,
            };

			lst[#lst + 1] = {
				type    = "skill damage",
				src     = "caster",
				tgt     = "enemy",
				elem    = 4,
				val     = (caster.min_atk + caster.max_atk) / 2 * (0.76 + 0.04 * skillLv),
                period  = 1,
                loop    = 4,
			};

            SkillGroup12(lst, caster, enemy, skillLv);
			return lst;
		end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 76 + 4 * skillLv)};
        end,
	},

	-- 在 4 秒内恢复总计 30%+1.5%/级 的生命
	[102005] =
	{
		-- 技能使用条件。返回0表示可以使用，否则不能使用（返回值为错误码）
		condition = function(caster, enemy)
			if (caster.cur_hp >= caster.max_hp) then
				return 203;
			end
			return 0;
		end,

		-- 技能被使用或触发
		use = function(caster, enemy, skillLv)
			local lst = {};

            lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-6-1",
                src     = "caster",
                slot    = "dp-3",
            };

            lst[#lst + 1] = {
				type    = "skill recover",
				src     = "caster",
				hp      = caster.max_hp * (0.3 + 0.015 * skillLv) / 16,
                period  = 0.25,
                loop    = 16,
			};

            SkillGroup12(lst, caster, enemy, skillLv);
			return lst;
		end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 30 + 1.5 * skillLv)};
        end,
	},

    -- 提高攻击力，效果相当于防御的 4%+1.5%/级
    [103000] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 103000,
                p1      = 4 + 1.5 * skillLv;
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 4 + 1.5 * skillLv)};
        end,
    },

    -- 暴击率提高 4%+0.75%/级
    [103001] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.CRITICAL,
                bene = 4 + 0.75 * skillLv,
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 4 + 0.75 * skillLv)};
        end,
    },

    -- 暴击伤害提高 18%+3%/级
    [103002] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
        local lst = {};
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.CRIT_DAMAGE,
                bene = 18 + 3 * skillLv,
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 18 + 3 * skillLv)};
        end,
    },

    -- 命中提高 13+3/级
    [103003] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.HIT,
                bene = 13 + 3 * skillLv,
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 13 + 3 * skillLv)};
        end,
    },

    -- 基础防御提高 8%+3%/级
    [103100] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type = "attrib gain",
                src = "caster",
                attr = AttribType.DEFENSE,
                gain = 8 + 3 * skillLv,
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 8 + 3 * skillLv)};
        end,
    },

    -- 所有抗性提高 7%+2%/级
    [103101] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            local val = 7 + 2 * skillLv;
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.FIRE_RESIST,
                bene    = val,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.COLD_RESIST,
                bene    = val,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.LIGHT_RESIST,
                bene    = val,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.POISON_RESIST,
                bene    = val,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 7 + 2 * skillLv)};
        end,
    },

    -- 闪避提高 13+3/级
    [103102] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.DODGE,
                bene = 13 + 3 * skillLv,
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 13 + 3 * skillLv)};
        end,
    },

    -- 受到攻击时对敌人造成相当于防御 15%+2.5%/级 的荆棘伤害
    [103103] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 103103,
                p1      = 15 + 2.5 * skillLv,
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 15 + 2.5 * skillLv)};
        end,
    },

    -- 普通攻击有 4%+1.5%/级 的几率无视目标 50% 防御，目标等级超过自己 3 级时概率减半
    [104000] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 104000,
                p1      = 4 + 1.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 4 + 1.5 * skillLv)};
        end,
    },

    -- 普通攻击有 4%+1.5%/级 的几率造成攻击力 15% 的附加元素伤害，目标等级超过自己 3 级时概率减半
    [104001] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 104001,
                p1      = 4 + 1.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 4 + 1.5 * skillLv)};
        end,
    },

    -- 普通攻击有 3%+0.75%/级 的几率击昏目标 2 秒，目标等级超过自己 3 级时概率减半
    [104002] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 104002,
                p1      = 3 + 0.75 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 3 + 0.75 * skillLv)};
        end,
    },

    -- 法力上限额外提高 8%+1.75%/级
    [104100] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 104100,
                p1      = 8 + 1.75 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 8 + 1.75 * skillLv)};
        end,
    },

    -- 战斗中，每次使用治疗药水可以恢复 6%+1%/级 的法力；反之亦然
    [104101] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 104101,
                p1      = 6 + 1 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 战斗中，每次受到伤害可以恢复 1.2%+0.2%/级 法力
    [104102] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 104102,
                p1      = 1.2 + 0.2 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 1.2 + 0.2 * skillLv)};
        end,
    },

	-- 造成攻击力 158%+7.5%/级 的物理伤害，同时恢复相当于所造成伤害 20% 的生命
	[105000] =
	{
		-- 技能被使用或触发
		use = function(caster, enemy, skillLv)
			local lst = {};
            local res = SkillGroup17Before(lst, caster, enemy, skillLv);
			lst[#lst + 1] = {
				type    = "action",
				src     = "caster",
				idx     = 4,
            };

			lst[#lst + 1] = {
				type    = "delay",
				time    = 0.47,
            };

			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-2-9-1",
				src     = "caster",
				slot    = "fx-1",
            };

			lst[#lst + 1] = {
				type    = "suck damage",
				src     = "caster",
				tgt     = "enemy",
				elem    = 0,
				val     = (caster.min_atk + caster.max_atk) / 2 * (1.58 + 0.075 * skillLv) * (1 + res.atk_rate),
                suck    = 20 + res.suck_perc,
                crit    = res.crit,
            };
            SkillGroup17After(lst, caster, enemy, skillLv);
			return lst;
		end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 158 + 7.5 * skillLv)};
        end,
	},

	-- 每秒造成攻击力 115%+5%/级 的火焰伤害，持续 6 秒
	[105001] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};
            local res = SkillGroup17Before(lst, caster, enemy, skillLv);
			lst[#lst + 1] = {
				type    = "action",
				src     = "caster",
				idx     = 2,
			};

			lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
				file    = "pe-3-10-2",
				src     = "enemy",
				slot    = "dp-1",
			};

			lst[#lst + 1] = {
                type    = res.type,
				src     = "caster",
				tgt     = "enemy",
				elem    = 1,
				val     = (caster.min_atk + caster.max_atk) / 2 * (1.15 + 0.05 * skillLv) * (1 + res.atk_rate),
                suck    = res.suck_perc,
                crit    = res.crit,
                period  = 1,
                loop    = 6,
			};
            SkillGroup17After(lst, caster, enemy, skillLv);
			return lst;
		end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 115 + 5 * skillLv)};
        end,
	},

    -- 造成攻击力 131%+6%/级 的冰霜伤害并有 20%+1.25%/级 的几率冰冻敌人 2 秒，对被减速的敌人有额外的暴击率和冰冻几率加成。暴击率加成为基础暴击率×（1+减速比例×0.66）；冰冻几率加成为基础冰冻几率×（1+减速比例×0.5）
    [105002] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            local res = SkillGroup17Before(lst, caster, enemy, skillLv);
            local sub = 0;
            local prob = 2500 + 125 * skillLv;

            if (enemy.act_rate < 1) then
                sub = 1 - enemy.act_rate;
                prob = prob * (1 + 0.5 * sub);
                lst[#lst + 1] = {
                    type = "attrib gain",
                    src = "caster",
                    attr = AttribType.CRITICAL,
                    gain = 0.66 * sub,
                    duration = 0.5,
                };
            end

            lst[#lst + 1] = {
                type    = "scene effect",
                file    = "pe-1-2-1",
                root    = "scene_front",
                src     = "skbn",
            };

            lst[#lst + 1] = {
                type    = "body effect",
                file    = "effect-3-6-1",
                src     = "enemy",
                slot    = "dp-1",
            };

            lst[#lst + 1] = {
                type    = res.type,
                src     = "caster",
                tgt     = "enemy",
                elem    = 2,
                val     = (caster.min_atk + caster.max_atk) / 2 * (1.31 + 0.06 * skillLv) * (1 + res.atk_rate),
                suck    = res.suck_perc,
                crit    = res.crit,
            };

            if (sw.randi(1, 10000) <= prob) then
                lst[#lst + 1] = {
                    type    = "froze",
                    src     = "enemy",
                    duration= 2,
                };
            end
            SkillGroup17After(lst, caster, enemy, skillLv);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 131 + 6 * skillLv), p2 = string.format("%g", 20 + 1.25 * skillLv)};
        end,
    },

    -- 造成攻击力 78%+3%/级 的闪电伤害，并在 2 秒后再造成攻击力 156%+6%/级 的闪电伤害
    [105003] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            local res = SkillGroup17Before(lst, caster, enemy, skillLv);

            lst[#lst + 1] = {
                type    = "action",
                src     = "caster",
                idx     = 2,
            };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-14-1",
                src     = "enemy",
                slot    = "dp-1",
            };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.5,
            };

            lst[#lst + 1] = {
                type    = res.type,
                src     = "caster",
                tgt     = "enemy",
                elem    = 3,
                val     = (caster.min_atk + caster.max_atk) / 2 * (0.78 + 0.03 * skillLv) * (1 + res.atk_rate),
                suck    = res.suck_perc,
                crit    = res.crit,
            };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 2,
            };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-15-1",
                src     = "enemy",
            };

            lst[#lst + 1] = {
                type    = "scene effect",
                file    = "pe-3-1-1",
                root    = "scene_orna",
                src     = "enemy",
            };

            lst[#lst + 1] = {
                type    = res.type,
                src     = "caster",
                tgt     = "enemy",
                elem    = 3,
                val     = (caster.min_atk + caster.max_atk) / 2 * (1.56 + 0.06 * skillLv) * (1 + res.atk_rate),
                suck    = res.suck_perc,
                crit    = res.crit,
            };
            SkillGroup17After(lst, caster, enemy, skillLv);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 78 + 3 * skillLv), p2 = string.format("%g", 156 + 6 * skillLv)};
        end,
    },

    -- 造成攻击力 189%+9%/级 的毒素伤害，同时使其所有抗性降低 6%+1%/级，持续 6 秒
    [105004] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            local res = SkillGroup17Before(lst, caster, enemy, skillLv);
            local p2 = 6 + 1 * skillLv;

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-12-1",
                src     = "skbn",
            };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.3,
            };

            lst[#lst + 1] = {
                type    = res.type,
                src     = "caster",
                tgt     = "enemy",
                elem    = 4,
                val     = (caster.min_atk + caster.max_atk) / 2 * (1.89 + 0.09 * skillLv) * (1 + res.atk_rate),
                suck    = res.suck_perc,
                crit    = res.crit,
            };

            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.FIRE_RESIST,
                bene    = -p2,
                duration= 6,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.COLD_RESIST,
                bene    = -p2,
                duration= 6,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.LIGHT_RESIST,
                bene    = -p2,
                duration= 6,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.POISON_RESIST,
                bene    = -p2,
                duration= 6,
            };
            SkillGroup17After(lst, caster, enemy, skillLv);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 189 + 6 * skillLv), p2 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 造成攻击力 178%+8%/级 的物理伤害，并使其攻击降低 6%+1%/级，持续 6 秒
    [105005] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            local res = SkillGroup17Before(lst, caster, enemy, skillLv);
            lst[#lst + 1] = {
                type    = "action",
                src     = "caster",
                idx     = 1,
            };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.33,
            };

            lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-13-1",
                src     = "caster",
                slot    = "fx-1",
            };

            lst[#lst + 1] = {
                type    = res.type,
                src     = "caster",
                tgt     = "enemy",
                elem    = 0,
                val     = (caster.min_atk + caster.max_atk) / 2 * (1.78 + 0.08 * skillLv) * (1 + res.atk_rate),
                suck    = res.suck_perc,
                crit    = res.crit,
            };

            lst[#lst + 1] = {
                type    = "attrib gain",
                src     = "enemy",
                attr    = AttribType.ATTACK,
                gain    = -(6 + 1 * skillLv),
                duration= 6,
            };
            SkillGroup17After(lst, caster, enemy, skillLv);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 178 + 8 * skillLv), p2 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 生命高于 70% 时，造成的所有伤害提高 6%+1%/级；生命低于 35% 时，受到的所有伤害降低 3%+0.5%/级
    [106000] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 106000,
                p1      = 6 + 1 * skillLv,
                p2      = 3 + 0.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv), p2 = string.format("%g", 3 + 0.5 * skillLv)};
        end,
    },

    -- 对生命高于 80% 的目标，暴击率提高 6%+1%/级；对生命低于 35% 的目标，造成额外 7%+0.75%/级 伤害
    [106001] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 106001,
                p1      = 6 + 1 * skillLv,
                p2      = 7 + 0.75 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv), p2 = string.format("%g", 7 + 0.75 * skillLv)};
        end,
    },

    -- 对生命高于你的目标，命中提高 12+2/级；对生命低于你的目标，忽视其 6%+1%/级 的防御
    [106002] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 106002,
                p1      = 12 + 2 * skillLv,
                p2      = 6 + 1 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 12 + 2 * skillLv), p2 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 对所有精英、头目和首领的伤害提高 9%+1.5%/级，命中提高 12+2/级
    [106003] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 106003,
                p1      = 9 + 1.5 * skillLv,
                p2      = 12 + 2 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 9 + 1.5 * skillLv), p2 = string.format("%g", 12 + 2 * skillLv)};
        end,
    },

    -- 金币获取提高 18%+3%/级
    [106100] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.EXTRA_GOLD,
                bene    = 18 + 3 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 18 + 3 * skillLv)};
        end,
    },

    -- 经验获取提高 12%+2%/级
    [106101] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.EXTRA_EXP,
                bene    = 12 + 2 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 12 + 2 * skillLv)};
        end,
    },

    -- 幸运提高 13+3/级
    [106102] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.LUCK,
                bene    = 13 + 3 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 13 + 3 * skillLv)};
        end,
    },

    -- 施放1#战斗技能会使敌人的防御降低 6%+1%/级，持续 5 秒（具体效果在1#技能中实现）
    [107000] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },
    -- 施放1#战斗技能后，你的普通攻击伤害提高 6%+1%/级，持续 5 秒
    [107001] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },
    -- 1#战斗技能会使目标的速度降低 8%+1.75%/级，持续 3 秒
    [107002] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 8 + 1.75 * skillLv)};
        end,
    },
    -- 施放1#战斗技能会使目标受到暴击的几率提高 3%+0.75%/级，持续 6 秒
    [107003] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 3 + 0.75 * skillLv)};
        end,
    },
    -- 施放1#战斗技能后，你的攻击速度提高 6%+1%/级，持续 3 秒
    [107004] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },
    -- 施放1#战斗技能后，立即恢复 7%+0.75%/级 的生命
    [107005] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 7 + 0.75 * skillLv)};
        end,
    },

    -- 基于你损失的生命，攻击速度最多提高 9%+1.5%/级。生命越低，提升效果越明显
    [107100] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 107100,
                p1      = 9 + 1.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 9 + 1.5 * skillLv)};
        end,
    },

    -- 基于你剩余的法力，攻击力最多提高 6%+1%/级。剩余法力越高，提升效果越明显
    [107101] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 107101,
                p1      = 6 + 1 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 造成暴击后，有 5%+0.25%/级 的几率直接击杀目标（对首领无效）
    [107102] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 107102,
                p1      = 5 + 0.25 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 5 + 0.25 * skillLv)};
        end,
    },

    -- 技能的冷却时间缩短 9%+1.5%/级
    [109000] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
        local lst = {};
            lst[#lst + 1] = {
                type    = "attrib gain",
                src     = "caster",
                attr    = AttribType.SKILL_COOLDOWN,
                gain    = -(9 + 1.5 * skillLv),
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 9 + 1.5 * skillLv)};
        end,
    },

    -- 技能造成的伤害提高 12%+2%/级，基础法力消耗提高 25%
    [109001] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
--[[
            lst[#lst + 1] = {
                type    = "cause damage change",
                src     = "caster",
                skill   = 12 + 2 * skillLv,
            }
            lst[#lst + 1] = {
                type    = "attrib gain",
                src     = "caster",
                attr    = AttribType.MP_COST,
                gain    = 25,
            }
 --]]
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 109001,
                p1      = 12 + 2 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 12 + 2 * skillLv)};
        end,
    },

    -- 你的技能额外忽视目标 6%+1%/级 的防御和抗性
    [109002] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 109002,
                p1      = 6 + 1 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,

    },

    -- 受到的普通攻击伤害降低 6%+1%/级
    [109100] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "be damage change",
                src     = "caster",
                attack  = -(6 + 1 * skillLv),
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 受到的技能伤害降低 6%+1%/级
    [109101] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "be damage change",
                src     = "caster",
                skill   = -(6 + 1 * skillLv),
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 受到的治疗效果提高 7%+0.75%/级
    [109102] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "recover change",
                src     = "caster",
                perc    = 7 + 0.75 * skillLv,
            }
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 7 + 0.75 * skillLv)};
        end,
    },

    -- 2#战斗技能可以偷取生命，效果相当于所造成伤害的 6%+1%/级
    [110000] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },
    -- 2#战斗技能对于生命高于 85%-1.25%/级 的目标必定暴击
    [110001] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 85 - 1.25 * skillLv)};
        end,
    },
    -- 2#战斗技能有 9%+1.5%/级 的几率冰冻目标，对被减速的敌人有额外的冰冻几率加成。冰冻几率加成为基础冰冻几率×（1+减速比例×0.5）
    [110002] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 9 + 1.5 * skillLv)};
        end,
    },
    -- 施放2#战斗技能可以使你的下一个技能伤害提高 6%+1%/级
    [110003] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },
    -- 施放2#战斗技能攻击生命低于自身的目标时，攻击力提高 4%+1.5%/级
    [110004] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 4 + 1.5 * skillLv)};
        end,
    },
    -- 施放2#战斗技能可恢复 6%+1%/级 法力
    [110005] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 攻击时可以偷取生命，效果相当于所造成伤害的 2%+0.75%/级
    [110100] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "suck red",
                src     = "caster",
                perc    = 2 + 0.75 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 2 + 0.75 * skillLv)};
        end,
    },
    -- 战斗胜利后可恢复 7%+0.75%/级 的生命
    [110101] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 110101,
                p1      = 7 + 0.75 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 7 + 0.75 * skillLv)};
        end,
    },

    -- 战斗中，每 3 秒恢复 2.4%+0.4%/级 的生命
    [110102] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 110102,
                p1      = 2.4 + 0.4 * skillLv;
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 2.4 + 0.4 * skillLv)};
        end,
    },

    -- 抵挡所有伤害，持续 5 秒。被抵挡伤害的 65%-1.25%/级 将在效果结束后的 5 秒内返还
    [111000] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
                lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-18-1",
                src     = "caster",
                };

                lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 111000,
                p1      = 65 - 1.25 * skillLv;
            };
            SkillGroup22(lst, caster, enemy, skillLv, 5);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 65 - 1.25 * skillLv)};
        end,
    },

    -- 施法者被烈焰包裹，暴击率提高 20%+1.25%/级，法力消耗降低 12%+0.75%/级，持续 6 秒
    [111001] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
                lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-6-3",
                src     = "caster",
                slot    = "dp-3",
                };

                lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.CRITICAL,
                bene    = 20 + 1.25 * skillLv,
                duration= 6,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.MP_COST,
                bene    = -(12 + 0.75 * skillLv),
                duration= 6,
            };
            SkillGroup22(lst, caster, enemy, skillLv, 6);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 20 + 1.25 * skillLv), p2 = string.format("%g", 12 + 0.75 * skillLv)};
        end,
    },

    -- 施法者被坚冰覆盖，受到的所有伤害降低 16%+1%/级，所有抗性提高 9%+1.5%/级，持续 5 秒
    [111002] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
                lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-18-2",
                src     = "caster",
                };

                local p1 = 16 + 1 * skillLv;
                local p2 = 9 + 1.5 * skillLv;

            lst[#lst + 1] = {
                type    = "be damage change",
                src     = "caster",
                physics = -p1,
                fire    = -p1,
                cold    = -p1,
                light   = -p1,
                poison  = -p1,
                duration= 5,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.FIRE_RESIST,
                bene    = p2,
                duration= 5,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.COLD_RESIST,
                bene    = p2,
                duration= 5,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.LIGHT_RESIST,
                bene    = p2,
                duration= 5,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.POISON_RESIST,
                bene    = p2,
                duration= 5,
            };
            SkillGroup22(lst, caster, enemy, skillLv, 5);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 16 + 1 * skillLv), p2 = string.format("%g", 9 + 1.5 * skillLv)};
        end,
    },

    -- 获得相当于生命上限 40%+2.5%/级 的护盾，并且每秒恢复 2.4%+0.4%/级 的法力，持续 5 秒
    [111003] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
                lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-19-1",
                src     = "caster",
                slot    = "dp-1",
                };

                lst[#lst + 1] = {
                type    = "shield",
                src     = "caster",
                val     = caster.max_hp * (0.4 + 0.025 * skillLv),
                duration= 5,
            };
            lst[#lst + 1] = {
                type    = "skill recover",
                src     = "caster",
                mp      = caster.max_mp * (0.024 + 0.004 * skillLv),
                period  = 1,
                loop    = 5,
            };
            SkillGroup22(lst, caster, enemy, skillLv, 8);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 40 + 2.5 * skillLv), p2 = string.format("%g", 2.4 + 0.4 * skillLv)};
        end,
    },

    -- 集中注意力以避开危险，闪避提高 70+7.5/级，治疗效果提高 10%+1.25%/级，持续 5 秒
    [111004] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
                lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-6-4",
                src     = "caster",
                slot    = "dp-3",
                };

                lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.DODGE,
                bene    = 70 + 7.5 * skillLv,
                duration= 5,
            };
            lst[#lst + 1] = {
                type    = "recover change",
                src     = "caster",
                perc    = 10 + 1.25 * skillLv,
                duration= 5,
            }
            SkillGroup22(lst, caster, enemy, skillLv, 5);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 70 + 7.5 * skillLv), p2 = string.format("%g", 10 + 1.25 * skillLv)};
        end,
    },

    -- 进入警戒状态，持续 5 秒。效果持续期间，每次受到攻击都会反弹所受伤害的 24%+4%/级
    [111005] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
                lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-20-1",
                src     = "caster",
                slot    = "dp-1",
                };

                lst[#lst + 1] = {
                type    = "damage back",
                src     = "caster",
                elem    = AttackType.Fire,
                mode    = 0,
                perc    = 24 + 4 * skillLv,
                duration= 5,
            };
            SkillGroup22(lst, caster, enemy, skillLv, 8);
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 24 + 4 * skillLv)};
        end,
    },

    -- 装备轻型武器时，攻击力提高 6%+1%/级，攻击时有 9%+1.5%/级 的几率令敌人流血 3 秒
    [112000] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 112000,
                p1      = 6 + 1 * skillLv,
                p2      = 9 + 1.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv), p2 = string.format("%g", 9 + 1.5 * skillLv)};
        end,
    },

    -- 装备重型武器时，暴击伤害提高 7%+2%/级，攻击时有 12%+2%/级 的几率触发碾压，直接扣除目标当前生命的 1/4
    [112001] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 112001,
                p1      = 7 + 2 * skillLv,
                p2      = 12 + 2 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 7 + 2 * skillLv), p2 = string.format("%g", 12 + 2 * skillLv)};
        end,
    },

    -- 装备长柄武器时，法力消耗降低 6%+1%级，技能伤害提高 5%+1.25%/级
    [112002] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 112002,
                p1      = 6 + 1 * skillLv,
                p2      = 5 + 1.25 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv), p2 = string.format("%g", 5 + 1.25 * skillLv)};
        end,
    },

    -- 受到控制效果影响时，每秒恢复 3%+0.25%/级 生命
    [112100] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 112100,
                p1      = 3 + 0.25 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 3 + 0.25 * skillLv)};
        end,
    },

    -- 你身上的每一个增益状态可以使攻击提高 2%+0.33%/级，每一个减益状态可以使防御提高 2%+0.33%/级
    [112102] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 112102,
                p1      = 2 + 0.33 * skillLv,
                p2      = 2 + 0.33 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 2 + 0.33 * skillLv), p2 = string.format("%g", 2 + 0.33 * skillLv)};
        end,
    },

    -- 战斗中有 8%+1.75%/级 的几率抵抗负面状态
    [112101] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.DEBUFF_RESIST,
                bene    = 8 + 1.75 * skillLv,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.CONTROL_RESIST,
                bene    = 8 + 1.75 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 8 + 1.75 * skillLv)};
        end,
    },

    -- 3#技能效果持续期间，造成的所有伤害提高 6%+1%/级
    [113000] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },
    -- 3#技能效果持续期间，暴击伤害提高 12%+2%/级
    [113001] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 12 + 2 * skillLv)};
        end,
    },
    -- 3#技能效果持续期间，技能冷却速度提高 9%+1.5%/级
    [113002] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 9 + 1.5 * skillLv)};
        end,
    },
    -- 3#技能效果持续期间，每秒对敌人造成攻击力 12%+2%/级 的闪电伤害
    [113003] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 12 + 2 * skillLv)};
        end,
    },
    -- 3#技能效果持续期间，受到的所有伤害额外降低 8%+0.5%/级
    [113004] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 8 + 0.5 * skillLv)};
        end,
    },
    -- 3#技能效果持续期间，所受伤害的 7%+0.75%/级 将转化为对你的治疗
    [113005] =
    {
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 7 + 0.75 * skillLv)};
        end,
    },

    -- 你无法闪避，但是防御提高，效果相当于闪避的 50%+12.5%/级
    [113100] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 113100,
                p1      = 50 + 12.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 50 + 12.5 * skillLv)};
        end,
    },
    -- 药水的恢复效果提高 9%+1.5%/级，但是会在 5 秒内持续生效
    [113101] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 113101,
                p1      = 9 + 1.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 9 + 1.5 * skillLv)};
        end,
    },

    -- 你不再造成物理伤害，但是所有附加元素伤害提高 6%+1%/级
    [113102] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 113102,
                p1      = 6 + 1 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 6 + 1 * skillLv)};
        end,
    },

    -- 你受到的物理伤害减少50%，但是所有抗性降低 <p1>%
    [113103] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 113103,
                p1      = 80 - 2.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 80 - 2.5 * skillLv)};
        end,
    },

    -- 你的普通攻击伤害降低 50%，但是技能伤害提高 12%+2%/级
    [113104] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 113104,
                p1      = 12 + 2 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 12 + 2 * skillLv)};
        end,
    },

    -- 造成的所有伤害提高 10%+1.25%/级，但是会受到额外 8%+0.5%/级 的伤害
    [113105] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 113105,
                p1      = 10 + 1.25 * skillLv,
                p2      = 8 + 0.5 * skillLv,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 10 + 1.25 * skillLv), p2 = string.format("%g", 8 + 0.5 * skillLv)};
        end,
    },

    -- 造成攻击力 190%+12.5%/级 的物理伤害。该技能总能暴击
    [114000] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "action",
                src     = "caster",
                idx     = 4,
            };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.47,
            };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-11-1",
                src     = "enemy",
            };

            lst[#lst + 1] = {
                type    = "skill damage",
                src     = "caster",
                tgt     = "enemy",
                elem    = 0,
                val     = (caster.min_atk + caster.max_atk) / 2 * (1.9 + 0.125 * skillLv),
                crit    = true,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 190 + 12.5 * skillLv)};
        end,
    },

    -- 造成攻击力 200%+15%/级 的火焰伤害。施放该技能会消耗掉所有剩余法力，每消耗 20 法力，伤害提高 1%+0.0625%/级
    [114001] =
    {
        -- 技能被使用或触发
        use = function(caster, enemy, skillLv)
            local lst = {};
            local mpr = caster.cur_mp / 20;

            lst[#lst + 1] = {
                type    = "mp loss",
                src     = "caster",
                tgt     = "caster",
                loss    = caster.cur_mp;
            };

            lst[#lst + 1] = {
                type    = "action",
                src     = "caster",
                idx     = 3,
                };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.4,
                };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-9-1",
                src     = "enemy",
                };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-10-1",
                src     = "enemy",
                };

            lst[#lst + 1] = {
                type    = "action",
                src     = "caster",
                idx     = 4,
            };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 1.66,
                };

            lst[#lst + 1] = {
                type    = "skill damage",
                src     = "caster",
                tgt     = "enemy",
                elem    = 0,
                val     = (caster.min_atk + caster.max_atk) / 2 * (2 + 0.15 * skillLv) * (1 + (0.01 + 0.000625 * skillLv) * mpr),
                crit    = true,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 200 + 15 * skillLv), p2 = string.format("%g", 1 + 0.0625 * skillLv)};
        end,
    },

    -- 造成攻击力 220%+12.5%/级 的冰霜伤害，目标的速度每降低 1%，伤害提高 2%+0.125%/级
    [114002] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            local rate = enemy.act_rate < 1 and 1 - enemy.act_rate or 0;
            lst[#lst + 1] = {
                type    = "action",
                src     = "caster",
                idx     = 2,
                };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.1,
                };

            lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-10-1-1",
                src     = "caster",
                slot    = "fx-1",
                };

            lst[#lst + 1] = {
                type    = "skill damage",
                src     = "caster",
                tgt     = "enemy",
                elem    = 2,
                val     = (caster.min_atk + caster.max_atk) / 2 * (2.2 + 0.125 * skillLv) * (1 + rate * (0.02 + 0.00125 * skillLv)),
            };

            if (sw.randi(1, 10000) <= (2500 + 125 * skillLv)) then
                lst[#lst + 1] = {
                    type    = "froze",
                    src     = "enemy",
                    duration= 2,
                };
            end
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 220 +  12.5 * skillLv), p2 = string.format("%g", 2 + 0.125 * skillLv)};
        end,
    },

    -- 造成攻击力 270%+20%/级 的闪电伤害。攻击后如果目标的生命高于 50% 则再受一次伤害，否则昏迷 4 秒
    [114003] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "action",
                src     = "caster",
                idx     = 2,
            };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-16-1",
                src     = "enemy",
            };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 1,
            };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-17-1",
                src     = "enemy",
                };

            lst[#lst + 1] = {
                type    = "skill damage",
                src     = "caster",
                tgt     = "enemy",
                elem    = AttackType.Light,
                val     = (caster.min_atk + caster.max_atk) / 2 * (2.7 + 0.2 * skillLv),
            };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.5,
                cond    = "secondStage2",
                };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                cond    = "secondStage2",
                file    = "pe-9-6-1",
                src     = "enemy",
                };

            lst[#lst + 1] = {
                type    = "faint",
                cond    = "secondStage2",
                src     = "enemy",
                duration= 4,
                };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.5,
                cond    = "secondStage1",
                };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                cond    = "secondStage1",
                file    = "pe-3-17-1",
                src     = "enemy",
                };

            lst[#lst + 1] = {
                type    = "skill damage",
                cond    = "secondStage1",
                src     = "caster",
                tgt     = "enemy",
                elem    = AttackType.Light,
                val     = (caster.min_atk + caster.max_atk) / 2 * (2.7 + 0.2 * skillLv),
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 270 + 20 * skillLv)};
        end,
        -- 后续
        secondStage1 = function(caster, enemy, skillLv)
            if (enemy and enemy.cur_hp * 2 > enemy.max_hp) then
                return true;
            end
            return false;
        end,
        secondStage2 = function(caster, enemy, skillLv)
            if (enemy and enemy.cur_hp * 2 <= enemy.max_hp and enemy.cur_hp > 0) then
                return true;
            end
            return false;
        end,
    },

    -- 在 3 秒内攻击目标 7次，每次造成攻击力 40%+2.5%/级 的毒素伤害。目标生命每损失 1%，伤害提高 0.8%+0.05%/级
    [114004] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_front",
                file    = "pe-3-21-1",
                src     = "enemy",
            };

            lst[#lst + 1] = {
                type    = "scene effect",
                root    = "scene_orna",
                file    = "pe-10-1-2",
                src     = "enemy",
                };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.2,
            };

            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                tgt     = "enemy",
                id      = 114004,
                p1      = 40 + 2.5 * skillLv,
                p2      = 0.8 + 0.05 * skillLv,
                period  = 0.42,
                loop    = 7,
            };

            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 40 + 2.5 * skillLv), p2 = string.format("%g", 0.8 + 0.05 * skillLv)};
        end,
    },

    -- 造成相当于攻击力 220%+20%/级 再加上自身损失生命 100%+6.25%/级 的物理伤害。如果未能击杀目标则恢复 20% 生命
    [114005] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            local p1 = 2.2 + 0.2 * skillLv;
            local p2 = (1 - caster.cur_hp / caster.max_hp) * (1 + 0.0625 * skillLv);
            lst[#lst + 1] = {
                type    = "action",
                src     = "caster",
                idx     = 4,
                };

            lst[#lst + 1] = {
                type    = "delay",
                time    = 0.47,
                };

            lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-10-1-3",
                src     = "caster",
                slot    = "fx-1",
                };

            lst[#lst + 1] = {
                type    = "skill damage",
                src     = "caster",
                tgt     = "enemy",
                elem    = AttackType.Physics,
                val     = (caster.min_atk + caster.max_atk) / 2 * (p1 + p2),
            };

            lst[#lst + 1] = {
                type    = "skill recover",
                cond    = "secondStage",
                src     = "caster",
                hp      = caster.max_hp * 0.2,
            };
            return lst;
        end,
        -- 描述文本替换
        description = function(skillLv)
            return {p1 = string.format("%g", 220 + 20 * skillLv), p2 = string.format("%g", 100 + 6.25 * skillLv)};
        end,
        -- 后续
        secondStage = function(caster, enemy, skillLv)
            if (enemy and enemy.cur_hp > 0) then
                return true;
            end
            return false;
        end,
    },



    -----------------------------------------------------------------------------------------------------------
	-- 怪物词缀-坚定：防御+x%，x=怪物等级/2+50
	[200000] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DEFENSE,
				gain    = caster.lv / 2 + 50,
			};
			return lst;
		end,
	},

	-- 怪物词缀-魔法抵抗：所有抗性+x%，x=怪物等级/3+33
	[200001] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.FIRE_RESIST,
				gain    = caster.lv / 3 + 33,
			};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.COLD_RESIST,
				gain    = caster.lv / 3 + 33,
			};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.LIGHT_RESIST,
				gain    = caster.lv / 3 + 33,
			};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.POISON_RESIST,
				gain    = caster.lv / 3 + 33,
			};
			return lst;
		end,
	},

	-- 怪物词缀-迅捷：攻击速度+x%，x=怪物等级/2+50
	[200002] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.ATTACK_SPEED,
				gain    = caster.lv / 2 + 50,
			};
			return lst;
		end,
	},

	-- 怪物词缀-灵敏：闪避+x%，x=怪物等级/4+25
	[200003] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DODGE,
				gain    = caster.lv / 4 + 25,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-强命：生命+x%，x=怪物等级+100
	[200004] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.HP,
				gain    = caster.lv + 100,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-荆棘：受到伤害对攻击者造成x反伤害，x=防御/5
	[200005] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DODGE,
				gain    = caster.lv / 4 + 25,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-反射：反弹所受伤害的x%，x=怪物等级/5+15
	[200006] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
                type    = "damage back",
                src     = "caster",
                elem    = AttackType.Fire,
                mode    = 0,
                perc    = caster.lv / 5 + 15,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-吸血：普通攻击偷取x%生命，x=怪物等级/10+15
	[200007] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
                type    = "suck red",
                src     = "caster",
                perc    = caster.lv / 10 + 0.15,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-回复：每3秒恢复x%生命，x=怪物等级/50+2
	[200008] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
                type    = "skill recover",
                src     = "caster",
                hp      = math.floor(caster.max_hp * (0.02 + caster.lv * 0.0002)),
                period  = 3,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-鲁莽：攻击力+x%，x=怪物等级/2+100；暴击率+x%，x=怪物等级/10+15%；命中-50%
	[200009] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.ATTACK,
				gain    = caster.lv / 2 + 100,
			};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.CRITICAL,
				gain    = caster.lv / 10 + 15,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.HIT,
				bene 	= -50,
            };
			return lst;
		end,
	},

 	-- 怪物词缀-狂暴：造成的伤害+x%，x=受损生命/2+50；攻击速度+x%，x=受损生命/2
	[200010] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DODGE,
				gain    = caster.lv / 4 + 25,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-激怒：攻击力+x%，x=怪物等级/2+50；命中+25%
	[200011] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.ATTACK,
				gain    = caster.lv / 2 + 50,
			};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.HIT,
                bene    = 25,
            };
			return lst;
		end,
	},

 	-- 怪物词缀-狂热：攻击力+x%，x=怪物等级/2+50；攻击速度+x%，x=怪物等级/4+25
	[200012] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.ATTACK,
				gain    = caster.lv / 2 + 50,
			};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.ATTACK_SPEED,
				gain    = caster.lv / 4 + 25,
            };
			return lst;
		end,
	},
 	-- 怪物词缀-专注：忽视敌人防御x%，x=怪物等级/4+25；忽视敌人所有抗性x%，x=怪物等级
	[200013] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.FIRE_RESIST,
                bene    = -caster.lv,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.COLD_RESIST,
                bene    = -caster.lv,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.LIGHT_RESIST,
                bene    = -caster.lv,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.POISON_RESIST,
                bene    = -caster.lv,
            };
			return lst;
		end,
	},

 	-- 怪物词缀-火焰强化：火焰伤害+x，x=怪物等级×5；火抗+75%；死亡时发生爆炸，造成自身生命上限x%的火焰伤害，x=怪物等级/4+25
	[200014] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.FIRE_ATTACK,
				gain    = caster.lv * 5,
			};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.FIRE_RESIST,
				bene    = 75,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-冰霜强化：冰霜伤害+x，x=怪物等级×5；冰抗+75%；战斗中，敌人的攻击速度降低x%，x=怪物等级/4+25
	[200015] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.COLD_ATTACK,
				gain    = caster.lv * 5,
			};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.COLD_RESIST,
				bene    = 75,
			};
            lst[#lst + 1] = {
                type    = "speed up",
                src     = "enemy",
                val     = -(caster.lv/4 + 25),
            };
			return lst;
		end,
	},

 	-- 怪物词缀-闪电强化：闪电伤害+x，x=怪物等级×5；电抗+75%；受到普通攻击时，对敌人造成x闪电伤害，x=怪物等级×5
	[200016] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.LIGHT_ATTACK,
				gain    = caster.lv * 5,
			};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.LIGHT_RESIST,
				bene    = 75,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-毒素强化：毒素伤害+x，x=怪物等级×5；毒抗+75%；战斗中，敌人每1.5秒受到x毒素伤害，x=怪物等级×5
	[200017] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.POISON_ATTACK,
				gain    = caster.lv * 5,
			};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.POISON_RESIST,
				bene    = 75,
			};
			return lst;
		end,
	},

    -- 怪物词缀-中毒：战斗中，使敌人每秒扣血10%
    [200018] =
    {
        use = function(caster, enemy, skillLv)
        local lst = {};
            lst[#lst + 1] = {
                type    = "skill hurt",
                src     = "enemy",
                tgt     = "enemy",
                elem    = AttackType.Physics,
                val     = math.floor(enemy.max_hp * (0.25  + 0.05 * caster.quality)),
                period  = 1,
            };
            return lst;
        end,
    },

    -- 怪物词缀-战斗中，每秒恢复x%血量
    [200019] =
    {
        use = function(caster, enemy, skillLv)
        local lst = {};
            lst[#lst + 1] = {
                type    = "skill recover",
                src     = "caster",
                hp      = math.floor(caster.max_hp * (0.02  + 0.005 * caster.quality)),
                period  = 1,
            };
            return lst;
        end,
    },

    -- 怪物词缀-免疫物理伤害
    [200020] =
    {
        use = function(caster, enemy, skillLv)
        local lst = {};
            lst[#lst + 1] = {
                type = "be damage change",
                src = "caster",
                physics = -60 - 10 * caster.quality,
                unique_id = 200020,
            };
            return lst;
        end,
    },

    -- 怪物词缀-反弹所受伤害的x%，x根据怪的品质确定
    [200021] =
    {
        use = function(caster, enemy, skillLv)
        local lst = {};
            lst[#lst + 1] = {
                type    = "damage back",
                src     = "caster",
                mode    = 0,
                perc    = 10 + caster.quality * 10,
            };
            lst[#lst + 1] = {
                type    = "damage back",
                src     = "caster",
                mode    = 1,
                perc    = 10 + caster.quality * 10,
            };
            return lst;
        end,
    },

 	-- 怪物词缀-专注：忽视敌人所有抗性x%
	[200022] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.FIRE_RESIST,
                bene    = -90 - 10 * caster.quality,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.COLD_RESIST,
                bene    = -90 - 10 * caster.quality,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.LIGHT_RESIST,
                bene    = -90 - 10 * caster.quality,
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.POISON_RESIST,
                bene    = -90 - 10 * caster.quality,
            };
			return lst;
		end,
	},

 	-- 怪物词缀-镇压：战斗开始后，敌人受到的治疗效果降低x%，x=怪物等级/4+40。影响所有恢复手段
	[200023] =
	{
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "recover change",
                src     = "enemy",
                perc    = -(caster.lv / 4 + 40),
            }
			return lst;
		end,
	},

 	-- 怪物词缀-审判：战斗开始后，敌人的防御-x%，x=怪物等级/3+33；所有抗性-x%，x=怪物等级/4+25
	[200024] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "enemy",
				attr    = AttribType.DEFENSE,
				gain    = -(caster.lv / 3 + 33),
			};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.FIRE_RESIST,
                bene    = -(caster.lv / 4 + 25),
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.COLD_RESIST,
                bene    = -(caster.lv / 4 + 25),
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.LIGHT_RESIST,
                bene    = -(caster.lv / 4 + 25),
            };
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "enemy",
                attr    = AttribType.POISON_RESIST,
                bene    = -(caster.lv / 4 + 25),
            };
			return lst;
		end,
	},

 	-- 怪物词缀-枯竭：战斗开始后，敌人的法力消耗提高x%，x=怪物等级+50
	[200025] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "enemy",
				attr    = AttribType.MP_COST,
				gain    = caster.lv + 50,
			};

			return lst;
		end,
	},

 	-- 怪物词缀-威慑：战斗开始后，敌人的技能冷却时间延长x%，x=怪物等级/4+25
	[200026] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DODGE,
				gain    = caster.lv / 4 + 25,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-护盾：战斗开始后，获得一个可吸收生命上限x%伤害的护盾，x=怪物等级/2+50
	[200027] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "shield",
				src     = "caster",
				val     = caster.max_hp * ( caster.lv / 200 + 0.5 ),
			};
			return lst;
		end,
	},

 	-- 怪物词缀-法力燃烧：普通攻击会减少敌人x%的法力，x=怪物等级/4+15
	[200028] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
                type    = "mp loss",
                src     = "caster",
                tgt     = "enemy",
                loss    = enemy.max_mp * ( caster.lv / 400 + 0.15 )
			};
			return lst;
		end,
	},

 	-- 怪物词缀-猛击：普通攻击有x%几率击昏敌人，持续2秒，x=怪物等级/10+20
	[200029] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DODGE,
				gain    = caster.lv / 4 + 25,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-冻结：普通攻击有x%几率冰冻敌人，持续2秒，x=怪物等级/10+20
	[200030] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DODGE,
				gain    = caster.lv / 4 + 25,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-祝福：普通攻击有x%几率获得祝福，使自己始终造成最大伤害，持续6秒，x=怪物等级/5+50
	[200031] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DODGE,
				gain    = caster.lv / 4 + 25,
			};
			return lst;
		end,
	},

 	-- 怪物词缀-诅咒：普通攻击有x%几率施加诅咒，使敌人始终造成最小伤害，持续6秒，x=怪物等级/5+50
	[200032] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr    = AttribType.DODGE,
				gain    = caster.lv / 4 + 25,
			};
			return lst;
		end,
	},

    -- 怪物词缀-无敌
    [200033] =
    {
        use = function(caster, enemy, skillLv)
        local lst = {};
            lst[#lst + 1] = {
                type = "be damage change",
                src = "caster",
                physics = -40 - 20 * caster.quality,
                unique_id = 200033,
            };
            return lst;
        end,
    },
	-- 怪物词缀-护盾
	[200034] =
	{
		use = function(caster, enemy, skillLv)
		local lst = {};
			lst[#lst + 1] = {
				type    = "shield",
				src     = "caster",
				val     = caster.max_hp * caster.quality * 0.5,
			};
            lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-9-3-1",
                src     = "caster",
            }
			return lst;
		end,
	},
	-- 怪物词缀-加速
	[200035] =
	{
		use = function(caster, enemy, skillLv)
            local lst = {}
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.ATTACK_SPEED,
                bene = 50 * caster.quality,
            }
			return lst;
		end,
    },
	-- 怪物词缀-吸血
	[200036] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {}
			lst[#lst + 1] = {
			type    = "suck red",
			src     = "caster",
			perc    = 50 * caster.quality,
		};
			return lst;
		end,
	},
	-- 怪物词缀 - 昏迷
	[200037] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {}
			lst[#lst + 1] = {
                type    = "faint",
                src     = "enemy",
                duration= 2,
			};
			return lst;
		end,
	},
    -- 怪物词缀-减伤
    [200038] =
    {
        use = function(caster, enemy, skillLv)
        local lst = {};
            lst[#lst + 1] = {
                type = "be damage change",
                src = "caster",
                physics = -60,
                fire    = -60,
                cold    = -60,
                light   = -60,
                poison  = -60,
                unique_id = 200038,
            };
            return lst;
        end,
    },
    -- 怪物词缀-高闪避
    [200039] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.DODGE,
                bene    = 300,
            };
            return lst;
        end,
    },

    -- 怪物词缀-无惧：免疫昏迷、冰冻效果
    [210023] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.CONTROL_RESIST,
                bene    = 100,
            };
            return lst;
        end,
    },
	
    -- 每次攻击造成玩家4%最大生命值伤害，并恢复100%所造成伤害的血量
    [210024] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.CONTROL_RESIST,
                bene    = 100,
            };
            return lst;
        end,
    },
	
	-- 每秒恢复自身最大生命值5%
	[210025] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "skill recover",
                src     = "caster",
                hp      = math.floor(caster.max_hp * 0.05),
                period  = 1,
            };
            return lst;
        end,
    },
	
	-- 每次攻击造成玩家4%最大生命值伤害，并恢复100%所造成伤害的血量
    [210026] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "skill hurt",
                src     = "caster",
				tgt		= "enemy",
				elem 	= AttackType.Physics,
                val     = enemy.max_hp * 0.04,
            };
			local atk = (caster.min_atk + caster.max_atk)/2
			lst[#lst + 1] = {
                type    = "suck damage",
                src     = "caster",
				tgt 	= "enemy",
				elem	= AttackType.Physics,
				val		= atk,
                suck    = 100,
            };
            return lst;
        end,
    },
	
	-- 免疫昏迷，每次攻击必定使玩家眩晕1秒
    [210027] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
			lst[#lst + 1] = {
                type    = "attrib benefit",
                src     = "caster",
                attr    = AttribType.CONTROL_RESIST,
                bene    = 100,
            };
            return lst;
        end,
    },
	
	-- 降低玩家50%的攻速,减少受到的50%伤害
    [210028] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
			lst[#lst + 1] = {
                type    = "be damage change",
                src     = "caster",
				physics = -50,
				fire = -50,
				cold = -50,
				light = -50,
				poison = -50,
				attack = -50,
				skill  = -50,
            };
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "enemy",
				attr	= AttribType.ATTACK_SPEED,
				gain	= -50,
			};
            return lst;
        end,
    },
	
	-- 降低玩家50%的攻击,降低玩家50%防御
    [210029] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "enemy",
				attr	= AttribType.ATTACK,
				gain	= -50,
            };
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "enemy",
				attr	= AttribType.DEFENSE,
				gain	= -50,
			};
            return lst;
        end,
    },
	
	-- 每次受到伤害5%几率晕眩玩家2秒
	[210030] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
			lst[#lst + 1] = {
				type      	= "single skill",
				src       	= "enemy",
				faintTime  	= 2,
				faintRate	= 5,
				id      	= 210030,
			};
            return lst;
        end,
    },
	
	-- 降低自身以及玩家50%攻速
	[210031] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "caster",
				attr	= AttribType.ATTACK_SPEED,
				gain	= -50,
            };
			lst[#lst + 1] = {
				type    = "attrib gain",
				src     = "enemy",
				attr	= AttribType.ATTACK_SPEED,
				gain	= -50,
			};
            return lst;
        end,
    },
	
	-- 攻击有5%将玩家生命值降为1
	[210032] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
			lst[#lst + 1] = {
                type 	= "skill hurt",
                src 	= "caster",
                tgt 	= "enemy",
                elem 	= AttackType.Physics,
                val 	= enemy.cur_hp - 1,
				perc	= 5,
            };
            return lst;
        end,
    },
	
     [210033] =
     {
         use = function(caster, enemy, skillLv)
             local lst = {};
             lst[#lst + 1] = {
                 type    = "faint",
                 src     = "enemy",
                 duration= 1,
             };
             return lst;
         end,
     },
	 
    [210034] =
    {
        use = function(caster, enemy, skillLv)
            local lst = {};
            lst[#lst + 1] = {
                type    = "single skill",
                src     = "caster",
                id      = 210034,
            };
            return lst;
        end,
    },

	-- Monster：501000	辛德拉尔
	-- 501000 - 切割：攻击敌人 3 次，每次造成攻击力 82% 的物理伤害
	-- 动作序号：3；总帧数：90；生效帧数：42 / 59 / 75
	-- 普攻段数：1, 攻击元素类型：物理
	[501000] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.37,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.52,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.56,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.52,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.53,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.52,
			}
			return lst
		end,
	},

	-- Monster：501000	辛德拉尔
	-- 501001 - 致死打击：对敌人造成攻击力 162% 的物理伤害和 158% 的毒素伤害
	-- 动作序号：2；总帧数：75；生效帧数：29 / 32
	-- 普攻段数：1, 攻击元素类型：物理
	[501001] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.93,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(caster.min_atk, caster.max_atk) * 1.22,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.1,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Poison,
				val = sw.randi(caster.min_atk, caster.max_atk) * 1.18,
			}
			return lst
		end,
	},

	-- Monster：501001	卡夫
	-- 501010 - 圣光风暴：用神圣的力量形成漩涡，对敌人造成攻击力 35%×12 次的火焰伤害
	-- 动作序号：2；总帧数：140；生效帧数：80 / 85 / 90 / 95 / 100 / 105 / 110 / 115 / 120 / 125 / 130 / 135
	-- 普攻段数：1, 攻击元素类型：物理
	[501010] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 2.47,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-7-1",
				src = "caster",
				slot = "fx-1",
			}
			for times = 1, 12 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.16,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Fire,
					val = sw.randi(caster.min_atk, caster.max_atk) * 0.35,
				}
			end
			return lst
		end,
	},

	-- Monster：501001	卡夫
	-- 501011 - 圣光普照：用圣光照耀敌人，造成攻击力 60%×4 次的火焰伤害并使其命中率降低 20%，持续 5 秒
	-- 动作序号：3；总帧数：110；生效帧数：50 / 60 / 70 / 80
	-- 普攻段数：1, 攻击元素类型：物理
	[501011] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.33,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-8-1",
				src = "caster",
				slot = "fx-2",
			}
			for times = 1, 4 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.33,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Fire,
					val = sw.randi(caster.min_atk, caster.max_atk) * 0.6,
				}
			end
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "enemy",
				attr = AttribType.HIT,
				bene = -20,
				duration = 5,
				unique_id = 501011,
			}
			return lst
		end,
	},

	-- Monster：501001	卡夫
	-- 501012 - 圣光灌注：为施法者恢复 60% 生命。该法术需要 2.5 秒施法时间。生命低于 50% 时开始使用
	-- 动作序号：4；总帧数：150；生效帧数：125
	-- 普攻段数：1, 攻击元素类型：物理
	[501012] =
	{
		-- 技能使用条件。返回0表示可以使用，否则不能使用（返回值为错误码）
		condition = function(caster, enemy)
			if (caster.cur_hp >= caster.max_hp * 0.5) then
				return 203
			end
			return 0
		end,

		-- 技能被使用或触发
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 3.67,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-9-1",
				src = "caster",
				slot = "fx-3",
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.5,
			}
			lst[#lst + 1] = {
				type = "skill recover",
				src = "caster",
				hp = caster.max_hp * 0.6
			}
			return lst
		end,
	},

	-- Monster：501001	卡夫
	-- 501013 - 神圣庇护：卡夫的生命低于 40% 时，受到的所有伤害降低 25%
	-- 动作序号：5；总帧数：90；生效帧数：42
	-- 普攻段数：1, 攻击元素类型：物理
	[501013] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 5,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.4,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-10-1",
				src = "caster",
				slot = "fx-4",
			}
			lst[#lst + 1] = {
				type = "be damage change",
				src = "caster",
				physics = -25,
				fire = -25,
				cold = -25,
				light = -25,
				poison = -25,
				unique_id = 501013,
			}
			return lst
		end,
	},

	-- Monster：502000	艾萨琳冷心
	-- 502000 - 猎人印记：为目标施加标记，使其防御降低 33%，闪避率降低 25%，持续至战斗结束
	-- 动作序号：4；总帧数：50；生效帧数：25
	-- 普攻段数：1, 攻击元素类型：物理
	[502000] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.83,
			}
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "enemy",
				attr = AttribType.DEFENSE,
				gain = -33,
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "enemy",
				attr = AttribType.DODGE,
				bene = -25,
			}
			return lst
		end,
	},

	-- Monster：502000	艾萨琳冷心
	-- 502001 - 急速射击：连续攻击 2 次，每次对敌人造成攻击力 116% 的物理伤害
	-- 动作序号：2；总帧数：80；生效帧数：38 / 62
	-- 普攻段数：1, 攻击元素类型：物理
	[502001] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.47,
			}
			for times = 1, 2 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.8,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Physics,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.16,
				}
			end
			return lst
		end,
	},

	-- Monster：502000	艾萨琳冷心
	-- 502002 - 箭雨：射出 3 支箭，每一支箭会对敌人造成攻击力 82% 的冰霜伤害
	-- 动作序号：3；总帧数：100；生效帧数：61 / 66 / 71
	-- 普攻段数：1, 攻击元素类型：物理
	[502002] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.87,
			}
			for times = 1, 4 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.17,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Ice,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.82,
				}
			end
			return lst
		end,
	},

	-- Monster：502001	尤蒙冈多，虚空之喉
	-- 502010 - 灼热撕咬：撕咬敌人，造成攻击力 32%×2次 物理伤害并使其火抗和毒抗降低 3%。该效果可无限叠加
	-- 动作序号：4；总帧数：120；生效次数：2；生效帧数：64 / 90
	-- 普攻段数：1, 攻击元素类型：物理
	[502010] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 2.1,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.32,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.7,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.32,
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "enemy",
				attr = AttribType.FIRE_RESIST,
				bene = -3,
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "enemy",
				attr = AttribType.POISON_RESIST,
				bene = -3,
			}
			return lst
		end,
	},

	-- Monster：502001	尤蒙冈多，虚空之喉
	-- 502011 - 腐蚀吐息：喷吐酸液攻击目标，造成攻击力 70% 的毒素伤害，并在接下来的 6 秒内造成额外 150% 的毒素伤害，该效果可叠加
	-- 动作序号：3；总帧数：180；生效次数：8；生效帧数：45 / 70 / 85 / 100 / 115 / 130 / 145 / 160
	-- 普攻段数：1, 攻击元素类型：物理
	[502011] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Poison,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.70,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.33,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-17-1",
				src = "caster",
				slot = "fx-2",
			}
            lst[#lst + 1] = {
                type = "skill damage",
                src = "caster",
                tgt = "enemy",
                elem = AttackType.Poison,
                val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.15,
                period = 1,
                loop = 6,
                dot = true,
            }
			return lst
		end,
	},

	-- Monster：502001	尤蒙冈多，虚空之喉
	-- 502012 - 熔岩喷吐：喷吐一个巨大的熔岩火球攻击目标，造成攻击力 150% 的火焰伤害
	-- 动作序号：2；总帧数：70；生效次数：1；生效帧数：50
	-- 普攻段数：1, 攻击元素类型：物理
	[502012] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.5,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-18-1",
				src = "caster",
				slot = "fx-1",      
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.16,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Fire,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.5,
                -- crit = true,
			}
			return lst
		end,
	},

	-- Monster：502001	尤蒙冈多，虚空之喉
	-- 502013 - 枯萎之触：造成暴击后使目标中毒，每 1 秒造成攻击力 10% 的毒素伤害，持续 6 秒
	-- 动作序号：无需动作；总帧数：——；生效次数：——；生效帧数：
	-- 普攻段数：1, 攻击元素类型：物理
	[502013] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Poison,
				val = (vAtkPowMin + vAtkPowMax) / 2 * 0.10,
				period = 1,
				loop = 6,
                dot = true,
				unique_id = 502013,
			}
			return lst
		end,
	},

	-- Monster：502001	尤蒙冈多，虚空之喉
	-- 502014 - 熔岩之血：受到攻击时，深渊蠕虫的岩浆之血会四散飞溅，对攻击者造成攻击力 6% 的火焰伤害
	-- 动作序号：无需动作；总帧数：——；生效次数：——；生效帧数：
	-- 普攻段数：1, 攻击元素类型：物理
	[502014] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "damage back",
				src = "caster",
				elem = AttackType.Fire,
				mode = 0,
                dam = (vAtkPowMin + vAtkPowMax) / 2 * 0.06,
			}
			return lst
		end,
	},

	-- Monster：503000	梦祈福
	-- 503000 - 神圣震击：用圣光冲击敌人，造成 135% 的闪电伤害。每次施放都会使闪电伤害提高 15%
	-- 动作序号：2；总帧数：80；生效帧数：46 / 50
	-- 普攻段数：1, 攻击元素类型：闪电
	[503000] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.light_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.light_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 1.5,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Light,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.35,
			}
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "caster",
				attr = AttribType.LIGHT_ATTACK,
				gain = 15,
			}
			return lst
		end,
	},

	-- Monster：503000	梦祈福
	-- 503001 - 圣光轮盘：施放圣光轮盘，对敌人造成 57%×5 次的闪电伤害
	-- 动作序号：3；总帧数：100；生效帧数：39 / 43 / 47 / 51 / 55
	-- 普攻段数：1, 攻击元素类型：闪电
	[503001] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.light_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.light_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 1.17,
			}
			for times = 1, 5 do
				lst[#lst + 1] = {
					type    = "delay",
					time    = 0.13,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Light,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.57,
				}
			end
			return lst
		end,
	},

	-- Monster：503000	梦祈福
	-- 503002 - 圣光屏障：施法者被能量护盾所保护，可吸收相当于生命上限43%的伤害，持续15秒
	-- 动作序号：4；总帧数：60；生效帧数：30
	-- 普攻段数：1, 攻击元素类型：闪电
	[503002] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.light_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.light_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 1,
			}
			lst[#lst + 1] = {
				type    = "shield",
				src     = "caster",
				val     = caster.max_hp * 0.43,
				duration = 15,
				unique_id = 503002,
			}
			return lst
		end,
	},

	-- Monster：503001	布洛托雷酒
	-- 503010 - 风暴打击：重击地面，对敌人造成攻击力 33%×10 次的闪电伤害并使其攻击速度降低 25%，持续 4 秒
	-- 动作序号：3；总帧数：100；生效次数：10；生效帧数：47 / 52 / 56 / 62 / 67 / 70 / 78 / 84 / 90 / 95
	-- 普攻段数：2, 攻击元素类型：物理
	[503010] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 2
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 1.4,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-12-1",
				src = "caster",
				slot = "fx-1",
			}
			for times = 1, 10 do
				lst[#lst + 1] = {
					type    = "delay",
					time    = 0.17,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Light,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.33,
				}
			end
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "enemy",
				attr = AttribType.ATTACK_SPEED,
				gain = -25,
				duration = 4,
				unique_id = 503010,
			}
			return lst
		end,
	},

	-- Monster：503001	布洛托雷酒
	-- 503011 - 雷霆冲撞：向敌人冲锋，造成攻击力 76%×3 次的物理伤害
	-- 动作序号：2；总帧数：80；生效次数：3；生效帧数：21 / 38 / 55
	-- 普攻段数：2, 攻击元素类型：物理
	[503011] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 2
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 0.13,
			}
			for times = 1, 3 do
				lst[#lst + 1] = {
					type    = "delay",
					time    = 0.56,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Physics,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.76,
				}
			end
			return lst
		end,
	},

	-- Monster：503001	布洛托雷酒
	-- 503012 - 天降正义：跃起砸击地面，对敌人造成攻击力 42% × 7 次的闪电伤害
	-- 动作序号：4；总帧数：90；生效次数：7；生效帧数：47 / 52 / 59 / 65 / 71 / 77 / 83
	-- 普攻段数：2, 攻击元素类型：物理
	[503012] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 2
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 1.5,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-11-1",
				src = "caster",
				slot = "fx-2",
			}
			for times = 1, 7 do
				lst[#lst + 1] = {
					type    = "delay",
					time    = 0.2,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Physics,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.42,
				}
			end
			return lst
		end,
	},

	-- Monster：503001	布洛托雷酒
	-- 503013 - 雷霆之怒：召唤雷霆攻击敌人多次，每次造成攻击力 58% 的闪电伤害
	-- 动作序号：5；总帧数：140；生效次数：13；生效帧数：40 / 43 / 47 / 54 / 57 / 63 / 67 / 71 / 76 / 81 / 87 / 95 / 100
	-- 普攻段数：2, 攻击元素类型：物理
	[503013] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 2
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 5,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 1.17,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-13-1",
				src = "caster",
				slot = "fx-3",
			}
			for times = 1, 13 do
				lst[#lst + 1] = {
					type    = "delay",
					time    = 0.166,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Light,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.58,
                    dot = true,
				}
			end
			return lst
		end,
	},

	-- Monster：503001	布洛托雷酒
	-- 503014 - 重击：攻击时有 25% 几率对敌人造成攻击力 40% 的额外物理伤害并使其昏迷 1 秒
	-- 动作序号：无需动作；总帧数：——；生效次数：——；生效帧数：——
	-- 昏迷效果暂时没有
	-- 普攻段数：2, 攻击元素类型：物理
	[503014] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 2
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "additional attack",
				src = "caster",
				tgt = "enemy",
				physics = (vAtkPowMin + vAtkPowMax) / 2 * 0.2,
			}
			return lst
		end,
	},

	-- Monster：503001	布洛托雷酒
	-- 503015 - 狂乱：风暴打击[503010]命中后将获得一层狂乱效果，攻击速度提高 10%，暴击率提高 3%，持续 10 秒
	-- 动作序号：无需动作；总帧数：——；生效次数：——；生效帧数：——
	-- 普攻段数：2, 攻击元素类型：物理
	[503015] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 2
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "caster",
				attr = AttribType.ATTACK_SPEED,
				gain = 10,
				duration = 10
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "caster",
				attr = AttribType.CRITICAL,
				bene = 3,
				duration = 10
			}
			return lst
		end,
	},

	-- Monster：503001	布洛托雷酒
	-- 503016 - 天神下凡：施法者变成石像形态，攻击和防御提高 50%，所有抗性提高 25% 并获得新技能。战斗时间超过 60 秒后激活
	-- 动作序号：6；总帧数：80；生效次数：——；生效帧数：——
	-- 战斗计时（AI脚本判断）
	-- 普攻段数：2, 攻击元素类型：物理
	[503016] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 2
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
            lst[#lst + 1] = {
                type = "action",
                src = "caster",
                idx = 6,
            }
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "caster",
				attr = AttribType.ATTACK,
				gain = 50,
			}
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "caster",
				attr = AttribType.DEFENSE,
				gain = 50,
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "caster",
				attr = AttribType.FIRE_RESIST,
				bene = 25,
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "caster",
				attr = AttribType.COLD_RESIST,
				bene = 25,
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "caster",
				attr = AttribType.LIGHT_RESIST,
				bene = 25,
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "caster",
				attr = AttribType.POISON_RESIST,
				bene = 25,
			}
			return lst
		end,
	},

	-- Monster：504000	菲欧娜
	-- 504001 - 冰霜冲击：用寒冰冲击敌人 2 次，每次造成攻击力 126% 的冰霜伤害
	-- 动作序号：3；总帧数：80；生效次数：2；生效帧数：50 / 55
	-- 普攻段数：1, 攻击元素类型：火焰
	[504001] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = (caster.fire_atk + caster.cold_atk) * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = (caster.fire_atk + caster.cold_atk) * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 1.5,
			}
			for times = 1, 2 do
				lst[#lst + 1] = {
					type    = "delay",
					time    = 0.166,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Ice,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.26,
				}
			end
			return lst
		end,
	},

	-- Monster：504000	菲欧娜
	-- 504002 - 燃烧宝珠：发射火球攻击敌人，造成攻击力 168%×2 次的火焰伤害
	-- 动作序号：2；总帧数：80；生效次数：2；生效帧数：47 / 51
	-- 普攻段数：1, 攻击元素类型：火焰
	[504002] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = (caster.fire_atk + caster.cold_atk) * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = (caster.fire_atk + caster.cold_atk) * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type    = "delay",
				time    = 1.43,
			}
			for times = 1, 2 do
				lst[#lst + 1] = {
					type    = "delay",
					time    = 0.166,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Fire,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.68,
				}
			end
			return lst
		end,
	},

	-- Monster：504001	砰砰博士
	-- 504010 - 高能切割：用高能粒子束熔化敌人的护甲，造成攻击力 168% 的闪电伤害并使其防御降低 20%，持续 10 秒
	-- 动作序号：2；总帧数：80；生效次数：1；生效帧数：53
	-- 普攻段数：1, 攻击元素类型：物理
	[504010] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.76,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Light,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.68,
			}
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "enemy",
				attr = AttribType.DEFENSE,
				gain = -20,
				duration = 10,
				unique_id = 504010,
			}
			return lst
		end,
	},

	-- Monster：504001	砰砰博士
	-- 504011 - 致命连射：控制和平流浪者手部的机关炮向敌人射击 5 次，每次造成攻击力 58% 的物理伤害
	-- 动作序号：3；总帧数：100；生效次数：5；生效帧数：42 / 46 / 50 / 58 / 66
	-- 普攻段数：1, 攻击元素类型：物理
	[504011] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.26,
			}
			for times = 1, 3 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.13,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Physics,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.58,
				}
			end
			for times = 1, 2 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.2,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Physics,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.72,
				}
			end
			return lst
		end,
	},

	-- Monster：504001	砰砰博士
	-- 504012 - 震荡炮击：用控制台下方的火炮齐射 10 次，每次造成 45% 的火焰伤害
	-- 动作序号：4；总帧数：120；生效次数：10；生效帧数：42 / 47 / 59 / 62 / 74 / 80 / 90 / 94 / 104 / 107
	-- 普攻段数：1, 攻击元素类型：物理
	[504012] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.16,
			}
			for times = 1, 10 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.23,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Fire,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.45,
                    dot = true,
				}
			end
			return lst
		end,
	},

	-- Monster：504001	砰砰博士
	-- 504013 - I-19等离子冲击炮：引导能量光线，对敌人造成相当于其生命 132% 的伤害（火/电各半）（QTE，简单的做法是直接HP-20%）
	-- 动作序号：5；总帧数：140；生效次数：1；生效帧数：90
	-- 普攻段数：1, 攻击元素类型：物理
	[504013] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.min_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local vAtkPowMax = caster.max_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 )
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 5,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 2.5,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-14-1",
				src = "caster",
				slot = "fx-1",
			}
            lst[#lst + 1] = {
                type = "skill hurt",
                src = "caster",
                tgt = "enemy",
                elem = AttackType.Fire,
                val = enemy.max_hp * 0.66,
            }
			lst[#lst + 1] = {
				type = "delay",
				time = 0.5,
			}
			lst[#lst + 1] = {
				type = "skill hurt",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Light,
                val = enemy.max_hp * 0.66,
			}
			return lst
		end,
	},

	-- Monster：505000	马尔科月痕
	-- 505000 - 水晶坠落：召唤从天而降的水晶砸击敌人，造成 136%×2 次的冰霜伤害
	-- 动作序号：2；总帧数：80；生效次数：2；生效帧数：47 / 52
	-- 普攻段数：1, 攻击元素类型：毒素
	[505000] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = (caster.cold_atk + caster.poison_atk) * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = (caster.cold_atk + caster.poison_atk) * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.4,
			}
			for times = 1, 2 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.17,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Ice,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.36,
				}
			end
			return lst
		end,
	},

	-- Monster：505000	马尔科月痕
	-- 505001 - 剧毒爆裂：施放瘟疫云雾攻击敌人，造成 108%×3 次的毒素伤害，并使其生命上限降低 20%，持续 15 秒
	-- 动作序号：3；总帧数：100；生效次数：3；生效帧数：40 / 47 / 54
	-- 普攻段数：1, 攻击元素类型：毒素
	[505001] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = (caster.cold_atk + caster.poison_atk) * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = (caster.cold_atk + caster.poison_atk) * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.1,
			}
			for times = 1, 3 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.23,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Poison,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.08,
				}
			end
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "enemy",
				attr = AttribType.HP,
				gain = -20,
				duration = 15,
				unique_id = 505001
			}
			return lst
		end,
	},

	-- Monster：505001	艾莎
	-- 505010 - 雪花盘旋：用雪花冰晶攻击敌人 3 次，每次造成攻击力 52% 的冰霜伤害
	-- 动作序号：3；总帧数：60；生效次数：3；生效帧数：37 / 42 / 47
	-- 普攻段数：1, 攻击元素类型：冰霜
	[505010] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.07,
			}
			for times = 1, 3 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.17,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Ice,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.52,
				}
			end
			return lst
		end,
	},

	-- Monster：505001	艾莎
	-- 505011 - 螺旋冰晶：用雪花冰晶快速切割敌人，造成攻击力 26%×6 次的冰霜伤害
	-- 动作序号：4；总帧数：105；生效次数：6；生效帧数：38 / 41 / 45 / 48 / 52 / 54
	-- 普攻段数：1, 攻击元素类型：冰霜
	[505011] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.2,
			}
			for times = 1, 6 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.1,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Ice,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.26,
				}
			end
			return lst
		end,
	},

	-- Monster：505001	艾莎
	-- 505012 - 冰锥：召唤巨大的冰锥，连续攻击敌人 3 次，每次造成攻击力 76% 的冰霜伤害
	-- 动作序号：2；总帧数：80；生效次数：3；生效帧数：24 / 30 / 37
	-- 普攻段数：1, 攻击元素类型：冰霜
	[505012] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.8,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-15-1",
				src = "caster",
				slot = "fx-1",
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Ice,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.76,
			}
			for times = 1, 2 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.2,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Ice,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.76,
				}
			end
			return lst
		end,
	},

	-- Monster：505001	艾莎
	-- 505013 - 冰川尖刺：召唤锋利的冰刺，造成 32%×12 次的冰霜伤害并将敌人冻结在冰块之内，持续 5 秒（单段27%）
	-- 动作序号：5；总帧数：120；生效次数：12；生效帧数：45 / 47 / 49 / 53 / 55 / 57 / 59 / 61 / 63 / 66 / 68 / 70
	-- 普攻段数：1, 攻击元素类型：冰霜
	[505013] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 5,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-16-1",
				src = "caster",
				slot = "fx-2",
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.3,
			}
			for times = 1, 12 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.1,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Ice,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.32,
				}
			end
			lst[#lst + 1] = {
				type = "froze",
				src = "enemy",
				duration = 3,
				unique_id = 505013
			}
			return lst
		end,
	},

	-- Monster：505001	艾莎
	-- 505014 - 彻骨之寒：艾莎的敌人被极寒影响，每 3 秒受到 450 点冰霜伤害
	-- 动作序号：无需动作；总帧数：——；生效次数：——；生效帧数：——
	-- 普攻段数：1, 攻击元素类型：冰霜
	[505014] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Ice,
				val = 450,
			}
			return lst
		end,
	},

	-- Monster：505001	艾莎
	-- 505015 - 碎冰甲：艾莎受到暴击时，将获得碎冰甲的保护，碎冰甲能吸收艾莎生命上限 2% 的伤害
	-- 动作序号：无需动作；总帧数：——；生效次数：——；生效帧数：——
	-- 普攻段数：1, 攻击元素类型：冰霜
	[505015] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "shield",
				src = "caster",
				val = caster.max_hp * 0.02,
				unique_id = 505014
			}
            lst[#lst + 1] = {
                type    = "body effect",
                file    = "pe-3-23-2",
                src     = "caster",
                slot    = "dp-1",
			}
			return lst
		end,
	},

	-- Monster：505001	艾莎
	-- 505016 - 霜寒刺骨：艾莎的所有攻击都会造成霜寒刺骨效果，使敌人的攻击速度降低 25%，冰抗降低 25%，持续 3 秒
	-- 动作序号：无需动作；总帧数：——；生效次数：——；生效帧数：——
	-- 普攻段数：1, 攻击元素类型：冰霜
	[505016] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "enemy",
				attr = AttribType.ATTACK_SPEED,
				gain = -25,
				duration = 3
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "enemy",
				attr = AttribType.COLD_RESIST,
				bene = -25,
				duration = 3
			}
            return lst
		end,
	},

	----------------------------------------------------------------------------------------------------------------------
	-- Monster：511001  雷刃·克里斯吴
	-- 攻击敌人 1 次，200% 物理
	-- 动作序号：2；命中时间：1
	[511001] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 2,
            }
			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-2-3-1",
				src     = "caster",
                slot    = "fx-1",
            }

			return lst
		end,
	},
	-- Monster：511001  雷刃·克里斯吴
	-- 攻击敌人 2 次，第一次冰霜+物理，第二次闪电+物理+必定暴击
	-- 动作序号：3；命中时间：1.37，2.43
	[511002] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.37,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Ice,
				val = caster.cold_atk,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax),
            }
            lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-3-23-2",
				src     = "enemy",
                slot    = "dp-1",
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.06,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Light,
				val = caster.light_atk * 1.1,
				crit = true,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.1,
				crit = true,
            }
            lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-3-17-1",
				src     = "enemy",
                slot    = "dp-1",
            }

			return lst
		end,
	},

	----------------------------------------------------------------------------------------------------------------------
	-- Monster：511003  巫女•日向狸
	-- 攻击敌人 2 次，物理；并且，第一次降低目标火抗，第二次给目标加持续火伤
	-- 动作序号：2；命中时间：1.23, 2.1
	[511003] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.23,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax),
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "enemy",
                attr = AttribType.FIRE_RESIST,
                bene = -5,
            }
			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-3-6-3",
				src     = "enemy",
                slot    = "dp-1",
            }

			lst[#lst + 1] = {
				type = "delay",
				time = 0.87,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax),
            }
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Fire,
                val = caster.fire_atk * sw.randi(0.3, 0.4),
                period = 1,
                loop = 15,
            }
			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-9-1-2",
				src     = "enemy",
                slot    = "dp-1",
            }

			return lst
		end,
	},
	-- Monster：511003  巫女·日向狸
	-- 5秒护盾；并攻击敌人 3 次，冰霜+物理，闪电+物理，火+物理
	-- 动作序号：3；命中时间：0.47, 2.1, 2.47, 2.77
	[511004] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
            }

			lst[#lst + 1] = {
				type = "delay",
				time = 0.47,
            }
			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-3-18-1",
				src     = "caster",
                slot    = "dp-1"
            }
			lst[#lst + 1] = {
				type = "shield",
				src = "caster",
                val = caster.max_hp,
                duration = 5,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.63,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Ice,
				val = caster.cold_atk,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax),
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 0.37,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Light,
				val = caster.light_atk,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax),
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 0.3,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Fire,
				val = caster.fire_atk * 1.2,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.2,
            }
            
			return lst
		end,
    },
    
	----------------------------------------------------------------------------------------------------------------------
	-- Monster: 511004  虚空九头蛇•再构
	-- 攻击敌人 2 次，减火抗、毒抗
	-- 动作序号：4；命中时间：2.13, 3
	[511005] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 2.13,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 110,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "enemy",
                attr = AttribType.FIRE_RESIST,
                bene = -7,
            }
			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-3-6-3",
				src     = "enemy",
                slot    = "dp-1",
            }

			lst[#lst + 1] = {
				type = "delay",
				time = 0.87,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 110,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "enemy",
                attr = AttribType.POISON_RESIST,
                bene = -7,
            }
			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-3-6-3",
				src     = "enemy",
                slot    = "dp-1",
            }

			return lst
		end,
    },
	-- Monster: 511004  虚空九头蛇•再构  喷火
	-- 攻击敌人 1 次，加持续火伤、毒伤
	-- 动作序号：2；命中时间：2.13, 3
	[511006] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.5,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-18-1",
				src = "caster",
				slot = "fx-1",
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.16,
			}
            lst[#lst + 1] = {
                type = "skill attack",
                src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 180,
            }

			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Fire,
                val = caster.fire_atk * sw.randi(0.35, 0.4),
                period = 1,
                loop = 12,
            }
			lst[#lst + 1] = {
				type = "delay",
				time = 0.5,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Poison,
                val = caster.poison_atk * sw.randi(0.35, 0.4),
                period = 1,
                loop = 12,
            }

			return lst
		end,
    },
	-- Monster: 511004  虚空九头蛇•再构  喷毒
	-- 攻击敌人 10 次，第一次和最后一次强制暴击
	-- 动作序号：3；命中时间：
	[511007] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 0.33,
			}
			lst[#lst + 1] = {
				type = "qte start",
				src = "caster",
				perc = 50,
            }
			lst[#lst + 1] = {
				type = "delay",
				time = 1,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-17-1",
				src = "caster",
				slot = "fx-2",
            }
            
            for i = 1, 15 do
                lst[#lst + 1] = {
                    type = "delay",
                    time = 0.2,
                }
                lst[#lst + 1] = {
                    type = "skill attack",
                    src = "caster",
					tgt = "enemy",
					qte = true,
					hit = true,
					pass = false,
                    crit = (i == 1 or i == 15),
                    perc = 25,
                }
            end

			return lst
		end,
	},

	----------------------------------------------------------------------------------------------------------------------
	-- Monster: 511005  犬兽卫兵
	-- 攻击 2 次
	-- 动作序号：2；命中时间：1.43, 1.7
	[511008] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.43,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 100,
            }

			lst[#lst + 1] = {
				type = "delay",
				time = 0.27,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 100,
            }

			return lst
		end,
    },
	-- Monster: 511005  犬兽卫兵
	-- 斗气攻击 2 次
	-- 动作序号：2；命中时间：1.43, 1.7
	[511009] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.43,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                crit = true,
                perc = 110,
            }

			lst[#lst + 1] = {
				type = "delay",
				time = 0.27,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                crit = true,
                perc = 130,
            }

			return lst
		end,
    },
	-- Monster: 511005  犬兽卫兵
	-- 斗气 1，加攻防
	-- 动作序号：4；命中时间：0.77
	[511010] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
            local lst = {}
            -- 一次性buff必须立即加，避免被昏
            lst[#lst + 1] = {
                type = "attrib gain",
                src = "caster",
                attr = AttribType.ATTACK,
                gain = 25,
            }
            lst[#lst + 1] = {
                type = "attrib gain",
                src = "caster",
                attr = AttribType.DEFENSE,
                gain = 25,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.HIT,
                gain = 100,
            }

			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
            }
			lst[#lst + 1] = {
				type = "delay",
				time = 0.77,
			}
			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-3-6-1",
				src     = "caster",
                slot    = "dp-1",
            }

			return lst
		end,
    },
	-- Monster: 511005  犬兽卫兵
	-- 斗气 2，加暴击速抗性
	-- 动作序号：4；命中时间：0.77
	[511011] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
            local lst = {}
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.CRITICAL,
                bene = 25,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.CRIT_DAMAGE,
                bene = 25,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.ATTACK_SPEED,
                gain = 100,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.FIRE_RESIST,
                gain = 25,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.COLD_RESIST,
                gain = 25,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.LIGHT_RESIST,
                gain = 25,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.POISON_RESIST,
                gain = 25,
            }

			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
            }
			lst[#lst + 1] = {
				type = "delay",
				time = 0.77,
			}
			lst[#lst + 1] = {
				type    = "body effect",
				file    = "pe-3-6-2",
				src     = "caster",
                slot    = "dp-1",
            }

			return lst
		end,
    },

	----------------------------------------------------------------------------------------------------------------------
	-- Monster: 511009  雄性冰精灵
	-- 攻击 1 次
	-- 动作序号：1；命中时间：1.03
	[511012] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 1,
            }
            lst[#lst + 1] = {
                type = "attrib benefit",
                src = "caster",
                attr = AttribType.DODGE,
                bene = 10,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.03,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 140,
            }
			return lst
		end,
    },
	-- Monster: 511009  雄性冰精灵
	-- 攻击 2 次
	-- 动作序号：2；命中时间：1.53, 1.8
	[511013] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.53,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 110,
            }

			lst[#lst + 1] = {
				type = "delay",
				time = 0.27,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 110,
            }
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "enemy",
				attr = AttribType.ATTACK_SPEED,
				gain = -25,
				duration = 4,
				unique_id = 511013,
			}

			return lst
		end,
    },
	-- Monster: 511009  雄性冰精灵
	-- 攻击 3 次
	-- 动作序号：3；命中时间：1.33, 1.6, 1.83
	[505014] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
            }
            
			lst[#lst + 1] = {
				type = "delay",
				time = 1.33,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 70,
            }

			lst[#lst + 1] = {
				type = "delay",
				time = 0.27,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
                tgt = "enemy",
                hit = true,
                perc = 90,
            }

			lst[#lst + 1] = {
				type = "delay",
				time = 0.23,
			}
			lst[#lst + 1] = {
				type = "skill attack",
				src = "caster",
				tgt = "enemy",
                hit = true,
                perc = 110,
            }
            if (sw.randi(1, 100) <= 50) then
                lst[#lst + 1] = {
                    type = "froze",
                    src = "enemy",
                    duration = 3,
                    unique_id = 505014
                }
            end
			return lst
		end,
	},
	
	----------------------------------------------------------------------------------------------------------------------
	-- Monster: 511010  死灵艾莎
	-- 雪花盘旋：用雪花冰晶攻击敌人 3 次，每次造成攻击力 100% 的毒素伤害
	-- 动作序号：3；总帧数：60；生效次数：3；生效帧数：37 / 42 / 47
	-- 普攻段数：1, 攻击元素类型：冰霜
	[511015] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 3,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.07,
			}
			for times = 1, 3 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.17,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Poison,
					val = sw.randi(vAtkPowMin, vAtkPowMax),
				}
			end
			return lst
		end,
	},
	-- Monster：511010  死灵艾莎
	-- 螺旋冰晶：用雪花冰晶快速切割敌人，造成攻击力 52%×6 次的冰霜伤害
	-- 动作序号：4；总帧数：105；生效次数：6；生效帧数：38 / 41 / 45 / 48 / 52 / 54
	-- 普攻段数：1, 攻击元素类型：冰霜
	[511016] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 4,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.2,
			}
			for times = 1, 6 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.1,
				}
				lst[#lst + 1] = {
					type = "skill damage",
					src = "caster",
					tgt = "enemy",
					elem = AttackType.Ice,
					val = sw.randi(vAtkPowMin, vAtkPowMax) * 0.64,
				}
			end

			return lst
		end,
	},
	-- Monster：511010  死灵艾莎
	-- 冰锥：召唤巨大的冰锥，连续攻击敌人 3 次，依次造成毒素、冰霜、物理伤害
	-- 动作序号：2；总帧数：80；生效次数：3；生效帧数：24 / 30 / 37
	-- 普攻段数：1, 攻击元素类型：冰霜
	[511017] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.8,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-15-1",
				src = "caster",
				slot = "fx-1",
			}

			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Poison,
				val = sw.randi(vAtkPowMin, vAtkPowMax),
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.2,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Ice,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.25,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.2,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = sw.randi(vAtkPowMin, vAtkPowMax) * 1.5,
			}

			return lst
		end,
	},
	-- Monster：511010  死灵艾莎
	-- 冰川尖刺：召唤锋利的冰刺，造成 12 次的伤害并将敌人冻结在冰块之内
	-- 动作序号：5；总帧数：120；生效次数：12；生效帧数：45 / 47 / 49 / 53 / 55 / 57 / 59 / 61 / 63 / 66 / 68 / 70
	-- 普攻段数：1, 攻击元素类型：冰霜
	[511018] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkPowMin = caster.min_atk
			local vAtkPowMax = caster.max_atk
			local lst = {}
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 5,
			}
			lst[#lst + 1] = {
				type = "body effect",
				file = "effect-2-16-1",
				src = "caster",
				slot = "fx-2",
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 0.3,
			}
			lst[#lst + 1] = {
				type = "qte start",
				src = "caster",
				perc = 50,
			}
			
			lst[#lst + 1] = {
				type = "delay",
				time = 1,
			}
			for times = 1, 12 do
				lst[#lst + 1] = {
					type = "delay",
					time = 0.1,
				}
				lst[#lst + 1] = {
					type = "skill attack",
					src = "caster",
					tgt = "enemy",
					hit = true,
					qte = true,
					pass = false,
					perc = 36,
				}
			end
			lst[#lst + 1] = {
				type = "froze",
				src = "enemy",
				qte = true,
				duration = 3,
				unique_id = 511018
			}
			return lst
		end,
	},
	-- Monster：511010  死灵艾莎
	-- 霜寒刺骨：艾莎的所有攻击都会造成霜寒刺骨效果，使敌人的攻击速度降低 25%，冰抗降低 25%，持续 3 秒
	-- 动作序号：无需动作；总帧数：——；生效次数：——；生效帧数：——
	-- 普攻段数：1, 攻击元素类型：冰霜
	[511019] =
	{
		use = function(caster, enemy, skillLv)
			local vAtkTimes = 1
			local vAtkPowMin = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 0.85
			local vAtkPowMax = caster.cold_atk * vAtkTimes / ( 1 + ( vAtkTimes - 1 ) * 0.2 ) * 1.15
			local lst = {};
			lst[#lst + 1] = {
				type = "attrib gain",
				src = "enemy",
				attr = AttribType.ATTACK_SPEED,
				gain = -25,
				duration = 3
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "enemy",
				attr = AttribType.COLD_RESIST,
				bene = -1,
				duration = 60
			}
            return lst
		end,
	},
	-- Monster：120011  枫叶林boss
	-- 时间轴：skill-2-3，技能生效时间1550毫秒
	-- 造成等同于攻击力x%的伤害（建议为500%）（若此时有属性叠加的buff，属性伤害并不会提高500%）
	[511020] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};
			local atkVal = (caster.min_atk + caster.max_atk)/2
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 2,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.55,
			}
			lst[#lst + 1] = {
				type = "skill damage",
				src = "caster",
				tgt = "enemy",
				elem = AttackType.Physics,
				val = atkVal*3.5
			}
            return lst
		end,
	},
	
	-- (1) 时间轴：skill-1-3，技能生效时间1100毫秒
	-- (2) 效果：获得buff，随机添加一条属性伤害到螳螂身上。他接下来的所有物理攻击都能造成等同于普通攻击的攻击力的该条属性的伤害。持续5秒
	[511021] =
	{
		use = function(caster, enemy, skillLv)
			local lst = {};
			local atkVal = (caster.min_atk + caster.max_atk)/2
			local vRate = sw.randi(1, 100)
			local atkType = AttribType.ATTACK
			if vRate < 35 then
				atkType = AttribType.ATTACK
			elseif vRate < 40 then
				atkType = AttribType.FIRE_ATTACK
			elseif vRate < 60 then
				atkType = AttribType.COLD_ATTACK
			elseif vRate < 80 then
				atkType = AttribType.LIGHT_ATTACK
			else
				atkType = AttribType.POISON_ATTACK
			end
			lst[#lst + 1] = {
				type = "action",
				src = "caster",
				idx = 1,
			}
			lst[#lst + 1] = {
				type = "delay",
				time = 1.1,
			}
			lst[#lst + 1] = {
				type = "attrib benefit",
				src = "caster",
				attr = atkType,
				bene = atkVal*0.2,
				duration = 5,
				unique_id = 511021,
			}
            return lst
		end,
	},
};

