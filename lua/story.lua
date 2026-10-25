--[[***************************************************************************************
* Copyright (c) 2014, Pixss.Com.Ltd. All rights reserved.
*****************************************************************************************--]]

-----------------------------------------------------------------------------------------
-- 示例剧本
-----------------------------------------------------------------------------------------

-- 容错
g_stories[5] =
{
    moment      = "enter main",
    priority    = 0,
    swallow     = false,
    repeatable  = true,

    condition = function(self, data)
        return true;
    end,

    body = function(self, data)
        if (sw.IsStoryFinished(1230) and not sw.IsFunctionUnlock(tFunction.CAMP_SHOP)) then
            sw.SetFunctionUnlock(tFunction.CAMP_SHOP, true);
        end
        if (sw.IsStoryFinished(1210)) then
            sw.SetStoryFinished(1205, true)
        end
    end
}


-- 进入角色创建页面
g_stories[10] =
{
    moment      = "enter create",       -- 进入角色创建页面
    priority    = 99,       -- 优先级 99
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = false,     -- 可重复触发

    body = function(self, data)
        -- 不存在1的脚本，只作为进度记录
        sw.SetStoryFinished(1, true);

        if (not APP_DIS) then
            local sel = DialogLeft(g_char.npc1, "story_00000", "confirm", "cancel");
            if (sel == 1) then
                for i, v in pairs(g_stories) do
                    if (i < 5000) then
                        sw.SetStoryFinished(i, true);
                    end
                end
                sw.SetFunctionUnlock(tFunction.CAMP, true)               -- 营地功能解锁
                sw.SetFunctionUnlock(tFunction.SMITHY, true)             -- 铁匠铺解锁
                sw.SetFunctionUnlock(tFunction.INLAY, true)              -- 镶嵌功能解锁
                sw.SetFunctionUnlock(tFunction.EQUIP_SHOP, true)         -- 装备商人解锁
                sw.SetFunctionUnlock(tFunction.CAMP_SHOP, true)          -- 营地商人解锁
                sw.SetFunctionUnlock(tFunction.FORGE, true)              -- 合成功能解锁
                sw.SetFunctionUnlock(tFunction.BREAKUP, true)            -- 分解功能解锁
                sw.SetFunctionUnlock(tFunction.FASHION, true)            -- 时装解锁
                sw.SetFunctionUnlock(tFunction.ENDLESS, true)            -- 无尽模式解锁
                sw.SetFunctionUnlock(tFunction.HARD, true)               -- 困难模式解锁
                sw.OpenTower();
                return;
            end
        end

        sw.SetFunctionUnlock(tFunction.CAMP, false)               -- 营地功锁定
        sw.SetFunctionUnlock(tFunction.SMITHY, false)             -- 铁匠铺锁定
        sw.SetFunctionUnlock(tFunction.INLAY, false)              -- 镶嵌功能锁定
        sw.SetFunctionUnlock(tFunction.EQUIP_SHOP, true)         -- 装备商人锁定
        sw.SetFunctionUnlock(tFunction.CAMP_SHOP, false)          -- 营地商人锁定
        sw.SetFunctionUnlock(tFunction.FORGE, false)              -- 合成功能锁定
        sw.SetFunctionUnlock(tFunction.BREAKUP, false)            -- 分解功能锁定

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        DialogRight(g_char.npc2, "story_01001")     -- （R）npc-002：嘿，大叔，这是我今天接待的第几个...要去救那个老家伙的小喽啰了？

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc1, "story_01002")      -- （L）npc-001：生意忙着呢，我可没工夫帮你数人头，小不点！
        DialogRight(g_char.npc2, "story_01003")     -- （R）npc-002：啊哈哈哈哈哈哈哈，好吧。

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_01004")      -- （L）npc-002：那么你好，对，就是你，我在你耳朵边呢！
        sw.PlaySound("event-1-2", false, 99)        -- 播放音效event-1-2，优先级99，不循环

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_01005")      -- （L）npc-002：你也是听到魔王的召唤才来到这里的吧？嗯...不管怎么样，想从勇者手里救出咱们魔王可是一件大事情！你还是要把自己打扮得得体一点比较好！万一...你比前面几个倒霉蛋能多撑几分钟呢？
        sw.PlaySound("event-1-3", false, 99)        -- 播放音效event-1-3，优先级99，不循环
        DialogLeft(g_char.npc2, "story_01006")      -- （L）npc-002：......啊、哈、哈哈哈，不用紧张啦...叫我<cr=230,65,5>夏努尔<cr=def>，是你的魂精灵！
        DialogLeft(g_char.npc2, "story_01007")      -- （L）npc-002：嗯，先给自己打扮一下吧！
   end
}

-- 点击创建角色按钮
g_stories[20] =
{
    moment      = "create role",       -- 进入角色创建页面
    priority    = 99,       -- 优先级 99
    swallow     = true,     -- 不被高优先级屏蔽
    repeatable  = false,     -- 可重复触发

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_02001")      -- （L）npc-002：啊、对了...虽说不太重要...也或许等下就会忘记。不过好吧，你叫什么名字呢？喽啰？
    end
}

-- 进入游戏主界面
g_stories[30] =
{
	moment		= "enter main",
	priority	= 99,
	swallow     = true,
	repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(10)
    end,

	body = function(self, data)
        sw.SetStoryFinished(20, true)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_03001")          -- （L）npc-001：哎我说，最近响应召唤而来的小东西质量越来越不靠谱了，你看都瘦成什么样了？看样子是你们家老板被勇者束缚得有点使不上力啊？
        DialogRight(g_char.npc2, "story_03002")         -- （R）npc-002：你就别埋汰他了。你也知道这群勇者实在是太不讲道理了...欠了这些怪兽们几个月的工钱，老板就去找他们要说法，谁知...
        DialogLeft(g_char.npc1, "story_03003")          -- （L）npc-001：是啊...谁知道钱没要回来，人还被勇者扣在撸撸塔，没办法只能召唤周边的小怪兽们打进去救他，到如今有去无回的小怪兽们也不差这一个了...

        DialogLeft(g_char.npc1, "story_03004")          -- （L）npc-001：......这事儿你都讲烂了。
        sw.PlaySound("event-1-3", false, 99)            -- 播放音效event-1-3，优先级99，不循环
        DialogRight(g_char.npc2, "story_03005")         -- （R）npc-002：啊哈哈、哈哈，别吓着人家萌新！哈哈哈...
        DialogLeft(g_char.npc2, "story_03006")          -- （L）npc-002：咳咳！不过确实差不多就如<cr=230,65,5>咕叽<cr=def>大叔说的一样，我们得救回魔王...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_03007")          -- （L）npc-002：好吧！我们这就进塔去看看，详细情况一边走我一边讲给你听。
        DialogRight(g_char.npc1, "story_03008")         -- （R）npc-001：真希望他能活到你把"详细情况"讲完，多一个小怪兽，我也就多一个小客户...

        -- 引导点击塔
        sw.ShowMask(true, {file = "image/ui/creat-2-1.png", x = 510, y = 930, dw = 508, dh = 828, mw = 280, mh = 660})
        sw.ShowNode("ccb/object/creatfx", "type-1", 510, 930)
        sw.ShowNode("ccb/object/finger", "type-1", 550, 900)
    end
}

-- 引导点击塔
g_stories[41] =
{
    moment		= "enter main",
    priority	= 50,
    swallow     = true,
    repeatable	= true,

    condition = function(self, data)
        return sw.IsStoryFinished(30)
    end,

    body = function(self, data)
        sw.ShowMask(true, {file = "image/ui/creat-2-1.png", x = 510, y = 930, dw = 508, dh = 828, mw = 280, mh = 660});
        sw.ShowNode("ccb/object/creatfx", "type-1", 510, 930);
        sw.ShowNode("ccb/object/finger", "type-1", 550, 900);
    end
};

-- 引导选择层数
g_stories[42] =
{
    moment		= "tower list",
    priority	= 50,
    swallow     = true,
    repeatable	= true,

    condition = function(self, data)
        return sw.IsStoryFinished(30)
    end,

    body = function(self, data)
        sw.ShowMask(true, {file = "image/ui/creat-1-1.png", x = 230, y = 530, dw = 366, dh = 168, mw = 250, mh = 70});
        sw.ShowNode("ccb/object/creatfx", "type-2", 230, 530);
        sw.ShowNode("ccb/object/finger", "type-1", 234, 534);
    end,
};

-- 进塔准备（隐藏之前的遮罩和ccb节点）
g_stories[43] =
{
    moment		= "entering tower",
    priority	= 50,
    swallow     = true,
    repeatable	= true,

    condition = function(self, data)
        return sw.IsStoryFinished(30);
    end,

    body = function(self, data)
        sw.HideMask();
        sw.HideNode("ccb/object/finger");
        sw.HideNode("ccb/object/creatfx");
    end,
};

-- 初次进塔
g_stories[50] =
{
    moment		= "entered tower",
    priority	= 99,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(30);
    end,

    body = function(self, data)
        sw.SetStoryFinished(41, true)
        sw.SetStoryFinished(42, true)
        sw.SetStoryFinished(43, true)

        -- 等待玩家角色刷新，延时 1.5 秒
        Wait(1.5)

        DialogLeft(g_char.npc2, "story_05001")          -- （L）npc-002：好，我们已经进入撸撸塔！简单来讲我们这次的营救计划分三步！
        DialogLeft(g_char.npc2, "story_05002")          -- （L）npc-002：第一步！我们穿越森林进入撸撸塔第一层，对对对，就是这儿了。
        DialogLeft(g_char.npc2, "story_05003")          -- （L）npc-002：第三步！我们找到楼梯冲到塔顶，救走魔王<cr=230,65,5>布鲁塔鲁斯<cr=def>！
        DialogLeft(g_char.npc2, "story_05004")          -- （L）npc-002：现在嘛，我们需要详细规划一下第二步...

        -- 延迟 1.5 秒，此过程需要屏蔽玩家操作
        Wait(1.5)

        DialogLeft(g_char.npc2, "story_05005")          -- （L）npc-002：如你所见，这里到处都是挡路的勇者。而你需要干掉他们，提升自己，找到楼梯，爬到塔顶，才能救到魔王。
        DialogLeft(g_char.npc2, "story_05006")          -- （L）npc-002：哈，浅显易懂吧？试一试干掉这个挡路的勇者吧！

        -- 引导点击敌人进入战斗
        local mon = sw.FindRoundMonster()
        if (mon) then
            sw.ShowNode("ccb/object/finger", "type-1", mon.x, mon.y + 40, "map-root-1")
        end
    end,
};

-- 初次战斗开始
g_stories[51] =
{
    moment		= "battle begin",
    priority	= 50,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(50)
    end,

    body = function(self, data)
        sw.HideNode("ccb/object/finger")
    end,
};

-- 初次战斗获胜
g_stories[60] =
{
    moment		= "battle end",
    priority	= 50,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        return sw.IsStoryFinished(51) and tPlayerInfo.cur_hp < tPlayerInfo.max_hp and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_06001")          -- （L）npc-002：哟！你得当心点儿，这些家伙可不是善茬，你可不能像我们魂精灵一样灵巧地躲避菜刀。你每次战斗都有可能会受伤哦！
        DialogLeft(g_char.npc2, "story_06002")          -- （L）npc-002：看看画面右下角。

        -- 引导玩家看血条。标记右下角血条，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-3-1.png", x = 655, y = 172, dw = 196, dh = 140})
        sw.ShowNode("ccb/object/creatfx", "type-3", 655, 172)
        Wait(2);
        sw.HideMask();
        sw.HideNode("ccb/object/creatfx")

        DialogLeft(g_char.npc2, "story_06003")          -- （L）npc-002：<cr=230,65,5>弧形的红条<cr=def>是你的<cr=230,65,5>生命值<cr=def>，如果降低到0的话，你就会充值了...呸、不是，你就被弄死了。

        -- 引导玩家看血瓶。标记左下角血瓶，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 60, y = 60, dw = 272, dh = 272})
        sw.ShowNode("ccb/object/creatfx", "type-4", 60, 60)
        Wait(2);
        sw.HideMask()
        sw.HideNode("ccb/object/creatfx")

        DialogLeft(g_char.npc2, "story_06004")          -- （L）npc-002：而左边的<cr=230,65,5>红色药水瓶子<cr=def>是治疗药水，喝一口能够恢复你一半的生命值。这些药水在你每次进入撸撸塔的时候都会有补充到10个，神奇吧？

        Wait(1.5)

        DialogLeft(g_char.npc2, "story_06005")          -- （L）npc-002：哈？我当然没喝过，你见过受伤的魂精灵吗？但是你可以喝了试试。
    end,
};

-- 获得装备
g_stories[70] =
{
    moment		= "obtain item",
    priority	= 50,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(60) and data.item_type >= 10 and data.item_type <= 31
    end,

    body = function(self, data)
        sw.CloseWindowViews()                           -- 关闭所有界面
        DialogLeft(g_char.npc2, "story_07001")          -- （L）npc-002：哟~你好像得到了一件不错的装备嘛！
        DialogLeft(g_char.npc2, "story_07002")          -- （L）npc-002：来，穿上试试？

        -- 指引玩家背包按钮的位置
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 667, y = 77, dw = 272, dh = 272, mw = 120, mh = 120})
        sw.ShowNode("ccb/object/creatfx", "type-6", 667, 77)
        sw.ShowNode("ccb/object/finger", "type-1", 674, 76)
    end,
};

-- 接上个剧本，玩家打开包裹之后
g_stories[71] =
{
    moment		= "open package",
    priority	= 60,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(70)
    end,

    body = function(self, data)
        -- 遍历背包，找到第一件装备类道具，计算界面位置
        local items = sw.GetItemsWithPage(1)
        local px, py
        for i, v in ipairs(items) do
            if (v.type >= 10 and v.type <= 31) then
                px = 76 + ((i - 1) % 4) * 100
                py = 472 + ((i - 1) / 4) * 100
                break
            end
        end

        if (px and py) then
            -- 指引玩家装备在背包中的位置
            sw.ShowMask(true, {file = "image/ui/creat-5-1.png", x = px, y = py, dw = 132, dh = 132, mw = 85, mh = 85},
                        {file = "image/ui/creat-6-1.png", x = 377, y = 800, dw = 780, dh = 440, mw = 0, mh = 0})
            sw.ShowNode("ccb/object/creatfx", "type-8", px, py)
            sw.ShowNode("ccb/object/finger", "type-3", px, py)
        end
    end,
};

-- 更换装备
g_stories[72] =
{
    moment		= "change equip",
    priority	= 50,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(71)
    end,

    body = function(self, data)
        sw.HideNode("ccb/object/finger")
        sw.HideNode("ccb/object/creatfx")
        sw.HideMask()

        DialogLeft(g_char.npc2, "story_07201")          -- （L）npc-002：看起来很厉害的样子，你可真是一个运气不错的小怪兽！
        DialogLeft(g_char.npc2, "story_07202")          -- （L）npc-002：刚说了，这些勇者可是不好惹的，如果你一身破铜烂铁去和他们打架的话，你就只能等着被做成烤串了。

        -- 引导玩家穿戴装备
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 667, y = 77, dw = 272, dh = 272, mw = 90, mh = 90})
        sw.ShowNode("ccb/object/creatfx", "type-6", 667, 77)
        sw.ShowNode("ccb/object/finger", "type-1", 680, 68)
    end,
};

-- 关闭包裹
g_stories[73] =
{
    moment		= "close package",
    priority	= 50,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(72)
    end,

    body = function(self, data)
        sw.HideNode("ccb/object/finger");
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();
    end,
};

-- 靠近通道，激活楼梯按钮
g_stories[80] =
{
    moment		= "near pass",
    priority	= 60,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(60);
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        sw.StopPlayerAction()                           -- 停止玩家行动
        sw.CloseWindowViews()                           -- 关闭所有界面
        DialogLeft(g_char.npc2, "story_08001")          -- （L）npc-002：嘿，你找到并激活了爬升楼层的<cr=230,65,5>楼梯<cr=def>！顺着这些楼梯进去，你就能一步一步接近我们的营救目标老蜥蜴了，哈哈！
        DialogLeft(g_char.npc2, "story_08002")          -- （L）npc-002：注意看看左上角的楼梯标记。

        -- 引导玩家注意新出现的楼梯按钮，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 214, y = 1254, dw = 136, dh = 136})
        sw.ShowNode("ccb/object/creatfx", "type-7", 214, 1254)
        Wait(2);
        sw.HideMask()
        sw.HideNode("ccb/object/creatfx")

        DialogLeft(g_char.npc2, "story_08003")          -- （L）npc-002：只要你激活过一层楼的楼梯，那么无论你想在本层楼怎~~么~~到处跑，都不会跑丢啦。想要<cr=230,65,5>回到楼梯<cr=def>旁边？只需要点击一下这个标记就好。
        sw.SetPlayerOperable(true)
    end,
};

-- 玩家来到第 3 层
g_stories[90] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(80) and data.map_id == 3
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_09001")          -- （L）npc-002：嘿，看来你比我想象中的厉害许多啊！这就连续上了几层楼了。
        DialogLeft(g_char.npc2, "story_09002")          -- （L）npc-002：哈哈哈，别不好意思了，我是在夸你呢！
        DialogLeft(g_char.npc2, "story_09003")          -- （L）npc-002：不过呢...你也要注意一下，随着你上的楼层越高，这些难缠的勇者也会相应提升等级的哦！你随便找个勇者，<cr=230,65,5>长按<cr=def>他就能看到他的信息啦。
    end
}

-- 玩家升级，获得技能点
-- 防止错误：如果玩家自行学会了技能，则不再进行技能引导
g_stories[100] =
{
    moment      = "learn skill",
    priority    = 80,
    swallow     = false,
    repeatable  = false,

    condition = function(self, data)
        return true;
    end,

    body = function(self, data)
        sw.SetStoryFinished(101, true);
        sw.SetStoryFinished(102, true);
        sw.SetStoryFinished(103, true);
        sw.SetStoryFinished(104, true);
    end,
};

-- 技能学习之前对话
g_stories[101] =
{
    moment      = "battle end",
    priority    = 98,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        return sw.IsStoryFinished(60) and tPlayerInfo.cur_skpt > 0 and data.result == tBattleResult.WIN
                and not sw.IsPackageFull() and Story:GetRunningID() == 0
    end,

    body = function(self, data)
        sw.StopPlayerAction()                           -- 停止玩家行动
        sw.CloseWindowViews()                           -- 关闭所有界面

        DialogLeft(g_char.npc2, "story_10101")          -- （L）npc-002：嗒~~~哒~~~

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_10102")          -- （L）npc-002：嗯？你知道是升级了？没劲...但是小怪兽们在升级后是可以通过学习不同的技能改造自身基因的！
        DialogLeft(g_char.npc2, "story_10103")          -- （L）npc-002：啊哈哈哈，对，你获得了1个<cr=230,65,5>技能点<cr=def>。要不要我教你怎么改造自己呢，哼哼！

        -- 延迟 3 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_10104", "story10104_option1", "story10104_option2")          -- （L）npc-002：哼，求我......（选项1：我不嘚瑟了！ / 选项2：大佬，教我！）
        DialogLeft(g_char.npc2, "story_10105")          -- （L）npc-002：好吧好吧我告诉你...<cr=230,65,5>连点3下屏幕<cr=def>然后<cr=230,65,5>手机狂甩5下<cr=def>，就可以了。

        -- 延迟1秒，此过程需要屏蔽玩家操作
        Wait(1);

        sw.ShowNode("ccb/object/shakefx", "4", 0, 0, "fxcenter")

        sw.PlaySound("boss-3-death", false, 99)         -- 播放音效boss-3-death，优先级99，不循环

        -- 延迟 2.3 秒，此过程需要屏蔽玩家操作
        Wait(2.3);

        DialogLeft(g_char.npc2, "story_10106")          -- （L）npc-002：...噗哈哈哈哈哈哈哈哈哈哈哈哈哈，好啦好啦，不逗你了！来，点这儿。

        -- 引导玩家点击背包按钮
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 667, y = 77, dw = 272, dh = 272, mw = 120, mh = 120});
        sw.ShowNode("ccb/object/creatfx", "type-6", 667, 77);
        sw.ShowNode("ccb/object/finger", "type-1", 674, 76);
    end
}
-- 打开包裹。与清理包裹同时机，需要排除
g_stories[102] =
{
    moment      = "open package",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(101) and (not sw.IsPackageFull() or sw.IsStoryFinished(260))
    end,

    body = function(self, data)
        -- 引导玩家打开技能界面
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 583, y = 52, dw = 272, dh = 272, mw = 90, mh = 90});
        sw.ShowNode("ccb/object/creatfx", "type-6", 583, 52);
        sw.ShowNode("ccb/object/finger", "type-1", 580, 50);
    end,
};
-- 打开技能界面
g_stories[103] =
{
    moment      = "open skill",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(102);
    end,

    body = function(self, data)
        sw.HideMask();
        sw.HideNode("ccb/object/finger");
        sw.HideNode("ccb/object/creatfx");

        DialogLeft(g_char.npc2, "story_10301")          -- （L）npc-002：嗯？你看到自己的怪兽基因了么？你获得的每一个技能点都可以在这里通过学习技能改造自己的DNA。来，继续。

        -- 引导玩家打开技能学习/升级界面
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 375, y = 110, dw = 272, dh = 272, mw = 90, mh = 90});
        sw.ShowNode("ccb/object/creatfx", "type-6", 375, 110);
        sw.ShowNode("ccb/object/finger", "type-1", 375, 106);
    end,
};
-- 使用技能点，点亮技能
g_stories[104] =
{
    moment      = "open learn skill",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(103);
    end,

    body = function(self, data)
        sw.HideMask();
        sw.HideNode("ccb/object/creatfx");
        sw.HideNode("ccb/object/finger")

        DialogLeft(g_char.npc2, "story_10401")          -- （L）npc-002：学习和升级技能都需要消耗1个技能点，选择最适合自己的技能去改造自己的DNA才能让你成为独一无二的怪兽哦！

        -- 展示技能点数的位置，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-1-1.png", x = 550, y = 480, dw = 178, dh = 168});
        sw.ShowNode("ccb/object/creatfx", "type-11", 550, 480);
        Wait(2);
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();

        DialogLeft(g_char.npc2, "story_10402")          -- （L）npc-002：来，进行你的第一次基因改造吧！
    end,
};

-- 随机对话
g_stories[110] =
{
    moment      = "battle end",
    priority    = 10,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        return sw.IsStoryFinished(80) and tPlayerInfo.lv == 2 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_11001")          -- （L）npc-002：哈哈哈哈，刚刚拿你开了玩笑，你不会生我的气吧。
        DialogLeft(g_char.npc2, "story_11002")          -- （L）npc-002：你跟别的小怪兽真的有些不一样呢，开始有些舍不得你死掉了，嘿嘿！
    end,
};

-- 提醒玩家检查背包中的新获得装备
g_stories[120] =
{
    moment      = "entered tower",
    priority    = 8,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        -- 遍历背包，查找背包中未查看过的装备数量
        local vNewEquip = 0
        for loop = 1, 6 do
            local tItems = sw.GetItemsWithPage(loop)
            for key, value in pairs(tItems) do
                if (value.type >= 10 and value.type <= 31) and value.is_new then
                    vNewEquip = vNewEquip + 1
                end
            end
        end
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(60) and vNewEquip >= 3 and data.map_id <= 10
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_12001")          -- （L）npc-002：喂喂喂...我说，你其实干得还算不错啦，但是也偶尔记得检查一下自己的包包，看看有没有获得什么新的玩意儿哦~
    end,
};

-- 提醒玩家注意自身血量
g_stories[130] =
{
    moment      = "battle end",
    priority    = 9,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(60) and data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp <= 0.15 and tMapInfo.id <= 20
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_13001")          -- （L）npc-002：^_^
        DialogLeft(g_char.npc2, "story_13002")          -- （L）npc-002：我说...

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_13003")          -- （L）npc-002：这位怪兽同志...^_^

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_13004")          -- （L）npc-002：<cr=230,65,5>你没发现你快挂了吗！！接下来的冒险，请注意一点啊！！<cr=def>
    end,
};

-- 准备进入下一层时，如果玩家没有备用药瓶，则进行提醒
g_stories[140] =
{
    moment      = "entering tower",
    priority    = 7,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        return sw.IsStoryFinished(60) and tPlayerInfo.cur_hp / tPlayerInfo.max_hp <= 0.1 and tPlayerInfo.cur_red == 0 and tPlayerInfo.cur_blue == 0
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_14001")          -- （L）npc-002：唔...还要继续前进吗？你确定你真的不需要尽快想办法弄点补给？...
    end,
};

