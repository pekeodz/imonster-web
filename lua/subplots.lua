--[[***************************************************************************************
* Copyright (c) 2014, Pixss.Com.Ltd. All rights reserved.
*****************************************************************************************--]]

-----------------------------------------------------------------------------------------
-- 剧本ID规范：
    -- 6位数字
    -- 首位：1 = 支线任务；2 = 日常任务；9 = 测试
    -- 次位：0（保留位）
    -- 3/4位：两位任务顺序编号
    -- 5/6位：单个任务内步骤编号
-----------------------------------------------------------------------------------------

-- 支线任务：100101 - 笼子里的精……地精
    -- 第1步：判断是否刷新NPC
g_stories[100101] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    -- 进入地图判断是否为 2-4
    condition = function(self, data)
        local nRefrashRate = 100        -- 刷新几率 100%
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 14 and sw.randi(1, 100) <= nRefrashRate and not sw.IsStoryFinished(100103)
    end,

    body = function(self, data)
        if sw.IsStoryFinished(100102) then
            -- 刷新NPC：胆小的呼叽呼叽（正常版）
            sw.AddMapObject(tSceneObj.NPC, "NPC_10010002", 1)
        else
            -- 刷新NPC：胆小的呼叽呼叽（镣铐版）
            sw.AddMapObject(tSceneObj.NPC, "NPC_10010001", 1)
            DialogRight(g_char.npc1001, "subplots_10010101")     -- （R）胆小的呼叽呼叽：谁来救救我？谁来救救我啊？
        end
    end
}

    -- 第2步：与NPC交互以获取任务
g_stories[100102] =
{
    moment      = "touch object",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    condition = function(self, data)
        -- 通过npc类型和唯一名称，可以确定npc
        return data.obj == tSceneObj.NPC and data.name == "NPC_10010001"
    end,

    body = function(self, data)
        DialogRight(g_char.npc1001, "subplots_10010201")     -- （R）胆小的呼叽呼叽：求你了，别杀我，别杀我！
        DialogRight(g_char.npc1001, "subplots_10010202")     -- （R）胆小的呼叽呼叽：我只是个普通人，我对你没有威胁，留我一条小命对你有好处！
        local vSelect = DialogRight(g_char.npc1001, "subplots_10010203", "subplots_100102_option1", "subplots_100102_option2")     -- （R）胆小的呼叽呼叽：我有钱，我有钱！只要你能放我出来，我可以给你钱！很多很多钱！
        if vSelect == 1 then
            -- 地精NPC刷新为正常形象
            local tPosition = sw.FindMapObject("NPC_10010001")
            sw.BreakMapObject("NPC_10010001", true)
            sw.AddMapObject(tSceneObj.NPC, "NPC_10010002", 1, tPosition.col, tPosition.row)
            Wait(1)
            DialogRight(g_char.npc1001, "subplots_10010204")     -- （R）胆小的呼叽呼叽：太感谢你了，英雄。不不不，长成什么样不重要，您救了我，您就是英雄，是大英雄！
            DialogRight(g_char.npc1001, "subplots_10010205")     -- （R）胆小的呼叽呼叽：这是您应得的，收下吧，请收下吧！
            sw.AddGold(500)                                      -- 获得金币 × 500
            DialogRight(g_char.npc1001, "subplots_10010206")     -- （R）胆小的呼叽呼叽：英雄，请您再帮我一个忙。我正在执行一项特殊的任务，不能让任何人——我是说冒险者再抓住我了。
            DialogRight(g_char.npc1001, "subplots_10010207")     -- （R）胆小的呼叽呼叽：所以我希望您能帮我除掉这一层的所有冒险者。您放心，不会让您白辛苦的！
            DialogRight(g_char.npc1001, "subplots_10010208")     -- （R）胆小的呼叽呼叽：为了安全起见，我会一直留在这里。当您解决掉这一层的所有冒险者之后，再过来通知我一声好吗？
            -- 设置支线任务（任务面板的图标？）
            sw.SetStoryTask(tTaskType.SIDE, nil, "subplots_1001_Title", "subplots_1001_Desc", "subplots_1001_Goal", "subplots_1001_Reward")
            -- 本任务设置为完成状态
            sw.SetStoryFinished(100102, true)
        end
    end
}

    -- 第3步：与NPC交互以检查任务完成状态
