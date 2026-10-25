--[[***************************************************************************************
* Copyright (c) 2014, Pixss.Com.Ltd. All rights reserved.
*****************************************************************************************--]]

wrap = {};

-----------------------------------------------------------------------------------------
-- 获取一个运行时唯一id
function wrap.NewIncID()
    return sw.NewIncID();
end
-- 随机数
function wrap.randi(minVal, maxVal)
    return sw.randi(minVal, maxVal);
end
-- 日志
-- param[in] sType: 日志类型，"info" - 信息，"warn" - 警告，"error" - 错误
-- param[in] level: 日志等级
-- param[in] content: 内容
function wrap.log(sType, level, content)
    return sw.Record(sType, level, content);
end

-- json字符串转为table
function wrap.JsonToTable(jstr)
    return sw.JsonToTable(jstr);
end
-- table转为json字符串
function wrap.TableToJson(t)
    return sw.TableToJson(t);
end

-----------------------------------------------------------------------------------------
-- 系统定时器对象支持。该定时器由C++层提供
-- 计划定时器
-- param[in] period: 定时间隔(毫秒)
-- param[in] loop: 是否循环
-- return: 定时器id
function wrap.ScheduelTimer(period, loop)
    return sw.ScheduelSystemTimer(period, loop);
end

-- 取消定时器
-- param[in] tmrID: 定时器id
function wrap.CancelTimer(tmrID)
    sw.CancelSystemTimer(tmrID);
end

-- 系统定时回调
function OnSystemTimerReach(tmrID)
    local co = coroutine.create(SystemTimerProc);
    sw.RegisterCoroutine(co);
    local suc, err = coroutine.resume(co, tmrID, co);
    if (not suc) then
        wrap.log("error", 15, err);
    end
end
-- 回调函数
function SystemTimerProc(tmrID, co)
    SysTimer.OnReach(tmrID);
    sw.UnregisterCoroutine(co);
end

------------------------------------------------------------------------------------------------------------
-- 剧本管理
------------------------------------------------------------------------------------------------------------
-- 所有剧本的集合。key为剧本id，整数；value为剧本对象
-- 一个剧本包括：
--  moment      - 以字符串表示的触发时机
--  priority    - 触发优先级，[0, 100]。同时机下的剧本，优先级高的先触发
--  swallow     - 是否吞噬时机。如果为true，当一个剧本执行后，同时机但低优先级的剧本将不被触发（可选，缺省不吞噬）
--  repeatable  - 如果为false，表示剧本执行后自动结束（已结束的剧本不再触发）；否则每当满足条件时将重复执行，直到手动结束（可选，缺省为false）
--  condition   - 触发条件。函数，参数为table（由各个时机自定义参数），返回true或整数表示触发（可选，缺省时表示必定触发）
--  body        - 剧情执行的脚本。函数，参数与条件函数的参数一致
g_stories = {};
-- 使脚本在不同协程中传递返回值
local s_result;

-- 剧本
Story = {running_id = 0};
Story.__index = Story;