-- 学习主动技能
g_stories[150] =
{
    moment      = "learn skill",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(103) and data.skill_type == 1
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_15001")          -- （L）npc-002：嘿，你的怪兽基因改造水准已经出现了一个质的飞跃！你刚刚学习的可是一个<cr=230,65,5>战斗技能<cr=def>哦！
        DialogLeft(g_char.npc2, "story_15002")          -- （L）npc-002：这是一个可以在战斗中主动使用的强力技能，哇哦哦哦，真没想到！我都好几天没见过能活到改造出主动技能的小喽啰了！赶紧找个倒霉催的勇者试试手去，哈哈哈哈哈！
    end,
};

-- 使用主动技能
g_stories[160] =
{
    moment      = "battle begin",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local p = sw.GetMyPlayer()
        local pass = (sw.IsStoryFinished(150) and p.fight_skill1)
        return pass and 2 or false
    end,

    body = function(self, data)
        sw.PauseRunningActions()                        -- 画面暂停
        DialogLeft(g_char.npc2, "story_16001")          -- （L）npc-002：那么，我们来看看所谓<cr=230,65,5>战斗技能<cr=def>是怎么一回事吧。

        -- 标记 1 号主动技能，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 684, y = 386, dw = 140, dh = 140});
        sw.ShowNode("ccb/object/creatfx", "type-6", 684, 386);
        Wait(2);
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();

        DialogLeft(g_char.npc2, "story_16002")          -- （L）npc-002：这就是你先前学会的<cr=230,65,5>战斗技能<cr=def>，在战斗中你可以随时使用它。
        DialogLeft(g_char.npc2, "story_16003")          -- （L）npc-002：技能图标下面的数字代表使用这个技能需要消耗的<cr=230,65,5>法力值<cr=def>。

        -- 标记法力值，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 300, y = 115, dw = 200, dh = 232});
        sw.ShowNode("ccb/object/creatfx", "type-10", 300, 115);
        Wait(2);
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();

        DialogLeft(g_char.npc2, "story_16004")          -- （L）npc-002：而对应生命值，这个蓝条就代表你的<cr=230,65,5>法力值<cr=def>。法力不足的话，当然就不能发动技能了。
        DialogLeft(g_char.npc2, "story_16005")          -- （L）npc-002：和生命药水一样，使用<cr=230,65,5>法力药水<cr=def>可以恢复一半的法力值。

        sw.ResumeActions()                              -- 画面恢复正常播放
    end,
};

-- 背包已满，提示玩家清理
g_stories[170] =
{
    moment      = "need cleanup",
    priority    = 98,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local map = sw.GetCurMap()
        return sw.IsStoryFinished(60) and Story:GetRunningID() == 0
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_17001")          -- （L）npc-002：啊，看来你的收获颇丰呢，背包都满了。
        DialogLeft(g_char.npc2, "story_17002")          -- （L）npc-002：如果你不想要这个物品，可以点击左边一个垃圾桶按钮直接将他丢弃
        DialogLeft(g_char.npc2, "story_17003")          -- （L）npc-002：但是如果你想要保留这件物品的话，你就需要点击右边的清理按钮对背包进行清理，以获得足够的空间来容纳下这个新的物品。
    end,
};
-- 清理包裹
g_stories[180] =
{
    moment      = "open package",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(170)
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_18001")          -- （L）npc-002：你可以点击道具栏上方的<cr=230,65,5>垃圾桶按钮<cr=def>来对背包中的物品进行单个或者批量丢弃，也可以点击解锁按钮来<cr=230,65,5>购买更多背包空间<cr=def>。
        DialogLeft(g_char.npc2, "story_18002")          -- （L）npc-002：确认有了足够的背包空间后，关闭界面就可以获得这个新的物品了。
--[[        Sleep(0.6);
        sw.EnableVeil(false);

        sw.ShowMask(false, {file = "image/ui/creat-1-1.png", x = 54, y = 634, dw = 178, dh = 168});
        sw.ShowNode("ccb/object/creatfx", "type-11", 54, 634);
        DialogLeft(g_char.npc2, "story_00204");
        DialogLeft(g_char.npc2, "story_00205");
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();      ]] -- 修改后剧本无此段指引
    end,
};

-- 点亮小地图
g_stories[190] =
{
    moment      = "touch object",
    priority    = 5,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(50) and data.obj == tSceneObj.OPEN_MAP
    end,

    body = function(self, data)
        sw.CloseWindowViews()                           -- 关闭所有界面
        DialogLeft(g_char.npc2, "story_19001")          -- （L）npc-002：嚯！你已经激活了本楼层的小地图，点击左上角的小地图就可以进行查看本层全貌啦。会省很多事儿哦！
    end,
};

-- 首次打开营地道具店
g_stories[210] =
{
    moment      = "open shop",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.storage == 2
    end,

    body = function(self, data)
        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc16, "story_21001")        -- （R）npc-016：你好！！欢迎光临本店！！
        DialogLeft(g_char.npc2, "story_21002")          -- （L）npc-002：你就是小桐哦？
        DialogRight(g_char.npc16, "story_21003")        -- （R）npc-016：哎？
        DialogLeft(g_char.npc2, "story_21004")          -- （L）npc-002：我现在能理解为什么咕叽咕叽要冒着危险到塔里面去找你了，多漂亮的魅魔啊，哈哈哈...
        DialogRight(g_char.npc16, "story_21005")        -- （R）npc-016：哎？哎？- -？
        DialogLeft(g_char.npc2, "story_21006")          -- （L）npc-002：啊哈哈，没事儿，我们就是随便看看~走咯~
        DialogRight(g_char.npc16, "story_21007")        -- （R）npc-016：啊，不买点吗？真是遗憾！
    end
}

-- 首次打开宝石镶嵌
g_stories[220] =
{
    moment      = "open inlay",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsFunctionUnlock(tFunction.INLAY)
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc10, "story_22001")         -- （L）npc-010：老毕，给他们介绍一下你的宝石镶嵌方案！
        DialogLeft(g_char.npc10, "story_22002")         -- （L）npc-010：啊，别忘了！要在我这里把<cr=230,65,5>装备强化到+3<cr=def>以上才会有<cr=230,65,5>镶嵌孔<cr=def>可以镶嵌宝石哦！
        DialogLeft(g_char.npc19, "story_22003")         -- （L）npc-019：......

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc19, "story_22004")         -- （L）npc-019：装备，放这里。

        -- 标记装备放置区域，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-5-1.png", x = 375, y = 984, dw = 140, dh = 140})
        sw.ShowNode("ccb/object/creatfx", "type-13", 375, 984);
        Wait(2);
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();

        DialogLeft(g_char.npc19, "story_22005")         -- （L）npc-019：宝、宝石，这里。

        DialogLeft(g_char.npc19, "story_22006")         -- （L）npc-019：已经镶嵌宝石的孔，<cr=230,65,5>可以覆盖<cr=def>、镶嵌新的宝石。
        DialogLeft(g_char.npc19, "story_22007")         -- （L）npc-019：完。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_22008")          -- （L）npc-002：唔...言简意赅，收到。
    end
}

-- 进入1-5后，固定给一个彩虹关
g_stories[300] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id >= 5 and data.map_id <= 9 and sw.FindRoundSpace();
    end,

    body = function(self, data)
        local tc = sw.FindRoundSpace();
        sw.AddMapObject(tSceneObj.PORTAL, "portal", 0, tc.col, tc.row);
        Wait(3);
        DialogLeft(g_char.npc2, "story_810001")
        DialogLeft(g_char.npc2, "story_810002")
        DialogLeft(g_char.npc2, "story_810003")
    end
}

-- 赠送的彩虹关后
g_stories[310] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(300) and data.map_id <= 10;
    end,

    body = function(self, data)
        sw.CloseWindowViews()                           -- 关闭所有界面
        DialogLeft(g_char.npc2, "story_20001")          -- （L）npc-002：啊对了！还忘了给你说个<cr=230,65,5>非常重要的事儿<cr=def>！！罪过啊！

        -- 标记回城按钮，持续 4 秒
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 705, y = 1289, dw = 90, dh = 90});
        sw.ShowNode("ccb/object/creatfx", "type-12", 705, 1289);
        Wait(4);
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();

        DialogLeft(g_char.npc2, "story_20002")          -- （L）npc-002：你的<cr=230,65,5>营地返回充能<cr=def>满了！你现在随时都可以点击它安全回到营地了，也只有通过这个方式回到营地，<cr=230,65,5>才能保留你本次冒险收获<cr=def>的全部物品啊，金币啊，经验值等等所有的资源！
        DialogLeft(g_char.npc2, "story_20003")          -- （L）npc-002：如果你的充能还没满的话，我就破例帮你补满，稍后我们就试试看。
        sw.SupplyPower();
        Wait(1);
        DialogLeft(g_char.npc2, "story_20004")          -- （L）npc-002：但是知道正常充能的方式，其实很简单啦，打败勇者就可以获得充能，100点充能就满了...
        DialogLeft(g_char.npc2, "story_20005")          -- （L）npc-002：虽说你从设置界面也可以放弃冒险回到营地，但那样做的话，你就会像时光倒流一样回到进来之前的状态，本次冒险也就白忙活啦...
        DialogLeft(g_char.npc2, "story_20006")          -- （L）npc-002：请一定记得，<cr=230,65,5>通过充能回营地才能保留所有冒险收获<cr=def>，只要你愿意，随时都可以离开。那么我们现在就来试试吧？
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 705, y = 1289, dw = 90, dh = 90, mw = 70, mh = 70});
        sw.ShowNode("ccb/object/finger", "type-1", 705, 1289);
    end
}

-- 准备回城
g_stories[320] =
{
    moment      = "prepare return city",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(310);
    end,

    body = function(self, data)
        sw.HideNode("ccb/object/finger");
        sw.HideMask();
    end
}


-- 点击未解锁的npc
g_stories[400] =
{
    moment      = "touch locked npc",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return true;
    end,

    body = function(self, data)
        if (data.npc == "market") then
            DialogLeft(g_char.npc2, "story_910001")
        elseif (data.npc == "inlay") then
            DialogLeft(g_char.npc2, "story_910002")
        elseif (data.npc == "alchemy" or data.npc == "breakup") then
            DialogLeft(g_char.npc2, "story_910003")
        end
    end
}

-- 解锁时装
g_stories[410] =
{
    moment		= "enter main",
    priority	= 10,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        local p = sw.GetMyPlayer();
        return p.max_floor >= 21 and not sw.IsPackageFull();
    end,

    body = function(self, data)
        sw.SetFunctionUnlock(tFunction.FASHION, true);
        DialogLeft(g_char.npc2, "story_41001");
        DialogLeft(g_char.npc2, "story_41002");

        -- 送一件时装
        sw.AddItemToPackage(209007);
        Wait(1);

        -- 引导点击时装按钮
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 705, y = 1244, dw = 80, dh = 80});
        sw.ShowNode("ccb/object/creatfx", "type-12", 705, 1244);
        sw.ShowNode("ccb/object/finger", "type-1", 705, 1244)
    end,
};

-- 打开时装界面
g_stories[420] =
{
    moment		= "open fashion",
    priority	= 50,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(410);
    end,

    body = function(self, data)
        sw.HideNode("ccb/object/creatfx");
        sw.HideNode("ccb/object/finger");
        sw.HideMask();

        DialogLeft(g_char.npc2, "story_42001");
        DialogLeft(g_char.npc2, "story_42002");
        DialogLeft(g_char.npc2, "story_42003");
        DialogLeft(g_char.npc2, "story_42004");
        DialogLeft(g_char.npc2, "story_42005");
    end,
};


-- 在一场战斗中获胜
g_stories[1010] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and ( tMapInfo.id == 7 or tMapInfo.id == 8 ) and tPlayerInfo.cur_hp / tPlayerInfo.max_hp >= 0.8
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_101001")         -- （L）npc-002：......
        DialogLeft(g_char.npc2, "story_101002")         -- （L）npc-002：是吧？你也闻到了...看来不是我的错觉。
        DialogLeft(g_char.npc2, "story_101003")         -- （L）npc-002：是什么什么东西烧焦了的味道...
        DialogLeft(g_char.npc2, "story_101004")         -- （L）npc-002：总之小心些。
    end
}

-- 进入 1-9 关卡
g_stories[1020] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 8
    end,

    body = function(self, data)

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc21, "story_102001")        -- （L）npc-021：你这个恶棍！放开我！！

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_102002")         -- （L）npc-002：！！
        DialogLeft(g_char.npc21, "story_102003")        -- （L）npc-021：混蛋！...唔！......

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        sw.PlaySound("enemy-attack-5-1", false, 99)     -- 播放音效enemy-attack-5-1，优先级99，不循环

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_102004")         -- （L）npc-002：发生了什么！？你看到了吗？
        DialogLeft(g_char.npc2, "story_102005")         -- （L）npc-002：似乎是有一些人在搏斗的声音！哦？好，我们跟过去看看，小心点。

        sw.ShowNode("ccb/object/chapterfx-1", "1", 0, 0, "fxcenter")

        -- 延迟 4 秒，此过程需要屏蔽玩家操作
        Wait(4)
    end
}

-- 激活前往 1-10 的楼梯
g_stories[1030] =
{
    moment      = "near pass",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 9
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        sw.StopPlayerAction()                           -- 停止玩家行动
        sw.CloseWindowViews()                           -- 关闭所有界面

        DialogLeft(g_char.npc2, "story_103001")        -- （L）npc-002：嗯？这是什么？？
        DialogLeft(g_char.npc2, "story_103002")        -- （L）npc-002：嗯...看样子像是失去了很珍贵的人...

        sw.ShowNode("ccb/object/window-900001", "open", 0, 0, "fxcenter")

        sw.SetPlayerOperable(true)
    end
}

-- 进入 1-10 关卡
g_stories[1040] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 10
    end,

    body = function(self, data)
        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_104001")         -- （L）npc-002：果然！！
        DialogLeft(g_char.npc2, "story_104002")         -- （L）npc-002：这里乌烟瘴气，到处都有被灼烧过的痕迹...会不会跟前面那些搏斗的人有关系？
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        DialogLeft(g_char.npc2, "story_104003")         -- （L）npc-002：嘘......小心！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc3, "story_104004")        -- （R）npc-003：哈瓦努小杂种！！辛德拉尔大爷我在这里！你就不想出来救你的小男朋友吗？哈哈哈哈哈！！

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc3, "story_104005")        -- （R）npc-003：哈哈哈哈哈！这里的怪基本都是杂碎！没意思...
        DialogRight(g_char.npc3, "story_104006")        -- （R）npc-003：你，你还有你，把那个粉红色的小猫咪给我关到密道去。
        DialogRight(g_char.npc3, "story_104007")        -- （R）npc-003：他那个恶心黏糊糊的鱼人朋友一定会来救他的！到时候我就把他们两个都宰了，哈哈哈哈哈哈哈！！！

        -- 延迟 1.5 秒，此过程需要屏蔽玩家操作
        Wait(1.5)

        DialogLeft(g_char.npc2, "story_104008")         -- （L）npc-002：......这些所谓的勇者很真是让人牙痒痒。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_104009")         -- （L）npc-002：哈？啥？你要救人？
        DialogLeft(g_char.npc2, "story_104010")         -- （L）npc-002：我是没什么关系啦，你自己可考虑清楚了，你倒是一路上都挺顺利，我可不想看你犯的第一个错误...就是你犯的最后一个错误。
        DialogLeft(g_char.npc2, "story_104011")         -- （L）npc-002：考虑好了的话，我们就跟过去吧。
    end
}

-- 进入第 1 个BOSS关卡，到达坐标40,50
g_stories[1050] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 1001 and data.x == 40 and data.y == 50
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        sw.StopPlayerAction()                           -- 停止玩家行动
        sw.CloseWindowViews()                           -- 关闭所有界面

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc3, "story_105001")        -- （R）npc-003：......老子就不信，身边没了卡夫，我堂堂辛德拉尔就做了不事情了？
        DialogLeft(g_char.npc2, "story_105002")         -- （L）npc-002：似乎就是这里了...我们悄悄靠过去...然...
        sw.SetPlayerOperable(true)
    end
}

-- 进入第 1 个BOSS关卡，到达BOSS身边，坐标：49,51或者49,50或者49,49
g_stories[1060] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 1001 and ( ( data.x == 49 and data.y == 51 ) or ( data.x == 49 and data.y == 50 ) or ( data.x == 49 and data.y == 49 ) )
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        DialogLeft(g_char.npc2, "story_106001")         -- （L）npc-002：哎？哎？你干啥！？不是说要悄悄的？...
        sw.ShowNode("ccb/object/hintfx", "1", 100, 0, "playerpnt")
        DialogRight(g_char.npc3, "story_106002")        -- （R）npc-003：？？
        DialogRight(g_char.npc3, "story_106003")        -- （R）npc-003：你是个什么东西？是那个鱼人小杂种派你来送死的吗？
        DialogLeft(g_char.npc2, "story_106004")         -- （L）npc-002：...啊，帅哥...我们路过...这就回。
        DialogRight(g_char.npc3, "story_106005")        -- （R）npc-003：哟，既然来了...那我就一定要招待一下客人的呀？哈哈哈哈哈！

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)
        sw.SetPlayerOperable(true)
    end
}

-- 击杀10层BOSS，ID：501000
g_stories[1070] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.result == tBattleResult.WIN and data.mon_id == 501000
    end,

    body = function(self, data)
        sw.SetFunctionUnlock(tFunction.EQUIP_SHOP, true)          -- 解锁装备商人
        sw.SetFunctionUnlock(tFunction.CAMP, true)                -- 解锁营地功能
        sw.SetFunctionUnlock(tFunction.SMITHY, true)              -- 解锁铁匠铺

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc3, "story_107001")        -- （R）npc-003：唔！...真是没想到会栽在你这种无名小辈手里！
        DialogRight(g_char.npc3, "story_107002")        -- （R）npc-003：留得青山在！算我倒霉！！这笔账我一定会找你们算的！

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_107003")         -- （L）npc-002：哇呜！！你居然打败了一个精英勇者VIP！他搞不好是充值了的呀！
        DialogLeft(g_char.npc2, "story_107004")         -- （L）npc-002：你太让我刮目相看了！啊，对了，我们得先去看看被他关起来的小怪兽如何了...

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(200)
        end
    end
}

-- 击杀10层BOSS之后，到达坐标53,50
g_stories[1071] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1070) and tMapInfo.id == 1001 and data.x == 53 and data.y == 50
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        sw.StopPlayerAction()                           -- 停止玩家行动
        sw.CloseWindowViews()                           -- 关闭所有界面

        sw.ShowNode("ccb/object/neo-1", "fun-1", 0, 0, "npcpnt-l")

        -- 延迟 1.5 秒，此过程需要屏蔽玩家操作
        Wait(1.5);

        DialogLeft(g_char.npc2, "story_107101")         -- （L）npc-002：你、你还好吧？刚刚真是吓死我了，哈哈哈哈哈。
        DialogLeft(g_char.npc2, "story_107102")         -- （L）npc-002：都得感谢这...
        DialogRight(g_char.npc10, "story_107103")       -- （R）npc-010：谢谢...我很好，我只是...
        DialogLeft(g_char.npc2, "story_107104")         -- （L）npc-002：没事儿没事儿，别害怕，慢慢说。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc10, "story_107105")       -- （R）npc-010：...我叫<cr=230,65,5>尼奥<cr=def>，来自荒野灯塔，我来这里找我的朋友，一个鱼人，叫哈瓦努，你们认识吗？
        DialogLeft(g_char.npc2, "story_107106")         -- （L）npc-002：哈？努？啊抱歉啊，实在是没什么印象，我每天要接待这样的小怪兽十几二十个...确实记不住了。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc10, "story_107107")       -- （R）npc-010：...这样啊，那我...
        DialogLeft(g_char.npc2, "story_107108")         -- （L）npc-002：嘿！不过你不用担心，你应该到我们的营地去问问，这附近的小怪兽们都在那里聚集，应该能得到你朋友的消息的！
        DialogLeft(g_char.npc2, "story_107109")         -- （L）npc-002：离开这座塔，往东边走你就能到营地了。
        DialogRight(g_char.npc10, "story_107110")       -- （R）npc-010：那这样实在是太感谢了！我就先走一步，再次谢谢你们救了我！

        sw.ShowNode("ccb/object/neo-1", "out", 0, 0, "npcpnt-l")

        DialogLeft(g_char.npc2, "story_107111")         -- （L）npc-002：......
        DialogLeft(g_char.npc2, "story_107112")         -- （L）npc-002：实话说你刚刚可真是吓死我了，我们还是回去缓一缓吧？顺便也看看刚刚那孩子怎么样了？
        DialogLeft(g_char.npc2, "story_107113")         -- （L）npc-002：哈哈哈，我就知道你会同意的！那么我们走吧！

        -- 强制回城
        sw.LeaveTower()

        -- 隐藏neo节点
        sw.SetPlayerOperable(true)
    end
}

-- 击杀10层BOSS之后，返回城镇
g_stories[1080] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1071)
    end,

    body = function(self, data)
        -- 隐藏之前的节点
        sw.HideMask();
        sw.HideNode("ccb/object/finger");
        sw.HideNode("ccb/object/creatfx");

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_108001")         -- （L）npc-001：哟！哟哟哟！没想到啊，这个瘦不拉几的小怪兽还真出人意料啊，居然活到着返回了营地！看来又多一个可以让我压榨的客户了！
        DialogRight(g_char.npc2, "story_108002")        -- （R）npc-002：哈哈哈哈，何止！他刚刚击败了一个精英勇者呢！
        DialogLeft(g_char.npc1, "story_108003")         -- （L）npc-001：是的是的，我听说了。
        DialogLeft(g_char.npc1, "story_108004")         -- （L）npc-001：早些时候到营地里来了一个粉红色的新面孔告诉我的，说是这个小怪兽救了他。
        DialogRight(g_char.npc2, "story_108005")        -- （R）npc-002：是尼奥！他到营地了么？
        DialogLeft(g_char.npc1, "story_108006")         -- （L）npc-001：对，是叫这个名字，而且他还是一位出色的铁匠，还帮我把营地里的那个货摊都修好了...唔，好像差一个售货员，这我可得好好想想...
        DialogLeft(g_char.npc1, "story_108007")         -- （L）npc-001：我表哥太贵...而且还不在家...
        DialogLeft(g_char.npc1, "story_108008")         -- （L）npc-001：阿桐虽然便宜...但是又太笨...
        DialogLeft(g_char.npc1, "story_108009")         -- （L）npc-001：唔...找谁好......
        DialogRight(g_char.npc2, "story_108010")        -- （R）npc-002：好好好，不耽误你挣钱，尼奥在哪儿呢？
        DialogLeft(g_char.npc1, "story_108011")         -- （L）npc-001：应该在营地里，修那个废了很久的火炉子吧...噢！看来要发大财了！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_108012")         -- （L）npc-001：哈，对了，这位小怪兽，点击左下角的蓝色按钮就可以在我这儿和营地之间来回走动，去营地看看吧！

        -- 引导玩家点击营地按钮
        sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 70, y = 70, dw = 150, dh = 150, mw = 130, mh = 130})
        sw.ShowNode("ccb/object/creatfx", "type-13", 70, 70);
        sw.ShowNode("ccb/object/finger", "type-1", 70, 70);
    end
}

-- 初次进入营地
g_stories[1090] =
{
    moment      = "enter camp",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1080)
    end,

    body = function(self, data)
        -- 隐藏之前的节点
        sw.HideMask();
        sw.HideNode("ccb/object/finger");
        sw.HideNode("ccb/object/creatfx");

        sw.PlaySound("event-1-2", false, 99)            -- 播放音效event-1-2，优先级99，不循环

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc2, "story_109001")        -- （R）npc-002：嘿！尼奥~
        DialogLeft(g_char.npc10, "story_109002")        -- （L）npc-010：啊，你们也回来啦。
        DialogRight(g_char.npc2, "story_109003")        -- （R）npc-002：哇哦哦...他把这儿弄得还真不错，走，瞧瞧去！

        -- 引导玩家点击铁匠铺
        sw.ShowMask(true, {file = "image/ui/creat-6-1.png", x = 110, y = 404, dw = 220, dh = 200, mw = 220, mh = 200})
        sw.ShowNode("ccb/object/creatfx", "type-16", 110, 404);
        sw.ShowNode("ccb/object/finger", "type-1", 110, 404);
    end
}

