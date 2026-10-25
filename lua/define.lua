--[[***************************************************************************************
* Copyright (c) 2014, Pixss.Com.Ltd. All rights reserved.
*****************************************************************************************--]]


-----------------------------------------------------------------------------------------
-- 一个剧本包括：
--	id			- 剧本的唯一编号。可随意设定，但设定好之后不可变更
--	moment		- 以字符串表示的触发时机
--	priority	- 触发优先级，[0, 100]。同时机下的剧本，优先级高的先触发。数值越大，优先级越高
--	swallow	    - 是否吞噬时机。如果为true，当一个剧本执行后，同时机但低优先级的剧本将不被触发（可选，缺省不吞噬）
--  repeatable  - 如果为false，表示剧本执行后自动结束（已结束的剧本不再触发）；否则每当满足条件时将重复执行，直到手动结束（可选，缺省为false）
--	condition	- 触发条件。函数，参数为table（由各个时机自定义参数），返回true或整数表示触发（可选，缺省时表示必定触发）
--	body		- 剧情执行的脚本。函数，参数与条件函数的参数一致

-----------------------------------------------------------------------------------------
-- 可用的时机
-----------------------------------------------------------------------------------------
-- 进入创建角色界面："enter create"
-- 点击创建角色确定按钮："create role"
-- 进入主界面："enter main"
-- 进入营地："enter camp"
-- 展开塔列表："tower list"
-- 准备进塔，包括准备进下一层："entering tower"
--      map_id - 准备进入的地图id
-- 已经进塔，包括到达下一层："entered tower"
--      map_id - 进入的地图id
--      last_id - 上一层地图id，从主界面进入时，此项为0
-- 到达某个位置："arrive tile"
--      x，y - 坐标
-- 获得物品，包括开箱、打怪掉落："obtain item"
--      item_id - 物品id
--      item_type - 物品类型
-- 打开包裹："open package"
-- 关闭包裹："close package"
-- 打开技能界面："open skill"
-- 关闭技能界面："close skill"
-- 打开技能学习界面："open learn skill"
-- 打开铁匠铺："open smithy"
-- 打开合成界面："open forge"
-- 打开设置："open setting"
-- 装备变更："change equip"
-- 接近通道："near pass"
-- 升级："level up"
-- 学技能："learn skill"
--      skill_id - 学习的技能id
--      skill_group - 技能分组
--      skill_type - 技能类型
-- 受伤："be damage"
-- 战斗开始："battle begin"
--      mon_id - 敌人怪物id
-- 战斗结束："battle end"
--      result - 结果，0胜利，1战死，2逃脱
--      mon_id - 敌人怪物id
-- 弹出需要清理窗口时："need cleanup"
-- 场景道具交互："touch object"。数据包括：
--  name: 用于唯一确定元件的字符串，在脚本中添加元件时通常可以设置该值
--  param: 附加的整数参数
--  obj：场景道具类型。参见tSceneObj
--  col: 以格子计算的元件x坐标
--  row: 以格子计算的元件y坐标

-- 打开商店界面："open shop"。数据：
--      storage：    1 - 装备商店，2 - 营地商店，3 - 塔中旅行商人
-- 打开镶嵌界面："open inlay"。数据：

-- 关闭技能学习界面。"close learn skill"
-- 关闭铁匠铺。"close smithy"
-- 关闭镶嵌界面。"close inlay"
-- 关闭设置。"close setting"
-- 关闭商店。"close shop"。（data.storage - 商店类型，1-装备商店，2-营地商店，3-旅行商人）

-- 非回城复活。"resurge"

-- 点击日常任务入口（如果已接日常任务，或者当天已完成日常，不会触发该时机）"click daily"。数据：
--      ts: 当前时间戳。可通过os.date("*t", data.ts)得到一个表示时间的table，包含：year （四位数字），month （1–12），day （1–31）， hour （0–23），min （0–59），sec （0–61）， wday （星期几，星期天为 1 ）， yday （当年的第几天）


-----------------------------------------------------------------------------------------
-- 功能函数
-----------------------------------------------------------------------------------------
-- 休眠
-- Sleep(seconds)
--		seconds 休眠的时间，秒

