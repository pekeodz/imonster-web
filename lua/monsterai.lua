--[[***************************************************************************************
* Copyright (c) 2014, Pixss.Com.Ltd. All rights reserved.
*****************************************************************************************--]]


-- monster/enemy包含的变量元素：
-- 		lv - 等级
-- 		cur_hp - 当前hp
-- 		max_hp - 最大hp
-- 		cur_mp - 当前mp
-- 		max_mp - 最大mp
-- 		min_atk - 最小攻击
-- 		max_atk - 最大攻击
-- 		defense - 防御
-- 		fire_atk - 火攻
-- 		cold_atk - 冰攻
-- 		light_atk - 雷攻
-- 		poison_atk - 毒攻
-- 		fire_res - 火抗
-- 		cold_res - 冰抗
-- 		light_res - 雷抗
-- 		poison_res - 毒抗
-- 		hit - 命中
-- 		dodge - 闪避
-- 		critical - 暴击
-- 		crit_dam - 暴击伤害

-- battle._hit		上一次怪物的攻击是否命中
-- battle._critical	上一次怪物的攻击是否暴击
-- battle._time		战斗持续时间，单位：秒


g_monster_ai = {
-- 辛德拉尔
[501000] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		print("进入技能使用检测")
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false
		print("	初始参数准备完成")

		if vHPScale <= 0.5 then
		-- 血量低于50%，50%几率使用致死打击[501001]，30%几率使用切割[501000]
			if vRate <= 50 then
				print(" ———— ※辛德拉尔※ HP 低于 40%， 使用了技能【 致死打击 】————")
				sw.UseSkill(501001, monster, enemy)
				bSkillCast = true
			elseif vRate <= 30 then
				print(" ———— ※辛德拉尔※ HP 低于 40%， 使用了技能【 切割 】————")
				sw.UseSkill(501000, monster, enemy)
				bSkillCast = true
			end
		else
		-- 其他情况，40%几率使用切割
			if vRate <= 40 then
				print(" ———— ※辛德拉尔※  使用了技能【 切割 】————")
				sw.UseSkill(501000, monster, enemy);
				bSkillCast = true
			end
		end
		if not bSkillCast then
			print("	本次未使用任何技能")
		end
		return bSkillCast
	end,

},

-- 卡夫
[501001] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		print("进入技能使用检测")
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false
		print("	初始参数准备完成")

		-- 神圣庇护：卡夫的生命低于 40% 时（该条件由AI控制)，受到的所有伤害降低 33%
		-- 参数battle，初始为空表，在一场战斗中，battle的值会持续保留，直到战斗结束。
		-- 当一场新的战斗开始时，battle重置为空表。可用于实现在一场战斗中有次数限制的技能
		print(" ———— ※卡夫※ 技能【 神圣庇护 】使用条件检测 ————")
		if (vHPScale < 0.4 and not battle.HolyShield) then
			print(" ———— ※卡夫※ HP 低于 40%，使用了技能【 神圣庇护 】————")
			sw.UseSkill(501013, monster, enemy)
			battle.HolyShield = true
			bSkillCast = true
		elseif battle.HolyShield then
			print(" 	※卡夫※ 已有【 神圣庇护 】效果")
		else
			print(" 	※卡夫※ HP 高于 40%，检测未通过，技能不可使用")
		end

		if not bSkillCast then
			if vHPScale <= 0.4 then
				-- 血量低于40%，20%几率使用圣光灌注[501012]，30%几率使用圣光普照[501011]，40%几率使用圣光风暴[501010]，10%几率普攻
				-- if vRate <= 20 and not battle.HolyInject then
					-- print(" ———— ※卡夫※ HP 低于 30%，使用了技能【 圣光灌注 】————")
					-- sw.UseSkill(501012, monster, enemy)
					-- battle.HolyInject = true
					-- bSkillCast = true
				if vRate <= 50 then
					print(" ———— ※卡夫※ HP 低于 30%，使用了技能【 圣光普照 】————")
					sw.UseSkill(501011, monster, enemy)
					bSkillCast = true
				elseif vRate <= 90 then
					print(" ———— ※卡夫※ HP 低于 30%，使用了技能【 圣光风暴 】————")
					sw.UseSkill(501010, monster, enemy)
					bSkillCast = true
				end
			elseif vHPScale <= 0.7 then
				-- 血量40%到70%，30%使用圣光普照[501011]，40%几率使用圣光风暴[501010]，30%几率普攻
				if vRate <= 30 then
					print(" ———— ※卡夫※ HP 低于 60%，使用了技能【 圣光普照 】————")
					sw.UseSkill(501011, monster, enemy)
					bSkillCast = true
				elseif vRate <= 70 then
					print(" ———— ※卡夫※ HP 低于 60%，使用了技能【 圣光风暴 】————")
					sw.UseSkill(501010, monster, enemy)
					bSkillCast = true
				end
			else
				-- 血量70%以上，30%几率使用圣光普照[501011]，70%普通攻击
				if vRate <= 30 then
					print(" ———— ※卡夫※ 使用了技能【 圣光普照 】————")
					sw.UseSkill(501011, monster, enemy);
					bSkillCast = true
				end
			end
		end
		if not bSkillCast then
			print("	本次未使用任何技能")
		end
		return bSkillCast
	end,
},