-- 初次打开铁匠铺
g_stories[1100] =
{
    moment      = "open smithy",
    priority    = 90,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1090)
    end,

    body = function(self, data)
        -- 隐藏之前的节点
        sw.HideMask();
        sw.HideNode("ccb/object/finger");
        sw.HideNode("ccb/object/creatfx");

        DialogRight(g_char.npc2, "story_110001")        -- （R）npc-002：怎么样？找到你的鱼人朋友了么？
        DialogLeft(g_char.npc10, "story_110002")        -- （L）npc-010：没、没有，不过有人听说他也去了那个塔里。所以我就干脆在这儿等他吧，我认为他总会到这个营地来的。
        DialogRight(g_char.npc2, "story_110003")        -- （R）npc-002：嗯，这就对了嘛！哎？你这是要把这个<cr=230,65,5>铁匠铺<cr=def>重新开张嘛？

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc10, "story_110004")        -- （L）npc-010：是的。
        DialogLeft(g_char.npc10, "story_110005")        -- （L）npc-010：反正都打算在这里长期呆着了，与其什么也不做，倒不如尽可能帮大伙一些忙，我来介绍一下铁匠铺的大致作用吧，希望能帮到你们！
        DialogRight(g_char.npc2, "story_110006")        -- （R）npc-002：啊，我看这个小怪兽也很感兴趣的样子，你讲。
        DialogLeft(g_char.npc10, "story_110007")        -- （L）npc-010：铁匠铺总体来说，是提升装备属性的地方。

        -- 标记装备强化按钮，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-1-1.png", x = 438, y = 1295, dw = 120, dh = 50})
        sw.ShowNode("ccb/object/creatfx", "type-17", 438, 1295);
        Wait(2);
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();

        DialogLeft(g_char.npc10, "story_110008")        -- （L）npc-010：在<cr=230,65,5>强化<cr=def>选项里，你可以对装备的基础属性进行提升。

        -- 标记装备精炼按钮，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-1-1.png", x = 556, y = 1295, dw = 120, dh = 50})
        sw.ShowNode("ccb/object/creatfx", "type-17", 556, 1295);
        Wait(2);
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();

        DialogLeft(g_char.npc10, "story_110009")        -- （L）npc-010：在<cr=230,65,5>精炼<cr=def>选项里，你可以对装备当前的属性值进行提升至最高值。

        -- 标记装备重铸按钮，持续 2 秒
        sw.ShowMask(true, {file = "image/ui/creat-1-1.png", x = 672, y = 1295, dw = 120, dh = 50})
        sw.ShowNode("ccb/object/creatfx", "type-17", 672, 1295);
        Wait(2);
        sw.HideNode("ccb/object/creatfx");
        sw.HideMask();

        DialogLeft(g_char.npc10, "story_110010")        -- （L）npc-010：在<cr=230,65,5>重铸<cr=def>选项里，你可以把装备的其中一条属性更换掉。另外你可以手动刷新属性池，你每次冒险回来属性池也会刷新。

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc10, "story_110011")        -- （L）npc-010：大概就是这样了，希望你们常来光顾！
        DialogRight(g_char.npc2, "story_110012")        -- （R）npc-002：一定会的，我们也会尽量帮你打听你朋友的消息。
        DialogLeft(g_char.npc10, "story_110013")        -- （L）npc-010：谢谢。
    end
}

-- 关闭铁匠铺，如果背包有空间，则赠送一件道具
g_stories[1110] =
{
    moment      = "close smithy",
    priority    = 5,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1100) and not sw.IsPackageFull()
    end,

    body = function(self, data)
        DialogLeft(g_char.npc10, "story_111001")        -- （L）npc-010：请收下这个！上次你救了我，无以言谢！

        -- 1120脚本如果还未执行，则置为已完成状态
        if not sw.IsStoryFinished(1120) then
            sw.SetStoryFinished(1120, true)
        end

        -- 给玩家赠送道具，ID：400102，数量：1，幻变的祝福宝珠：强化成功率+7%
        sw.AddItemToPackage(400102, nil, 1)
    end
}

-- 关闭铁匠铺，如果背包无空间，提示玩家清理背包
g_stories[1120] =
{
    moment      = "close smithy",
    priority    = 5,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return not sw.IsStoryFinished(1110) and sw.IsPackageFull()
    end,

    body = function(self, data)
        DialogLeft(g_char.npc10, "story_112001")        -- （L）npc-010：你清理一下背包再来找我吧？我有些礼物要送给你。
    end
}

-- 从营地返回主界面
g_stories[1130] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1090)
    end,

    body = function(self, data)
        sw.PlayBGM("tower-1")                           -- 播放背景音乐tower-1

        -- 在npcpnt01节点内加入dogia-1.ccbi，并播放其in时间轴
        sw.ShowNode("ccb/object/dogia-1", "in", 0, 0, "npcpnt01")

        -- 延迟 3.5 秒，此过程需要屏蔽玩家操作
        Wait(3.5)

        DialogRight(g_char.npc11, "story_113001")       -- （R）npc-011：嘿，你们好啊？
        DialogLeft(g_char.npc2, "story_113002")         -- （L）npc-002：？
        DialogRight(g_char.npc11, "story_113003")       -- （R）npc-011：对，就是这个小怪兽。嚯，你小子潜力不错啊！我都听哥布林老板讲了，很久都没来过这么有意思的小怪兽了。
        DialogLeft(g_char.npc2, "story_113000")        -- （L）npc-002：这位是？
        DialogLeft(g_char.npc1, "story_113004")         -- （L）npc-001：一个常来喝酒的客人，而且...
        DialogRight(g_char.npc11, "story_113005")       -- （R）npc-011：什么"常来喝酒的客人"？你太见外了咕叽老板。我叫<cr=230,65,5>多吉亚•托托利<cr=def>，酷炫的浪子游侠！很希望能认识你们！哦哈哈哈哈哈！
        DialogLeft(g_char.npc2, "story_113006")         -- （L）npc-002：...你好。
        DialogRight(g_char.npc11, "story_113007")       -- （R）npc-011：哦哈哈哈哈哈哈哈

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_113008")       -- （R）npc-011：嗝儿...
        DialogRight(g_char.npc11, "story_113009")       -- （R）npc-011：...我很欣赏这个小怪兽，我希望他能成为我的小弟，帮我调查一些事情！对，调查一些事情。
        DialogRight(g_char.npc11, "story_113010")       -- （R）npc-011：如你们所知，像他这样的小怪兽前赴后继的去救魔王，大多数都有去无回。可问题，就在"有去无回"上，活不见人，死不见尸，你们不觉得很奇怪吗？
        DialogRight(g_char.npc11, "story_113011")       -- （R）npc-011：好，小弟！这事儿就拜托你去调查一下啦！作为你的老大，我教你几招，到塔里你也可以更顺利的完成任务！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_113012")       -- （R）npc-011：看好了！

        -- 播放dogia-1的fun-1时间轴
        sw.ShowNode("ccb/object/dogia-1", "fun-1", 0, 0, "npcpnt01")

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        sw.PlaySound("levelup", false, 99)              -- 播放音效levelup，优先级99，不循环

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_113013")       -- （R）npc-011：哈哈哈哈哈，老大已经传授了1个新的<cr=230,65,5>技能点<cr=def>给你，不用崇拜我！谁叫你是我的小弟呢！

        sw.AddSkillPoint(1)                             -- 获得技能点 × 1

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_113014")       -- （R）npc-011：好，那我先去忙别的去了，一有消息回营地联络！嗝儿...
        DialogRight(g_char.npc11, "story_113015")       -- （R）npc-011：今天这酒！喝得值！哈哈哈哈哈哈哈......

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        -- dogia-1播放out时间轴
        sw.ShowNode("ccb/object/dogia-1", "out", 0, 0, "npcpnt01")

        -- 延迟 2.5 秒，此过程需要屏蔽玩家操作
        Wait(2.5);

        DialogLeft(g_char.npc2, "story_113016")         -- （L）npc-002：......
        DialogLeft(g_char.npc2, "story_113017")         -- （L）npc-002：所以...你是答应了吗？
        DialogLeft(g_char.npc2, "story_113018")         -- （L）npc-002：还有，他到底是谁？大叔。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_113019")         -- （L）npc-001：一个常来喝酒的客人...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_113020")         -- （L）npc-001：而且...已经欠了6次酒钱了...（手动微笑）

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc2, "story_113021")        -- （R）npc-002：...看你兴致勃勃的样子。检查一下新的技能点，收拾一下我们就出发吧。

        sw.PlayBGM("main-1")                            -- 播放背景音乐tower-1
        sw.PlaySound("qte-1", false, 99)
    end
}

-- 再次点击塔，出现 2-1 选项
g_stories[1140] =
{
    moment      = "tower list",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1080)
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_114001")         -- （L）npc-002：突然发现，你已经可以选择从传送到2-1开始冒险了。
        DialogLeft(g_char.npc2, "story_114002")         -- （L）npc-002：随着你的冒险的距离越远，当然能直接传送过去的地方就会越多。你希望从哪儿开始你新的冒险，你就选哪个就好了。
    end,
};

-- 进入塔内，到达2-1层
g_stories[1150] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1140) and data.map_id == 11
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_115001")         -- （L）npc-002：呼...调查失踪的怪兽？营救魔王？
        DialogLeft(g_char.npc2, "story_115002")         -- （L）npc-002：似乎并不冲突，一起干吧。
        DialogLeft(g_char.npc2, "story_115003")         -- （L）npc-002：不过你得小心了，我发现这里灼烧的情况越来越严重，而且真的很不像"灼烧"呢...
    end,
};

-- 击杀小劣魔，ID：101006
g_stories[1160] =
{
    moment      = "battle end",
    priority    = 2,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.result == tBattleResult.WIN and data.mon_id == 101006
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_116001")         -- （L）npc-002：这些游荡的小劣魔...有些奇怪。
        DialogLeft(g_char.npc2, "story_116002")         -- （L）npc-002：我记得之前好像就有看到他们袭击尼奥。
    end
}

-- 击杀随机怪物
g_stories[1170] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tMapInfo.id >= 14 and tMapInfo.id <= 20 and tPlayerInfo.cur_mp / tPlayerInfo.max_mp <= 0.3
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_117001")         -- （L）npc-002：敌人似乎越来越强了，在他们背后肯定有很大的力量在加持。不要去做太勉强的事情哦！
        DialogLeft(g_char.npc2, "story_117002")         -- （L）npc-002：不过呢，看到你这么专注，也会慢慢喜欢跟你在一起的感觉啦！哈哈哈哈哈，笨蛋，当然不是表白！
    end
}

-- 场景元件交互：瓦罐
g_stories[1180] =
{
    moment      = "touch object",
    priority    = 3,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id >= 16 and tMapInfo.id <= 20 and data.obj == tSceneObj.CROCK
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_118001")         -- （L）npc-002：哎？里面有张图？画得可真是太那啥了...
        DialogLeft(g_char.npc2, "story_118002")         -- （L）npc-002：落款是：酷炫的浪子游侠？...嗯，好像在哪儿听过这个名字。

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        sw.ShowNode("ccb/object/window-900002", "open", 0, 0, "fxcenter")

    end
}

-- 进入 2-10 层
g_stories[1190] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 20
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc1, "story_119001")        -- （R）npc-001：小不点？小怪兽？
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc1, "story_119002")        -- （R）npc-001：小怪兽是你们吗！？...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_119003")         -- （L）npc-002：哈！？什么个情况？咕叽大叔的声音？
        DialogLeft(g_char.npc2, "story_119004")         -- （L）npc-002：咕叽大叔？你在哪儿啊？
        DialogRight(g_char.npc1, "story_119005")        -- （R）npc-001：我就在这层楼...我也不知道我在哪儿！附近好多肌肉勇者，我躲在角落里，好害怕啊！你们快来救我！...
        DialogLeft(g_char.npc2, "story_119006")         -- （L）npc-002：真是头大！你躲好！
    end
}

-- 点击 2-10 层哥布林旅行商人
g_stories[1200] =
{
    moment      = "touch object",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1190) and data.obj == tSceneObj.BUSINESSMAN
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_120001")         -- （L）npc-002：你好好在营地里呆着挣金币不好，跑这里来做啥？把自己当外卖送给勇者吗？
        DialogRight(g_char.npc1, "story_120002")        -- （R）npc-001：哎...我这不是想从魔法学院把小桐那丫头找回来帮我看店嘛！结果半路那个笨蛋走丢了，我就去找他，然后我也走丢了...
        DialogRight(g_char.npc1, "story_120003")        -- （R）npc-001：顺便我也淘了点好东西回去卖，要买点啥不？小怪兽？
        DialogLeft(g_char.npc2, "story_120004")         -- （L）npc-002：找到了就赶紧回去，别当一个有命挣钱没命花的哥布林商人...
        DialogRight(g_char.npc1, "story_120005")        -- （R）npc-001：哈哈哈哈，我知道啦，我再呆一会儿就走，你们先忙你们的去。
    end
}

-- 与营地中的哥布林商人进行交互，如果背包无空间，提示玩家清理背包
g_stories[1205] =
{
    moment      = "open shop",
    priority    = 5,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(1200) and sw.IsStoryFinished(1260) and data.storage == 1 and sw.IsPackageFull()
    end,

    body = function(self, data)
        DialogLeft(g_char.npc1, "story_112001")        -- （L）npc-010：你清理一下背包再来找我吧？我有些礼物要送给你。
    end
}

-- 与营地中的哥布林商人进行交互
g_stories[1210] =
{
    moment      = "open shop",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1200) and sw.IsStoryFinished(1260) and data.storage == 1 and not sw.IsPackageFull()
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_121001")         -- （L）npc-001：呐，我不是那种小气的哥布林啊！我记得有一次你在塔里救过我，这些送给你，就当是报答你啦！
        DialogLeft(g_char.npc1, "story_121002")         -- （L）npc-001：谢、谢谢...
        DialogLeft(g_char.npc1, "story_121003")         -- （L）npc-001：好！两清了！

        -- 获得钻石 × 150
        sw.AddDiamond(150)
        Wait(0.5)
        sw.AddItemToPackage(400072)
        sw.PlaySound("qte-1", false, 99)
        sw.SetStoryFinished(1205, true)
    end
}

-- 进入BOSS之前的准备地图1102
g_stories[1220] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1102
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_122001")         -- （L）npc-002：等等！

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_122002")         -- （L）npc-002：魂精灵的本能...前面有一股非常危险而强大的能量再弥漫...或许你将面对和辛德拉尔一样强大的敌人！

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_122003")         -- （L）npc-002：不......
        DialogLeft(g_char.npc2, "story_122004")         -- （L）npc-002：......比辛德拉尔强大的多，请务必小心！
    end
}

-- 进入BOSS地图1002
g_stories[1230] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1002
    end,

    body = function(self, data)
        sw.SetFunctionUnlock(tFunction.CAMP_SHOP, true)           -- 黑市功能解锁
        sw.ShowNode("ccb/object/dogia-1", "stand", 0, 0, "npcpnt-10021")
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_123001")         -- （L）npc-002：这里似乎是一个大型的塔楼阳台...
        DialogLeft(g_char.npc2, "story_123002")         -- （L）npc-002：唔...这里就是那种"灼烧"感的源头，一定是的！
    end
}

-- 进入第 2 个BOSS关卡，到达坐标49,47
g_stories[1240] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1230) and tMapInfo.id == 1002 and data.x == 49 and data.y == 47
    end,

    body = function(self, data)
        sw.StopPlayerAction()                           -- 停止玩家行动
        sw.CloseWindowViews()                           -- 关闭所有界面

        DialogRight(g_char.npc11, "story_124001")       -- （R）npc-011：？？

        sw.ShowNode("ccb/object/dogia-1", "stand2", 0, 0, "npcpnt-10021")

        DialogRight(g_char.npc11, "story_124002")       -- （R）npc-011：嘿，我的小弟！你也调查到这里来啦？我检查过了，这里什么也没有，没有活人，没有尸体。
        DialogRight(g_char.npc11, "story_124003")       -- （R）npc-011：嗯...非要说的话，有点热？
        DialogLeft(g_char.npc2, "story_124004")         -- （L）npc-002：有点热？大厅里都焚烧了很久了。
        DialogRight(g_char.npc11, "story_124005")       -- （R）npc-011：哈，是嘛，不过我现在只关心怪兽去向的问题。我继续调查去啦！你也要加油哦，小弟！老大我先走一步！

        sw.ShowNode("ccb/object/dogia-1", "stand", 0, 0, "npcpnt-10021")

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_124006")       -- （R）npc-011：（遥远的喊声）对了~~~~咕叽让我告诉你~~~~他那个魅魔<cr=230,65,5>小桐<cr=def>找到啦~~~~已经回去到营地上班啦~~~~

        DialogLeft(g_char.npc2, "story_124007")         -- （L）npc-002：......

        Sleep(0.5)

        sw.ShowNode("ccb/object/dogia-1", "out", 0, 0, "npcpnt-10021")

    end
}

-- 进入第 2 个BOSS关卡，到达坐标49,53
g_stories[1250] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1240) and tMapInfo.id == 1002 and data.x == 49 and data.y == 53
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        DialogLeft(g_char.npc2, "story_125001")         -- （L）npc-001：嗯？这有个头冠？...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc4, "story_125002")        -- （R）npc-004：愚蠢的恶魔！！
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        DialogLeft(g_char.npc2, "story_125003")         -- （L）npc-002：谁？！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc4, "story_125004")        -- （R）npc-004：你的恶行辛德拉尔已经告诉我了！
        DialogLeft(g_char.npc2, "story_125005")         -- （L）npc-002：到底是谁在说话！你是让这个地方焚烧起来的吧！

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc4, "story_125006")        -- （R）npc-004：焚烧？这是天堂的神圣之火！只有你们这些散发着恶臭、生着脓疮的魔鬼才会惧怕这种正义的火焰！
        DialogRight(g_char.npc4, "story_125007")        -- （R）npc-004：而你袭击了我的侍卫！释放了我们千里迢迢追击到此的重要线索，让恶魔逃避了他应得的审判！
        DialogLeft(g_char.npc2, "story_125008")         -- （L）npc-002：所以你到底想干什么啊，说了这么多！听不懂啊大哥！
        DialogRight(g_char.npc4, "story_125009")        -- （R）npc-004：现在！我判你和你的同党有罪！我卡夫•赛德尔曼，将以圣光的名义将你烧成灰烬！！
        DialogRight(g_char.npc4, "story_125010")        -- （R）npc-004：正义之名！吾必守护！！
        sw.SetPlayerOperable(true)
    end
}

-- 击杀怪物，ID：501001
g_stories[1260] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.result == tBattleResult.WIN and data.mon_id == 501001
    end,

    body = function(self, data)
        sw.SetStoryFinished(1010, true)
        sw.SetStoryFinished(1020, true)
        sw.SetStoryFinished(1030, true)
        sw.SetStoryFinished(1040, true)
        sw.SetStoryFinished(1050, true)
        sw.SetStoryFinished(1060, true)
        sw.SetStoryFinished(1070, true)
        sw.SetStoryFinished(1071, true)
        sw.SetStoryFinished(1080, true)
        sw.SetStoryFinished(1100, true)
        sw.SetStoryFinished(1110, true)
        sw.SetStoryFinished(1120, true)
        sw.SetStoryFinished(1130, true)
        sw.SetStoryFinished(1140, true)
        sw.SetStoryFinished(1150, true)
        sw.SetStoryFinished(1160, true)
        sw.SetStoryFinished(1170, true)
        sw.SetStoryFinished(1190, true)
        sw.SetStoryFinished(1200, true)
        sw.SetStoryFinished(1220, true)
        sw.SetStoryFinished(1230, true)
        sw.SetStoryFinished(1240, true)
        sw.SetStoryFinished(1250, true)

        DialogLeft(g_char.npc2, "story_126001")         -- （L）npc-002：不要随随便便的就给别人定罪啊！
        DialogRight(g_char.npc4, "story_126002")        -- （R）npc-004：失之我幸，得之我命...
        DialogRight(g_char.npc4, "story_126003")        -- （R）npc-004：...<cr=230,65,5>芙蕾雅之泪<cr=def>！
        DialogRight(g_char.npc4, "story_126004")        -- （R）npc-004：......不、不！就算死！我也不能变成弟弟那样！！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_126005")         -- （L）npc-002：...他似乎被自己的神圣之火反噬了，作茧自缚吧。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_126006")         -- （L）npc-002：芙蕾雅...之泪...？

        sw.ShowNode("ccb/object/chapterfx-1", "end", 0, 0, "fxcenter")

        -- 延迟 4 秒，此过程需要屏蔽玩家操作
        Wait(4)

        DialogLeft(g_char.npc2, "story_126007")         -- （L）npc-002：嗯，随着这个圣骑士的死去，神圣之火带来的灼烧温度也慢慢冷却了下来，不过这跟怪物失踪的关系应该不大。
        DialogLeft(g_char.npc2, "story_126008")         -- （L）npc-002：我们继续走吧。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_126009")         -- （L）npc-002：对了，顺便说一下，你刚刚打败的是一个领主级别的圣骑士勇者...而之前从来没有任何一个小怪兽能做到。
        DialogLeft(g_char.npc2, "story_126010")         -- （L）npc-002：你真的非常特别！

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(200)
        end
    end
}

-- 进入 3-1
g_stories[1270] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        return data.map_id == 21
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_127001")         -- （L）npc-002：这里就是魔法学院了。
        DialogLeft(g_char.npc2, "story_127002")         -- （L）npc-002：魔法学院原本是一个中立的组织，所以这里也会有很多学习魔法的勇者，请一定注意。
    end
}

-- 在 3-2 之上击杀任意怪物
g_stories[1280] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id >= 22 and tMapInfo.id <= 30 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_128001")         -- （L）npc-002：等等。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_128002")         -- （L）npc-002：他身上，好像有...
        DialogLeft(g_char.npc2, "story_128003")         -- （L）npc-002：...这是什么东西？写得不清不楚的。

        sw.ShowNode("ccb/object/window-900003", "open", 0, 0, "fxcenter")

    end
}

-- 在 1280 任务之后，击杀任意怪物，并且玩家回城能量满，自动为玩家回城
g_stories[1290] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1280) and data.map_id >= 23 and data.map_id <=30
    end,


body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_129001")         -- （L）npc-002：嗯？你说刚刚那个改造日记可能和尼奥的朋友有关系？

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_129002")         -- （L）npc-002：啊！对对对！他的朋友就叫哈瓦努啊！
        DialogLeft(g_char.npc2, "story_129003")         -- （L）npc-002：那么还是赶紧回去吧！走！

        sw.SetStoryFinished(1291, true)
        -- 强制回城
        sw.LeaveTower()
    end
}


-- 在 1290 任务之后，进入主界面时
g_stories[1293] =
{
    moment      = "enter main",
    priority    = 98,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(1290) or sw.IsStoryFinished(1291)
    end,

    body = function(self, data)
        -- fix: 容错处理
        if (sw.IsStoryFinished(1310)) then
            sw.SetStoryFinished(1293, true);
        else
            -- 引导玩家点击营地按钮
            sw.ShowMask(true, {file = "image/ui/creat-4-1.png", x = 70, y = 70, dw = 150, dh = 150, mw = 130, mh = 130})
            sw.ShowNode("ccb/object/creatfx", "type-13", 70, 70);
            sw.ShowNode("ccb/object/finger", "type-1", 70, 70);
        end
    end
}

-- 击杀怪物，ID：102004
g_stories[1300] =
{
    moment      = "battle end",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.mon_id == 102004 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_130001")         -- （L）npc-002：座狼？
        DialogLeft(g_char.npc2, "story_130002")         -- （L）npc-002：为什么这些野兽也和勇者这么亲近？嗯...
    end
}

-- 在 1293 任务之后，回到营地
g_stories[1310] =
{
    moment      = "enter camp",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1280)
    end,

    body = function(self, data)
        -- 隐藏之前的节点
        sw.HideMask();
        sw.HideNode("ccb/object/finger");
        sw.HideNode("ccb/object/creatfx");

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc2, "story_131001")        -- （R）npc-002：尼奥，找到哈瓦努的线索了！一封日记！
        DialogLeft(g_char.npc10, "story_131002")        -- （L）npc-010：哈！？我看看

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        DialogLeft(g_char.npc10, "story_131003")        -- （L）npc-010：改造日记？...落款是，阿鲁巴斯？！
        DialogRight(g_char.npc2, "story_131004")        -- （R）npc-002：嗯？你认识？
        DialogLeft(g_char.npc10, "story_131005")        -- （L）npc-010：唔...他是兄弟会会长的男朋友，他是一个疯狂的外科医生，热衷于对改造各种各样的"东西"。如果哈瓦努跟他在一起，应该是没什么危险。但是没人知道怎么找到黑暗医生的实验室。

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc10, "story_131006")        -- （L）npc-010：我得托人去兄弟会问问，虽然很远。也请你帮我继续打探一下阿鲁巴斯的去向！感谢！

        sw.SetStoryFinished(1293, true)
        sw.SetStoryFinished(1290, true)
    end
}

