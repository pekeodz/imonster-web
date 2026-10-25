--[[***************************************************************************************
* Copyright (c) 2014, Pixss.Com.Ltd. All rights reserved.
*****************************************************************************************--]]

---------------------------------------------------------------------------------------------------
-- 在地图中随机遭遇的小事件，完成后可以获得奖励。编号从50000开始
-- 每个任务通常分三段：触发（产生NPC），接受（第一次点击NPC），交（之后点击NPC）
-- 1、消灭本层所有勇者可获得XX
-- 2、消灭指定XX勇者可获得xx
-- 3、从第X层NPC得到的道具需要送到第Y层的NPC手里获取奖励
---------------------------------------------------------------------------------------------------
-- 开始副本时重置状态
g_stories[50000] =
{
    moment      = "entered tower",
    priority    = 150,
    swallow     = false,
    repeatable  = true,

    condition = function(self, data)
        return data.last_id == 0;
    end,

    body = function(self, data)
        sw.SetStoryData("encounter_id", nil);
        sw.SetStoryData("encounter_map", nil);
        sw.SetStoryData("encounter_npc", nil);
        sw.SetStoryData("encounter_item", nil);
        sw.SetStoryData("encounter_rank", nil);
    end
}

---------------------------------------------------------------------------------------------------
-- 杀本层所有怪
g_stories[50100] =
{
    moment      = "entered tower",
    priority    = 10,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        -- 已有遭遇时不触发
        local val = sw.GetStoryData("encounter_id");
        if val ~= "" then
            return false;
        end

        -- 按概率触发
        if not sw.SuccessRandom(10) then
            return false;
        end
        
        -- 限制地图
        if data.map_id < 21 or data.map_id > 100 then
            return false;
        end

        return true;
    end,

    body = function(self, data)
        local obj = sw.AddMapObject(tSceneObj.NPC, "encounter_npc", 1);
        wrap.log("info", 15, "encounter npc 2: " .. obj.col .. ", " .. obj.row);
        sw.SetStoryFinished(50110, false);
        sw.SetStoryFinished(50120, false);
    end
}
-- 接受任务
g_stories[50110] =
{
    moment      = "touch object",
    priority    = 60,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.obj == tSceneObj.NPC and data.name == "encounter_npc" and data.param == 1;
    end,

    body = function(self, data)
        DialogRight(g_char.npc1001, "encounter_5011001");
    end
}
-- 交任务
g_stories[50120] =
{
    moment      = "touch object",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return data.obj == tSceneObj.NPC and data.name == "encounter_npc" and data.param == 1;
    end,

    body = function(self, data)
        local total = sw.GetMonsterCount();
        if total > 0 then
            DialogRight(g_char.npc1001, "encounter_5012001");
        elseif sw.IsPackageFull() then
            DialogRight(g_char.npc1001, "encounter_5000001");
        else
            local col = data.col;
            local row = data.row;

            DialogRight(g_char.npc1001, "encounter_5012002");
            sw.BreakMapObject("encounter_npc", true);
            sw.SetStoryFinished(50120, true);

            local map = sw.GetCurMap();
            local lv = map.lv or 1;
            local t;
            if sw.SuccessRandom(70) then
                if lv > 40 then
                    t = {400150, 400105, 400104, 610000, 400040, 400041, 400308};
                elseif lv > 30 then
                    t = {400105, 400104, 400103, 610000, 400040, 400041, 400053, 400308};
                else
                    t = {400103, 400102, 400307, 400050, 400000, 400005, 400007};
                end
                local r = sw.rand(1, #t);
                sw.AddItemToPackage(t[r], nil, 1);
            else
                if lv > 30 or sw.SuccessRandom(50) then
                    sw.AddMapObject(tSceneObj.DIAMOND_BOX, nil, nil, col, row);
                else
                    sw.AddMapObject(tSceneObj.GOLD_BOX, nil, nil, col, row);
                end
            end
        end
    end
}

-- ---------------------------------------------------------------------------------------------------
-- 杀本层指定类型怪
g_stories[50200] =
{
    moment      = "entered tower",
    priority    = 20,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        -- 已有遭遇时不触发
        local val = sw.GetStoryData("encounter_id");
        if val ~= "" then
            return false;
        end

        -- 按概率触发
        if not sw.SuccessRandom(10) then
            return false;
        end
        
        -- 限制地图
        if data.map_id < 21 or data.map_id > 100 then
            return false;
        end

        return true;
    end,

    body = function(self, data)
        local total, num1, num2, num3 = sw.GetMonsterCount();
        local t = {1};
        if (num2 > 0) then
            t[#t + 1] = 2;
        end
        if (num3 > 0) then
            t[#t + 1] = 3;
        end
        local r = sw.rand(1, #t);
        local rank = t[r];
        local obj = sw.AddMapObject(tSceneObj.NPC, "encounter_npc", 2);
        wrap.log("info", 15, "encounter npc 2: " .. obj.col .. ", " .. obj.row);
        sw.SetStoryFinished(50210, false);
        sw.SetStoryFinished(50220, false);
        sw.SetStoryData("encounter_rank", tostring(rank));
    end
}
-- 接受任务
g_stories[50210] =
{
    moment      = "touch object",
    priority    = 60,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.obj == tSceneObj.NPC and data.name == "encounter_npc" and data.param == 2;
    end,

    body = function(self, data)
        local rank = tonumber(sw.GetStoryData("encounter_rank"));
        local sMon = sw.LocalString("mon_qual_" .. rank);
        local s = sw.LocalString("encounter_5021001");
        s = string.format(s, sMon);
        DialogRight(g_char.npc1002, s);
    end
}
-- 交任务
g_stories[50220] =
{
    moment      = "touch object",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return data.obj == tSceneObj.NPC and data.name == "encounter_npc" and data.param == 2;
    end,

    body = function(self, data)
        local total, num1, num2, num3 = sw.GetMonsterCount();
        local rank = tonumber(sw.GetStoryData("encounter_rank"));
        local num;
        if (rank == 1) then
            num = num1;
        elseif (rank == 2) then
            num = num2;
        elseif (rank == 3) then
            num = num3;
        else
            return;
        end

        if num > 0 then
            DialogRight(g_char.npc1002, "encounter_5022001");
        elseif sw.IsPackageFull() then
            DialogRight(g_char.npc1002, "encounter_5000001");
        else
            local col = data.col;
            local row = data.row;

            DialogRight(g_char.npc1002, "encounter_5022002");
            sw.BreakMapObject("encounter_npc", true);
            sw.SetStoryData("encounter_rank", nil);
            sw.SetStoryFinished(50220, true);

            local map = sw.GetCurMap();
            local lv = map.lv or 1;
            local t;
            if sw.SuccessRandom(80) then
                if lv > 40 then
                    t = {400105, 400104, 610000, 400308, 400022, 420040, 420041, 420042, 420043};
                elseif lv > 30 then
                    t = {400103, 400307, 400006, 400008, 400021, 420030, 420031, 420032, 420033};
                else
                    t = {400051, 400102, 400306, 400306, 400001, 400002, 400003, 400004, 400020};
                end
                local r = sw.rand(1, #t);
                sw.AddItemToPackage(t[r], nil, 1);
            else
                sw.AddMapObject(tSceneObj.GOLD_BOX, nil, nil, col, row);
            end
        end
    end
}

-- ---------------------------------------------------------------------------------------------------
-- 送道具
g_stories[50300] =
{
    moment      = "entered tower",
    priority    = 15,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        -- 已有遭遇时不触发
        local val = sw.GetStoryData("encounter_id");
        if val ~= "" then
            return false;
        end

        -- 按概率触发
        if not sw.SuccessRandom(10) then
            return false;
        end
        
        -- 限制地图
        if data.map_id < 21 or data.map_id > 100 then
            return false;
        end
        if (data.map_id // 10 > 7) then
            return false;
        end

        return true;
    end,

    body = function(self, data)
        local obj = sw.AddMapObject(tSceneObj.NPC, "encounter_npc", 3);
        wrap.log("info", 15, "encounter npc 3: " .. obj.col .. ", " .. obj.row);
        sw.SetStoryFinished(50305, false);
        sw.SetStoryFinished(50310, false);
        sw.SetStoryFinished(50315, false);
        sw.SetStoryFinished(50320, false);
    end
}
-- 此任务跨地图，因此到达目的地图时需要重新刷出NPC
g_stories[50305] =
{
    moment      = "entered tower",
    priority    = 100,
    swallow     = false,
    repeatable  = true,

    condition = function(self, data)
        local val = sw.GetStoryData("encounter_id");
        if val ~= "3" then
            return false;
        end

        local mapID = tonumber(sw.GetStoryData("encounter_map"));
        if (data.map_id < mapID) then
            return false;
        end

        return true;
    end,

    body = function(self, data)
        local mapID = tonumber(sw.GetStoryData("encounter_map"));
        if (mapID == data.map_id) then
            local obj = sw.AddMapObject(tSceneObj.NPC, "encounter_npc", 3);
            wrap.log("info", 15, "encounter npc 3: " .. obj.col .. ", " .. obj.row);
        else
            sw.SetStoryData("encounter_id", nil);
            sw.SetStoryData("encounter_map", nil);
            sw.SetStoryData("encounter_item", nil);
            sw.SetStoryFinished(50305, true);
            sw.SetStoryFinished(50310, true);
            sw.SetStoryFinished(50315, true);
            sw.SetStoryFinished(50320, true);
        end
    end
}
-- 接受任务
g_stories[50310] =
{
    moment      = "touch object",
    priority    = 60,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.obj == tSceneObj.NPC and data.name == "encounter_npc" and data.param == 3 and not sw.IsPackageFull();
    end,

    body = function(self, data)
        local t = {600004, 600012, 600014, 600022, 600024, 600030, 600032, 600034, 600041, 600044, 600050};
        local r = sw.rand(1, #t);
        local item = sw.GetItemTemplate(t[r]);
        local map = sw.GetCurMap();
        map = sw.GetMapTemplate(map.id + sw.rand(1, 3));

        local s = sw.LocalString("encounter_5031001");
        s = string.format(s, item.name, map.floor_name);
        DialogRight(g_char.npc1003, s);
        sw.SetStoryFinished(50315, true);
        sw.AddItemToPackage(t[r], nil, 1);
        sw.SetStoryData("encounter_id", "3");
        sw.SetStoryData("encounter_map", tostring(map.id));
        sw.SetStoryData("encounter_item", tostring(t[r]));
    end
}
-- 背包已满，不能接受任务，给出提示
g_stories[50315] =
{
    moment      = "touch object",
    priority    = 60,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return data.obj == tSceneObj.NPC and data.name == "encounter_npc" and data.param == 3 and sw.IsPackageFull();
    end,

    body = function(self, data)
        DialogRight(g_char.npc1003, "encounter_5000001");
    end
}
-- 交任务
g_stories[50320] =
{
    moment      = "touch object",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return data.obj == tSceneObj.NPC and data.name == "encounter_npc" and data.param == 3;
    end,

    body = function(self, data)
        local mapID = tonumber(sw.GetStoryData("encounter_map"));
        local itemID = tonumber(sw.GetStoryData("encounter_item"));
        local map = sw.GetCurMap();
        if (map.id ~= mapID) then
            DialogRight(g_char.npc1003, "encounter_5032001");
            return;
        end

        local num = sw.GetItemCount(itemID);
        if (num <= 0) then
            DialogRight(g_char.npc1003, "encounter_5032003");
            return;
        end

        local col = data.col;
        local row = data.row;

        sw.RemoveItemFromPackage(itemID, 1);
        DialogRight(g_char.npc1003, "encounter_5032002");
        sw.BreakMapObject("encounter_npc", true);
        sw.SetStoryData("encounter_id", nil);
        sw.SetStoryData("encounter_map", nil);
        sw.SetStoryData("encounter_item", nil);
        sw.SetStoryFinished(50320, true);

        local lv = map.lv or 1;
        local t;
        if sw.SuccessRandom(60) then
            if lv > 40 then
                t = {400105, 400104, 610000, 400308, 400022, 420040, 420041, 420042, 420043};
            elseif lv > 30 then
                t = {400103, 400307, 400006, 400008, 400021, 420030, 420031, 420032, 420033};
            else
                t = {400051, 400102, 400306, 400306, 400001, 400002, 400003, 400004, 400020};
            end
            local r = sw.rand(1, #t);
            sw.AddItemToPackage(t[r], nil, 1);
        else
            sw.AddMapObject(tSceneObj.GOLD_BOX, nil, nil, col, row);
        end
    end
}



