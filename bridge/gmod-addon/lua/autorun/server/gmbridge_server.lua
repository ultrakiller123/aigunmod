-- Optional Minecraft input is applied to the exporting player only.
-- This convar must be enabled by the server owner; disabled by default.
AddCSLuaFile("autorun/client/gmbridge_client.lua")
util.AddNetworkString("gmbridge_input")
util.AddNetworkString("gmbridge_shot")
local enabled = CreateConVar("gmbridge_allow_control", "0", bit.bor(FCVAR_ARCHIVE, FCVAR_REPLICATED),
    "Allow the bridge to control the exporting player's own GMod character")
local inputs = {}

net.Receive("gmbridge_input", function(_, ply)
    if not enabled:GetBool() then return end
    local angles = net.ReadAngle()
    local forward, side = net.ReadFloat(), net.ReadFloat()
    local buttons = net.ReadUInt(16)
    if forward ~= forward or side ~= side or angles.p ~= angles.p or angles.y ~= angles.y then return end
    inputs[ply] = {angles = Angle(math.Clamp(angles.p, -89, 89), math.NormalizeAngle(angles.y), 0),
        forward = math.Clamp(forward, -400, 400), side = math.Clamp(side, -400, 400),
        buttons = bit.band(buttons, bit.bor(IN_ATTACK, IN_ATTACK2, IN_JUMP, IN_USE, IN_RELOAD)),
        time = CurTime()}
end)

hook.Add("StartCommand", "gmbridge_control", function(ply, cmd)
    local input = inputs[ply]
    if not enabled:GetBool() or not input or CurTime() - input.time > 0.35 then return end
    cmd:ClearMovement()
    cmd:ClearButtons()
    cmd:SetViewAngles(input.angles)
    cmd:SetForwardMove(input.forward)
    cmd:SetSideMove(input.side)
    cmd:SetButtons(input.buttons)
    ply:SetEyeAngles(input.angles)
end)

hook.Add("PlayerDisconnected", "gmbridge_cleanup", function(ply) inputs[ply] = nil end)

hook.Add("EntityFireBullets", "gmbridge_bullets", function(ent, data)
    if not data.Src or not data.Dir then return end
    -- Visual tracer only. Source's real damage and hit simulation remain authoritative.
    local trace = util.TraceLine({start = data.Src,
        endpos = data.Src + data.Dir * math.min(data.Distance or 8192, 8192), filter = ent})
    net.Start("gmbridge_shot")
    net.WriteVector(data.Src)
    net.WriteVector(trace.HitPos)
    net.Broadcast()
end)