-- 在 1310 任务之后，返回主界面
g_stories[1320] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1310)
    end,

    body = function(self, data)

        sw.ShowNode("ccb/object/dogia-1", "stand", 0, 0, "npcpnt01")

        -- 延迟 1.5 秒，此过程需要屏蔽玩家操作
        Wait(1.5)

        DialogRight(g_char.npc11, "story_132001")       -- （R）npc-011：阿鲁巴斯。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_132002")       -- （R）npc-011：亦正亦邪的黑暗医生...不过比起这个，关于怪兽失踪的事情，我有了进展，调查到一个叫做芙蕾...
        DialogLeft(g_char.npc2, "story_132003")         -- （L）npc-002：芙蕾雅之泪。
        DialogRight(g_char.npc11, "story_132004")       -- （R）npc-011：啊，对，你也查到了？
        DialogLeft(g_char.npc2, "story_132005")         -- （L）npc-002：不，只是听到过这个名字而已。
        DialogRight(g_char.npc11, "story_132006")       -- （R）npc-011：不错不错！不愧是我的小弟！哈哈哈哈哈哈，那么就继续顺着这个往下查吧！
        sw.ShowNode("ccb/object/dogia-1", "out", 0, 0, "npcpnt01")
        DialogLeft(g_char.npc1, "story_132007")         -- （L）npc-001：别走！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_132008")         -- （L）npc-001：...酒钱。
    end
}

-- 进入地图 26 层以上
g_stories[1330] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1320) and data.map_id >= 26 and data.map_id <=30
    end,

    body = function(self, data)
        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogLeft(g_char.npc2, "story_133001")         -- （L）npc-002：就算是魔法学院看来也是有不少的冲突的，各种魔法元素的对抗，使得空气好像都带着电流一样。
        DialogLeft(g_char.npc2, "story_133002")         -- （L）npc-002：啊？没没、没，我就感慨一下，哈哈哈哈。
        DialogLeft(g_char.npc2, "story_133003")         -- （L）npc-002：不过话说回来，你要多多注意附近的陷阱哦，越来越密集了。
    end
}

-- 进入第 3 个BOSS地图（本任务流程不影响玩家操作）
g_stories[1340] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1330) and data.map_id == 1003
    end,

    body = function(self, data)
        Wait(0.5)

        DialogRight(g_char.npc6, "story_134001") -- （R）npc-006：很快就会有更多的怪兽送过来，上尉，我先去处理那个大的了。

        Wait(0.5)

        DialogRight(g_char.npc5, "story_134002") -- （R）npc-005：了解，慢走。

        Wait(0.5)

        sw.PlaySound("resurrection-1", false, 99)              -- 播放音效hit-8-1，优先级99，不循环

        Wait(1)

        DialogLeft(g_char.npc2, "story_134003") -- （L）npc-002：失踪的怪兽？不用猜也知道这里有事儿了...

        sw.ShowNode("ccb/object/chapterfx-2", "1", 0, 0, "fxcenter")

        Wait(4)

        sw.SetDialogCanTouch("left", false);
        sw.SetDialogCanTouch("right", false);

        DialogRightNoBlock(g_char.npc5, "story_134004") -- （R）npc-005：有客人？我们这里没有探监服务。现身吧！入侵者！

        Sleep(3)

        HideAllDialogs()

        sw.SetDialogCanTouch("left", true);
        sw.SetDialogCanTouch("right", true);
end
}

-- 击杀第 3 个BOSS，ID：502000
g_stories[1350] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1340) and data.mon_id == 502000 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        DialogRight(g_char.npc5, "story_135001")        -- （R）npc-005：战况分析，劣势，进行战术撤退。
        DialogRight(g_char.npc5, "story_135002")        -- （R）npc-005：看样子你们是真的高兴得太早了，虚空九头龙会解决掉你们的。
        DialogLeft(g_char.npc2, "story_135003")         -- （L）npc-002：嘴硬什么虚空九头龙！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc5, "story_135004")        -- （R）npc-005：不过真是有些尴尬，我居然要和阿鲁巴斯的改造生物并肩作战。
        DialogLeft(g_char.npc2, "story_135005")         -- （L）npc-002：阿鲁巴斯！？你、站住！

        sw.PlaySound("resurrection-1", false, 99)              -- 播放音效hit-8-1，优先级99，不循环

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        DialogLeft(g_char.npc2, "story_135006")         -- （L）npc-002：跑掉了...

        Wait(0.5)

        sw.ShowNode("ccb/object/bxbsfx-1", "stand", 0, 0, "npcpnt-10031")
        sw.PlaySound("qte-2", false, 99)                -- 播放音效qte-2，优先级99，不循环

        Wait(0.5)

        DialogLeft(g_char.npc19, "story_135007")        -- （L）npc-019：......

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc2, "story_135008")        -- （R）npc-002：？？
        DialogLeft(g_char.npc19, "story_135009")        -- （L）npc-022：（仓促逃走）

        sw.ShowNode("ccb/object/bxbsfx-1", "fun-1", 0, 0, "npcpnt-10031")

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        DialogRight(g_char.npc2, "story_135010")        -- （R）npc-002：似乎是牢房里的小怪兽逃出来了...
        sw.PlaySound("resurrection-1", false, 99)              -- 播放音效hit-8-1，优先级99，不循环

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(200)
        end
    end
}

-- 进入塔中任何一层
g_stories[1360] =
{
    moment      = "entered tower",
    priority    = 90,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1320)
    end,

    body = function(self, data)
        sw.SetStoryFinished(1361, true)

        -- 隐藏主界面的dogia节点

    end
}

-- 进入营地
g_stories[1361] =
{
    moment      = "entered camp",
    priority    = 90,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1320)
    end,

    body = function(self, data)
        sw.SetStoryFinished(1360, true)

        -- 隐藏主界面的dogia节点

    end
}

-- 击杀怪物，ID：102007 或 102008
g_stories[1370] =
{
    moment      = "battle end",
    priority    = 80,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return ( data.mon_id == 102007 or data.mon_id == 102008 ) and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_137001")         -- （L）npc-002：看来这些勇者不仅仅是关押怪兽们！还在奴役其中一些有战斗力的怪兽！
        DialogLeft(g_char.npc2, "story_137002")         -- （L）npc-002：我们得尽快和回去给多吉亚说这个事情，这大概就是他在调查的怪兽失踪事件的核心！
    end
}

-- 在 1350 任务之后，回到主界面
g_stories[1380] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1350)
    end,

    body = function(self, data)
        sw.SetStoryFinished(1370, true)

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(1)
        sw.PlayBGM("tower-1")                           -- 播放背景音乐tower-1
        sw.ShowNode("ccb/object/dogia-1", "in", 0, 0, "npcpnt01")
        Wait(1)

        DialogLeft(g_char.npc2, "story_138001")         -- （L）npc-002：怪兽失踪的事情有很大进展了！多吉亚！
        DialogRight(g_char.npc11, "story_138002")       -- （R）npc-011：好样的！小弟，说来听听！
        DialogLeft(g_char.npc2, "story_138003")         -- （L）npc-002：在魔法学院上面发现了很大的一个监狱，关押着许多怪兽，我们已经救了那些怪兽，但看样子，他们还在别处关押着更多的怪兽，至于勇者们想要做什么，暂时还不清楚。

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc11, "story_138004")       -- （R）npc-011：唔...那我就再顺着这个情报继续往下看看。
        Wait(0.5)
        DialogRight(g_char.npc11, "story_138005")       -- （R）npc-011：哦？小弟！看样子你又得到了提升，我再教你一招吧！希望你再接再厉！

        -- 播放dogia-1的fun-1时间轴
        sw.ShowNode("ccb/object/dogia-1", "fun-1", 0, 0, "npcpnt01")

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        sw.PlaySound("levelup", false, 99)              -- 播放音效levelup，优先级99，不循环

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_138006")       -- （R）npc-011：你又获得了1个额外的<cr=230,65,5>技能点<cr=def>。我先去调查去啦！

        sw.ShowNode("ccb/object/dogia-1", "out", 0, 0, "npcpnt01")

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_138007")         -- （L）npc-001："小弟"
        DialogLeft(g_char.npc1, "story_138008")         -- （L）npc-001：营地里新来了几个朋友，说是之前你在紫罗兰监狱救下来的。去看看？
        sw.PlayBGM("main-1")                           -- 播放背景音乐main-1
        sw.AddSkillPoint(1)                             -- 获得技能点 × 1
        sw.PlaySound("qte-1", false, 99)
    end
}

-- 在 1380 任务之后，回到营地
g_stories[1390] =
{
    moment      = "enter camp",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1380)
    end,

    body = function(self, data)
        sw.SetFunctionUnlock(tFunction.INLAY, true)               -- 镶嵌功能解锁

        -- 显示fallen节点
        -- 显示feona节点

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        sw.ShowNode("ccb/object/feona-1", "stand", 0, 0, "npcpnt-feona")
        Wait(1)

        DialogRight(g_char.npc16, "story_139001")       -- （R）npc-016：听我的同学说魔法学院出事儿了？感谢你救下我的同学们！
        DialogLeft(g_char.npc2, "story_139002")         -- （L）npc-002：具体的我也不太清楚，不过好像有很多怪兽被奴役或者被关起来了...
        DialogRight(g_char.npc16, "story_139003")       -- （R）npc-016：听菲欧娜说，还有更多的同学被他们带走了，往塔顶的方向！请你也一定去调查，感谢！

        Wait(1)

        DialogRight(g_char.npc9, "story_139004")        -- （R）npc-009：如果发现我们的同学！请救救他们！
        DialogLeft(g_char.npc2, "story_139005")         -- （L）npc-002：具体的我也不太清楚，不过好像有很多怪兽被奴役或者被关起来了...
        DialogRight(g_char.npc9, "story_139006")        -- （R）npc-009：感谢！
        DialogRight(g_char.npc16, "story_139007")       -- （R）npc-016：给您添麻烦了！

        Wait(1)

        DialogLeft(g_char.npc19, "story_139008")        -- （L）npc-019：......
        DialogRight(g_char.npc2, "story_139009")        -- （R）npc-002：哟尼奥！...你旁边这位是？
        DialogLeft(g_char.npc19, "story_139010")        -- （L）npc-019：毕。
        DialogLeft(g_char.npc10, "story_139011")        -- （L）npc-010：这也是小桐的同学，也是你们救下的。他在魔法学院是学习宝石镶嵌的，所以就让他和我一起待在这里啦。
        DialogLeft(g_char.npc10, "story_139012")        -- （L）npc-010：以后你们如果需要对装备镶嵌宝石，可以找他呢！
        DialogRight(g_char.npc2, "story_139013")        -- （R）npc-002：好的，大家都加油吧！
   end
}


--1391
g_stories[1391] =
{
    moment      = "enter camp",
    priority    = 1,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(1390)
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/feona-1", "stand", 0, 0, "npcpnt-feona")
    end
}


-- 在 1390 任务之后，进入第 4 个BOSS关卡前的准备房间
g_stories[1400] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1390) and data.map_id == 1104
    end,

    body = function(self, data)

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc14, "story_140001")       -- （R）npc-014：终于有人来了！封印解除了！

        sw.ShowNode("ccb/object/lich-1", "in", 0, 0, "npcpnt-10041")
        sw.PlayBGM("tower-6")

        DialogLeft(g_char.npc2, "story_140002")         -- （L）npc-002：哈？你是？
        DialogRight(g_char.npc14, "story_140003")       -- （R）npc-014：我是西希•赛德尔曼，是一名巫妖。勇者们把我封印在这里吸取我的魔能为他们的浮空岛提供能量！你们无意进入这个房间，打破了封印平衡...封印也就失效了。
        DialogRight(g_char.npc14, "story_140004")       -- （R）npc-014：现在我自由啦！
        DialogLeft(g_char.npc2, "story_140005")         -- （L）npc-002：等等，吸取魔能？浮空岛？他们要做什么？
        DialogRight(g_char.npc14, "story_140006")       -- （R）npc-014：为他们的基地——索纳塔尔格提供能源。还有很多怪兽被吸干而死去...
        DialogLeft(g_char.npc2, "story_140007")         -- （L）npc-002：原来...！！怪兽失踪！他们是被囚禁起来准备被献祭！终于明白了！
        DialogRight(g_char.npc14, "story_140008")       -- （R）npc-014：虽然你是无意进入，但是谢谢你，复仇时间到了！可恶的勇者！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc14, "story_140009")       -- （R）npc-014：另外，我们虽然没见过，但是我能感受到我哥哥的灵魂被自己的欲望吞噬...是你们打败了他。
        DialogRight(g_char.npc14, "story_140010")       -- （R）npc-014：如果你有时间的话，帮我调查三处地方，或许我能教你一些炼金术！
        DialogRight(g_char.npc14, "story_140011")       -- （R）npc-014：<cr=230,65,5>钢铁武器库<cr=def>。

        sw.ShowNode("ccb/object/lich-1", "out", 0, 0, "npcpnt-10041")

        DialogRight(g_char.npc14, "story_140012")       -- （R）npc-014：<cr=230,65,5>钢铁锻造厂<cr=def>。
        DialogRight(g_char.npc14, "story_140013")       -- （R）npc-014：（渐远的声音）<cr=230,65,5>塔顶红水晶<cr=def>，我会用灵魂连接和你保持联系...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_140014")         -- （L）npc-002：......
        sw.PlayBGM("tower-5")

        -- 隐藏lich节点

    end
}


-- 在 1400 任务之后，进入第 4 个BOSS关卡（本任务流程不影响玩家操作）
g_stories[1410] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1004
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc6, "story_141001") -- （R）npc-006：无知的蝼蚁，居然跟过来了...
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        Wait(1)
        DialogLeft(g_char.npc2, "story_141002")  -- （L）npc-002：你就是之前在监狱里主导这个事件的恶棍！？休想逃走！
        DialogRight(g_char.npc6, "story_141003") -- （R）npc-006：逃？哈哈哈？逃？？我确实要"逃"！哈哈哈哈哈！！
    end
}

-- 在 1410 任务之后，进入与第 4 个BOSS的战斗（本任务流程不影响玩家操作）
g_stories[1420] =
{
    moment      = "boss appear",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return data.mon_id == 502001
    end,

    body = function(self, data)
        sw.SetDialogCanTouch("left", false);
        sw.SetDialogCanTouch("right", false);
        DialogRightNoBlock(g_char.npc6, "story_142001") -- （R）npc-006：因为碾碎你们根本不需要我亲自动手！我的一条狗就足以让你们灰飞烟灭！

        -- 延迟 3 秒
        Sleep(3)

        -- 关闭对话框
        HideAllDialogs()

        DialogRightNoBlock(g_char.npc6, "story_142002") -- （R）npc-006：感受一下你们自己的杰作吧！被铁链锁住的恶魔啊！听从我的召唤！干掉你的同类！起来..起来！！

        -- 延迟 3 秒
        Sleep(3)

        -- 关闭对话框
        HideAllDialogs()


        DialogRightNoBlock(g_char.npc6, "story_142003") -- （R）npc-006：起来吧！！虚空九头龙！！

        -- 延迟 3 秒
        Sleep(3)

        -- 关闭对话框
        HideAllDialogs()
        sw.SetDialogCanTouch("left", true);
        sw.SetDialogCanTouch("right", true);
    end
}

-- 击杀第 4 个BOSS，ID：502001
g_stories[1430] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1420) and data.mon_id == 502001 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        sw.SetStoryFinished(1260, true)
        sw.SetStoryFinished(1270, true)
        sw.SetStoryFinished(1280, true)
        sw.SetStoryFinished(1290, true)
        sw.SetStoryFinished(1291, true)
        sw.SetStoryFinished(1293, true)
        sw.SetStoryFinished(1300, true)
        sw.SetStoryFinished(1310, true)
        sw.SetStoryFinished(1321, true)
        sw.SetStoryFinished(1330, true)
        sw.SetStoryFinished(1340, true)
        sw.SetStoryFinished(1350, true)
        sw.SetStoryFinished(1360, true)
        sw.SetStoryFinished(1361, true)
        sw.SetStoryFinished(1380, true)
        sw.SetStoryFinished(1390, true)
        sw.SetStoryFinished(1400, true)
        sw.SetStoryFinished(1410, true)
        sw.SetStoryFinished(1420, true)

        sw.PlayBGM("tower-1")                           -- 播放背景音乐tower-1

        sw.ShowNode("ccb/object/dogia-2", "in", 0, 0, "npcpnt-10042")
        DialogLeft(g_char.npc2, "story_143001")         -- （L）npc-002：老大！！
        DialogRight(g_char.npc11, "story_143002")       -- （R）npc-011：呼，太危险了！！我的小弟！！你怎么能独自和这种庞然大物打起来！

        DialogLeft(g_char.npc2, "story_143003")         -- （L）npc-002：哇！老大，你来得太及时了！老大！老大！
        DialogRight(g_char.npc11, "story_143004")       -- （R）npc-011：不要崇拜我，炫酷的浪子游侠，哈哈哈！！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_143005")         -- （L）npc-002：缓过来了...我想我们已经搞清楚怪兽失踪的事情了。
        DialogRight(g_char.npc11, "story_143006")       -- （R）npc-011：哈，我刚刚碰到了那个巫妖，大概的我也知道了！这事儿先放放。
        DialogRight(g_char.npc11, "story_143007")       -- （R）npc-011：现在我要先去追击那个"兜帽男"了，他一定是关键人物！

        sw.ShowNode("ccb/object/chapterfx-2", "end", 0, 0, "fxcenter")

        -- 延迟 4 秒，此过程需要屏蔽玩家操作
        Wait(5)

        sw.ShowNode("ccb/object/dogia-2", "out", 0, 0, "npcpnt-10042")

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(400)
        end
    end
}

-- fix: 如果玩家错过1390剧情，自动解锁镶嵌功能
g_stories[1435] =
{
    moment      = "enter main",
    priority    = 100,
    swallow     = false,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1390) and not sw.IsFunctionUnlock(tFunction.INLAY);
    end,

    body = function(self, data)
        sw.SetFunctionUnlock(tFunction.INLAY, true);
    end
}

-- 击杀第 4 个BOSS之后，返回主界面
g_stories[1440] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1430)
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_144001")         -- （L）npc-001：现在貌似不能称呼你为小怪兽了。
        DialogLeft(g_char.npc1, "story_144002")         -- （L）npc-001：你的已经是咱们营地的明星怪兽了！简直太厉害了，有你这样的朋友，让我感觉挣钱都容易许多！哈哈哈哈。
        DialogRight(g_char.npc2, "story_144003")        -- （R）npc-002：嘿嘿，现在那些勇者们应该知道厉害了！
        DialogLeft(g_char.npc1, "story_144004")         -- （L）npc-001：不能骄傲！
        DialogLeft(g_char.npc1, "story_144005")         -- （L）npc-001：不能大意！！
        DialogLeft(g_char.npc1, "story_144006")         -- （L）npc-001：......
        DialogLeft(g_char.npc1, "story_144007")         -- （L）npc-001：好吧，我装不下去了，他确实很强，哈哈哈哈哈哈哈！
    end
}

-- 在 1440 任务之后，主界面
g_stories[1450] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1440)
    end,

    body = function(self, data)

        Wait(1)

        sw.ShowNode("ccb/object/dogia-1", "in", 0, 0, "npcpnt01")

        DialogLeft(g_char.npc1, "story_145001")         -- （L）npc-001：没酒了没酒了！
        DialogRight(g_char.npc11, "story_145002")       -- （R）npc-011：别这样啊！你这个抠门的绿皮怪！
        DialogRight(g_char.npc11, "story_145003")       -- （R）npc-011：啊，你来了。
        DialogRight(g_char.npc11, "story_145004")       -- （R）npc-011：咳咳，是这样的，我又弄到了不得了的情报。勇者们在陆陆续续的从塔顶传送阵，撤离到浮空岛——索纳塔尔格。
        DialogLeft(g_char.npc2, "story_145005")         -- （L）npc-002：啊，这是为什么呢？他们要逃走？塔顶的魔王怎么办？
        DialogRight(g_char.npc11, "story_145006")       -- （R）npc-011：被束缚住的魔王似乎也要一并没带走，调查一下吧。
        DialogLeft(g_char.npc2, "story_145007")         -- （L）npc-002：那我们得赶紧追击了！我们的目标可是营救魔王啊！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_145008")       -- （R）npc-011：说实话...我不认为他们是要逃走，我看到那个"兜帽男"了...深不可测，回见。

        sw.ShowNode("ccb/object/dogia-1", "out", 0, 0, "npcpnt01")

        sw.ShowNode("ccb/object/chapterfx-3", "1", 0, 0, "fxcenter")

        -- 延迟 4 秒，此过程需要屏蔽玩家操作
        Wait(4)

    end
}

-- 在 1450 任务之后，进入营地
g_stories[1460] =
{
    moment      = "enter camp",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1430)
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/feona-1", "stand", 0, 0, "npcpnt-feona")
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc9, "story_146001")        -- （R）npc-009：那个...你好！
        DialogLeft(g_char.npc2, "story_146002")         -- （L）npc-002：喂，那个人在叫你...
        DialogRight(g_char.npc9, "story_146003")        -- （R）npc-009：感谢你在我们同学的事情上这么费心！
        DialogRight(g_char.npc9, "story_146004")        -- （R）npc-009：这是我们同学凑的一些东西，请你一定收下！感谢！也希望你能继续帮我们营救更多的小怪兽！
        DialogLeft(g_char.npc19, "story_146005")        -- （L）npc-019：......

        sw.AddDiamond(300)                              -- 获得钻石 × 300
        sw.PlaySound("qte-1", false, 99)
    end
}

-- 在 1460 任务之后，返回主界面
g_stories[1470] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1460)
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_147001")         -- （L）npc-001：咳咳。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc2, "story_147002")        -- （R）npc-002：干啥，大叔？

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        sw.PlayBGM("home-1")

        DialogLeft(g_char.npc1, "story_147003")         -- （L）npc-001：你大叔我...其实也不是一个特别抠门的人。
        DialogLeft(g_char.npc1, "story_147004")         -- （L）npc-001：我天天就在这个路口做生意，看到了无数的小怪兽冲进塔里救魔王...大多数有去无回，难得遇到一个像你这么优秀的小怪兽。
        DialogLeft(g_char.npc1, "story_147005")         -- （L）npc-001：但是这次你们要踏上的路可比前面的困难得多...恐怕就没有这么多人在你身后支撑你了，大叔舍不得你们走。
        DialogRight(g_char.npc2, "story_147006")        -- （R）npc-002：不要这么伤感好不好，我看到你好像要掏钱包了。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_147007")         -- （L）npc-001：镇守撸撸塔顶的是一个叫做布洛托•雷酒的矮人战士，他不是坏蛋，但是他却是一个正义忠诚的好将军，不过他忠于的是勇者，而不是我们怪兽。他将成为你们最大的阻碍，也许小怪兽你会命丧在那儿...
        DialogLeft(g_char.npc1, "story_147008")         -- （L）npc-001：西出阳关无故人，或许这么说更贴切吧...
        DialogRight(g_char.npc2, "story_147009")        -- （R）npc-002：你从哪儿得到的情报？
        DialogLeft(g_char.npc1, "story_147010")         -- （L）npc-001：以前，他经常和多吉亚来我这里喝酒，不过自从勇者绑了魔王以后，出于避嫌，他就再也没来过这里。
        if sw.GetPackageSpace() < 3 then
            DialogLeft(g_char.npc1, "story_147011")         -- （L）npc-001：去清理一下背包吧。我有些东西给你。
        else
            sw.SetStoryFinished(1471, true)
            DialogLeft(g_char.npc1, "story_147012")         -- （L）npc-001：这些给你，你收下，算是个帮助，也算是个念想。
            DialogRight(g_char.npc2, "story_147013")        -- （R）npc-002：谢了大叔，我相信他能够活着回来的！

            sw.AddItemToPackage(400051, nil, 3)             -- 获得 随机传送卷轴 × 3
            Wait(0.3)
            sw.AddItemToPackage(400050, nil, 1)             -- 获得 透视卷轴 × 1
            Wait(0.3)
            sw.AddItemToPackage(400053, nil, 1)             -- 获得 浩劫卷轴 × 1
            sw.SetStoryFinished(1471, true)
            sw.PlaySound("qte-1", false, 99)
        end
    end
}

