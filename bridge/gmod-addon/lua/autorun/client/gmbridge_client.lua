-- GMod requires the Steam launch option -allowlocalhttp to reach the loopback relay.
local base = "http://127.0.0.1:8765"
local enabled = CreateClientConVar("gmbridge_enabled", "0", true, false,
    "Stream the current GMod world to the local Minecraft bridge")
local exportMap = CreateClientConVar("gmbridge_export_map", "1", true, false,
    "Export visible map brush geometry when supported")
local session, ready, busy, seq = "", false, false, 0
local uploaded, queue, queued, shots, mapEntities, attempted = {}, {}, {}, {}, {}, {}
local worldExported = false
local origin = Vector(0, 0, 0)
local lastHello = 0
local modelBusy, inputBusy, generation = false, false, 0
local remoteInput = nil
local function vec(v) return {v.x, v.y, v.z} end
local function ang(a) return {a.p, a.y, a.r} end

local function post(path, body, callback)
    local json = util.TableToJSON(body)
    -- Lua has one table type; keep empty protocol arrays unambiguous.
    for _, key in ipairs({"entities", "shots"}) do
        if body[key] and #body[key] == 0 then
            json = string.gsub(json, '("' .. key .. '"%s*:%s*){}', '%1[]')
        end
    end
    HTTP({url = base .. path, method = "POST", type = "application/json",
        body = json,
        success = function(code, response) callback(code == 200, response) end,
        failed = function(reason) callback(false, reason) end})
end

local function begin()
    generation = generation + 1
    session = tostring(os.time()) .. "_" .. tostring(SysTime())
    ready, busy, seq, modelBusy, inputBusy = false, false, 0, false, false
    uploaded, queue, queued, shots, mapEntities, attempted = {}, {}, {}, {}, {}, {}
    worldExported = false
    remoteInput = nil
    lastHello = 0
    if IsValid(LocalPlayer()) then origin = LocalPlayer():GetPos() end
end