-- 艾萨琳冷心
[502000] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		print("进入技能使用检测")
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false
		print("	初始参数准备完成")

		-- 如果目标没有标记，则加一个
		-- 猎人印记：为目标施加标记，使其防御降低 33%，闪避率降低 25%，持续至战斗结束
		print(" ———— ※艾萨琳冷心※ 技能【 猎人标记 】使用条件检测 ————")
		if not battle.HunterMark then
			sw.UseSkill(502000, monster, enemy)
			battle.HunterMark = true
			bSkillCast = true
			print(" ———— ※艾萨琳冷心※  使用了技能【 猎人标记 】————")
		else
			print(" 【 猎人标记 】已存在")
		end

		-- 每次攻击，15%几率使用箭雨[502002]，35%几率使用急速射击[502001]
		if not bSkillCast then
			if vRate <= 15 then
				sw.UseSkill(502002, monster, enemy)
				bSkillCast = true
				print(" ———— ※艾萨琳冷心※  使用了技能【 箭雨 】————")
			elseif vRate <= 50 then
				sw.UseSkill(502001, monster, enemy)
				bSkillCast = true
				print(" ———— ※艾萨琳冷心※  使用了技能【 急速射击 】————")
			end
		end
		if not bSkillCast then
			print("	本次未使用任何技能")
		end
		return bSkillCast
	end,
},

-- 尤蒙冈多，虚空之喉
[502001] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		-- 自身血量低于80%，开启
		-- 熔岩之血：受到攻击时，深渊蠕虫的岩浆之血会四散飞溅，对攻击者造成攻击力 8% 的火焰伤害
		if vHPScale < 0.8 and not battle.LavaBlood then
			sw.UseSkill(502014, monster, enemy)
			battle.LavaBlood = true
		end

		-- 自身血量低于50%，开启
		-- 枯萎之触：造成暴击后使目标中毒，每 1 秒造成攻击力 17% 的毒素伤害，持续 6 秒
		if vHPScale < 0.5 and battle._critical then
			sw.UseSkill(502013, monster, enemy)
		end

        if vHPScale <= 0.15 then
            sw.UseSkill(502012, monster, enemy)
            bSkillCast = true
		elseif vHPScale <= 0.4 then
            -- 血量首次低于30%时，必定触发熔岩喷吐[502012]
            if (not battle._first_fire) then
                battle._first_fire = true
                sw.UseSkill(502012, monster, enemy)
                bSkillCast = true
			-- 血量低于30%， 15%几率使用熔岩喷吐[502012]，25%几率使用腐蚀吐息[502011]，20%几率使用灼热撕咬[502010]
			elseif vRate <= 15 then
				sw.UseSkill(502012, monster, enemy)
				bSkillCast = true
			elseif vRate <= 40 then
				sw.UseSkill(502010, monster, enemy)
				bSkillCast = true
            elseif vRate <= 60 then
                sw.UseSkill(502011, monster, enemy)
                bSkillCast = true
			end
		elseif vHPScale <= 0.9 then
			-- 血量低于60%， 20%几率使用灼热撕咬[502010]，40%几率使用腐蚀吐息[502011]
			if vRate <= 25 then
				sw.UseSkill(502010, monster, enemy)
				bSkillCast = true
			elseif vRate <= 70 then
				sw.UseSkill(502011, monster, enemy)
				bSkillCast = true
			end
		else
			-- 30%几率使用腐蚀吐息[502011]
			if vRate <= 40 then
				sw.UseSkill(502011, monster, enemy)
				bSkillCast = true
			end
		end
		return bSkillCast
	end,
},