-- 在 1470 任务之后，返回主界面，赠送玩家物品
g_stories[1471] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(1470) and sw.GetPackageSpace() >= 3
    end,

    body = function(self, data)
        DialogLeft(g_char.npc1, "story_147012")         -- （L）npc-001：这些给你，你收下，算是个帮助，也算是个念想。
        DialogRight(g_char.npc2, "story_147013")        -- （R）npc-002：谢了大叔，我相信他能够活着回来的！

        sw.AddItemToPackage(400051, nil, 3)             -- 获得 随机传送卷轴 × 3
        sw.AddItemToPackage(400050, nil, 1)             -- 获得 透视卷轴 × 1
        sw.AddItemToPackage(400053, nil, 1)             -- 获得 浩劫卷轴 × 1
        sw.PlaySound("qte-1", false, 99)

        sw.SetStoryFinished(1471, true)
    end
}

-- 进入地图 44
g_stories[1480] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1470) and data.map_id == 44
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_148001")         -- （L）npc-002：看来大叔的担心也不是没有理由的...
        DialogLeft(g_char.npc2, "story_148002")         -- （L）npc-002：这里的勇者实力要远远高于之前遇到的，请务必小心。
    end
}

-- 击杀任意怪物
g_stories[1490] =
{
    moment      = "battle end",
    priority    = 98,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        local tPlayerInfo = sw.GetMyPlayer()
        return sw.IsStoryFinished(1480) and data.result == tBattleResult.WIN and tMapInfo.id >= 45 and tMapInfo.id <= 50 and tPlayerInfo.cur_hp / tPlayerInfo.max_hp > 0.8
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_149001")         -- （L）npc-002：看，这个勇者带有一篇手记。
        DialogLeft(g_char.npc2, "story_149002")         -- （L）npc-002：似乎和之前大叔谈到的那个什么经常去营地喝酒的勇者有关系。

        sw.ShowNode("ccb/object/window-900004", "open", 0, 0, "fxcenter")

    end
}

-- 阵亡后非回城复活
g_stories[1500] =
{
    moment      = "resurge",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id >= 41 and tMapInfo.id <= 60
    end,

    body = function(self, data)
        -- 延迟 4 秒，此过程需要屏蔽玩家操作
        Wait(4)

        DialogLeft(g_char.npc11, "story_150001")        -- （L）npc-011：嘿！大哥路过就看到你如此狼狈啊！需要帮忙吗？

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc2, "story_150002")        -- （R）npc-002：？？不需要了，我想他能搞定...你在哪里？
        DialogLeft(g_char.npc11, "story_150003")        -- （L）npc-011：哈哈哈哈哈哈哈！！酷炫浪子游侠，当然是在风里！！那么回头见了！
        DialogLeft(g_char.npc11, "story_150004")        -- （L）npc-011：我得赶往楼上一层去，那儿原本是我们兽人族的寄居地，我还得去见见......（声音太远，听不到了）
        DialogRight(g_char.npc2, "story_150005")        -- （R）npc-002：？？？

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_150006")         -- （L）npc-002：似乎走远了...
    end
}

-- 进入第 5 个BOSS关卡
g_stories[1510] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 1005 and ( ( data.x == 49 and data.y == 63 ) or ( data.x == 50 and data.y == 63 ) or ( data.x == 51 and data.y == 63 ) )
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_151001")         -- （L）npc-002：这儿看上去不像是有人在的地方啊，应该没什么收获，我们走吧...
        DialogRight(g_char.npc7, "story_151002")        -- （R）npc-007：慢着！！
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        DialogLeft(g_char.npc2, "story_151003")         -- （L）npc-002：？？有人？
        DialogRight(g_char.npc7, "story_151004")        -- （R）npc-007：当然有人！还是大人物！！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc7, "story_151005")        -- （R）npc-007：可恶的布洛托•雷酒！居然让我堂堂恩吉尔德•深火一个人做这种无聊的值班工作！！连过路的小怪物都不把我放在眼里！！
        DialogLeft(g_char.npc2, "story_151006")         -- （L）npc-002：不不不...只是这儿太暗了，没看到有人...抱歉
        DialogRight(g_char.npc7, "story_151007")        -- （R）npc-007：抱歉！？哈哈哈哈？抱歉！
        DialogRight(g_char.npc7, "story_151008")        -- （R）npc-007：该抱歉的是我！你们这些不知所谓的杂碎！！因为我将会打到你们半死，剖开你的肚子，烤熟你们的肠子，然后再塞到你们嘴里！
        DialogRight(g_char.npc7, "story_151009")        -- （R）npc-007：最后把绝望的你们，拎到那个自以为是的雷酒跟前，让他看看，这就是和他的"畸形"朋友...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_151010")         -- （L）npc-002：......
        DialogLeft(g_char.npc2, "story_151011")         -- （L）npc-002：你和你朋友的恩怨何必带上我们呢，我们不想做无谓的战斗...
        DialogRight(g_char.npc7, "story_151012")        -- （R）npc-007：果然！连怪物都瞧不起我！！不错，我改变主意了...我要就地将你们处死！！
        DialogLeft(g_char.npc2, "story_151013")         -- （L）npc-002：这是你自找的。
    end
}

-- 击杀第 5 个BOSS，ID：503000
g_stories[1520] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1510) and data.mon_id == 503000 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc7, "story_152001")        -- （R）npc-007：别别、别杀我！我投降！！

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        DialogRight(g_char.npc7, "story_152002")        -- （R）npc-007：我告诉你们一些秘密！！
        DialogLeft(g_char.npc2, "story_152003")         -- （L）npc-002：喔？快说，不然我这位怪兽朋友可要吃掉你了！
        DialogLeft(g_char.npc2, "story_152004")         -- （L）npc-002：（小声说）我不是说真的吃了他，你表现得狰狞一点就好...
        DialogRight(g_char.npc7, "story_152005")        -- （R）npc-007：...好好好。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc7, "story_152006")        -- （R）npc-007：魔王之所以被囚禁，是因为需要更多小怪来营救他，这样我们勇者就能获得更多魔能和经验提升自己的实力。一方是因为索纳塔尔格需要魔能来驱动，而我们自己生产的魔能完全不足够，另一方面...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_152007")         -- （L）npc-002：继续说！
        DialogRight(g_char.npc7, "story_152008")        -- （R）npc-007：我说！我说！
        DialogRight(g_char.npc7, "story_152009")        -- （R）npc-007：另一方面，我们的老大，需要找到存在于你们怪物中的...传说中的芙蕾雅之泪...
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        DialogRight(g_char.npc7, "story_152010")        -- （R）npc-007：有机会！！
        DialogLeft(g_char.npc2, "story_152011")         -- （L）npc-002：！！
        sw.PlaySound("resurrection-1", false, 99)              -- 播放音效hit-8-1，优先级99，不循环

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_152012")         -- （L）npc-002：大意了，让他逃走了！！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_152013")         -- （L）npc-002：不过，这应该不是我们第一次听到芙蕾雅之泪这个名字了...
        DialogLeft(g_char.npc2, "story_152014")         -- （L）npc-002：到底是一个什么东西呢，大家都在找。

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(400)
        end
    end
}

-- 打开黑市
g_stories[1530] =
{
    moment      = "open shop",
    priority    = 98,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1520) and data.storage == 2
    end,

    body = function(self, data)

    -- 隐藏tone节点

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc9, "story_153001")        -- （R）npc-009：嗨！你们来啦！
        DialogRight(g_char.npc16, "story_153002")         -- （L）npc-002：唔...菲欧娜。哎？小桐呢？
        DialogRight(g_char.npc9, "story_153003")        -- （R）npc-009：你们走后，魔法学院算是恢复了平静，小桐去参加魔法学院的怪兽晋升考试去了！所以我就带他看着铺子。
        DialogLeft(g_char.npc19, "story_153004")        -- （R）npc-009：咕叽大叔并不知道...不能让他知道小桐翘班啊！
        DialogRight(g_char.npc9, "story_153005")        -- （R）npc-009：作为回报，请收下这个！
        if not sw.IsPackageFull() then
            sw.AddItemToPackage(400053, nil, 1)             -- 获得 浩劫卷轴 × 1
            sw.PlaySound("qte-1", false, 99)
            DialogLeft(g_char.npc2, "story_153006")         -- （L）npc-002：嗯...你这是在贿赂我们...不过我觉得可以接受，哈哈哈哈哈！
            DialogRight(g_char.npc9, "story_153007")        -- （R）npc-009：嘻嘻！就知道你们最好了，哈哈哈。
            sw.SetStoryFinished(1531, true)
        else
            DialogRight(g_char.npc9, "story_153008")        -- （R）npc-009：嗯？你的背包好像满了哦，清理一下再来找我吧！
        end
    end
}

-- 打开黑市
g_stories[1531] =
{
    moment      = "open shop",
    priority    = 98,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(1530) and data.storage == 2 and not sw.IsPackageFull()
    end,

    body = function(self, data)
        sw.AddItemToPackage(400053, nil, 1)             -- 获得 浩劫卷轴 × 1
        DialogLeft(g_char.npc2, "story_153006")         -- （L）npc-002：嗯...你这是在贿赂我们...不过我觉得可以接受，哈哈哈哈哈！
        DialogRight(g_char.npc9, "story_153007")        -- （R）npc-009：嘻嘻！就知道你们最好了，哈哈哈。
        sw.SetStoryFinished(1531, true)                 -- 设定本任务完成状态为true
        sw.PlaySound("qte-1", false, 99)
    end
}

-- 在 1520 任务之后，击杀BOSS之后，继续前进，到达坐标50,72
g_stories[1540] =
{
    moment      = "ready to tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.last_id == 1005 and data.map_id == 51
    end,

    body = function(self, data)
        sw.PauseRunningActions()                     -- 暂停画面
        sw.ShowNode("ccb/object/chapterfx-0", "1", 0, 0)
        Wait(1)
        sw.PlayBGM("death-1")


        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc7, "story_154001")         -- （L）npc-007：......
        DialogLeft(g_char.npc7, "story_154002")         -- （L）npc-007：...好像没有追上来，吓死我了...还好这里够暗。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc7, "story_154003")         -- （L）npc-007：？

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc22, "story_154004")       -- （R）npc-022：他们都不看好你吗？嘿嘿嘿嘿......
        DialogLeft(g_char.npc7, "story_154005")         -- （L）npc-007：谁！？
        DialogRight(g_char.npc22, "story_154006")       -- （R）npc-022：你是个不错的样本，没事儿，我看好你...
        DialogLeft(g_char.npc7, "story_154007")         -- （L）npc-007：是嘛！！我以后跟你混了！
        DialogRight(g_char.npc22, "story_154008")       -- （R）npc-022：你当然得跟我...不过不是混，而是成为我的"样本"。
        DialogLeft(g_char.npc7, "story_154009")         -- （L）npc-007：样本？
        DialogLeft(g_char.npc7, "story_154010")         -- （L）npc-007：敢问您是？

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc15, "story_154011")       -- （R）npc-015：阿鲁巴斯。
        sw.PlaySound("qte-4", false, 99)                -- 播放音效qte-4，优先级99，不循环
        DialogLeft(g_char.npc7, "story_154012")         -- （L）npc-007：啊！？黑暗医生，阿鲁...
        sw.ShowNode("ccb/object/chapterfx-0", "2", 0, 0)
        sw.PlaySound("resurrection-3", false, 99)       -- 播放音效resurrection-3，优先级99，不循环

        -- 延迟 0.5 秒，此过程需要屏蔽玩家操作
        Wait(0.5)

        sw.PlaySound("enemy-death-1-1", false, 99)      -- 播放音效enemy-death-1-1，优先级99，不循环
        sw.PlaySound("enemy-death-1-1", false, 99)      -- 播放音效enemy-death-1-1，优先级99，不循环
        Wait(1)
        DialogLeft(g_char.npc15, "story_154013")
        sw.ResumeActions()                              -- 恢复画面
        sw.ShowNode("ccb/object/chapterfx-0", "end", 0, 0)
        sw.PlayBGM("tower-1")
    end
}

-- 进入地图 52
g_stories[1550] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 47
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc14, "story_155001")        -- （L）npc-014：嘿...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc14, "story_155002")        -- （L）npc-014：我是之前那个巫妖，你还没忘了我吧...
        DialogLeft(g_char.npc14, "story_155003")        -- （L）npc-014：别紧张，我们还在灵魂链接中，我能看到你所看到的...也能听到我的声音。
        DialogLeft(g_char.npc14, "story_155004")        -- （L）npc-014：很好...我已经搜集了足够多钢铁武器库的信息了，那么接下来还有两个需要调查的地方，也拜托你可以到达了...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc14, "story_155005")        -- （L）npc-014：为了保证你能顺利的帮我搞定接下来的事情，我能教你一些咒语，让你多获得1个<cr=230,65,5>技能点<cr=def>，听好了...
        Wait(1)
        sw.PlaySound("levelup", false, 99)              -- 播放音效levelup，优先级99，不循环
        DialogLeft(g_char.npc14, "story_155006")        -- （L）npc-014：我会继续和你保持联系的...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc2, "story_155007")        -- （R）npc-002：？？
        DialogRight(g_char.npc2, "story_155008")        -- （R）npc-002：小怪兽？你突然愣着干嘛？走啊？
        sw.AddSkillPoint(1)                             -- 获得：技能点 × 1

        sw.SetFunctionUnlock(tFunction.FORGE, true)               -- 合成功能解锁
        sw.SetFunctionUnlock(tFunction.BREAKUP, true)             -- 分解功能解锁
        sw.PlaySound("qte-1", false, 99)

    end
}

-- 进入地图 59
g_stories[1560] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1550) and data.map_id == 59
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc14, "story_156001")        -- （L）npc-014：还是我...嗯..钢铁锻造厂的信息也足够了
        DialogLeft(g_char.npc14, "story_156002")        -- （L）npc-014：那么最后一个目标，塔顶红水晶，别死了...我可不要你那个纯洁的灵魂，哈哈哈哈哈哈...
    end
}

-- 击杀任意怪物
g_stories[1570] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tMapInfo.id >= 54 and tMapInfo.id <= 60 and tPlayerInfo.cur_hp / tPlayerInfo.max_hp >= 0.2
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_157001")         -- （L）npc-014：一张手记
        DialogLeft(g_char.npc2, "story_157002")         -- （L）npc-014：看上去，无奈的可不止是怪兽...整个世界都...
        sw.ShowNode("ccb/object/window-900005", "open", 0, 0, "fxcenter")

        -- 打开便签窗口《朋友和职责》
    end
}

-- 升级
g_stories[1580] =
{
    moment      = "level up",
    priority    = 98,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1550) and tMapInfo.id >= 51 and tMapInfo.id <= 60
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc22, "story_158001")        -- （L）npc-022：嗯，哈哈哈哈...看来这个样本还真得值得注意一下，比之前那个鱼人强多了。
        DialogRight(g_char.npc2, "story_158002")        -- （R）npc-002：你是？什么鱼人？
        DialogLeft(g_char.npc22, "story_158003")        -- （L）npc-022：喔喔...别这么着急揭开谜底，好戏才刚刚开始。
        DialogRight(g_char.npc2, "story_158004")        -- （R）npc-002：是敌还是友！
        DialogLeft(g_char.npc22, "story_158005")        -- （L）npc-022：这些都不重要...重要的是赛德尔曼会要你的灵魂，而我对你的肉体比较感兴趣，哈哈哈哈...有机会碰面的！
        DialogRight(g_char.npc2, "story_158006")        -- （R）npc-002：...你总得告诉我们，你是谁！喂？

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_158007")         -- （L）npc-002：都是些来无影去无踪的高手...
    end
}

-- 在地图 59 以上击杀任意怪物
g_stories[1590] =
{
    moment      = "battle end",
    priority    = 98,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1550) and tMapInfo.id >= 59 and tMapInfo.id <= 60 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_159001")         -- （L）npc-002：什么？魔王那个老家伙已经被勇者转移到索纳塔尔格了！
        DialogLeft(g_char.npc2, "story_159002")         -- （L）npc-002：你看，这有一个密信，我们得抓紧了。
        DialogLeft(g_char.npc2, "story_159003")         -- （L）npc-002：...看来他们全部都被放弃了，包括布洛托。
        sw.ShowNode("ccb/object/window-900006", "open", 0, 0, "fxcenter")

        -- 弹出便签框《密信：布洛托•雷酒亲启》

    end
}

-- 进入第 6 个BOSS关卡
g_stories[1600] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1550) and data.map_id == 1006
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_160001")         -- （L）npc-002：塔顶......

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_160002")         -- （L）npc-002：我们终于来到了这里。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc8, "story_160003")        -- （R）npc-008：终于还是来了，朋友们！
    end
}


-- 进入第 6 个BOSS关卡，到达坐标47,47
g_stories[1610] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1600) and tMapInfo.id == 1006 and data.x == 47 and data.y == 47
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc8, "story_161001")        -- （R）npc-008：哈哈哈哈哈哈，这位小怪兽，你可是最近响当当的大人物，很高兴能见到本尊。
        DialogLeft(g_char.npc2, "story_161002")         -- （L）npc-002：布洛托•雷酒？
        DialogRight(g_char.npc8, "story_161003")        -- （R）npc-008：正是在下，前几次去咕叽那儿没见过你啊？真是可爱的小精灵。
        DialogLeft(g_char.npc2, "story_161004")         -- （L）npc-002：我听过你，你不是那种不讲道理的人！可否让我们通过，你也应该知道我们的事业是正义的！再拖下去，我们就无法营救我们的魔王了！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc8, "story_161005")        -- （R）npc-008：抱歉啊，小怪兽，魂精灵，恕难从命。
        DialogLeft(g_char.npc2, "story_161006")         -- （L）npc-002：你这是愚忠！你和塔里的勇者已经被放弃了！你知道吗！？
        DialogRight(g_char.npc8, "story_161007")        -- （R）npc-008：啊，我非常清楚我在做什么。
        DialogRight(g_char.npc8, "story_161008")        -- （R）npc-008：人生总是充满了遗憾，本应该是很好的朋友，可刚认识便是刀剑诀别...只是可惜，怕是没有机会和你开怀共饮了。
        DialogLeft(g_char.npc2, "story_161009")         -- （L）npc-002：布洛托！！
        DialogRight(g_char.npc8, "story_161010")        -- （R）npc-008：好了！！能和你交手也算是我之大幸！
        DialogRight(g_char.npc8, "story_161011")        -- （R）npc-008：来吧！打败我，从我的尸体上踩过去！
        sw.SetPlayerOperable(true)
    end
}

-- 击杀第 6 个BOSS，ID：503001
g_stories[1620] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        return data.mon_id == 503001 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        sw.SetStoryFinished(1440, true)
        sw.SetStoryFinished(1450, true)
        sw.SetStoryFinished(1470, true)
        sw.SetStoryFinished(1471, true)
        sw.SetStoryFinished(1480, true)
        sw.SetStoryFinished(1490, true)
        sw.SetStoryFinished(1500, true)
        sw.SetStoryFinished(1510, true)
        sw.SetStoryFinished(1520, true)
        sw.SetStoryFinished(1540, true)
        sw.SetStoryFinished(1550, true)
        sw.SetStoryFinished(1560, true)
        sw.SetStoryFinished(1570, true)
        sw.SetStoryFinished(1580, true)
        sw.SetStoryFinished(1590, true)
        sw.SetStoryFinished(1600, true)
        sw.SetStoryFinished(1610, true)

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc8, "story_162001")        -- （R）npc-008：唔！厉、厉害...
        DialogLeft(g_char.npc2, "story_162002")         -- （L）npc-002：......传送阵已经关闭了，魔王被带到了索纳塔尔格，我们留在了这里，一切都完了...
        DialogRight(g_char.npc8, "story_162003")        -- （R）npc-008：果然名不虚传...哈、哈哈哈...咳咳...
        DialogRight(g_char.npc8, "story_162004")        -- （R）npc-008：来，靠近我...过来。
        sw.PlaySound("event-4-1", false, 99)            -- 播放音效event-4-1，优先级99，不循环

        sw.PlayBGM("theme-1")                           -- 播放背景音乐theme-1

        -- 延迟 4 秒，此过程需要屏蔽玩家操作
        Wait(4)

        DialogRight(g_char.npc8, "story_162005")        -- （R）npc-008：往前、前走...
        DialogRight(g_char.npc8, "story_162006")        -- （R）npc-008：虽然你们无法传送到，索、索纳塔尔格...但是另外有一条传输能源用的小路，可以、可以到达浮空岛大陆底部...
        DialogRight(g_char.npc8, "story_162007")        -- （R）npc-008：咳咳！！你可真厉害！！
        DialogLeft(g_char.npc2, "story_162008")         -- （L）npc-002：别再说了，我可以治...
        DialogRight(g_char.npc8, "story_162009")        -- （R）npc-008：走开！我、我不能带着这样的叛逃身份活下去...让我一个人...离去。
        DialogRight(g_char.npc8, "story_162010")        -- （R）npc-008：这是我自己选择的路！！
        sw.PlaySound("event-4-1", false, 99)            -- 播放音效event-4-1，优先级99，不循环

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc8, "story_162011")        -- （R）npc-008：咳、哈哈......帮我给多吉亚，咕叽道个别...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc8, "story_162012")        -- （R）npc-008：有点想你们那儿的酒了......

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc8, "story_162013")        -- （R）npc-008：明明、那么难喝...哈哈哈哈...
        sw.PlaySound("event-4-1", false, 99)            -- 播放音效event-4-1，优先级99，不循环

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        DialogRight(g_char.npc8, "story_162014")        -- （R）npc-008：可惜了...
        DialogRight(g_char.npc8, "story_162015")        -- （R）npc-008：要是有点酒...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc8, "story_162016")        -- （R）npc-008：...就、好了......

        -- 延迟 3 秒，此过程需要屏蔽玩家操作
        Wait(3)

        DialogLeft(g_char.npc2, "story_162017")         -- （L）npc-002：他走了...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc14, "story_162018")        -- （L）npc-014：是的，他走了。
        DialogLeft(g_char.npc14, "story_162019")        -- （L）npc-014：我已经收到了他的灵魂，无比高尚...
        DialogLeft(g_char.npc14, "story_162020")        -- （L）npc-014：你们也帮我搜集到足够的塔顶红水晶的信息。
        DialogLeft(g_char.npc14, "story_162021")        -- （L）npc-014：你有空了就来找我，我将兑现我的诺言。

        sw.ShowNode("ccb/object/chapterfx-3", "end", 0, 0, "fxcenter")

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(600)
        end
    end
}

-- 击杀第 6 个BOSS之后，回到主界面
g_stories[1630] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1620)
    end,

    body = function(self, data)

        sw.ShowNode("ccb/object/dogia-1", "stand", 0, 0, "npcpnt01")

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        DialogLeft(g_char.npc2, "story_163001")         -- （L）npc-002：大叔...
        DialogLeft(g_char.npc1, "story_163002")         -- （L）npc-001：我已经听说了，布洛托的事儿...营地里来了个新朋友告诉我们的。
        DialogLeft(g_char.npc1, "story_163003")         -- （L）npc-001：从一开始，便一定是这样的结局，他实在是太固执了。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc11, "story_163004")       -- （R）npc-011：......
        DialogLeft(g_char.npc2, "story_163005")         -- （L）npc-002：对不起，多吉亚，我们...
        DialogRight(g_char.npc11, "story_163006")       -- （R）npc-011：......不赖你们，对于他...换我也没辙。
        DialogRight(g_char.npc11, "story_163007")       -- （R）npc-011：不过你老大我一定调查清楚这个事情的真相！振作起来，小弟！
        DialogLeft(g_char.npc1, "story_163008")         -- （L）npc-001：...

        -- 延迟 3 秒，此过程需要屏蔽玩家操作
        Wait(1.5)

        DialogLeft(g_char.npc14, "story_163009")        -- （L）npc-014：现在是灵魂链接，小怪兽，我听到的哀鸣声中，还有关于你们营地的内容，营地里有奸细。
        DialogLeft(g_char.npc14, "story_163010")        -- （L）npc-014：不要告诉任何人我们的关系，不要相信任何人...我在营地里等你。
    end
}