g_stories[100103] =
{
    moment      = "touch object",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    condition = function(self, data)
        -- 通过npc类型和唯一名称，可以确定npc
        return data.obj == tSceneObj.NPC and data.name == "NPC_10010002"
    end,

    body = function(self, data)
        local vTotal, vNormal, vElite, vBoss = sw.GetMonsterCount()
        if vTotal > 12 then
            DialogRight(g_char.npc1001, "subplots_10010301")     -- （R）胆小的呼叽呼叽：这些冒险者很讨厌是吧……我也这么觉得……不，我和他们不是一路人。
        elseif vTotal > 5 then
            DialogRight(g_char.npc1001, "subplots_10010302")     -- （R）胆小的呼叽呼叽：英雄，那些家伙都解决完了吗？
        elseif vTotal > 0 then
            DialogRight(g_char.npc1001, "subplots_10010303")     -- （R）胆小的呼叽呼叽：不不不，您别骗我，我仍然能感觉到危险！
        else
            DialogRight(g_char.npc1001, "subplots_10010304")     -- （R）胆小的呼叽呼叽：安全了？这真是一个好消息！
            DialogRight(g_char.npc1001, "subplots_10010305")     -- （R）胆小的呼叽呼叽：感谢您的帮助！这些金币请收下吧，我会记得您的这份恩情的。
            sw.AddGold(6000)                                     -- 获得金币 × 6000
            DialogRight(g_char.npc1001, "subplots_10010306")     -- （R）胆小的呼叽呼叽：那么我就先闪了，再次感谢你，我的英雄。
            sw.BreakMapObject("NPC_10010002", true)
            -- 本任务设置为完成状态
            sw.SetStoryFinished(100101, true)
            sw.SetStoryFinished(100102, true)
            sw.SetStoryFinished(100103, true)
        end
    end
}

-- 支线任务：100201 - 有丝绸吗？
    -- 第1步：判断是否刷新NPC（80%几率刷新）
g_stories[100201] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    condition = function(self, data)
        local vRefrashRate, nRefrashRate = 0, 80     -- 初始NPC刷新几率 80%
        local bRefresh = false
        local tMapInfo = sw.GetCurMap()
        if tMapInfo.id == 33 and not sw.IsStoryFinished(100204) then
            -- 进入4-3地图，并且未检测到任务完成标识，才进行NPC刷新检测
            if not sw.IsStoryFinished(100202) then
                -- 如果玩家没有接任务，则刷新NPC几率为设定值
                vRefrashRate = nRefrashRate
            else
                -- 如果玩家已经接到任务，则刷新NPC几率为100%
                vRefrashRate = 100
            end
            if sw.randi(1, 100) <= vRefrashRate then
                bRefresh = true
            end
        end
        return bRefresh
    end,

    body = function(self, data)
        if sw.IsStoryFinished(100203) then
            -- 如果第3步已经完成，添加怪物：大肉脚葛尔巴（暂时用 矮人男战士的ID），蓝色品质，当前地图等级+1，位置随机
            sw.AddMonster(106002, 2, 1)
        else
            -- 添加一个NPC：脏兮兮的厕所，位置随机
            sw.AddMapObject(tSceneObj.NPC, "DirtyToilet", 1)
        end
    end
}

    -- 第2步：与NPC交互以获取任务
g_stories[100202] =
{
    moment      = "touch object",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = false,    -- 不可重复触发

    condition = function(self, data)
        -- 通过npc类型和唯一名称，可以确定npc
        return data.obj == tSceneObj.NPC and data.name == "DirtyToilet"
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "subplots_10020201")         -- （L）主角精灵：嗯？这是什么？看上去脏兮兮的，还散发着臭味……
        DialogRight(g_char.npc1002, "subplots_10020202")     -- （R）被锁起来的矮人：嘿！嘿！嘿！外面是谁在？能帮我一个小忙吗？必有重谢！
        DialogLeft(g_char.npc2, "subplots_10020203")         -- （L）主角精灵：哇！里面有人说话！喂！你在里面干嘛？
        DialogRight(g_char.npc1002, "subplots_10020204")     -- （R）被锁起来的矮人：别问这么多了，能不能麻烦你弄几块丝绸来做……做……呃，反正是丝绸就行了！你可以在附近的那些冒险者身上找到。
        DialogRight(g_char.npc1002, "subplots_10020205")     -- （R）被锁起来的矮人：放心，我不会让你白辛苦的！我这里有一件很不错的装备，只要你能给我一些丝绸，我就把它送给你！

        -- 设置支线任务（任务面板的图标？）
        sw.SetStoryTask(tTaskType.SIDE, nil, "subplots_1002_Title", "subplots_1002_Desc", "subplots_1002_Goal", "subplots_1002_Reward")
    end
}

    -- 第3步：判断任务是否完成