-- 梦祈福
[503000] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		if vHPScale <= 0.5 then
			-- 血量低于30%， 15%几率使用圣光屏障[503002]，25%几率使用神圣震击[503000]，40%几率使用圣光轮盘[503001]
			if not battle._first_fire then
                battle._first_fire = true
				sw.UseSkill(503002, monster, enemy)
				bSkillCast = true
			elseif vRate <= 30 then
				sw.UseSkill(503000, monster, enemy)
				bSkillCast = true
			elseif vRate <= 95 then
				sw.UseSkill(503001, monster, enemy)
				bSkillCast = true
			end
		elseif vHPScale <= 0.8 then
			-- 血量低于60%， 15%几率使用神圣震击[503000]，45%几率使用圣光轮盘[503001]
			if vRate <= 60 then
				sw.UseSkill(503000, monster, enemy)
				bSkillCast = true
			elseif vRate <= 80 then
				sw.UseSkill(503001, monster, enemy)
				bSkillCast = true
			end
		else
			-- 50%几率使用神圣震击[503000]
			if vRate <= 50 then
				sw.UseSkill(503000, monster, enemy)
				bSkillCast = true
			end
		end
		return bSkillCast
	end,
},

-- 布洛托雷酒
[503001] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		print("进入技能使用检测")
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.rand(1, 100)
		local bSkillCast = false
		print("	初始参数准备完成")

		-- 开战80秒激活
		-- 天神下凡：施法者变成石像形态，攻击和防御提高 50%，所有抗性提高 25% 并获得新技能。战斗时间超过 60 秒后激活
		if battle._time > 80 and not battle.Avatar then
			print(" ———— ※布洛托雷酒※ 开战 60 秒后使用了技能【 天神下凡 】————")
			sw.UseSkill(503016, monster, enemy)
			battle.Avatar = true
		end

		-- 重击：攻击时有 25% 几率对敌人造成攻击力 40% 的额外物理伤害并使其昏迷 1 秒
		-- 天神下凡状态下有效
		if battle._hit and sw.rand(1, 100) <= 25 and battle.Avatar then
			print(" ———— ※布洛托雷酒※ 在攻击中造成了效果【 重击 】————")
			sw.UseSkill(503014, monster, enemy)
		end

		-- 狂乱：风暴打击[503010]命中后将获得一层狂乱效果，攻击速度提高 10%，暴击率提高 3%，持续 10 秒
		if battle.StormHit then
			print(" ———— ※布洛托雷酒※ 获得了效果【 狂乱 】————")
			sw.UseSkill(503015, monster, enemy)
			battle.StormHit = false
		end

		if not battle.Avatar then
		-- 普通状态下技能使用
			-- 15%几率使用风暴打击[503010]，35%几率使用天降正义[503012]
			if vRate <= 15 then
				print(" ———— ※布洛托雷酒※ 使用了技能【 风暴打击 】————")
				sw.UseSkill(503010, monster, enemy)
				battle.StormHit = true
				bSkillCast = true
			elseif vRate <= 50 then
				print(" ———— ※布洛托雷酒※ 使用了技能【 天降正义 】————")
				sw.UseSkill(503012, monster, enemy)
				battle.StormHit = true
				bSkillCast = true
			end
		else
		-- 天神下凡状态下技能使用
			-- 20%几率使用雷霆之怒[503013]，40%几率使用雷霆冲撞[503011]
			if vRate <= 20 then
				print(" ———— ※布洛托雷酒※ 使用了技能【 风暴打击 】————")
				sw.UseSkill(503013, monster, enemy)
				bSkillCast = true
			elseif vRate <= 60 then
				print(" ———— ※布洛托雷酒※ 使用了技能【 天降正义 】————")
				sw.UseSkill(503011, monster, enemy)
				bSkillCast = true
			end
		end
		if not bSkillCast then
			print("	本次未使用任何技能")
		end
		return bSkillCast
	end,
},