-- 1631
g_stories[1631] =
{
    moment      = "open forge",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1620)
    end,

    body = function(self, data)
        DialogRight(g_char.npc14, "story_164008")
    sw.AddDiamond(400)                              -- 获得钻石 × 400
    sw.PlaySound("qte-1", false, 99)
    end
}


-- 在 1630 任务之后，进入营地
g_stories[1640] =
{
    moment      = "enter camp",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsFunctionUnlock(tFunction.FORGE) and sw.IsFunctionUnlock(tFunction.BREAKUP)
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/feona-1", "stand", 0, 0, "npcpnt-feona")
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_164001")       -- （R）npc-014：收拾下心情，总的来说你们还没有完全失去希望，不是么。
        DialogRight(g_char.npc14, "story_164002")         -- （L）npc-002：你怎么知道布洛托•雷酒和我们的...
        DialogLeft(g_char.npc2, "story_164003")       -- （R）npc-014：我可是巫妖，这位女士，只要我想，所有的灵魂都会来我这里报道。
        DialogRight(g_char.npc14, "story_164004")       -- （R）npc-014：言归正传。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc14, "story_164005")       -- （R）npc-014：我暂住此地作为研究场所，你们如果有任何合成的需要可以找我，我很乐意为你们效劳，并提升我的研究进度。
        DialogRight(g_char.npc14, "story_164006")       -- （R）npc-014：另外，我的石像鬼随从也很乐意帮你们把不要了的装备大卸八块，分解成别的东西。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc14, "story_164007")       -- （R）npc-014：另外，初来乍到，还请多多关照，这是我的见面礼，希望你们笑纳。

    end
}


-- 击杀第 6 个BOSS之后，进入地图61
g_stories[1650] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1620) and data.map_id == 61
    end,

    body = function(self, data)

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_165001")         -- （L）npc-002：看样子，已经在浮空岛底部了，布洛托指的路没问题。
        DialogLeft(g_char.npc2, "story_165002")         -- （L）npc-002：不过离大陆表面，还是有点距离就是了。
        DialogLeft(g_char.npc2, "story_165003")         -- （L）npc-002：那么，我们接下来要做的就是找上去的路，一直到表面！
    end
}

-- 进入地图63
g_stories[1660] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1650) and data.map_id == 63
    end,

    body = function(self, data)
        sw.SetStoryFinished(1391, true)
        DialogLeft(g_char.npc14, "story_166001")        -- （L）npc-014：你现在应该会感觉到越来越热了...
        DialogLeft(g_char.npc14, "story_166002")        -- （L）npc-014：这是因为你们正在接近索纳塔尔格的动力区
        DialogLeft(g_char.npc14, "story_166003")        -- （L）npc-014：当然，我不是为了来说这个的...
        DialogLeft(g_char.npc14, "story_166004")        -- （L）npc-014：营地中的人出现了叛徒，你得时刻当心了。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_166005")         -- （L）npc-002：越来越热了呢？嗯？
    end
}



-- 进入营地商人界面
g_stories[1670] =
{
    moment      = "open shop",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1660) and data.storage == 2
    end,

    body = function(self, data)

        -- 隐藏营地内feona节点
        -- 显示营地内tone节点

        DialogLeft(g_char.npc2, "story_167001")         -- （L）npc-002：嘿？小桐你回来啦？
        DialogRight(g_char.npc16, "story_167002")       -- （R）npc-016：嗯！欢迎光临
        DialogLeft(g_char.npc2, "story_167003")         -- （L）npc-002：怎么样，说你去考试去啦？晋升了吗？
        DialogRight(g_char.npc16, "story_167004")       -- （R）npc-016：啊？...这个。
        DialogRight(g_char.npc16, "story_167005")       -- （R）npc-016：其实我没有参加，菲欧娜告诉我说有考试，但是我去的时候才知道，考试不是针对我这个级别的，所以我就回来了。
        DialogLeft(g_char.npc19, "story_167006")         -- （L）npc-002：嗯？帮你看店的同学？
        DialogLeft(g_char.npc2, "story_167007")       -- （R）npc-016：我回来之后就没见到人，不知道去哪儿了。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc19, "story_167008")        -- （L）npc-019：......
    end
}

-- 击杀任意怪物
g_stories[1680] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id >= 64 and tMapInfo.id <=70 and data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp >= 0.85
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_168001")         -- （L）npc-002：一篇手记？似乎是写的关于营地的事情

        sw.ShowNode("ccb/object/window-900007", "open", 0, 0, "fxcenter")

    end
}

-- 击杀任意怪物
g_stories[1690] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1680) and tMapInfo.id >= 64 and tMapInfo.id <=70 and data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp >= 0.85
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_169001")         -- （L）npc-002：一篇手记？似乎是写的关于营地的事情

        sw.ShowNode("ccb/object/window-900008", "open", 0, 0, "fxcenter")

    end
}

-- 进入第 7 个BOSS关卡
g_stories[1700] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1660) and data.map_id == 1007
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/albus-1", "normal", 0, 0, "npcpnt-10071")
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)
        sw.PlaySound("resurrection-1", false, 99)              -- 播放音效hit-8-1，优先级99，不循环
        DialogRight(g_char.npc22, "story_170001")       -- （R）npc-022：又见面咯。
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        Wait(1)
        DialogLeft(g_char.npc2, "story_170002")         -- （L）npc-002：见过？
        DialogRight(g_char.npc22, "story_170003")       -- （R）npc-022：哈哈哈哈，不重要！
        DialogRight(g_char.npc22, "story_170004")       -- （R）npc-022：你们是在追击勇者，营救你们的魔王吧？那么我告诉你们一个事情。
        DialogRight(g_char.npc22, "story_170005")       -- （R）npc-022：现在索纳塔尔格还停留在撸撸塔顶，但是如果他离开了塔顶，你们可就再也上去不了...
        DialogRight(g_char.npc22, "story_170006")       -- （R）npc-022：所以破坏他们的动力是你们当前要做的事情，你们所在的区域就是动力区域，找到能量涡轮，破坏他，就可以防止他们逃走。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_170007")         -- （L）npc-002：为什么帮我们？
        DialogRight(g_char.npc22, "story_170008")       -- （R）npc-022：哈哈哈哈哈，我只是不想我的新样本跑太远了而已！
        DialogLeft(g_char.npc2, "story_170009")         -- （L）npc-002：无论怎样，谢谢了。

        sw.ShowNode("ccb/object/chapterfx-4", "1", 0, 0, "fxcenter")
        Wait(4)

    end
}

-- 进入第 7 个BOSS关卡，到达坐标48,52
g_stories[1710] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 1007 and data.x == 48 and data.y == 52
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        sw.SetStoryFinished(1670, true)
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc2, "story_171001")        -- （R）npc-002：菲欧娜？
        DialogRight(g_char.npc2, "story_171002")        -- （R）npc-002：你怎么在这里，很危险的啊。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc9, "story_171003")         -- （L）npc-009：嗯？等你们啊？我想和你们一起参加战斗呢。
        DialogRight(g_char.npc2, "story_171004")        -- （R）npc-002：这里的勇者都是很危险的，太冒险了！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc2, "story_171005")        -- （R）npc-002：等等...菲欧娜。
        DialogRight(g_char.npc2, "story_171006")        -- （R）npc-002：营地里的那个卧底，该不会就是你吧...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc9, "story_171007")         -- （L）npc-009：卧底？什么卧底？我不知道啊！哈、哈哈...
        DialogLeft(g_char.npc9, "story_171008")         -- （L）npc-009：在你们杀死了那个矮人经理恩吉尔德之前，我就一直没有离开过营地啊。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_171009")         -- （L）npc-002：杀死..谁？
        DialogRight(g_char.npc15, "story_171010")       -- （R）npc-022：可是他们并没有杀死那个矮人先生...这位同学。

        -- 显示albus节点
        -- 播放albus的时间轴open

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc2, "story_171011")        -- （R）npc-002：...
        DialogRight(g_char.npc15, "story_171012")       -- （R）npc-015：理论上来说，那位矮人先生是我杀死的，他们并不知情，况且我从没跟任何人说起过这个事情。
        DialogRight(g_char.npc15, "story_171013")       -- （R）npc-015：因为作为黑暗医生阿鲁巴斯，偶尔一个作品失败了，总是会感觉有些丢脸的不是么。
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        DialogRight(g_char.npc2, "story_171014")        -- （R）npc-002：你是阿鲁巴斯？
        sw.PlayBGM("boss-1")                           -- 播放背景音乐boss-1

        -- 延迟 2 秒，此过程需要屏蔽玩家操作
        Wait(2)

        DialogLeft(g_char.npc9, "story_171015")         -- （L）npc-009：哈哈哈哈哈哈哈哈...好吧，我承认，我是艾莎的魔法随从，我也在你们营地里获得了足够多的情报了。
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        DialogRight(g_char.npc2, "story_171016")        -- （R）npc-002：果然是你...
        DialogLeft(g_char.npc9, "story_171017")         -- （L）npc-009：不错，不错！你们已经没有了利用价值，接下来，你们是要一个一个来送死，还是要一起上？哈哈哈哈哈。
        DialogRight(g_char.npc15, "story_171018")       -- （R）npc-015：抱歉，我还有别的事儿要处理，而且，我不认为你可以抵挡得了这个样本的攻击，他可是我最看好的样本。

        sw.ShowNode("ccb/object/albus-1", "out", 0, 0, "npcpnt-10071")

        DialogRight(g_char.npc2, "story_171019")        -- （R）npc-002：果然是你！！

        sw.SetPlayerOperable(true)

    end
}

-- 击杀第 7 个BOSS，ID：504000
g_stories[1720] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1710) and data.mon_id == 504000 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_172001")         -- （L）npc-002：为什么这么做！？
        DialogRight(g_char.npc9, "story_172002")        -- （R）npc-009：哈哈哈哈哈、哈哈哈哈哈！！你向尸体发问去吧！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_172003")         -- （L）npc-002：......
        DialogLeft(g_char.npc14, "story_172004")        -- （L）npc-014：因为那根本不是菲欧娜的本意。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc14, "story_172005")        -- （L）npc-014：菲欧娜的灵魂告诉我了...之前一切都是因为她被奴役后，艾莎控制她做的。
        DialogLeft(g_char.npc14, "story_172006")        -- （L）npc-014：至于阿鲁巴斯，似乎并不是敌人。

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(600)
        end
    end
}

-- 击杀第 7 个BOSS之后，进入地图 71
g_stories[1730] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1720) and data.map_id == 71
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_173001")         -- （L）npc-002：所以，为了救下魔王，我们必须先破坏掉索纳塔尔格的动力。
        DialogLeft(g_char.npc2, "story_173002")         -- （L）npc-002：如同阿鲁巴斯所说...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_173003")         -- （L）npc-002：什么？哈瓦努的事情？
        DialogLeft(g_char.npc2, "story_173004")         -- （L）npc-002：我想我们回头有机会问到阿鲁巴斯的，当务之急，是先解决掉能量涡轮。
    end
}

-- 在 1730 任务之后，进入地图 74
g_stories[1740] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1730) and data.map_id == 74
    end,

    body = function(self, data)
        sw.PlaySound("boss-3-9", false, 99)             -- 播放音效boss-3-9，优先级99，不循环

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc12, "story_174001")        -- （L）npc-012：喂、喂喂，这里是能量涡轮正在为你广播，能听到吗？
        DialogLeft(g_char.npc12, "story_174002")        -- （L）npc-012：我是砰砰博士，你们老大雇我对涡轮进行改造，并驱逐那些怪兽入侵者。
        DialogLeft(g_char.npc12, "story_174003")        -- （L）npc-012：目前入侵者已经成功入侵了4个动力区，你们得为我争取点时间，我才能完成涡轮改造。
    end
}

-- 在 1740 任务之后，进入地图 75
g_stories[1750] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1740) and data.map_id == 75
    end,

    body = function(self, data)
        sw.PlaySound("boss-3-9", false, 99)             -- 播放音效boss-3-9，优先级99，不循环

        DialogLeft(g_char.npc12, "story_175001")        -- （L）npc-012：这里是能量涡轮最新播报。
        DialogLeft(g_char.npc12, "story_175002")        -- （L）npc-012：入侵者已经入侵了C区。
    end
}

-- 在 1750 任务之后，进入地图 76
g_stories[1760] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1750) and data.map_id == 76
    end,

    body = function(self, data)
        sw.PlaySound("boss-3-9", false, 99)             -- 播放音效boss-3-9，优先级99，不循环

        DialogLeft(g_char.npc12, "story_176001")        -- （L）npc-012：这里是能量涡轮最新播报。
        DialogLeft(g_char.npc12, "story_176002")        -- （L）npc-012：入侵者已经入侵了E区，啊啊啊啊，你们能不能给我加把劲，战斗化能量涡轮快要准备就绪了！
    end
}

-- 在 1760 任务之后，进入地图 77
g_stories[1770] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1760) and data.map_id == 77
    end,

    body = function(self, data)
        sw.PlaySound("boss-3-9", false, 99)             -- 播放音效boss-3-9，优先级99，不循环

        DialogLeft(g_char.npc12, "story_177001")        -- （L）npc-012：这里是能量涡轮最新播报。
        DialogLeft(g_char.npc12, "story_177002")        -- （L）npc-012：入侵者，你也能听到吧。我不关心你们勇者和怪兽有什么恩怨，我现在受雇清除你们，请你们好自为之。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc12, "story_177003")        -- （L）npc-012：哎？不能不能，你这个笨蛋！那个液化气不能放那儿！

        sw.PlaySound("boss-3-5", false, 99)             -- 播放音效boss-3-5，优先级99，不循环

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_177004")         -- （L）npc-002：什么东西爆炸了的声音吗...
    end
}

-- 在 1770 任务之后，进入地图 78
g_stories[1780] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1770) and data.map_id == 78
    end,

    body = function(self, data)
        sw.PlaySound("boss-3-9", false, 99)             -- 播放音效boss-3-9，优先级99，不循环

        DialogLeft(g_char.npc12, "story_178001")        -- （L）npc-012：这里是能量涡轮最新播报。
        DialogLeft(g_char.npc12, "story_178002")        -- （L）npc-012：入侵者已经入侵了D区。
        DialogLeft(g_char.npc12, "story_178003")        -- （L）npc-012：入侵者，你们正在死亡的道路上前进，战斗型涡轮就快要改造完毕了！

        sw.PlaySound("boss-3-2", false, 99)             -- 播放音效boss-3-2，优先级99，不循环
    end
}

-- 在 1800 任务之后，进入地图 80
g_stories[1790] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1800) and data.map_id == 80
    end,

    body = function(self, data)
        sw.PlaySound("boss-3-9", false, 99)             -- 播放音效boss-3-9，优先级99，不循环

        DialogLeft(g_char.npc12, "story_179001")        -- （L）npc-012：这里是能量涡轮最新播报。
        DialogLeft(g_char.npc12, "story_179002")        -- （L）npc-012：入侵者已经到达了最后的核心动力源。
        DialogLeft(g_char.npc12, "story_179003")        -- （L）npc-012：不过没关系，我完美的作品已经诞生了...剩下的，只是期望他不要爆炸就好了，哈哈哈哈哈哈哈！

        sw.PlaySound("boss-3-11", false, 99)            -- 播放音效boss-3-11，优先级99，不循环
    end
}

-- 在 1780 任务之后，进入地图 79
g_stories[1800] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1780) and data.map_id == 79
    end,

    body = function(self, data)
        DialogLeft(g_char.npc2, "story_180001")         -- （L）npc-002：似乎到了一个核心区域，我能明显感觉到温度的提升。
        DialogLeft(g_char.npc2, "story_180002")         -- （L）npc-002：加油，我们应该快要到核心的能量涡轮了。
    end
}

-- 在 1790 任务之后，进入第 8 个BOSS关卡
g_stories[1810] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1790) and data.map_id == 1008
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        sw.PlaySound("boss-3-11", false, 99)            -- 播放音效boss-3-11，优先级99，不循环

        DialogLeft(g_char.npc6, "story_181001")         -- （L）npc-006：砰砰博士，你的客人们好像已经到了...
        DialogRight(g_char.npc12, "story_181002")       -- （R）npc-012：是啊，那么接下来就让他们感受一下改造后的能量涡轮的恐怖吧！哈哈哈哈...
        DialogLeft(g_char.npc6, "story_181003")         -- （L）npc-006：不用留活口。
    end
}

-- 在 1810 任务之后，进入第 8 个BOSS的战斗，ID：504001（本任务流程不影响玩家操作）
g_stories[1820] =
{
    moment      = "boss appear",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return data.mon_id == 504001
    end,

    body = function(self, data)
        sw.SetDialogCanTouch("left", false);
        sw.SetDialogCanTouch("right", false);
        DialogRightNoBlock(g_char.npc6, "story_182001") -- （R）npc-006：哈哈哈哈哈，这次见面恐怕就是最后一次了！

        -- 延迟 1.5 秒
        Sleep(1.5)

        HideAllDialogs()                                -- 关闭对话框
        DialogLeftNoBlock(g_char.npc2, "story_182002")  -- （L）npc-002：是你！

        -- 延迟 1 秒
        Sleep(1)

        HideAllDialogs()                                -- 关闭对话框
        DialogRightNoBlock(g_char.npc12, "story_182003") -- （R）npc-006：专心面对你当前的危险吧！看看我的最新发明！！起！！

        -- 延迟 1.5 秒
        Sleep(1.5)

        HideAllDialogs()                                -- 关闭对话框
        sw.SetDialogCanTouch("left", true);
        sw.SetDialogCanTouch("right", true);

    end
}

-- 在 1820 任务之后，击杀第 8 个BOSS
g_stories[1830] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1820) and data.mon_id == 504001 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/albus-1", "normal", 0, 0, "npcpnt-10072")
        sw.SetStoryFinished(1630, true)
        sw.SetStoryFinished(1640, true)
        sw.SetStoryFinished(1650, true)
        sw.SetStoryFinished(1660, true)
        sw.SetStoryFinished(1680, true)
        sw.SetStoryFinished(1690, true)
        sw.SetStoryFinished(1700, true)
        sw.SetStoryFinished(1710, true)
        sw.SetStoryFinished(1720, true)
        sw.SetStoryFinished(1730, true)
        sw.SetStoryFinished(1740, true)
        sw.SetStoryFinished(1750, true)
        sw.SetStoryFinished(1760, true)
        sw.SetStoryFinished(1770, true)
        sw.SetStoryFinished(1780, true)
        sw.SetStoryFinished(1790, true)
        sw.SetStoryFinished(1800, true)
        sw.SetStoryFinished(1810, true)
        sw.SetStoryFinished(1820, true)

        DialogRight(g_char.npc12, "story_183001")       -- （R）npc-012：怎、怎么会！机械故障？！
        DialogLeft(g_char.npc2, "story_183002")         -- （L）npc-002：专心面对你当前的危险吧...
        DialogRight(g_char.npc12, "story_183003")       -- （R）npc-012：啊啊啊啊！！我的发明不会有问题啊！！可恶！！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_183004")         -- （L）npc-002：反而是因为他，把能量涡轮炸了，浮空岛索纳塔尔格应该停止了移动。
        DialogLeft(g_char.npc2, "story_183005")         -- （L）npc-002：刚刚那个人...
        DialogLeft(g_char.npc2, "story_183006")         -- （L）npc-002：我们也赶紧追上去，继续赶路吧！

        sw.ShowNode("ccb/object/chapterfx-4", "end", 0, 0, "fxcenter")
        Wait(4)

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(800)
        end
    end
}


-- 击杀第 8 个BOSS之后，到达坐标55,50
g_stories[1840] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1830) and tMapInfo.id == 1008 and data.x == 55 and data.y == 50
    end,

    body = function(self, data)

        sw.ShowNode("ccb/object/albus-1", "normal", 0, 0, "npcpnt-10072")
        -- 播放albus的open时间轴

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc15, "story_184001")        -- （L）npc-015：呼~干得不错啊。
        DialogLeft(g_char.npc15, "story_184002")        -- （L）npc-015：虽然都是些机械研究数据，但是还是很有用。
        DialogRight(g_char.npc2, "story_184003")        -- （R）npc-002：阿鲁巴斯，你认识一个叫哈瓦努的鱼人么？据说是被你...
        DialogLeft(g_char.npc15, "story_184004")        -- （L）npc-015：别这么说啊，哈哈哈，他现在好得很，你们会感谢我的。
        DialogRight(g_char.npc2, "story_184005")        -- （R）npc-002：那么他现在在哪儿呢？
        DialogLeft(g_char.npc15, "story_184006")        -- （L）npc-015：唔...
        DialogLeft(g_char.npc15, "story_184007")        -- （L）npc-015：帮我个忙，我就告诉你？如何？

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc15, "story_184008")        -- （L）npc-015：你似乎没得选，哈哈哈哈。
        DialogLeft(g_char.npc15, "story_184009")        -- （L）npc-015：你接下来即将进入索纳塔尔格的动力隔热冷却区，这是一条可以直接通往索纳塔尔格表面的路。
        DialogLeft(g_char.npc15, "story_184010")        -- （L）npc-015：我需要你打败其中的一个研究人员，拿到他的研究报告。他应该在你前往顶部途中的纯白要塞里。
        DialogLeft(g_char.npc15, "story_184011")        -- （L）npc-015：就这么说啦，我要继续研究一会儿，你们上路吧！

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc2, "story_184012")        -- （R）npc-002：可不能食言。
    end
}

-- 回到营地
g_stories[1850] =
{
    moment      = "enter camp",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1720)
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc19, "story_185001")        -- （L）npc-019：我知道有、有问题。
        DialogRight(g_char.npc16, "story_185002")       -- （R）npc-016：没想到是菲欧娜故意引开我...
        DialogLeft(g_char.npc19, "story_185003")        -- （L）npc-019：她原本，不这么开朗。
        DialogLeft(g_char.npc19, "story_185004")        -- （L）npc-019：早就该发现。
        DialogRight(g_char.npc2, "story_185005")        -- （R）npc-002：你们也别难过，他似乎是被完全控制了。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc14, "story_185006")       -- （R）npc-014：嗯，通过这次，你也能学到不少东西吧。
        sw.AddSkillPoint(1)                             -- 获得：技能点 × 1
        sw.PlaySound("qte-1", false, 99)
        sw.PlaySound("levelup", false, 99)
    end
}

-- 回到主界面
g_stories[1860] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1830)
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_186001")         -- （L）npc-001：你干掉了我们地精的死对头！！那个傻子博士！！
        DialogLeft(g_char.npc1, "story_186002")         -- （L）npc-001：咳咳...这是我表弟发来的感谢信，还有慰问品。
        DialogLeft(g_char.npc1, "story_186003")         -- （L）npc-001：我可没有克扣！！
        sw.AddDiamond(500)                              -- 获得：钻石 × 500
        sw.PlaySound("qte-1", false, 99)

        sw.ShowNode("ccb/object/window-900009", "open", 0, 0, "fxcenter")

    end
}

-- 到达楼层 81
g_stories[1870] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1830) and data.map_id == 81
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_187001")         -- （L）npc-002：打起精神。
        DialogLeft(g_char.npc2, "story_187002")         -- （L）npc-002：我们在冲刺索纳塔尔格的最后一段路了。
    end
}

-- 到达楼层 84
g_stories[1880] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1870) and data.map_id == 84
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_188001")         -- （L）npc-002：唔...好冷啊，你多带大衣了么？手套也行...
        DialogLeft(g_char.npc2, "story_188002")         -- （L）npc-002：别让自己冻僵了，这个冷冻隔热的区域看起来似乎像是...魔法？
    end
}

-- 到达楼层 89
g_stories[1890] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1880) and data.map_id == 89
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_189001")         -- （L）npc-002：纯白要塞？...
        DialogLeft(g_char.npc2, "story_189002")         -- （L）npc-002：这里看起来有些像啊，想办法先把阿鲁巴斯的要求搞定。
    end
}

-- 进入第 9 个BOSS关卡
g_stories[1900] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1890) and data.map_id == 1009
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_190001")         -- （L）npc-002：到了，这里就是纯白要塞了，暴风雪似乎更大了...
        DialogLeft(g_char.npc2, "story_190002")         -- （L）npc-002：先不管这么多了，赶紧找阿鲁巴斯要的研究报告吧。
    end
}