-- 初始化，绑定剧本的消息关系
function Story:Init()
    local map = {};
    local t;
    -- 剧本的优先级比较
    local comp = function(r1, r2)
        if (r1.priority ~= r2.priority) then
            return r1.priority > r2.priority;
        end
        return r1.id < r2.id;
    end;
    
    for i,v in pairs(g_stories) do
        t = map[v.moment] or {};
        map[v.moment] = t;
        
        v.id = i;
        t[#t + 1] = v;
    end
    
    for i,v in pairs(map) do
        table.sort(v, comp);
    end
    self.scenes = map;
end

-- 剧本的消息处理
-- param[in] moment: 时机
-- param[in] data: 数据体
-- return: 如果没有剧本被触发，返回false；
--         如果有一个剧本被触发，返回该剧本condition的返回值（若缺省condition，则返回true）
--         如果有多个剧本被触发，返回其中一个剧本condition的返回值（若缺省condition，则返回true），如果要唯一确定返回值的脚本，需要确保只有该脚本被触发
function Story:Trigger(moment, data)
    -- 对应时机的剧本集合
    local t = self.scenes[moment];
    if (not t) then
        return false;
    end
    local pass;
    
    -- 遍历该时机下所有剧本
    for i,v in ipairs(t) do
        -- 忽略已结束的剧本
        if (sw.IsStoryFinished(v.id)) then
            pass = false;
        -- 未结束的剧本，判断条件
        else
            pass = true;
            if (v.condition) then
                pass = v.condition(v, data);
            end
        end
        s_result = pass;
        
        -- 满足条件的剧本被触发
        if (pass) then
            self.running_id = v.id;
            v.body(v, data);
            self.running_id = 0;
            if (not v.repeatable) then
                sw.SetStoryFinished(v.id, true);
            end
            if (v.swallow) then
                break;
            end
        end
    end
    return pass;
end
-- 当前执行中的脚本id。当两个脚本触发时机不同、但却可能在同一期间被触发时（如杀怪升级和临近楼梯口两个剧本），可以在其中一个脚本中作此判断，防止同时触发
function Story:GetRunningID()
    return self.running_id;
end

-- 触发剧本的回调
function TriggerStory(moment, data)
    local co = coroutine.create(StoryProc);
    sw.RegisterCoroutine(co);
    sw.EnableSave(false);
    local suc, ret = coroutine.resume(co, moment, data, co);
    if (suc) then
        return ret;
    else
        sw.UnregisterCoroutine(co);
        sw.EnableSave(true);
        wrap.log("error", 15, ret);
        return nil;
    end
end
function StoryProc(moment, data, co)
    local r = Story:Trigger(moment, data);
    sw.UnregisterCoroutine(co);
    sw.EnableSave(true);
    return r;
end

-----------------------------------------------------------------------------------------
-- 用于直接执行脚本字符串的支持。该函数只提供给C层调用
function RunStringImpl()
    -- RunStrProc由C层提供
    local co = coroutine.create(RunStrProc);
    sw.RegisterCoroutine(co);
    local suc, ret = coroutine.resume(co, co);
    if (suc) then
        return ret;
    else
        wrap.log("error", 15, ret);
        return nil;
    end
end

-----------------------------------------------------------------------------------------
-- C++层的休眠只是定时回调，阻塞在lua层实现
-- 避免在休眠的同时触发其他定时器或剧本回调，可能产生不可预知的问题
-- param[in] seconds: 秒
function Sleep(seconds)
    local co = coroutine.running();
    DelayCall(seconds * 1000, nil, OnSleepEnd, co);
    return coroutine.yield(s_result);
end

-- 休眠结束的回调
function OnSleepEnd(co)
    local suc, err = coroutine.resume(co);
    if (not suc) then
        wrap.log("error", 15, err);
    end
end

-- 等待，类似于休眠，但期间玩家不可操作
function Wait(seconds)
    sw.EnableVeil(true);
    Sleep(seconds);
    sw.EnableVeil(false);
end

-----------------------------------------------------------------------------------------
-- 浮动框
function ShowFloat(msg)
    local s = tostring(msg);
    local content = sw.LocalString(s);
    sw.FloatMessage(content);
end

-----------------------------------------------------------------------------------------
local s_co_dialog = nil;
local s_co_message = nil;
-- 消息框
-- param[in] content: 内容
-- param[in] title: 标题
function ShowOkCancelMessage(content, title)
    sw.MessageOkCancel(sw.LocalString(content), sw.LocalString(title));
    s_co_message = coroutine.running();
    return coroutine.yield(s_result);
end
-- 消息框回调
-- param[in] sel: 对话框的选择项
function OnMessageEnd(sel)
    local co = s_co_message;
    s_co_message = nil;
    if (not co) then
        return;
    end

    local suc, err = coroutine.resume(co, sel);
    if (not suc) then
        wrap.log("error", 15, "error: " .. err);
    end
end

-- 显示对话框
-- param[in] dir: 对话框方向
-- param[in] head: 头像图片文件
-- param[in] talker: 说话者名称
-- param[in] word: 说话内容
-- param[in] speedRate: 说话速度倍率，1为默认速度
-- param[in] sel1: 选择1的文字
-- param[in] sel2: 选择2的文字
-- return: 选择的项序号，无选择的对话返回0
function ShowDialog(dir, head, talker, word, speedRate, sel1, sel2)
	sw.Dialog(dir, head, talker, word, 50 * speedRate, sel1, sel2);
	s_co_dialog = coroutine.running();
	return coroutine.yield(s_result);
end
-- 对话框回调
-- param[in] sel: 对话框的选择项
function OnDialogEnd(sel)
	local co = s_co_dialog;
	s_co_dialog = nil;
    if (not co) then
        return;
    end
    
	local suc, err = coroutine.resume(co, sel);
	if (not suc) then
		wrap.log("error", 15, "error: " .. err);
	end
end

-- 左侧对话框
-- param[in] char: table，[1] - 说话者头像，[2] - 说话者名字
-- param[in] word: 内容
-- param[in] sel1: 选择1的文字
-- param[in] sel2: 选择2的文字
-- return: 选择的项序号，无选择的对话返回0
function DialogLeft(char, word, sel1, sel2)
	return ShowDialog("left", char[1] or char.head, sw.LocalString(char[2] or char.name),
                      sw.LocalString(word), 1, sw.LocalString(sel1), sw.LocalString(sel2));
end
-- 右侧对话框
function DialogRight(char, word, sel1, sel2)
	return ShowDialog("right", char[1] or char.head, sw.LocalString(char[2] or char.name),
                      sw.LocalString(word), 1, sw.LocalString(sel1), sw.LocalString(sel2));
end
-- 左侧对话框，不阻塞
function DialogLeftNoBlock(char, word, sel1, sel2)
    sw.Dialog("left", char[1] or char.head, sw.LocalString(char[2] or char.name),
              sw.LocalString(word), 50, sw.LocalString(sel1), sw.LocalString(sel2));
end
-- 右侧对话框，不阻塞
function DialogRightNoBlock(char, word, sel1, sel2)
    sw.Dialog("right", char[1] or char.head, sw.LocalString(char[2] or char.name),
              sw.LocalString(word), 50, sw.LocalString(sel1), sw.LocalString(sel2));
end

-- 隐藏左侧对话框
function HideDialogLeft()
	return sw.HideDialog("left");
end
-- 隐藏右侧对话框
function HideDialogRight()
	return sw.HideDialog("right");
end
-- 隐藏对话框
function HideAllDialogs()
    return sw.HideDialog();
end