-- 菲欧娜
[504000] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		if vHPScale <= 0.6 then
			-- 血量低于60%， 20%几率使用冰霜冲击[504001]，50%几率使用燃烧宝珠[504002]
			if vRate <= 20 then
				sw.UseSkill(504001, monster, enemy)
				bSkillCast = true
			elseif vRate <= 70 then
				sw.UseSkill(504002, monster, enemy)
				bSkillCast = true
			end
		else
			-- 30%几率使用冰霜冲击[504001]
			if vRate <= 30 then
				sw.UseSkill(504001, monster, enemy)
				bSkillCast = true
			end
		end
		return bSkillCast
	end,
},

-- 砰砰博士
[504001] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		print("进入技能使用检测")
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false
		print("	初始参数准备完成")

		if vHPScale <= 0.25 then
			-- 血量低于25%， 20%几率使用致命连射[504011]，30%几率使用震荡炮击[504012]，30%几率使用I-19等离子冲击炮[504013]
			if vRate <= 50 or not battle._first_fire then
                sw.UseSkill(504013, monster, enemy)
                battle._first_fire = true
                bSkillCast = true
			elseif vRate <= 70 then
                sw.UseSkill(504011, monster, enemy)
                bSkillCast = true
			elseif vRate <= 90 then
                sw.UseSkill(504012, monster, enemy)
                bSkillCast = true
			end
		elseif vHPScale <= 0.5 then
			-- 血量低于50%， 20%几率使用高能切割[504010]，20%几率使用致命连射[504011]，30%几率使用震荡炮击[504012]
			if vRate <= 20 then
				print(" ———— ※砰砰博士※ HP 低于 50%，使用了技能【 高能切割 】————")
				sw.UseSkill(504010, monster, enemy)
				bSkillCast = true
			elseif vRate <= 40 then
				print(" ———— ※砰砰博士※ HP 低于 50%，使用了技能【 致命连射 】————")
				sw.UseSkill(504011, monster, enemy)
				bSkillCast = true
			elseif vRate <= 70 then
				print(" ———— ※砰砰博士※ HP 低于 50%，使用了技能【 震荡炮击 】————")
				sw.UseSkill(504012, monster, enemy)
				bSkillCast = true
			end
		elseif vHPScale <= 0.75 then
			-- 血量低于75%， 20%几率使用高能切割[504010]，30%几率使用致命连射[504011]
			if vRate <= 20 then
				print(" ———— ※砰砰博士※ HP 低于 75%，使用了技能【 高能切割 】————")
				sw.UseSkill(504010, monster, enemy)
				bSkillCast = true
			elseif vRate <= 50 then
				print(" ———— ※砰砰博士※ HP 低于 75%，使用了技能【 致命连射 】————")
				sw.UseSkill(504011, monster, enemy)
				bSkillCast = true
			end
		else
			-- 20%几率使用高能切割[504010]
			if vRate <= 20 then
				print(" ———— ※砰砰博士※  使用了技能【 高能切割 】————")
				sw.UseSkill(504010, monster, enemy)
				bSkillCast = true
			end
		end
		if not bSkillCast then
			print("	本次未使用任何技能")
		end
		return bSkillCast
	end,
},