-- 休眠，同时屏蔽玩家操作
-- Wait(seconds)
--		seconds 休眠的时间，秒

-- 显示左侧对话框
-- DialogLeft(char, word)
--		char: 说话者图片和名字
--		word: 内容

-- 显示右侧对话框
-- DialogRight(char, word)
--		char: 说话者图片和名字
--		word: 内容

-- 无法操作的对话框（玩家可正常操作行动）
-- DialogLeftNoBlock(char, word)
-- DialogRightNoBlock(char, word)

-- 隐藏所有对话框
-- HideAllDialogs()

-- 播放BGM
-- sw.PlayBGM(name)
--		name: bgm文件路径

-- 暂停BGM
-- sw.PauseBGM()

-- 恢复BGM
-- sw.ResumeBGM()

-- 播放音效
-- sw.PlaySound(name, loop, prior)
--		name: 文件路径
--		loop: 是否循环播放
--		prior: 音效优先级

-- 停止音效
-- sw.StopSound(name)
--		name: 文件路径

-- 设置触摸遮罩，防止玩家点击操作。仅防止触摸，不会有画面上的表现
-- sw.EnableVeil(e)
--		e: true表示开启（此时玩家的任何操作将无响应），false表示关闭

-- 在画面上显示遮罩。通常显示一个带孔的遮罩，挖孔的部分正常显示，其余部分为去色并模糊
-- sw.ShowMask(e, holeInfo)
--      e: 如果为true，表示除带孔的部位外，其余位置不响应点击；如果false，则不防止触摸，玩家可以正常点击
--      holeInfo: 孔的信息table，包括：x、y孔中心位置，dw、dh孔显示大小，mw、mh孔触摸大小，file用于孔样式的图片路径
--                可以省略mw、mh，此时触摸大小跟显示大小一样

-- 隐藏遮罩
-- sw.HideMask()

-- 显示ccb节点
-- sw.ShowNode(ccbFile, animName, x, y, NodeName)
--      ccbFile: ccb文件路径
--      animName: 执行的动画名
--      x、y：显示的位置
--      NodeName：用于在某个节点插入ccb，正常播放此项不写

-- 隐藏ccb节点
-- sw.HideNode(ccbFile)
--      ccbFile: ccb文件路径

-- 暂停画面
-- sw.PauseRunningActions()

-- 恢复画面
-- sw.ResumeActions()

-- 判断剧本是否已结束
-- sw.IsStoryFinished(storyID)
--		storyID: 剧本id

-- 设置剧本的结束状态
-- sw.SetStoryFinished(storyID, fin)
--		storyID: 剧本id
--		fin: 如果为true，表示结束该剧本；如果为false，表示打开该剧本

-- 获取玩家角色信息
-- sw.GetMyPlayer()
--  返回值为table，包括：
--      lv - 等级
--      cur_hp - 当前生命
--      max_hp - 最大生命
--      cur_mp - 当前法力
--      max_mp - 最大法力
--      cur_skpt - 可用的技能点数
--      fight_skill1、fight_skill2、fight_skill3、fight_skill4 - 4个战斗技能，如果未学习，则对应字段为nil
--      cur_red: 当前红瓶数
--      cur_blue: 当前蓝瓶数
--      power: 回城能量
--      x、y：玩家坐标

-- 获取当前地图信息
-- sw.GetCurMap()
--  返回值为table，包括：
--      id - 地图id

-- 判断包裹是否已满
-- sw.IsPackageFull()

-- 包裹剩余格数
-- sw.GetPackageSpace()

-- 以页为单位，获取玩家身上的物品
-- sw.GetItemsWithPage(page)
--      page: 1表示获取包裹中第1页的所有道具，2表示获取第2页的所有道具，以此类推；如果为0，表示获取所有穿戴的装备
--  返回值为数组（如果对应页没有道具，或没有解锁，返回一个空数组），每一项均为table，表示一个道具的信息，包括：
--      id: 道具id
--      type: 道具类型
--      quality: 道具品质
--      attr_lv: 属性等级
--      is_new: 是否有new标记
--      count: 道具的堆叠数量，如果是装备，固定为1

