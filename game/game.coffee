# TODO:
#  - Make distinguished world coordinates and grid coordintes systems.
#    Level should contain block coordinates in it's own system, then to draw
#    coordinates should be translated accordingly. Same for bot and blocks.

Game = do ->

  class Bot
    constructor: (@posx, @posy, @level) ->
      @targetx = @posx
      @targety = @posy
      @onComplete = ->
      @attachedTo = null

      @program = null
      @_actionHistory = []
      @_currentAction = null
      @_actionQueue   = []
      @_idle = true

    moveTo: (x, y) ->
      @targetx = x
      @targety = y

    draw: ->
      luv.graphics.setColor 255, 255, 255
      fillRect @posx, @posy

      if @attachedTo
        @attachedTo.draw()

    update: (dt) ->
      console.log "@_idle: #{@_idle}"
      if @targetx == @posx and @targety == @posy and @_idle
        @_actionHistory.push @_currentAction
        @_currentAction = @_actionQueue[0]
        @_actionQueue = @_actionQueue.slice 1
        if @_currentAction
          @runCmd @_currentAction
        return

      delta = dt * BOT_SPEED

      if @targetx < @posx
        if @targetx > @posx - delta
          @posx = @targetx
        else
          @posx -= delta

      else if @targetx > @posx
        if @targetx < @pox + delta
          @posx = @targetx
        else
          @posx += delta
        
      else if @targety < @posy
        if @targety > @posy - delta
          @posy = @targety
        else
          @posy -= delta

      else if @targety > @posy
        if @targety < @posy + delta
          @posy = @targety
        else
          @posy += delta

      if @targetx == @posx and @targety == @posy
        @onComplete()

      if @attachedTo
        @attachedTo.update dt

    bottomPos: ->
      [ @posx, @posy + BLOCK_HEIGHT / 2 ]

    _setIdle: =>
      console.log "bot is idle"
      @_idle = true
      @onComplete = ->

    setProgram: (program) ->
      if @program
        throw new Error "program is already set"
      @program = program
      @_actionQueue = program[0].commands

    runCmd: (cmd) ->
      @_idle = false

      if cmd.cmd == "move"
        if cmd.dir == "left"
          @targetx -= BLOCK_WIDTH
          @onComplete = @_setIdle
        else if cmd.dir == "right"
          @targetx += BLOCK_WIDTH
          @onComplete = @_setIdle
        else
          console.log "ERROR: invalid dir: #{cmd.dir}"
      else if cmd.cmd == "down"
        console.log "down"
        col = colOf @posx
        console.log "bot col: #{col}"
        [ topBlockPos, topBlock ] = @level.topBlock col

        if @attachedTo == null
          @onComplete = =>
            console.log "action completed"
            @attachedTo = topBlock
            @attachedTo.attach this
            @targety = BLOCK_HEIGHT / 2
            @level.pop col
            @onComplete = @_setIdle

          @targety = topBlockPos - BLOCK_HEIGHT / 2

        else
          @onComplete = =>
            console.log "action completed"
            @targety = BLOCK_HEIGHT / 2
            @attachedTo.detach()
            @level.push col, @attachedTo
            @attachedTo = null
            @onComplete = @_setIdle

          @targety = topBlockPos - BLOCK_HEIGHT / 2 - BLOCK_HEIGHT

      else
        console.log "ERROR: invalid cmd: #{cmd.cmd}"


  class Block
    constructor: (@posx, @posy, @color) ->
      @attached = null

    draw: ->
      luv.graphics.setColor @color...
      fillRect @posx, @posy

    update: ->
      if @attached
        [bottomx, bottomy] = @attached.bottomPos()
        @posx = bottomx
        @posy = bottomy + BLOCK_WIDTH / 2

    attach: (obj) ->
      @attached = obj

    detach: () =>
      @attached = null


  class Level
    constructor: (@lvlData) ->
      console.log "loading level: #{@lvlData}"
      console.log "bot col #{colOf (SCREEN_WIDTH / 2)}"
      @bot    = new Bot colOf(SCREEN_WIDTH / 2) * BLOCK_WIDTH + BLOCK_WIDTH / 2, BLOCK_HEIGHT / 2, this
      @blocks = []

      for colIdx in [0..@lvlData.length-1]
        col = @lvlData[colIdx]
        col_ = []
        for rowIdx in [0..col.length-1]
          row = col.charAt rowIdx

          color =
            if row == "r"
              [ 255, 0, 0 ]
            else if row == "g"
              [ 0, 255, 0 ]
            else
              [ 0, 0, 255 ]

          posx = colIdx * BLOCK_WIDTH + BLOCK_WIDTH / 2
          posy = SCREEN_HEIGHT - (rowIdx * BLOCK_HEIGHT - BLOCK_HEIGHT / 2)

          block = new Block posx, posy, color
          col_.push block

        @blocks.push col_

    update: (dt) ->
      @bot.update dt

      for col in @blocks
        for block in col
          block.update dt

    draw: ->
      @bot.draw()

      for col in @blocks
        for block in col
          block.draw()

    topBlock: (col) ->
      console.log "level col: #{col}"
      [ SCREEN_HEIGHT - (@blocks[col].length - 1) * BLOCK_HEIGHT, @blocks[col][@blocks[col].length-1] ]

    pop: (col) ->
      @blocks[col].pop()

    push: (col, block) ->
      @blocks[col].push block

  currentLevel = null

  loadLevel = (lvl) ->
    currentLevel = new Level lvl

  runProgram = (program) ->
    if currentLevel == null
      console.log "load a level first"
      return

    currentLevel.bot.setProgram program

  luv.update = (dt) ->
    if currentLevel
      currentLevel.update dt

  luv.draw = ->
    if currentLevel
      currentLevel.draw()

  luv.run()

  loadLevel: loadLevel,
  runProgram: runProgram

window.Game = Game