-- 马尔科月痕
[505000] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		print("进入技能使用检测")
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false
		print("	初始参数准备完成")

		if vHPScale <= 0.6 then
			-- 血量低于60%，30%几率使用YOU SHALL NOT PASS[505001]，40%几率使用水晶坠落[505000]
			if vRate <= 50 then
				print(" ———— ※马尔科月痕※ HP 低于 60%， 使用了技能【 YOU SHALL NOT PASS 】————")
				sw.UseSkill(505001, monster, enemy)
				bSkillCast = true
			elseif vRate <= 70 then
				print(" ———— ※马尔科月痕※ HP 低于 60%， 使用了技能【 水晶坠落 】————")
				sw.UseSkill(505000, monster, enemy)
				bSkillCast = true
			end
		else
			-- 30%几率使用水晶坠落[505000]
			if vRate <= 30 then
				print(" ———— ※马尔科月痕※  使用了技能【 水晶坠落 】————")
				sw.UseSkill(505000, monster, enemy)
				bSkillCast = true
			end
		end
		if not bSkillCast then
			print("	本次未使用任何技能")
		end
		return bSkillCast
	end,
},

-- 艾莎
[505001] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		print("进入技能使用检测")
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false
		print("	初始参数准备完成")

		-- 开战激活
		-- 彻骨之寒：艾莎的敌人被极寒影响，每 3 秒受到 150 点冰霜伤害
		if battle._time > 0 and battle._time % 3 == 0 then
			print(" ———— ※艾莎※ 【 彻骨之寒 】生效，玩家受到 150 冰霜伤害 ————")
			sw.UseSkill(505014, monster, enemy)
		end

		-- 开战激活
		-- 霜寒刺骨：艾莎的所有攻击都会造成霜寒刺骨效果，使敌人的攻击速度降低 25%，冰抗降低 25%，持续 3 秒
		if battle._hit then
			print(" ———— ※艾莎※ 攻击命中之后造成【 霜寒刺骨 】效果 ————")
			sw.UseSkill(505016, monster, enemy)
		end

		if vHPScale <= 0.4 then
			-- 血量低于40%， 10%几率使用螺旋冰晶[505011]，20%几率使用冰锥[505012]，30%几率使用雪花盘旋[505010]，30%几率使用冰川尖刺[505013]
			if vRate <= 10 then
				print(" ———— ※艾莎※ HP 低于 40%，使用了技能【 螺旋冰晶 】————")
				sw.UseSkill(505011, monster, enemy)
				bSkillCast = true
			elseif vRate <= 30 then
				print(" ———— ※艾莎※ HP 低于 40%，使用了技能【 冰锥 】————")
				sw.UseSkill(505012, monster, enemy)
				bSkillCast = true
			elseif vRate <= 60 then
				print(" ———— ※艾莎※ HP 低于 40%，使用了技能【 雪花盘旋 】————")
				sw.UseSkill(505010, monster, enemy)
				bSkillCast = true
			elseif vRate <= 90 then
				print(" ———— ※艾莎※ HP 低于 40%，使用了技能【 冰川尖刺 】————")
				sw.UseSkill(505013, monster, enemy)
				bSkillCast = true
			end
		elseif vHPScale <= 0.7 then
			-- 血量低于70%， 10%几率使用螺旋冰晶[505011]，20%几率使用冰锥[505012]，30%几率使用雪花盘旋[505010]
			if vRate <= 10 then
				print(" ———— ※艾莎※  使用了技能【 螺旋冰晶 】————")
				sw.UseSkill(505011, monster, enemy)
				bSkillCast = true
			elseif vRate <= 30 then
				print(" ———— ※艾莎※  使用了技能【 冰锥 】————")
				sw.UseSkill(505012, monster, enemy)
				bSkillCast = true
			elseif vRate <= 60 then
				print(" ———— ※艾莎※  使用了技能【 雪花盘旋 】————")
				sw.UseSkill(505010, monster, enemy)
				bSkillCast = true
			end
		else
			-- 15%几率使用冰锥[505012]，25几率使用雪花盘旋[505010]
			if vRate <= 15 then
				print(" ———— ※艾莎※  使用了技能【 冰锥 】————")
				sw.UseSkill(505012, monster, enemy)
				bSkillCast = true
			elseif vRate <= 40 then
				print(" ———— ※艾莎※  使用了技能【 雪花盘旋 】————")
				sw.UseSkill(505010, monster, enemy)
				bSkillCast = true
			end
		end
		if not bSkillCast then
			print("	本次未使用任何技能")
		end
		return bSkillCast
	end,

	-- 怪物受到伤害时被触发
	-- monster: 怪物
	-- enemy: 敌人（玩家)
	-- battle: _critical - 是否暴击
	-- 无返回值
	beDamage = function(monster, enemy, battle)
		-- 开战激活
		-- 碎冰甲：艾莎受到暴击时，将获得碎冰甲的保护，碎冰甲能吸收艾莎生命上限 10% 的伤害
		if battle._critical then
			print(" ———— ※艾莎※ 受到暴击，【 碎冰甲 】生效 ————")
			sw.UseSkill(505015, monster, enemy)
		end
	end,
},