-- 检查玩家是否学习指定技能
-- sw.IsSkillLearned(skillID)
--      skillID: 技能id

-- 使回城充能全满
-- sw.SupplyPower()

-- 补满药瓶
-- sw.SupplyBottle()

-- 增加技能点
-- sw.AddSkillPoint(n)
--      n: 增加的点数

-- 给玩家增加物品
-- sw.AddItemToPackage(id, lv, num)
--      id - 物品id
--      lv - 属性等级，填nil则默认取玩家当前等级
--      num - 堆叠数量，不能超过道具的堆叠上限；如果是装备，忽略该参数

-- 从玩家背包中移除物品
-- sw.RemoveItemFromPackage(id, num)
--  id - 物品id
--  num - 数量

-- 加金币
-- sw.AddGold(gold)

-- 加钻石
-- sw.AddDiamond(diamond)

-- 停止玩家行动
-- sw.StopPlayerAction()

-- 关闭地图中的窗口界面
-- sw.CloseWindowViews()

-- 设置功能解锁
-- sw.SetFunctionUnlock(gc, unlock)
--  gf: 功能标记
    -- CAMP            = 1,    // 营地
    -- SMITHY          = 2,    // 铁匠铺
    -- INLAY           = 3,    // 镶嵌
    -- EQUIP_SHOP      = 4,    // 装备商人
    -- CAMP_SHOP       = 5,    // 营地商人
    -- FORGE           = 6,    // 合成
    -- BREAKUP         = 7,    // 分解
    -- PET             = 8,    // 宠物
    -- ENDLESS         = 9,    // 无尽模式
-- unlock: true表示解锁功能，false表示重新锁定功能

-- 判断功能解锁
-- sw.IsFunctionUnlock(gf)
--  gf: 功能标记
    -- CAMP            = 1,    // 营地
    -- SMITHY          = 2,    // 铁匠铺
    -- INLAY           = 3,    // 镶嵌
    -- EQUIP_SHOP      = 4,    // 装备商人
    -- CAMP_SHOP       = 5,    // 营地商人
    -- FORGE           = 6,    // 合成
    -- BREAKUP         = 7,    // 分解
    -- PET             = 8,    // 宠物
    -- ENDLESS         = 9,    // 无尽模式
-- 返回值：true表示已解锁，false表示未解锁

-- 强制回城，会进入结算界面
-- sw.LeaveTower()

-- 在当前地图随机添加一个地图交互元件。
-- 注意：需要在一块三面围墙的空地上新建，如果没有这样的空地，不会新建元件，并返回false
-- sw.AddMapObject(obj, name, param, col, row)
--  obj: 元件类型，参见tSceneObj
--  name: 能唯一确定元件的字符串，当查找和移除元件时需要该值
--  param: 附加的整数参数，目前对NPC类型有效，用来表示需要显示的ccb。例如：1表示"ccb/object/npc-1"，2表示"ccb/object/npc-2"，以此类推；
--         这种ccb必须是MapObjectNode类型，并且要有"use-1"时间轴，用作npc的移除动画
--  col、row: 可选，以格子计算的怪物x、y坐标，如果忽略，则随机在一个空地上放置
-- 返回值: table(找不到会返回nil)，包含
--      col - 元件x坐标
--      row - 元件y坐标

-- 在当前地图寻找一个地图交互元件
-- sw.FindMapObject(name)
--  name: 能唯一确定元件的字符串
-- 返回值: table(找不到会返回nil)，包含
--      col - 元件x坐标
--      row - 元件y坐标

-- 破坏一个元件（打开宝箱、打碎瓦罐、消耗祭坛、清除障碍物、清除空npc等）
-- sw.BreakMapObject(name)
--  name: 能唯一确定元件的字符串

-- 在当前地图添加一个怪物
-- sw.AddMonster(monsterID, rank, level, col, row)
--  monsterID: 怪物id
--  rank: 怪物品质，1白，2蓝，3金
--  level: 怪物等级，如果忽略，以当前地图等级作为怪物等级
--  col、row: 可选，以格子计算的怪物x、y坐标，如果忽略，则随机在一个空地上放置