local function queueMesh(key, vertices)
    if queued[key] or uploaded[key] or #vertices == 0 then return end
    if table.Count(queued) + table.Count(uploaded) >= 128 then return end
    queue[#queue + 1] = {key = key, vertices = vertices}
    queued[key] = true
end

local function modelKey(ent)
    return tostring(util.CRC(string.lower(ent:GetModel() or "")))
end

local function exportModel(ent, key)
    if queued[key] or uploaded[key] or attempted[key] then return end
    attempted[key] = true
    local model = ent:GetModel()
    if not model or not string.EndsWith(string.lower(model), ".mdl") then return end
    -- Static bind-pose geometry. Skeletal animation/material conversion needs a later asset pipeline.
    local ok, meshes = pcall(util.GetModelMeshes, model, 0, 0)
    if not ok or not meshes then return end
    local vertices = {}
    for _, mesh in ipairs(meshes) do
        local triangles = mesh.triangles or {}
        for index = 1, #triangles - 2, 3 do
            if #vertices + 9 > 270000 then break end
            for i = index, index + 2 do
                local p = triangles[i].pos
                vertices[#vertices + 1] = p.x
                vertices[#vertices + 1] = p.y
                vertices[#vertices + 1] = p.z
            end
        end
    end
    queueMesh(key, vertices)
end

local function exportWorld()
    if worldExported then return end
    worldExported = true
    if not exportMap:GetBool() then return end
    local world = game.GetWorld()
    if not IsValid(world) or not world.GetBrushSurfaces then
        print("[GMod Bridge] Brush export unavailable; props will still be streamed.")
        return
    end
    local ok, surfaces = pcall(world.GetBrushSurfaces, world)
    if not ok or not surfaces then
        print("[GMod Bridge] Could not read map brush surfaces; props will still be streamed.")
        return
    end
    local vertices, chunk = {}, 0
    local function flush()
        if #vertices == 0 or chunk >= 64 then return end
        local key = "map_" .. chunk
        queueMesh(key, vertices)
        mapEntities[#mapEntities + 1] = {id = 1000000 + chunk, model_key = key,
            pos = {0, 0, 0}, ang = {0, 0, 0}, mins = {0, 0, 0}, maxs = {0, 0, 0},
            color = {115, 125, 145, 255}, map = true}
        vertices, chunk = {}, chunk + 1
    end
    for _, surface in ipairs(surfaces) do
        if chunk >= 64 then break end
        if not surface:IsNoDraw() then
            local points = surface:GetVertices()
            for i = 2, #points - 1 do
                for _, p in ipairs({points[1], points[i], points[i + 1]}) do
                    vertices[#vertices + 1] = p.x - origin.x
                    vertices[#vertices + 1] = p.y - origin.y
                    vertices[#vertices + 1] = p.z - origin.z
                end
                if #vertices >= 27000 then flush() end
            end
        end
    end
    flush()
    print("[GMod Bridge] Queued " .. tostring(#mapEntities) .. " map geometry chunks (untextured).")
end

cvars.AddChangeCallback("gmbridge_enabled", function(_, _, value)
    if tonumber(value) == 1 then begin() else ready = false; generation = generation + 1 end
end, "gmbridge_toggle")
hook.Add("InitPostEntity", "gmbridge_begin", function() if enabled:GetBool() then begin() end end)
concommand.Add("gmbridge_restart", function() if enabled:GetBool() then begin() end end)

net.Receive("gmbridge_shot", function()
    local start, finish = net.ReadVector(), net.ReadVector()
    if enabled:GetBool() and #shots < 128 then
        shots[#shots + 1] = {start = vec(start - origin), ["end"] = vec(finish - origin)}
    end
end)

timer.Create("gmbridge_stream", 0.05, 0, function()
    if not enabled:GetBool() or not IsValid(LocalPlayer()) then return end
    local current = generation
    if session == "" then begin(); return end
    if not ready then
        if SysTime() - lastHello < 2 then return end
        lastHello = SysTime()
        post("/hello", {session = session}, function(ok, response)
            if current ~= generation then return end
            if ok then
                local hello = util.JSONToTable(response or "")
                if hello and hello.reset then
                    uploaded, queue, queued, attempted, mapEntities = {}, {}, {}, {}, {}
                    worldExported = false
                end
                ready = true
                exportWorld()
                print("[GMod Bridge] Relay connected. Streaming at up to 20 Hz.")
            else
                print("[GMod Bridge] Relay unavailable: " .. tostring(response)
                    .. ". Start relay and add -allowlocalhttp to GMod's launch options.")
            end
        end)
        return
    end
    if busy then return end
    busy = true
    local entities = {}
    for _, entity in ipairs(mapEntities) do entities[#entities + 1] = entity end
    local candidates = ents.GetAll()
    table.sort(candidates, function(a, b)
        return a:GetPos():DistToSqr(LocalPlayer():GetPos()) < b:GetPos():DistToSqr(LocalPlayer():GetPos())
    end)
    for _, ent in ipairs(candidates) do
        if #entities >= 256 then break end
        if IsValid(ent) and ent ~= LocalPlayer() and not ent:GetNoDraw()
            and ent:GetModel() and string.EndsWith(string.lower(ent:GetModel()), ".mdl") then
            local key = modelKey(ent)
            exportModel(ent, key)
            local color = ent:GetColor()
            entities[#entities + 1] = {id = ent:EntIndex(), model_key = key,
                pos = vec(ent:GetPos() - origin), ang = ang(ent:GetAngles()),
                mins = vec(ent:OBBMins()), maxs = vec(ent:OBBMaxs()),
                color = {color.r, color.g, color.b, color.a}}
        end
    end
    seq = seq + 1
    local pendingShots = shots
    shots = {}
    post("/snapshot", {protocol = 1, session = session, seq = seq,
        map = game.GetMap(), eye = vec(LocalPlayer():EyePos() - origin),
        eye_ang = ang(LocalPlayer():EyeAngles()), health = LocalPlayer():Health(),
        entities = entities, shots = pendingShots}, function(ok)
        if current ~= generation then return end
        busy = false
        if not ok then ready = false end
    end)
end)

timer.Create("gmbridge_meshes", 0.2, 0, function()
    if not enabled:GetBool() or not ready or modelBusy or #queue == 0 then return end
    modelBusy = true
    local current, model = generation, queue[1]
    post("/model", {session = session, key = model.key, vertices = model.vertices}, function(ok, response)
        if current ~= generation then return end
        modelBusy = false
        if ok then
            uploaded[model.key], queued[model.key] = true, nil
            table.remove(queue, 1)
        elseif util.JSONToTable(response or "") then
            print("[GMod Bridge] Mesh rejected: " .. tostring(response))
            queued[model.key] = nil
            table.remove(queue, 1)
        else
            ready = false
        end
    end)
end)

timer.Create("gmbridge_input", 0.05, 0, function()
    if not enabled:GetBool() or not ready or inputBusy then return end
    inputBusy = true
    local current = generation
    http.Fetch(base .. "/input?session=" .. session, function(response)
        if current ~= generation then return end
        inputBusy = false
        local data = util.JSONToTable(response)
        local input = data and data.input
        if not input or not input.angles then return end
        local buttons = 0
        for key, flag in pairs({attack = IN_ATTACK, attack2 = IN_ATTACK2, jump = IN_JUMP,
            use = IN_USE, reload = IN_RELOAD}) do
            if input[key] then buttons = bit.bor(buttons, flag) end
        end
        remoteInput = {angles = Angle(input.angles[1], input.angles[2], 0),
            forward = input.forward, side = input.side, buttons = buttons, time = SysTime()}
        net.Start("gmbridge_input")
        net.WriteAngle(Angle(input.angles[1], input.angles[2], 0))
        net.WriteFloat(input.forward)
        net.WriteFloat(input.side)
        net.WriteUInt(buttons, 16)
        net.SendToServer()
    end, function() if current == generation then inputBusy = false end end)
end)

-- Mirror controls into local prediction so the exporting client does not fight
-- the server-authoritative movement while its window is in the background.
hook.Add("StartCommand", "gmbridge_prediction", function(ply, cmd)
    local allowed = GetConVar("gmbridge_allow_control")
    if ply ~= LocalPlayer() or not enabled:GetBool() or not allowed or not allowed:GetBool()
        or not remoteInput or SysTime() - remoteInput.time > 0.35 then return end
    cmd:ClearMovement()
    cmd:ClearButtons()
    cmd:SetViewAngles(remoteInput.angles)
    cmd:SetForwardMove(remoteInput.forward)
    cmd:SetSideMove(remoteInput.side)
    cmd:SetButtons(remoteInput.buttons)
    ply:SetEyeAngles(remoteInput.angles)
end)