-- 雷刃·克里斯吴
[511001] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		-- 血量高于50%时，40%几率使用[511001]
		if vHPScale > 0.5 then
			if vRate <= 40 then
				sw.UseSkill(511001, monster, enemy);
				bSkillCast = true
			end
		-- 血量低于50%，50%几率使用[511002]，20%几率使用[511001]
		else
			if vRate <= 50 then
				sw.UseSkill(511002, monster, enemy)
				bSkillCast = true
			elseif vRate <= 70 then
				sw.UseSkill(511001, monster, enemy)
				bSkillCast = true
			end
		end
		
		return bSkillCast
	end,
},

-- 巫女·日向狸
[511003] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		if (not battle._sk2_count) then
			battle._sk2_count = 4;
		else
			battle._sk2_count = battle._sk2_count - 1;
		end

		-- 血量高于50%时，几率使用[511003]
		if vHPScale > 0.5 then
			if vRate <= 70 then
				sw.UseSkill(511003, monster, enemy);
				bSkillCast = true
			end
		-- 血量低于40%，50%几率使用[511004]，20%几率使用[511003]。其中[511004]会挂护盾，不能连续使用
		else
			if vRate <= 50 and battle._sk2_count <= 0 then
				sw.UseSkill(511004, monster, enemy)
				battle._sk2_count = 4;
				bSkillCast = true
			elseif vRate > 80 then
				sw.UseSkill(511003, monster, enemy)
				bSkillCast = true
			end
		end
		
		return bSkillCast
	end,
},


-- 虚空九头蛇•再构
[511004] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		-- 血量高于75%
		if vHPScale > 0.75 then
			if vRate <= 70 then
				sw.UseSkill(511005, monster, enemy);
				bSkillCast = true
			end
		-- 血量50% ~ 75%
		elseif vHPScale > 0.5 then
			if vRate <= 40 then
				sw.UseSkill(511005, monster, enemy)
				bSkillCast = true
			elseif vRate <= 80 then
				sw.UseSkill(511006, monster, enemy)
				bSkillCast = true
			end
		-- 血量25% ~ 50%
		elseif vHPScale > 0.25 then
			if vRate <= 60 then
				sw.UseSkill(511006, monster, enemy)
				bSkillCast = true
			elseif vRate <= 90 then
				sw.UseSkill(511007, monster, enemy)
				bSkillCast = true
			end
		-- 血量低于25%
		else
			if vRate <= 30 then
				sw.UseSkill(511006, monster, enemy)
				bSkillCast = true
			else
				sw.UseSkill(511007, monster, enemy)
				bSkillCast = true
			end
		end
		
		return bSkillCast
	end,
},