-- 以键值对的方式，设置可存档的数据。可以结合sw.TableToJson和sw.JsonToTable，从存档中读写table
-- sw.SetStoryData(key, value)
--  key: 字符串，用于查找数据的键
--  value: 字符串，需要保存的值。如果为nil或空字符串，则表示删除对应的数据项

-- 以键值对的方式，获取存档的数据
-- sw.GetStoryData(key)
--  key: 字符串，用于查找数据的键
--  返回值: 字符串，对应的值。如果对应的key没有设置值，则返回空字符串（不是nil）

-- 将一个table，转换成json字符串
-- sw.TableToJson(t)
--  t: 一个table对象，需要满足以下条件：
--      1、table的键如果是整数，则应当从1开始，并且不间断，即，以数组的方式保存数据；如果键是字符串，没有限制；
--      2、table中的值只包含数字、字符串、bool型等基本类型，或另一个符合条件的table；如果包含了另一个table，需要注意不能出现循环包含
-- 返回值：字符串，json格式

-- 将一个json字符串，转换成table
-- sw.JsonToTable(json)
--  json: json字符串
--  返回值: table对象

-- 设置主线、支线、日常任务
-- sw.SetStoryTask(type, icon, title, desc, goal, reward)
--  type: 任务类型，1主线，2支线，3日常
--  icon: 图标路径，如果为nil，则该任务不显示图标
--  title: 任务标题
--  desc: 描述文本
--  goal: 目标文本
--  reward: 奖励文本

-- 删除主线、支线、日常任务
-- sw.ResetStoryTask(type)
--  type: 任务类型，1主线，2支线，3日常

-- 判断是否已有某种任务
-- sw.IsStoryTaskExist(type)
--  type: 任务类型，1主线，2支线，3日常
-- sw.LeaveTower()

-- 移动镜头
-- sw.MoveCamera(beginX, beginY, endX, endY, time, fade, rate)
--  beginX、beginY: 起点位置
--  endX、endY: 终点位置
--  time: 持续时间，秒
--  fade: 移动方式，"easein"、"easeout"、"easeinout"，如果填nil，则线性移动
--  rate: 移动方式的参数

-- 控制节点播放动画
-- sw.NodeAnimate(name, anim)
--  name: 节点名字（用sw.AddMapObject创建物件时传入的name）
--  anim: 动画名称

-- 刷新商店
-- sw.RefreshShop(st)
--  st: 1 - 武器商人，2 - 营地商人