-- 进入第 9 个BOSS关卡，到达坐标48,53或50,50或52,53
g_stories[1910] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1900) and tMapInfo.id == 1009 and ( ( data.x == 48 and data.y == 53 ) or ( data.x == 50 and data.y == 50 ) or ( data.x == 52 and data.y == 53 ) )
    end,

    body = function(self, data)
        sw.SetStoryFinished(1840)
        sw.SetPlayerOperable(false)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc13, "story_191001")        -- （L）npc-013：不用找了。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc13, "story_191002")        -- （L）npc-013：研究报告在我身上，击败我，拿走它。
        DialogLeft(g_char.npc13, "story_191003")        -- （L）npc-013：不过你们不要心存侥幸，我可不会像雷酒那样睁一只眼闭一只眼。

        sw.SetPlayerOperable(true)

        sw.ShowNode("ccb/object/chapterfx-5", "1", 0, 0, "fxcenter")

    end
}

-- 击杀第 9 个BOSS，ID：505000
g_stories[1920] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1910) and data.mon_id == 505000 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/albus-1", "normal", 0, 0, "npcpnt-10091")

        DialogLeft(g_char.npc13, "story_192001")        -- （L）npc-013：唔啊！！艾萨琳，等我！！


        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc15, "story_192002")        -- （L）npc-015：似乎搞到手了，嗯...
        DialogLeft(g_char.npc15, "story_192003")        -- （L）npc-015：啊、啊、啊别急，我知道我该说什么。
        DialogLeft(g_char.npc15, "story_192004")        -- （L）npc-015：哈瓦努，是吧，他不仅仅是被我改造过了，而且也是兄弟会不可或缺的一名成员。所以，我相信他现在正和温妮莎或者郝利克斯在一起也不一定，索纳塔尔格表面？
        DialogLeft(g_char.npc15, "story_192005")        -- （L）npc-015：啊？如果你们这么想找到答案，就冲上去吧，哈哈哈哈哈。
        DialogLeft(g_char.npc15, "story_192006")        -- （L）npc-015：作为感谢，这次微整改造就当送你了，好好改造自己的基因。

        -- 播放albus的close

        DialogLeft(g_char.npc2, "story_192007")         -- （L）npc-002：继续走吧，最后一点路，我们就要到达索纳塔尔格了...
        sw.AddSkillPoint(1)                             -- 获得：技能点 × 1
        sw.PlaySound("levelup", false, 99)
        sw.PlaySound("qte-1", false, 99)
        sw.ShowNode("ccb/object/albus-1", "out", 0, 0, "npcpnt-10091")

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(800)
        end
    end
}

-- 到达楼层 91
g_stories[1930] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1920) and data.map_id == 91
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_193001")         -- （L）npc-002：多吉亚如果还在调查的话，应该也在这附近。
        DialogLeft(g_char.npc2, "story_193002")         -- （L）npc-002：很久没到他了，还真有点不习惯啊。
    end
}

-- 到达楼层 95
g_stories[1940] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1930) and tMapInfo.id == 95 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_194001")         -- （L）npc-002：这是...
        DialogLeft(g_char.npc2, "story_194002")         -- （L）npc-002：不好！得赶紧想办法和多吉亚取得联系！
        sw.ShowNode("ccb/object/window-900010", "open", 0, 0, "fxcenter")
    end
}

-- 到达楼层 98，激活向上层的楼梯
g_stories[1950] =
{
    moment      = "near pass",
    priority    = 98,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1940) and tMapInfo.id == 98
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc18, "story_195001")        -- （L）npc-018：灵魂链接这种小把戏...
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        Wait(1)
        DialogLeft(g_char.npc18, "story_195002")        -- （L）npc-018：不要再往前了，你已经有朋友因此送命了。
        DialogLeft(g_char.npc18, "story_195003")        -- （L）npc-018：当然，我知道你也不会听，就和之前的菲欧娜一样。可惜了这么好的苗子。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_195004")         -- （L）npc-002：你说什么？勇者用灵魂链接来威胁你？
        DialogLeft(g_char.npc2, "story_195005")         -- （L）npc-002：看样子也不用我说...你的表情看起来并不接受这份威胁的样子啊。
        sw.SetPlayerOperable(true)
    end
}

-- 进入第 10 个BOSS关卡
g_stories[1960] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1010
    end,

    body = function(self, data)

        -- 显示dogiasnow节点

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc18, "story_196001")       -- （R）npc-016：你真的认为你的一腔热血不会在这里被冻结成冰渣子？？怎么样，要投靠我们吗？你应该能成为一个很不错的打手。
        DialogLeft(g_char.npc11, "story_196002")        -- （L）npc-011：投靠你们？哈哈哈？
        DialogLeft(g_char.npc11, "story_196003")        -- （L）npc-011：我拒绝。

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogRight(g_char.npc18, "story_196004")       -- （R）npc-016：那真是可惜了
        sw.PlaySound("boss-2-5", false, 99)             -- 播放音效boss-2-5，优先级99，不循环
        DialogLeft(g_char.npc11, "story_196005")        -- （L）npc-011：啊！！！
        sw.ShowNode("ccb/object/pe-1-2-1", "normal", 0, 0, "npcpnt-10092")
        sw.ShowNode("ccb/object/dogia-f", "1", 0, 0, "npcpnt-10092")
        DialogLeft(g_char.npc2, "story_196006")         -- （L）npc-002：不好！
    end
}

-- 进入第 10 个BOSS关卡，到达坐标49,52
g_stories[1970] =
{
    moment      = "arrive tile",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return sw.IsStoryFinished(1960) and tMapInfo.id == 1010 and data.x == 49 and data.y == 52
    end,

    body = function(self, data)
       sw.SetPlayerOperable(false)
        sw.ShowNode("ccb/object/hintfx", "1", 0, 0, "playerpnt")
        DialogLeft(g_char.npc2, "story_197001")         -- （L）npc-002：老大！
        sw.PlaySound("boss-2-3", false, 99)        -- 播放音效event-1-2，优先级99，不循环
        Wait(0.5)
        sw.ShowNode("ccb/object/pe-10-1-1", "hit_1", 0, 0, "npcpnt-10092")
        sw.ShowNode("ccb/object/dogia-f", "out", 0, 0, "npcpnt-10092")

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_197002")         -- （L）npc-002：......

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_197003")         -- （L）npc-002：看来我们来晚了一步...
        DialogRight(g_char.npc18, "story_197004")       -- （R）npc-016：没呢！并不算很晚，我将把你们埋葬在一起！哈哈哈哈哈！
        DialogLeft(g_char.npc2, "story_197005")         -- （L）npc-002：是啊...

        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_197006")         -- （L）npc-002：并不算很晚，我们还可以杀了你报仇...
        sw.SetPlayerOperable(true)
    end
}

-- 开始与第 10 个BOSS的战斗（本任务流程不影响玩家操作）
g_stories[1980] =
{
    moment      = "boss appear",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1970) and data.mon_id == 505001
    end,

    body = function(self, data)
        sw.SetDialogCanTouch("left", false);
        sw.SetDialogCanTouch("right", false);
        DialogLeftNoBlock(g_char.npc2, "story_198001")  -- （L）npc-002：多吉亚...

        -- 延迟 1 秒
        Sleep(1)

        HideAllDialogs()                                -- 关闭对话框
        DialogRightNoBlock(g_char.npc18, "story_198002")-- （R）npc-018：担心一下你自己吧！哈哈哈哈哈哈！

        -- 延迟 2 秒
        Sleep(2)

        HideAllDialogs()                                -- 关闭对话框
        sw.SetDialogCanTouch("left", true);
        sw.SetDialogCanTouch("right", true);
    end
}

-- 在 1980 任务之后，击杀第 10 个BOSS，ID：505001
g_stories[1990] =
{
    moment      = "battle end",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1980) and data.mon_id == 505001 and data.result == tBattleResult.WIN
    end,

    body = function(self, data)
        sw.SetStoryFinished(1840, true)
        sw.SetStoryFinished(1850, true)
        sw.SetStoryFinished(1870, true)
        sw.SetStoryFinished(1880, true)
        sw.SetStoryFinished(1890, true)
        sw.SetStoryFinished(1900, true)
        sw.SetStoryFinished(1910, true)
        sw.SetStoryFinished(1920, true)
        sw.SetStoryFinished(1930, true)
        sw.SetStoryFinished(1940, true)
        sw.SetStoryFinished(1950, true)
        sw.SetStoryFinished(1960, true)
        sw.SetStoryFinished(1970, true)
        sw.SetStoryFinished(1980, true)


        DialogRight(g_char.npc18, "story_199001")-- （R）npc-018：可恨！！
        DialogLeft(g_char.npc2, "story_199002")  -- （L）npc-002：多吉亚...我们帮你报仇了...
        DialogLeft(g_char.npc2, "story_199003")  -- （L）npc-002：我们损失太多了，先回营地暂做修整吧。
        sw.ShowNode("ccb/object/storyfx-end", "open", 0, 0, "storyend")
        Wait(32)
        sw.LeaveTower()

        if (PAID_VERSION) then
            DialogLeft(g_char.npc17, "story_00001")         -- （L）npc-017：恭喜通关！这是我们为付费版玩家准备的礼物，请收下吧。
            sw.AddDiamond(1000)
        end
   end
}


-- 返回主界面，暂时的终章
g_stories[2000] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(1990)
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/dogia-g", "1", 0, 0, "npcpnt01")
        Wait(2)
        sw.PlayBGM("theme-1")                           -- 播放背景音乐tower-1
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc1, "story_200001")         -- （L）npc-001：暂时别再追击了...动力坏了，他们也走不远。
        DialogLeft(g_char.npc1, "story_200002")         -- （L）npc-001：只是多吉亚...可恶！
        DialogRight(g_char.npc2, "story_200003")        -- （L）npc-002：先缓一缓吧，最近发生的事儿也太多了。

        sw.ShowNode("ccb/object/chapterfx-5", "end", 0, 0, "fxcenter")

        -- Wait(4)
        -- DialogLeft(g_char.npc17, "story_200004")        -- （L）npc-0017：当前版本章节已全部完成，您仍可完成其他的游戏内容，更多主线内容请查看或关注后续版本更新。

        -- 关闭所有任务，避免游戏中出现意外错误（如果有后续，需要把此段取消）
        --for vIndex, vValue in pairs(g_stories) do
            --sw.SetStoryFinished(vIndex, true)
        --end
    end
}


---------------------------------------------------------------------------------------------------
-- 开启无尽模式的剧情
g_stories[2010] =
{
    moment      = "enter camp",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2000);
    end,

    body = function(self, data)
        Wait(1);
        DialogLeft(g_char.npc15, "story_201001");
        Wait(2);
        DialogLeft(g_char.npc15, "story_201002");
        Wait(1);
        DialogLeft(g_char.npc10, "story_201003");
        DialogRight(g_char.npc2, "story_201004");
        Wait(1);
        DialogRight(g_char.npc2, "story_201005");
        DialogLeft(g_char.npc15, "story_201006");
        Wait(2);
        DialogLeft(g_char.npc15, "story_201007");
        DialogRight(g_char.npc2, "story_201008");
        DialogLeft(g_char.npc14, "story_201009");
        DialogLeft(g_char.npc15, "story_201010");
        DialogRight(g_char.npc2, "story_201011");
        DialogLeft(g_char.npc14, "story_201012");
        Wait(1);
        DialogLeft(g_char.npc15, "story_201013");
        Wait(1);
        DialogRight(g_char.npc2, "story_201014");
        Wait(1);
        DialogLeft(g_char.npc15, "story_201015");
        DialogRight(g_char.npc2, "story_201016");
        DialogLeft(g_char.npc15, "story_201017");
        Wait(1);
        DialogLeft(g_char.npc15, "story_201018");
        Wait(1);
        DialogRight(g_char.npc2, "story_201019");
        DialogLeft(g_char.npc15, "story_201020");
    end
}

-- 询问营地商人
g_stories[2020] =
{
    moment      = "open shop",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2010) and data.storage == 2;
    end,

    body = function(self, data)
        DialogLeft(g_char.npc16, "story_202001");
        DialogRight(g_char.npc2, "story_202002");
    end
}

-- 询问铁匠铺
g_stories[2030] =
{
    moment      = "open smithy",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2010);
    end,

    body = function(self, data)
        DialogRight(g_char.npc2, "story_203001");
        DialogLeft(g_char.npc10, "story_203002");
        DialogLeft(g_char.npc10, "story_203003");
        DialogRight(g_char.npc2, "story_203004");
    end
}

-- 询问镶嵌
g_stories[2040] =
{
    moment      = "open inlay",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2010);
    end,

    body = function(self, data)
        DialogRight(g_char.npc2, "story_204001");
        DialogLeft(g_char.npc19, "story_204002");
        DialogLeft(g_char.npc15, "story_204003");
        DialogLeft(g_char.npc19, "story_204004");
    end
}

-- 询问合成
g_stories[2050] =
{
    moment      = "open forge",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2010);
    end,

    body = function(self, data)
        DialogLeft(g_char.npc14, "story_205001");
        DialogRight(g_char.npc2, "story_205002");
        DialogLeft(g_char.npc14, "story_205003");
    end
}

-- 询问武器商人
g_stories[2060] =
{
    moment      = "open shop",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2010) and data.storage == 1;
    end,

    body = function(self, data)
        DialogRight(g_char.npc2, "story_206001");
        DialogLeft(g_char.npc1, "story_206002");
        DialogRight(g_char.npc2, "story_206003");
        DialogLeft(g_char.npc1, "story_206004");
    end
}

-- 未询问完，点击阿鲁巴斯
g_stories[2070] =
{
    moment      = "click npc",
    priority    = 60,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        if (data.npc ~= "albus") then
            return false;
        end
        if (sw.IsStoryFinished(2020) and sw.IsStoryFinished(2030) and sw.IsStoryFinished(2040) and
            sw.IsStoryFinished(2050) and sw.IsStoryFinished(2060)) then
            return false;
        end
        return true;
    end,

    body = function(self, data)
        DialogLeft(g_char.npc15, "story_207001");
    end
}

-- 已询问完，点击阿鲁巴斯
g_stories[2080] =
{
    moment      = "click npc",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        if (data.npc ~= "albus") then
            return false;
        end
        if (sw.IsStoryFinished(2020) and sw.IsStoryFinished(2030) and sw.IsStoryFinished(2040) and
            sw.IsStoryFinished(2050) and sw.IsStoryFinished(2060)) then
            return true;
        end
        return false;
    end,

    body = function(self, data)
        sw.SetStoryFinished(2070, true);

        DialogRight(g_char.npc2, "story_208001");
        DialogLeft(g_char.npc15, "story_208002");
        DialogRight(g_char.npc2, "story_208003");
        Wait(1);
        DialogLeft(g_char.npc15, "story_208004");
        DialogLeft(g_char.npc15, "story_208005");
        DialogLeft(g_char.npc15, "story_208006");
        DialogRight(g_char.npc2, "story_208007");
        Wait(1);
        DialogLeft(g_char.npc15, "story_208008");
        DialogLeft(g_char.npc10, "story_208009");
        DialogRight(g_char.npc2, "story_208010");
        DialogLeft(g_char.npc10, "story_208011");
        DialogLeft(g_char.npc15, "story_208012");
        Wait(1);
        DialogLeft(g_char.npc15, "story_208013");
        DialogLeft(g_char.npc15, "story_208014");
        Wait(2);
        DialogRight(g_char.npc2, "story_208015");
        DialogLeft(g_char.npc15, "story_208016");
        DialogRight(g_char.npc2, "story_208017");
        DialogLeft(g_char.npc15, "story_208018");
        DialogRight(g_char.npc2, "story_208019");
    end
}

-- 未找到金雄，点阿鲁巴斯
g_stories[2090] =
{
    moment      = "click npc",
    priority    = 60,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        if (data.npc ~= "albus") then
            return false;
        end
        return sw.IsStoryFinished(2080);
    end,

    body = function(self, data)
        DialogLeft(g_char.npc15, "story_209001");
    end
}

-- 产生金雄的密室
g_stories[2095] =
{
    moment      = "entered tower",
    priority    = 60,
    swallow     = false,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(2080) and data.map_id >= 81 and data.map_id <= 88;
    end,

    body = function(self, data)
        if (INLAND_VERSION) then
            local tc = sw.FindRoundSpace();
            sw.AddMapObject(tSceneObj.PORTAL, "portal", 2023, tc.col, tc.row);
        else
            sw.AddMapObject(tSceneObj.PORTAL, "portal", 2023);
        end
    end
}

-- 进入金雄的密室
g_stories[2100] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2080) and data.map_id == 2023;
    end,

    body = function(self, data)
        Wait(2);
        DialogLeft(g_char.npc23, "story_210001");
        Wait(1);
        DialogRight(g_char.npc2, "story_210002");
        DialogLeft(g_char.npc23, "story_210003");
        DialogRight(g_char.npc2, "story_210004");
        DialogLeft(g_char.npc23, "story_210005");
        DialogRight(g_char.npc2, "story_210006");
    end
}

-- 打败金雄
g_stories[2110] =
{
    moment      = "battle end",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2100) and data.result == tBattleResult.WIN and data.mon_id == 500107;
    end,

    body = function(self, data)
        Wait(1);
        DialogLeft(g_char.npc23, "story_211001");
        DialogRight(g_char.npc2, "story_211002");
        Wait(1);
        DialogLeft(g_char.npc23, "story_211003");
        DialogRight(g_char.npc2, "story_211004");
        DialogLeft(g_char.npc23, "story_211005");
        Wait(2);
        DialogRight(g_char.npc2, "story_211006");
        sw.SetStoryFinished(2090, true);
        sw.SetStoryFinished(2095, true);
        sw.LeaveTower();
    end
}

-- 找到金雄，回到营地
g_stories[2120] =
{
    moment      = "enter camp",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2110);
    end,

    body = function(self, data)
        Wait(2);
        DialogRight(g_char.npc23, "story_212001");
        DialogRight(g_char.npc23, "story_212002");
        Wait(1);
        DialogLeft(g_char.npc15, "story_212003");
        DialogRight(g_char.npc2, "story_212004");
        DialogRight(g_char.npc23, "story_212005");
        DialogRight(g_char.npc23, "story_212006");
        DialogLeft(g_char.npc15, "story_212007");
        DialogRight(g_char.npc23, "story_212008");
        DialogLeft(g_char.npc15, "story_212009");
        Wait(1);
        DialogRight(g_char.npc23, "story_212010");
        DialogLeft(g_char.npc15, "story_212011");
        DialogRight(g_char.npc23, "story_212012");
        Wait(2);
        DialogLeft(g_char.npc15, "story_212013");
        DialogRight(g_char.npc23, "story_212014");
        DialogLeft(g_char.npc15, "story_212015");
        DialogRight(g_char.npc23, "story_212016");
        DialogLeft(g_char.npc15, "story_212017");
        DialogRight(g_char.npc23, "story_212018");
        Wait(2);
        DialogLeft(g_char.npc15, "story_212019");
        DialogLeft(g_char.npc15, "story_212020");
        DialogRight(g_char.npc23, "story_212021");
        DialogLeft(g_char.npc15, "story_212022");
        DialogRight(g_char.npc23, "story_212023");
    end
}

-- 未找到装置，点阿鲁巴斯
g_stories[2125] =
{
    moment      = "click npc",
    priority    = 60,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        if (data.npc ~= "albus") then
            return false;
        end
        return sw.IsStoryFinished(2120);
    end,

    body = function(self, data)
        DialogLeft(g_char.npc15, "story_212501");
    end
}

-- 产生神庙
g_stories[2127] =
{
    moment      = "entered tower",
    priority    = 60,
    swallow     = false,
    repeatable  = true,

    condition = function(self, data)
        if (sw.IsStoryFinished(2120)) then
            if ((data.map_id >= 91 and data.map_id <= 94) or (data.map_id >= 97 and data.map_id <= 100)) then
                return true;
            end
        end
        return  false;
    end,

    body = function(self, data)
        if (INLAND_VERSION) then
            local tc = sw.FindRoundSpace();
            sw.AddMapObject(tSceneObj.PORTAL, "portal", 2020, tc.col, tc.row);
        else
            sw.AddMapObject(tSceneObj.PORTAL, "portal", 2020);
        end
    end
}

-- 进入地图
g_stories[2130] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        if (sw.IsStoryFinished(2120)) then
            if ((data.map_id >= 91 and data.map_id <= 94) or (data.map_id >= 97 and data.map_id <= 100)) then
                return true;
            end
        end
        return  false;
    end,

    body = function(self, data)
        DialogRight(g_char.npc2, "story_213001");
        DialogRight(g_char.npc2, "story_213002");
    end
}

-- 进入神庙
g_stories[2140] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2130) and data.map_id == 2020;
    end,

    body = function(self, data)
        DialogRight(g_char.npc2, "story_214001");
    end
}

-- 找到装置
g_stories[2150] =
{
    moment		= "obtain item",
    priority	= 50,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(2140) and data.item_id == 610001;
    end,

    body = function(self, data)
        sw.CloseWindowViews();
        DialogRight(g_char.npc2, "story_215001");
        sw.SetStoryFinished(2125, true);
        sw.SetStoryFinished(2127, true);
    end,
};

-- 找到装置，回到营地
g_stories[2160] =
{
    moment      = "enter camp",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2150);
    end,

    body = function(self, data)
        Wait(2);
        DialogLeft(g_char.npc15, "story_216001");
        DialogRight(g_char.npc2, "story_216002");
        DialogLeft(g_char.npc15, "story_216003");
        Wait(1);
        DialogLeft(g_char.npc15, "story_216004");
        DialogLeft(g_char.npc15, "story_216005");
        DialogLeft(g_char.npc15, "story_216006");
        DialogLeft(g_char.npc15, "story_216007");
        DialogLeft(g_char.npc15, "story_216008");
        Wait(1);
        DialogLeft(g_char.npc15, "story_216009");
        DialogLeft(g_char.npc15, "story_216010");
        sw.SetFunctionUnlock(tFunction.ENDLESS, true);
        sw.RefreshShop(2);
    end
}

-- 询问铁匠铺
g_stories[2170] =
{
    moment      = "open smithy",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2160);
    end,

    body = function(self, data)
        DialogRight(g_char.npc2, "story_217001");
        DialogLeft(g_char.npc10, "story_217002");
        Wait(1);
        DialogLeft(g_char.npc15, "story_217003");
    end
}

-- 询问营地商人
g_stories[2180] =
{
    moment      = "open shop",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2160) and data.storage == 2;
    end,

    body = function(self, data)
        DialogLeft(g_char.npc16, "story_218001");
        DialogRight(g_char.npc2, "story_218002");
        DialogLeft(g_char.npc16, "story_218003");
        DialogRight(g_char.npc2, "story_218004");
    end
}

-- 询问合成
g_stories[2190] =
{
    moment      = "open forge",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2160);
    end,

    body = function(self, data)
        DialogLeft(g_char.npc14, "story_219001");
    end
}

-- 剧情暂时完成，点阿鲁巴斯
g_stories[2200] =
{
    moment      = "click npc",
    priority    = 60,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        if (data.npc ~= "albus") then
            return false;
        end
        return sw.IsStoryFinished(2160);
    end,

    body = function(self, data)
        local r = sw.randi(0, 2);
        local s = string.format("story_22000%d", r);
        DialogLeft(g_char.npc15, s);
    end
}

----------------------------------------------------------------------------------
-- 开始困难模式剧情
g_stories[2210] =
{
    moment      = "enter main",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2160);
    end,

    body = function(self, data)
        sw.SetFunctionUnlock(tFunction.HARD, true);

        DialogRight(g_char.npc2, "story_221000");
        Wait(1);
        DialogRight(g_char.npc2, "story_221001");
        
        sw.ShowMask(true, {file = "image/ui/creat-2-1.png", x = 510, y = 930, dw = 508, dh = 828, mw = 280, mh = 660});
        sw.ShowNode("ccb/object/creatfx", "type-1", 510, 930);
        sw.ShowNode("ccb/object/finger", "type-1", 550, 900);
    end
}

-- 点击后隐藏引导
g_stories[2215] =
{
    moment		= "tower list",
    priority	= 50,
    swallow     = true,
    repeatable	= false,

    condition = function(self, data)
        return sw.IsStoryFinished(2210)
    end,

    body = function(self, data)
        sw.HideMask();
        sw.HideNode("ccb/object/finger");
        sw.HideNode("ccb/object/creatfx");
    end,
};

-- 进入110层BOSS关卡，到达坐标40,50
g_stories[2220] =
{
    moment      = "arrive tile",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 1011 and data.x == 40 and data.y == 50 and sw.IsStoryFinished(2210)
    end,

    body = function(self, data)
        sw.SetPlayerOperable(false)
        sw.StopPlayerAction()
        sw.CloseWindowViews()
        Wait(0.5)

        DialogRight(g_char.npc2, "story_222000")
        DialogRight(g_char.npc2, "story_222001")
        sw.SetPlayerOperable(true)
    end
}