g_stories[100203] =
{
    moment      = "touch object",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    -- 已经获取到任务，但是尚未完成，才执行本段脚本
    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return data.obj == tSceneObj.NPC and data.name == "DirtyToilet" and not sw.IsStoryFinished(100203) and sw.IsStoryFinished(100202)
    end,

    body = function(self, data)
        local nTaskItemID = 600063      -- 暂无此项道具，临时用道具表中裹尸布的ID
        local nTaskItemNum = 10         -- 需求物品数量：10
        local vItemCount = 0
        local bSearch = false
        -- 遍历背包，找到任务物品：丝绸，获取数量
        for loop1 = 1, 6 do
            local tItems = sw.GetItemsWithPage(loop1)
            if #tItems > 0 then
                for loop2 = 1, #tItems do
                    if tItems[loop2].id == nTaskItemID then
                        vItemCount = tItems[loop2].count
                        bSearch = true
                        break
                    end
                end
            end
            if bSearch then
                break
            end
        end
        if vItemCount < 10 then
            DialogRight(g_char.npc1002, "subplots_10020301")        -- （R）被锁起来的矮人：你找到丝绸了吗？我腿好麻……
        else
            if sw.IsPackageFull() then
                DialogRight(g_char.npc1002, "subplots_10020302")        -- （R）被锁起来的矮人：我要准备出来了哦，你也先去清理一下背包吧！
            else
                -- 回收任务道具：丝绸 × 10
                sw.RemoveItemFromPackage(nTaskItemID, nTaskItemNum)
                -- 清除NPC：脏兮兮的厕所
                sw.BreakMapObject("DirtyToilet", true)
                -- 添加怪物：大肉脚葛尔巴（暂时用 矮人男战士的ID），蓝色品质，当前地图等级+1
                sw.AddMonster(106002, 2, 1, data.col, data.row)
                -- 暂停 1 秒
                Wait(1)

                DialogRight(g_char.npc1003, "subplots_10020303")        -- （R）大肉脚葛尔巴：我葛尔巴真是太特么的机智了！给自己点个赞！
                DialogRight(g_char.npc1003, "subplots_10020304")        -- （R）大肉脚葛尔巴：这位小哥，感谢你的丝绸。好了，上前来，感受一下我为你准备的武器吧！

                -- 关闭本任务
                sw.SetStoryFinished(100203, true)
            end
        end
    end
}

    -- 第4步：击杀怪物：大肉脚葛尔巴，给玩家发放奖励