-----------------------------------------------------------------------------------------
-- 辅助表定义
-----------------------------------------------------------------------------------------
-- 场景元件
tSceneObj =
{
    WOOD_BOX            = 1,    -- 小宝箱
    GOLD_BOX            = 2,    -- 大宝箱
    DIAMOND_BOX         = 3,    -- 钻石宝箱
    CROCK               = 4,    -- 瓦罐
    BARREL              = 5,    -- 木桶
    WEAPON_RACK         = 6,    -- 武器架
    ARMOR_RACK          = 7,    -- 防具架
    TRINKET_BOX         = 8,    -- 饰品盒
    RED_SPRING          = 9,    -- 红泉（恢复hp）
    BLUE_SPRING         = 10,   -- 蓝泉（恢复mp）
    YELLOW_SPRING       = 11,   -- 黄泉（恢复hp和mp）
    RED_ALTAR           = 12,   -- 红祭坛（获得红瓶）
    BLUE_ALTAR          = 13,   -- 蓝祭坛（获得蓝瓶）
    YELLOW_ALTAR        = 14,   -- 黄祭坛（获得红瓶和蓝瓶）
    RETURN_STELE        = 15,   -- 回城碑
    OPEN_MAP            = 16,   -- 地图全亮
    DIAMOND_RED_ALTAR   = 17,   -- 钻石红祭坛（补满红瓶）
    DIAMOND_BLUE_ALTAR  = 18,   -- 钻石蓝祭坛（补满蓝瓶）
    BOMB                = 19,   -- 清场
    PORTAL              = 20,   -- 传送门
    BLOCK               = 21,   -- 障碍
    BILLBOARD           = 22,   -- 告示牌
    GOLD_POOL           = 23,   -- 金币池
    EXP_ALTAR           = 24,   -- 经验泉水
    TRINKET             = 25,   -- 散落的饰品
    GOLD_TREASURE       = 26,   -- 金币宝藏
    BUSINESSMAN         = 27,   -- 隐藏商人
    LETTER              = 28,   -- 信笺
    BOSS_BOX            = 29,   -- boss宝箱
    NPC                 = 31,   -- 空npc
}
-- 战斗结果
tBattleResult =
{
    WIN = 0,        -- 胜利
    DIE = 1,        -- 战死
    FLEE = 2,       -- 逃脱
}
-- 功能模块
tFunction =
{
    CAMP            = 1,    -- 营地
    SMITHY          = 2,    -- 铁匠铺
    INLAY           = 3,    -- 镶嵌
    EQUIP_SHOP      = 4,    -- 装备商人
    CAMP_SHOP       = 5,    -- 营地商人
    FORGE           = 6,    -- 合成
    BREAKUP         = 7,    -- 分解
    PET             = 8,    -- 宠物
    ENDLESS         = 9,    -- 无尽模式
    FASHION         = 10,   -- 时装
    HARD            = 11,   -- 困难模式
}
-----------------------------------------------------------------------------------------
-- 角色定义
-----------------------------------------------------------------------------------------
g_char = {
    npc1 = {"image/char/npc-001.png","npc_001"},                -- 精明的咕叽咕叽
    npc2 = {"image/char/npc-002.png","npc_002"},                -- 夏努尔
    npc3 = {"image/char/npc-003.png","npc_003"},                -- 辛德拉尔
    npc4 = {"image/char/npc-004.png","npc_004"},                -- 卡夫
    npc5 = {"image/char/npc-005.png","npc_005"},                -- 艾萨琳
    npc6 = {"image/char/npc-006.png","npc_006"},                -- ？？？
    npc7 = {"image/char/npc-007.png","npc_007"},                -- 恩吉尔德•深火
    npc8 = {"image/char/npc-008.png","npc_008"},                -- 布洛托•雷酒
    npc9 = {"image/char/npc-009.png","npc_009"},                -- 菲欧娜
    npc10 = {"image/char/npc-010.png","npc_010"},               -- 天选者尼奥
    npc11 = {"image/char/npc-011.png","npc_011"},               -- 多吉亚•托托利
    npc12 = {"image/char/npc-012.png","npc_012"},               -- 砰砰博士
    npc13 = {"image/char/npc-013.png","npc_013"},               -- 马尔科•月痕
    npc14 = {"image/char/npc-014.png","npc_014"},               -- 西希
    npc15 = {"image/char/npc-015.png","npc_015"},               -- 阿鲁巴斯
    npc16 = {"image/char/npc-016.png","npc_016"},               -- 小桐
    npc17 = {"image/char/npc-017.png","npc_017"},               -- 像素网络
    npc18 = {"image/char/npc-018.png","npc_018"},               -- 艾莎
    npc19 = {"image/char/npc-019.png","npc_019"},               -- 毕须博斯
    npc21 = {"image/char/npc-021.png","npc_021"},               -- （远处传来的声音）
    npc22 = {"image/char/npc-022.png","npc_022"},               -- ？？？
    npc23 = {"image/char/npc-023.png","npc_023"},               -- 金雄
    npc24 = {"image/char/npc-027.png","monster_511003"},        -- 巫女
    npc25 = {"image/char/npc-018.png","monster_511010"},        -- 死灵艾莎
    npc900  = {"image/char/npc-017.png","npc_900"},
    npc1001 = {"image/char/npc-024.png","npc_024"},             -- 冰蓝沉沦魔法师
    npc1002 = {"image/char/npc-025.png","npc_025"},             -- 鱼人杀手
    npc1003 = {"image/char/npc-026.png","npc_026"},             -- 骷髅斗士
};

-- 任务状态标识
tTaskType =
{
    MAIN = 1,       -- 主线
    SIDE = 2,       -- 支线
    DAILY = 3,      -- 日常
}