-- 进入120层BOSS关卡
g_stories[2230] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 1012 and sw.IsStoryFinished(2210)
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc2, "story_223000")
        Wait(1)
        DialogRight(g_char.npc2, "story_223001")
    end
}

-- 进入122层
g_stories[2240] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 122 and sw.IsStoryFinished(2210)
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc2, "story_224000")
        Wait(1)
        DialogRight(g_char.npc2, "story_224001")
    end
}

-- 进入130层BOSS关卡
g_stories[2250] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap()
        return tMapInfo.id == 1013 and sw.IsStoryFinished(2210)
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc2, "story_225000")
        DialogRight(g_char.npc2, "story_225001")
        Wait(1)
        DialogLeft(g_char.npc24, "story_225002")
        Wait(1)
        DialogRight(g_char.npc2, "story_225003")
        DialogLeft(g_char.npc24, "story_225004")
        Wait(1)
        DialogRight(g_char.npc2, "story_225005")
    end
}

-- 击杀130层BOSS
g_stories[2260] =
{
    moment      = "battle end",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.result == tBattleResult.WIN and data.mon_id == 511003 and sw.IsStoryFinished(2250);
    end,

    body = function(self, data)
        DialogLeft(g_char.npc24, "story_226000")
        Wait(1)
        DialogRight(g_char.npc2, "story_226001")
    end
}

-- 进入第 140 BOSS关卡
g_stories[2270] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1014 and sw.IsStoryFinished(2260)
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc2, "story_227000")
        Wait(1)
        DialogLeft(g_char.npc6, "story_227001")
        DialogLeft(g_char.npc6, "story_227002")
        Wait(1)
        DialogRight(g_char.npc2, "story_227003")
        DialogLeft(g_char.npc6, "story_227004")
        DialogRight(g_char.npc2, "story_227005")
    end
}

-- 击杀140层BOSS
g_stories[2280] =
{
    moment      = "battle end",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.result == tBattleResult.WIN and data.mon_id == 511004 and sw.IsStoryFinished(2270);
    end,

    body = function(self, data)
        DialogRight(g_char.npc2, "story_228000")
        DialogRight(g_char.npc2, "story_228001")
        Wait(1)
        DialogRight(g_char.npc2, "story_228002")
    end
}

-- 进入第 150 BOSS关卡
g_stories[2290] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1015 and sw.IsStoryFinished(2280)
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc2, "story_229000")
        Wait(1)
        DialogRight(g_char.npc2, "story_229001")
    end
}

-- 进入第 160 BOSS关卡
g_stories[2300] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1016 and sw.IsStoryFinished(2290)
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc2, "story_230000")
        DialogRight(g_char.npc2, "story_230001")
        DialogRight(g_char.npc2, "story_230002")
    end
}

-- 进入第 161 关卡
g_stories[2310] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 161 and sw.IsStoryFinished(2300)
    end,

    body = function(self, data)
        Wait(1)
        DialogLeft(g_char.npc12, "story_231000")
        Wait(1)
        DialogRight(g_char.npc2, "story_231001")
        Wait(1)
        DialogLeft(g_char.npc12, "story_231002")
    end
}

-- 进入第 171 关卡
g_stories[2320] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 171 and sw.IsStoryFinished(2310)
    end,

    body = function(self, data)
        Wait(1)
        DialogLeft(g_char.npc12, "story_232000")
        Wait(1)
        DialogRight(g_char.npc2, "story_232001")
    end
}

-- 进入第 180 Boss关卡
g_stories[2330] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1018 and sw.IsStoryFinished(2320)
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc2, "story_233000")
        Wait(1)
        DialogLeft(g_char.npc12, "story_233001")
        Wait(1)
        DialogLeft(g_char.npc12, "story_233002")
    end
}

-- 准备进 181 之前
g_stories[2340] =
{
    moment      = "ready to tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.last_id == 1018 and data.map_id == 181 and sw.IsStoryFinished(2330)
    end,

    body = function(self, data)
        sw.PauseRunningActions()
        Wait(1)

        DialogLeft(g_char.npc12, "story_234000")
        DialogLeft(g_char.npc12, "story_234001")
        Wait(1)
        DialogLeft(g_char.npc12, "story_234002")
        
        sw.ResumeActions()
    end
}

-- 进入第 191 关卡
g_stories[2350] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 191 and sw.IsStoryFinished(2340)
    end,

    body = function(self, data)
        Wait(1)
        DialogRight(g_char.npc2, "story_235000")
    end
}

-- 进入第 200 Boss关卡
g_stories[2360] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 1020 and sw.IsStoryFinished(2340)
    end,

    body = function(self, data)
        Wait(1)
        DialogLeft(g_char.npc25, "story_236000")
        Wait(1)
        DialogRight(g_char.npc2, "story_236001")
        Wait(1)
        DialogLeft(g_char.npc25, "story_236002")
        DialogLeft(g_char.npc25, "story_236003")
        Wait(1)
        DialogRight(g_char.npc2, "story_236004")
    end
}

-- 击杀200层BOSS
g_stories[2370] =
{
    moment      = "battle end",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.result == tBattleResult.WIN and data.mon_id == 511010 and sw.IsStoryFinished(2360);
    end,

    body = function(self, data)
        DialogRight(g_char.npc2, "story_237000")
        Wait(1)
        DialogRight(g_char.npc2, "story_237001")
        DialogRight(g_char.npc2, "story_237002")
    end
}

-- 困难模式剧情结束
g_stories[2380] =
{
    moment      = "enter main",
    priority    = 50,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return sw.IsStoryFinished(2360);
    end,

    body = function(self, data)
        DialogLeft(g_char.npc17, "story_238000")
    end
}


----------------------------------------------------------------------------------
-- 活动检查
g_stories[5000] =
{
    moment      = "check activity",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        if (data.acid == 1) then
            return not sw.IsStoryFinished(5100);
        end
        return false;
    end,

    body = function(self, data)
        sw.PlayBGM("xmas-1")
        sw.ShowNode("ccb/object/xmasman", "stand", 0, 0, "feast-2")
    end
};

-- 活动统一入口
g_stories[5010] =
{
    moment      = "click activity",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return data.acid == 1;
    end,

    body = function(self, data)
        if (data.acid == 1) then
            sw.TeleportTower(5001, true);
            sw.PlaySound("object-7-3", false, 99)
        end
    end
};


g_stories[5100] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    condition = function(self, data)
        return data.map_id == 5001
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/en-a", "normal", 0, 0, "scr-4852")
        sw.ShowNode("ccb/object/en-b", "normal", 0, 0, "scr-5257")
        sw.ShowNode("ccb/object/en-c", "normal", 0, 0, "scr-4856")
        sw.ShowNode("ccb/object/en-d", "normal", 0, 0, "scr-5356")
        sw.ShowNode("ccb/object/en-e", "normal", 0, 0, "scr-4755")
        sw.ShowNode("ccb/object/en-f", "normal", 0, 0, "scr-4756")
        sw.ShowNode("ccb/object/en-g", "normal", 0, 0, "scr-4853")
        sw.ShowNode("ccb/object/en-h", "normal", 0, 0, "scr-4750")
        sw.ShowNode("ccb/object/en-i", "normal", 0, 0, "scr-5351")
        sw.ShowNode("ccb/object/en-j", "normal", 0, 0, "scr-5150")
        sw.ShowNode("ccb/object/en-k", "normal", 0, 0, "scr-4655")
        sw.ShowNode("ccb/object/en-l", "normal", 0, 0, "scr-4949")
        sw.ShowNode("ccb/object/en-m", "normal", 0, 0, "scr-4851")
        sw.ShowNode("ccb/object/en-n", "normal", 0, 0, "scr-5149")
        sw.ShowNode("ccb/object/en-o", "normal", 0, 0, "scr-5050")
        sw.ShowNode("ccb/object/en-p", "normal", 0, 0, "scr-5353")
        sw.ShowNode("ccb/object/en-q", "normal", 0, 0, "scr-4950")
        sw.ShowNode("ccb/object/en-r", "normal", 0, 0, "scr-5251")
        sw.ShowNode("ccb/object/en-s", "normal", 0, 0, "scr-4753")
        sw.ShowNode("ccb/object/en-t", "normal", 0, 0, "scr-5350")
        sw.ShowNode("ccb/object/en-u", "normal", 0, 0, "scr-5252")
        sw.ShowNode("ccb/object/en-v", "normal", 0, 0, "scr-5256")
        sw.ShowNode("ccb/object/en-w", "normal", 0, 0, "scr-5455")
        sw.ShowNode("ccb/object/en-x", "normal", 0, 0, "scr-5355")
        sw.ShowNode("ccb/object/en-y", "normal", 0, 0, "scr-4751")
        sw.ShowNode("ccb/object/en-z", "normal", 0, 0, "scr-5253")
        sw.ShowNode("ccb/object/xmastree", "normal", 0, 0, "feast-1")
        Wait(1)
        DialogLeft(g_char.npc2, "story_500001")
        Wait(1)
        DialogLeft(g_char.npc2, "story_500002")
        Wait(1)
        DialogLeft(g_char.npc2, "story_500003")
        DialogLeft(g_char.npc2, "story_500004")
    end
}


g_stories[6002] =
{
    moment      = "arrive tile",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    mapFloor = {},
    condition = function(self, data)
         local tMapInfo = sw.GetCurMap();
        if (tMapInfo.id ~= 525) then
            return false;
        end
        if g_stories[6001].isCreate then
            if data.x == 46 and data.y == 50 then
                DialogLeft(g_char.npc2, "story_600002")
            end
        end
        if g_stories[6001].isOpen and data.x == 51 and data.y == 54 then
            g_stories[6001].isOpen = false
            DialogLeft(g_char.npc2, "story_600001")
            sw.BreakMapObject("block_1", true)
        end
        if data.x >= 39 and data.x <= 50 and data.y >= 46 and data.y <= 50 then
            return true
        end
        return false;
    end,
    
    body = function(self, data)
        if g_stories[6001].isCreate then
            g_stories[6001].isCreate = false
            self.mapFloor = {}
            if data.x == 46 and data.y == 51 then
                DialogLeft(g_char.npc2, "story_600002")
            end
        end
        local name = data.x .. "-" .. data.y
        if self.mapFloor[name] then
            sw.ShowNode("ccb/object/en-x", "tonormal", data.x * 100 , data.y * 100 , "SCR", name )
            self.mapFloor[name] = false
            sw.VisibleMapObject("block_2",true)
        else
            sw.ShowNode("ccb/object/en-x", "open", data.x * 100 , data.y * 100 , "SCR", name )
            self.mapFloor[name] = true
            local isPass = true
            local count = 0
            for i,v in pairs(self.mapFloor) do
                if not v then
                    isPass = false
                end
                count = count + 1
            end
            if count == 60 and isPass then
                if data.x == 50 and data.y == 48 then
                    sw.BreakMapObject("block_2",true)
                else
                    sw.VisibleMapObject("block_2",false)
                end
            else
                sw.VisibleMapObject("block_2",true)
            end

        end
    end
}

g_stories[6001] =
{
    moment      = "entered tower",
    priority    = 50,
    swallow     = true,
    repeatable  = true,
    isCreate    = false,
    isOpen      = true,
    condition = function(self, data)
        return data.map_id == 525
    end,
    
    body = function(self, data)
        g_stories[6001].isCreate = true
        g_stories[6001].isOpen = true
        for i = 39,50 do
            for j = 50,54 do
                sw.ShowNode("ccb/object/en-x", "normal", i * 100 , 10000 - ( j * 100) , "SCR",  i .. "-" .. j )
            end
        end
    end
}

g_stories[5110] =
{
    moment      = "arrive tile",
    priority    = 50,
    swallow     = true,
    repeatable  = true,

    char_map = {["a"] = {48, 52, "scr-4852"},
                ["b"] = {52, 57, "scr-5257"},
                ["c"] = {48, 56, "scr-4856"},
                ["d"] = {53, 56, "scr-5356"},
                ["e"] = {47, 55, "scr-4755"},
                ["f"] = {47, 56, "scr-4756"},
                ["g"] = {48, 53, "scr-4853"},
                ["h"] = {47, 50, "scr-4750"},
                ["i"] = {53, 51, "scr-5351"},
                ["j"] = {51, 50, "scr-5150"},
                ["k"] = {46, 55, "scr-4655"},
                ["l"] = {49, 49, "scr-4949"},
                ["m"] = {48, 51, "scr-4851"},
                ["n"] = {51, 49, "scr-5149"},
                ["o"] = {50, 50, "scr-5050"},
                ["p"] = {53, 53, "scr-5353"},
                ["q"] = {49, 50, "scr-4950"},
                ["r"] = {52, 51, "scr-5251"},
                ["s"] = {47, 53, "scr-4753"},
                ["t"] = {53, 50, "scr-5350"},
                ["u"] = {52, 52, "scr-5252"},
                ["v"] = {52, 56, "scr-5256"},
                ["w"] = {54, 55, "scr-5455"},
                ["x"] = {53, 55, "scr-5355"},
                ["y"] = {47, 51, "scr-4751"},
                ["z"] = {52, 53, "scr-5253"},
               },

    condition = function(self, data)
        local tMapInfo = sw.GetCurMap();
        if (tMapInfo.id ~= 5001) then
            return false;
        end

        local ch;
        for i,v in pairs(self.char_map) do
            if (data.x == v[1] and data.y == v[2]) then
                ch = i;
                break;
            end
        end
        if (not ch) then
            return false;
        end

        return true;
    end,

    body = function(self, data)
        local ch;
        for i,v in pairs(self.char_map) do
            if (data.x == v[1] and data.y == v[2]) then
                ch = i;
                break;
            end
        end

        local dataKey = "christmas";
        local step = sw.GetStoryData(dataKey);
        if (step == "" and ch == "c") then
            for i,v in pairs(self.char_map) do
                if (i ~= ch) then
                    sw.ShowNode("ccb/object/en-" .. i, "normal", 0, 0, v[3])
                end
            end
            sw.ShowNode("ccb/object/en-c", "open", 0, 0, "scr-4856");
            sw.ShowNode("ccb/object/xmastree", "1", 0, 0, "feast-1");
            sw.SetStoryData(dataKey, "1");
        elseif (step == "1" and ch == "h") then
            sw.ShowNode("ccb/object/en-h", "open", 0, 0, "scr-4750")
            sw.ShowNode("ccb/object/en-c", "tonormal", 0, 0, "scr-4856")
            sw.ShowNode("ccb/object/xmastree", "2", 0, 0, "feast-1")
            sw.SetStoryData(dataKey, "2");
        elseif (step == "2" and ch == "r") then
            sw.ShowNode("ccb/object/en-r", "open", 0, 0, "scr-5251")
            sw.ShowNode("ccb/object/en-h", "tonormal", 0, 0, "scr-4750")
            sw.ShowNode("ccb/object/xmastree", "3", 0, 0, "feast-1")
            sw.SetStoryData(dataKey, "3");
        elseif (step == "3" and ch == "i") then
            sw.ShowNode("ccb/object/en-i", "open", 0, 0, "scr-5351")
            sw.ShowNode("ccb/object/en-r", "tonormal", 0, 0, "scr-5251")
            sw.ShowNode("ccb/object/xmastree", "4", 0, 0, "feast-1")
            sw.SetStoryData(dataKey, "4");
        elseif (step == "4" and ch == "s") then
            sw.ShowNode("ccb/object/en-s", "open", 0, 0, "scr-4753")
            sw.ShowNode("ccb/object/en-i", "tonormal", 0, 0, "scr-5351")
            sw.ShowNode("ccb/object/xmastree", "5", 0, 0, "feast-1")
            sw.SetStoryData(dataKey, "5");
        elseif (step == "5" and ch == "t") then
            sw.ShowNode("ccb/object/en-t", "open", 0, 0, "scr-5350")
            sw.ShowNode("ccb/object/en-s", "tonormal", 0, 0, "scr-4753")
            sw.ShowNode("ccb/object/xmastree", "6", 0, 0, "feast-1")
            sw.SetStoryData(dataKey, "6");
        elseif (step == "6" and ch == "m") then
            sw.ShowNode("ccb/object/en-m", "open", 0, 0, "scr-4851")
            sw.ShowNode("ccb/object/en-t", "tonormal", 0, 0, "scr-5350")
            sw.ShowNode("ccb/object/xmastree", "7", 0, 0, "feast-1")
            sw.SetStoryData(dataKey, "7");
        elseif (step == "7" and ch == "a") then
            sw.ShowNode("ccb/object/en-a", "open", 0, 0, "scr-4852")
            sw.ShowNode("ccb/object/en-m", "tonormal", 0, 0, "scr-4851")
            sw.ShowNode("ccb/object/xmastree", "8", 0, 0, "feast-1")
            sw.SetStoryData(dataKey, "8");
        elseif (step == "8" and ch == "s") then
            sw.SetStoryData(dataKey, "9");
            sw.SetStoryFinished(5100, true);
            sw.SetStoryFinished(5110, true);

            sw.SetPlayerOperable(false)
            sw.ShowNode("ccb/object/en-c", "open", 0, 0, "scr-4856")
            Wait(0.15)
            sw.ShowNode("ccb/object/en-h", "open", 0, 0, "scr-4750")
            Wait(0.15)
            sw.ShowNode("ccb/object/en-r", "open", 0, 0, "scr-5251")
            Wait(0.15)
            sw.ShowNode("ccb/object/en-i", "open", 0, 0, "scr-5351")
            Wait(0.15)
            sw.ShowNode("ccb/object/en-s", "open", 0, 0, "scr-4753")
            Wait(0.15)
            sw.ShowNode("ccb/object/en-t", "open", 0, 0, "scr-5350")
            Wait(0.15)
            sw.ShowNode("ccb/object/en-m", "open", 0, 0, "scr-4851")
            Wait(0.15)
            sw.ShowNode("ccb/object/en-a", "open", 0, 0, "scr-4852")
            Wait(0.15)
            sw.ShowNode("ccb/object/en-s", "open", 0, 0, "scr-4753")
            sw.ShowNode("ccb/object/xmastree", "9", 0, 0, "feast-1")
            sw.ShowNode("ccb/object/pe-11-1-1", "normal", 0, 0, "feast-1")
            DialogLeft(g_char.npc2, "story_500005")
            Wait(1)
            DialogLeft(g_char.npc2, "story_500006")
            sw.BreakMapObject("block_1", true)
            sw.SetPlayerOperable(true)
        else
            for i,v in pairs(self.char_map) do
                if (i == ch) then
                    sw.ShowNode("ccb/object/en-" .. i, "close", 0, 0, v[3])
                else
                    sw.ShowNode("ccb/object/en-" .. i, "normal", 0, 0, v[3])
                end
            end
            sw.ShowNode("ccb/object/xmastree", "normal", 0, 0, "feast-1")
            sw.SetStoryData(dataKey, "");
        end
    end
};




g_stories[8000] =
{
    moment      = "entered tower",
    priority    = 99,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        return data.map_id == 2006
    end,

    body = function(self, data)
        -- 延迟 1 秒，此过程需要屏蔽玩家操作
        Wait(1)

        DialogLeft(g_char.npc2, "story_800000")
        Wait(1)
        DialogLeft(g_char.npc3, "story_800001")
        DialogRight(g_char.npc5, "story_800002")
        DialogLeft(g_char.npc2, "story_800003")
    end
}


g_stories[9001] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
    local tPlayerInfo = sw.GetMyPlayer()
    local tMapInfo = sw.GetCurMap()
    return data.result == tBattleResult.WIN and tPlayerInfo.cur_mp / tPlayerInfo.max_mp <= 0.2 and tMapInfo.id >= 27 and tMapInfo.id <= 29
    end,

    body = function(self, data)
    Wait(0.5)
    DialogLeft(g_char.npc2, "story_900023")
    sw.ShowNode("ccb/object/window-910001", "open", 0, 0, "fxcenter")
    end,
    };


    g_stories[9002] =
    {
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
    local tPlayerInfo = sw.GetMyPlayer()
    local tMapInfo = sw.GetCurMap()
    return data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp <= 0.1 and tMapInfo.id >= 12 and tMapInfo.id <= 14
    end,

    body = function(self, data)
    Wait(0.5)
    DialogLeft(g_char.npc2, "story_900024")
    sw.ShowNode("ccb/object/window-910002", "open", 0, 0, "fxcenter")
    end,
};


g_stories[9003] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_mp / tPlayerInfo.max_mp <= 0.1 and tMapInfo.id >= 80 and tMapInfo.id <= 82
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900025")
        sw.ShowNode("ccb/object/window-910003", "open", 0, 0, "fxcenter")
    end,
};

g_stories[9004] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_mp / tPlayerInfo.max_mp <= 0.05 and tMapInfo.id >= 42 and tMapInfo.id <= 44
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900026")
        sw.ShowNode("ccb/object/window-910004", "open", 0, 0, "fxcenter")
    end,
};

g_stories[9005] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_mp / tPlayerInfo.max_mp == 1 and tMapInfo.id >= 98 and tMapInfo.id <= 100
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900027")
        sw.ShowNode("ccb/object/window-910005", "open", 0, 0, "fxcenter")
    end,
};

g_stories[9006] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp == 1 and tMapInfo.id >= 32 and tMapInfo.id <= 34
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900028")
        sw.ShowNode("ccb/object/window-910006", "open", 0, 0, "fxcenter")
    end,
};

g_stories[9007] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_mp / tPlayerInfo.max_mp <= 0.05 and tMapInfo.id >= 93 and tMapInfo.id <= 95
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900029")
        sw.ShowNode("ccb/object/window-910007", "open", 0, 0, "fxcenter")
    end,
};

g_stories[9008] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp <= 0.05 and tMapInfo.id >= 60 and tMapInfo.id <= 62
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900030")
        sw.ShowNode("ccb/object/window-910008", "open", 0, 0, "fxcenter")
    end,
};

g_stories[9009] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp <= 0.05 and tMapInfo.id >= 65 and tMapInfo.id <= 67
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900031")
        sw.ShowNode("ccb/object/window-910009", "open", 0, 0, "fxcenter")
    end,
};

g_stories[9010] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp <= 0.1 and tPlayerInfo.cur_mp / tPlayerInfo.max_mp <= 0.1 and tMapInfo.id >= 79 and tMapInfo.id <= 81
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900032")
        sw.ShowNode("ccb/object/window-910010", "open", 0, 0, "fxcenter")
    end,
};


g_stories[9011] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp <= 0.1 and tPlayerInfo.cur_mp / tPlayerInfo.max_mp <= 0.1 and tMapInfo.id >= 65 and tMapInfo.id <= 67
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900033")
        sw.ShowNode("ccb/object/window-910011", "open", 0, 0, "fxcenter")
    end,
};


g_stories[9012] =
{
    moment      = "battle end",
    priority    = 1,
    swallow     = true,
    repeatable  = false,

    condition = function(self, data)
        local tPlayerInfo = sw.GetMyPlayer()
        local tMapInfo = sw.GetCurMap()
        return data.result == tBattleResult.WIN and tPlayerInfo.cur_hp / tPlayerInfo.max_hp <= 0.1 and tPlayerInfo.cur_mp / tPlayerInfo.max_mp >= 0.8 and tMapInfo.id >= 38 and tMapInfo.id <= 40
    end,

    body = function(self, data)
        Wait(0.5)
        DialogLeft(g_char.npc2, "story_900034")
        sw.ShowNode("ccb/object/window-910012", "open", 0, 0, "fxcenter")
    end,
};


-- 在营地显示金雄，用于剧情
g_stories[9990] =
{
    moment      = "enter camp",
    priority    = 90,
    swallow     = false,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(2110);
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/jinxiong-1", "stand", 0, 0, "npcpnt-jinxiong");
    end
}

-- 在营地显示阿鲁巴斯，用于剧情
g_stories[9995] =
{
    moment      = "enter camp",
    priority    = 90,
    swallow     = false,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(2000);
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/albus-1", "stand", 0, 0, "npcpnt-albus");
    end
}

--9999
g_stories[9999] =
{
    moment      = "enter main",
    priority    = 99,
    swallow     = false,
    repeatable  = true,

    condition = function(self, data)
        return sw.IsStoryFinished(1990)
    end,

    body = function(self, data)
        sw.ShowNode("ccb/object/dogia-g", "1", 0, 0, "npcpnt01")
    end
}