g_stories[100204] =
{
    moment      = "battle end",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = false,    -- 不可重复触发

    -- 已经获取到任务，但是尚未完成，才执行本段脚本
    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(100203) and data.result == tBattleResult.WIN and data.mon_id == 501001
    end,

    body = function(self, data)
        local tReward = { 102003, 112003, 122003 }      -- 15级紫色武器
        sw.AddItemToPackage(tReward[sw.randi(1, #tReward)], nil, 1)             -- 获得 随机15级紫色武器 × 1

        -- 关闭本支线任务线
        sw.SetStoryFinished(100201, true)
        sw.SetStoryFinished(100202, true)
        sw.SetStoryFinished(100203, true)
        sw.SetStoryFinished(100204, true)
    end
}

-- 怪物刷新范例-1：ID=401000，出现在12层
g_stories[999101] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    -- 判断是否进入地图12层
    condition = function(self, data)
        local nRefrashRate = 80     -- 刷新几率 80%
        return data.map_id == 12 and sw.randi(1, 100) <= nRefrashRate
    end,

    body = function(self, data)
        local vMonsterID = 401000
        -- 刷新怪物：ID=401000，金色品质，地图等级+2，位置随机
        sw.AddMonster(vMonsterID, 3, 2)
    end
}

-- 怪物刷新范例-2：第一步：ID为列表中随机抽取，在指定的若干层中某一层刷新，一旦刷新，则其他层不再刷新
g_stories[999201] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = { 400001, 400002, 400003 },

    -- 判断是否进入地图5/6/7/8层
    condition = function(self, data)
        local nRefrashRate = 75     -- 刷新几率 75%
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 5 or data.map_id == 6 or data.map_id == 7 or data.map_id == 8 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物：ID随机抽取，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        vMonsterID = sw.randi(1, #self.tMonsterID)
        sw.AddMonster(vMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

-- 怪物刷新范例-2：第二步：回城时清除刷新标识
g_stories[999202] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 401000,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}



-----------------------------------------------------------------------------------------
-- ACT1
-----------------------------------------------------------------------------------------
-- ACT1独特金怪：钢铁防御
g_stories[901000] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 100     -- 刷新几率
        return data.map_id == 7 and sw.randi(1, 100) <= nRefrashRate
    end,

    body = function(self, data)
        local vMonsterID = 401000
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        sw.AddMonster(vMonsterID, 3, 2)
    end
}


-- ACT1独特金怪：小老鼠飞奔龙
g_stories[901010] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = { 401010, },

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 8 or data.map_id == 9 or data.map_id == 10 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        vMonsterID = sw.randi(1, #self.tMonsterID)
        sw.AddMonster(vMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[901011] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 401010,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT1独特金怪：黑光
g_stories[901030] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 401030,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 11 or data.map_id == 12 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[901031] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 401030,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT1独特金怪：小时候没吃好
g_stories[901040] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 401040,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 13 or data.map_id == 14 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[901041] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 401040,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT1独特金怪：好名都让狗起了
g_stories[901050] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 401050,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 15 or data.map_id == 16 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[901051] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 401050,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT1独特金怪：傻啦吧唧猫猫
g_stories[901070] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 401070,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 17 or data.map_id == 18 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[901071] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 401070,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT1独特金怪：灭团启示录
g_stories[901080] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 25     -- 刷新几率
        return data.map_id == 19 and sw.randi(1, 100) <= nRefrashRate
    end,

    body = function(self, data)
        local vMonsterID = 401080
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        sw.AddMonster(vMonsterID, 3, 2)
    end
}


-- ACT1独特金怪：甲纯/从小长的矮
g_stories[901090] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = { 401090, 401100 },

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 20 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        vMonsterID = sw.randi(1, #tMonsterID)
        sw.AddMonster(vMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[901091] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = { 401090, 401100 },

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}



-----------------------------------------------------------------------------------------
-- ACT2
-----------------------------------------------------------------------------------------
-- ACT2独特金怪：恨天高
g_stories[902000] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402000,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 21 or data.map_id == 25 or data.map_id == 27 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[902001] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402000,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT2独特金怪：兜里有糖
g_stories[902010] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402010,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 22 or data.map_id == 28 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[902011] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402010,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT2独特金怪：急速雷达
g_stories[902020] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402020,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 23 or data.map_id == 26 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[902021] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 402020,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT2独特金怪：孙子冰法
g_stories[902030] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402030,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 66     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 24 or data.map_id == 32 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[902031] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 402030,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT2独特金怪：乙荃
g_stories[902060] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402060,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 29 or data.map_id == 30 or data.map_id == 31 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[902061] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 402060,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT2独特金怪：西刚王道
g_stories[902090] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402090,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 2     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 35 or data.map_id == 36 or data.map_id == 37 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[902091] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 402090,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT2独特金怪：送终鸡
g_stories[902100] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 402100,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 38 or data.map_id == 39 or data.map_id == 40 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[902101] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 402100,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}



-----------------------------------------------------------------------------------------
-- ACT3
-----------------------------------------------------------------------------------------
-- ACT3独特金怪：遇女薪惊
g_stories[903000] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403000,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 41 or data.map_id == 42 or data.map_id == 47 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903001] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403000,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT3独特金怪：糯米小兔
g_stories[903020] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403020,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 43 or data.map_id == 44 or data.map_id == 46 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903021] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403020,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT3独特金怪：詹姆士邦迪
g_stories[903040] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403040,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 66     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 45 or data.map_id == 48 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903041] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403040,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT3独特金怪：里耶乐类卢
g_stories[903050] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403050,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 49 or data.map_id == 54 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903051] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403050,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT3独特金怪：小手冰凉
g_stories[903060] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403060,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 50 or data.map_id == 52 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903061] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403060,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT3独特金怪：桃之夭夭
g_stories[903070] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403070,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 51 or data.map_id == 53 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903071] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403070,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT3独特金怪：符文爱斯
g_stories[903080] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403080,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 56 or data.map_id == 59 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903081] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403080,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT3独特金怪：压力大啊
g_stories[903090] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403090,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 55 or data.map_id == 58 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903091] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403090,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT3独特金怪：糯米小鼠
g_stories[903100] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 403100,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 57 or data.map_id == 60 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[903101] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 403100,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}