-- 犬兽卫兵
[511005] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		-- 斗气
		if vHPScale <= 0.7 and not battle._caster_status then
			battle._caster_status = 1;
			sw.UseSkill(511010, monster, enemy);
			return true;
		elseif vHPScale <= 0.35 and battle._caster_status == 1 then
			battle._caster_status = 2;
			sw.UseSkill(511011, monster, enemy);
			return true;
		end

		if vHPScale > 0.7 then
			if vRate <= 30 then
				sw.UseSkill(511008, monster, enemy);
				bSkillCast = true
			end
		elseif vHPScale > 0.35 then
			if vRate <= 50 then
				sw.UseSkill(511008, monster, enemy);
				bSkillCast = true
			end
		else
			if vRate <= 50 then
				sw.UseSkill(511009, monster, enemy);
				bSkillCast = true
			end
		end
		
		return bSkillCast
	end,
},

-- 雄性冰精灵
[511009] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		if vHPScale > 0.8 then
			if vRate <= 50 then
				sw.UseSkill(511012, monster, enemy);
				bSkillCast = true
			end
		elseif vHPScale > 0.5 then
			if vRate <= 35 then
				sw.UseSkill(511012, monster, enemy);
				bSkillCast = true
			elseif vRate <= 70 then
				sw.UseSkill(511013, monster, enemy);
				bSkillCast = true
			end
		else
			if vRate <= 30 then
				sw.UseSkill(511013, monster, enemy);
				bSkillCast = true
			elseif vRate <= 80 then
				sw.UseSkill(511014, monster, enemy);
				bSkillCast = true
			end
		end
		
		return bSkillCast
	end,
},

-- 死灵艾莎
[511010] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false

		-- 霜寒刺骨：艾莎的所有攻击都会造成霜寒刺骨效果，使敌人的攻击速度降低 25%，冰抗降低 25%，持续 3 秒
		if battle._hit then
			sw.UseSkill(511019, monster, enemy)
		end

		if vHPScale <= 0.4 then
			-- 血量低于40%， 10%几率使用螺旋冰晶[505011]，20%几率使用冰锥[505012]，30%几率使用雪花盘旋[505010]，30%几率使用冰川尖刺[505013]
			if vRate <= 10 then
				print(" ———— ※艾莎※ HP 低于 40%，使用了技能【 螺旋冰晶 】————")
				sw.UseSkill(511016, monster, enemy)
				bSkillCast = true
			elseif vRate <= 30 then
				print(" ———— ※艾莎※ HP 低于 40%，使用了技能【 冰锥 】————")
				sw.UseSkill(511017, monster, enemy)
				bSkillCast = true
			elseif vRate <= 60 then
				print(" ———— ※艾莎※ HP 低于 40%，使用了技能【 雪花盘旋 】————")
				sw.UseSkill(511015, monster, enemy)
				bSkillCast = true
			elseif vRate <= 90 then
				print(" ———— ※艾莎※ HP 低于 40%，使用了技能【 冰川尖刺 】————")
				sw.UseSkill(511018, monster, enemy)
				bSkillCast = true
			end
		elseif vHPScale <= 0.7 then
			-- 血量低于70%， 10%几率使用螺旋冰晶[505011]，20%几率使用冰锥[505012]，30%几率使用雪花盘旋[505010]
			if vRate <= 10 then
				print(" ———— ※艾莎※  使用了技能【 螺旋冰晶 】————")
				sw.UseSkill(511016, monster, enemy)
				bSkillCast = true
			elseif vRate <= 30 then
				print(" ———— ※艾莎※  使用了技能【 冰锥 】————")
				sw.UseSkill(511017, monster, enemy)
				bSkillCast = true
			elseif vRate <= 60 then
				print(" ———— ※艾莎※  使用了技能【 雪花盘旋 】————")
				sw.UseSkill(511015, monster, enemy)
				bSkillCast = true
			end
		else
			-- 15%几率使用螺旋冰晶[505012]，25几率使用雪花盘旋[505010]
			if vRate <= 15 then
				print(" ———— ※艾莎※  使用了技能【 螺旋冰晶 】————")
				sw.UseSkill(511016, monster, enemy)
				bSkillCast = true
			elseif vRate <= 40 then
				print(" ———— ※艾莎※  使用了技能【 雪花盘旋 】————")
				sw.UseSkill(511015, monster, enemy)
				bSkillCast = true
			end
		end
		return bSkillCast
	end,

	-- 怪物受到伤害时被触发
	-- monster: 怪物
	-- enemy: 敌人（玩家)
	-- battle: _critical - 是否暴击
	-- 无返回值
	beDamage = function(monster, enemy, battle)
		-- 开战激活
		-- 碎冰甲：艾莎受到暴击时，将获得碎冰甲的保护，碎冰甲能吸收艾莎生命上限 10% 的伤害
		if battle._critical then
			print(" ———— ※艾莎※ 受到暴击，【 碎冰甲 】生效 ————")
			sw.UseSkill(505015, monster, enemy)
		end
	end,
},


-- 恶魔：昏迷
[116000] =
{
	-- 命中目标
	-- monster: 怪物
	-- enemy: 敌人（玩家)
	-- battle: _critical - 是否暴击
	-- 无返回值
	onHit = function(monster, enemy, battle)
		local vRate = sw.randi(1, 100)
		local line = monster.quality * 10;
		if vRate <= line or not battle._first_fire then
			sw.UseSkill(200037, monster, enemy)
			battle._first_fire = true;
		end
	end,
},

-- 天使长：护盾
[117000] =
{
	-- 每当怪物执行完一次动作时，触发一次AI检测
	-- return: 返回true表示有技能动作，false表示继续普通攻击。如果有技能释放，但没有动作，也返回false
	action = function(monster, enemy, battle)
		local vHPScale = monster.cur_hp / monster.max_hp;
		if not battle._first_fire and vHPScale <= 0.7 then
			sw.UseSkill(200034, monster, enemy)
			battle._first_fire = true;
		end
		return false;
	end,
},

-- 儿童节捣蛋鬼：昏迷
[119000] =
{
	-- 命中目标
	-- monster: 怪物
	-- enemy: 敌人（玩家)
	-- battle: _critical - 是否暴击
	-- 无返回值
	onHit = function(monster, enemy, battle)
		local vRate = sw.randi(1, 100)
		local line = 30;
		if vRate <= line then
			sw.UseSkill(200037, monster, enemy)
		end
	end,
},

-- 蛮爪保卫者：昏迷
[120001] =
{
    -- 命中目标
    -- monster: 怪物
    -- enemy: 敌人（玩家)
    -- battle: _critical - 是否暴击
    -- 无返回值
    onHit = function(monster, enemy, battle)
        sw.UseSkill(210033, monster, enemy)
    end,
},


-- 枫叶林boss
[120011] =
{
	action = function(monster, enemy, battle)
		print("进入技能使用检测")
		local vCurHP = monster.cur_hp
		local vMaxHP = monster.max_hp
		local vHPScale = vCurHP / vMaxHP
		local vRate = sw.randi(1, 100)
		local bSkillCast = false
		print("	初始参数准备完成")
		if vRate < 20 then
			sw.UseSkill(511020, monster, enemy)
		elseif vRate < 60 then
			sw.UseSkill(511021, monster, enemy)
		end
		return bSkillCast
	end,
},

}
g_monster_ai[116003] = g_monster_ai[116000];