-----------------------------------------------------------------------------------------
-- ACT4
-----------------------------------------------------------------------------------------
-- ACT4独特金怪：应付职工薪酬等
g_stories[904010] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = { 404010, 404011, 404012, 404013, 404014, 404015 },

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 6     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 61 or data.map_id == 62 or data.map_id == 64 or data.map_id == 69 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        vMonsterID = sw.randi(1, #self.tMonsterID)
        sw.AddMonster(vMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[904011] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = { 404010, 404011, 404012, 404013, 404014, 404015 },

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT4独特金怪：詹姆士帮忙
g_stories[904030] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 404030,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 63 or data.map_id == 66 or data.map_id == 72 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[904031] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 404030,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT4独特金怪：丙彤
g_stories[904040] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 404040,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 66     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 70 or data.map_id == 75 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[904041] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 404040,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT4独特金怪：无形的幻化之刃
g_stories[904060] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 404060,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 5     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 67 or data.map_id == 74 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[904061] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 404060,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT4独特金怪：红鲤鱼与绿鲤鱼
g_stories[904080] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 404080,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 15     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 76 or data.map_id == 78 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[904081] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 404080,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT4独特金怪：纯色诱惑
g_stories[904090] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 404090,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 12     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 73 or data.map_id == 79 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[904091] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 404090,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT4独特金怪：索隆的徒弟
g_stories[904100] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 404100,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 77 or data.map_id == 80 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[904101] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 404100,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}



-----------------------------------------------------------------------------------------
-- ACT5
-----------------------------------------------------------------------------------------
-- ACT5独特金怪：丁菀
g_stories[905010] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 405010,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 81 or data.map_id == 82 or data.map_id == 83 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[905011] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 405010,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT5独特金怪：墓中无人
g_stories[905030] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 405030,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 84 or data.map_id == 85 or data.map_id == 86 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[905031] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 405030,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT5独特金怪：尸小珍
g_stories[905040] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 405040,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 66     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 95 or data.map_id == 96 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[905041] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 405040,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT5独特金怪：四条
g_stories[905060] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 405060,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 87 or data.map_id == 88 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[905061] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 405060,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT5独特金怪：洫精棂灬夿夿
g_stories[905070] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 405070,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 5     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 89 or data.map_id == 90 or data.map_id == 91 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[905071] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 405070,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT5独特金怪：士土土土土等
g_stories[905080] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = { 405080, 405081, 405082, 405083, 405084, 405085, 405086, 405087, 405088, 405089 },

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 10     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 92 or data.map_id == 94 or data.map_id == 98 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        vMonsterID = sw.randi(1, #tMonsterID)
        sw.AddMonster(vMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[905081] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = { 405080, 405081, 405082, 405083, 405084, 405085, 405086, 405087, 405088, 405089 },

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT5独特金怪：詹姆士帮倒忙
g_stories[905090] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 405090,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 5     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 93 or data.map_id == 99 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[905091] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 405090,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}


-- ACT5独特金怪：鬼脸嘟嘟
g_stories[905100] =
{
    moment      = "entered tower",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    tMonsterID = 405100,

    -- 判断是否进入指定地图
    condition = function(self, data)
        local nRefrashRate = 5     -- 刷新几率
        local vRefrashFlag = sw.GetStoryData("tMonsterRand")
        return ( data.map_id == 97 or data.map_id == 100 ) and sw.randi(1, 100) <= nRefrashRate and vRefrashFlag ~= "EXIST"
    end,

    body = function(self, data)
        -- 刷新怪物，金色品质，地图等级+2，位置随机
        local map = sw.GetCurMap()
        sw.AddMonster(self.tMonsterID, 3, map.lv + 2)
        -- 设置怪物刷新标识
        sw.SetStoryData("tMonsterRand", "EXIST")
    end
}

g_stories[905101] =
{
    moment      = "enter main",
    priority    = 50,       -- 优先级 50
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = true,     -- 可重复触发

    vMonsterID = 405100,

    condition = function(self, data)
        return true
    end,

    body = function(self, data)
        sw.SetStoryData("tMonsterRand", nil)
    end
}

