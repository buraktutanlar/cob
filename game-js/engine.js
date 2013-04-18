// Generated by CoffeeScript 1.6.2
(function() {
  var EngineModule;

  EngineModule = (function() {
    var GameEngine, Level, arrEq, levelFromString;

    levelFromString = function(string) {
      var getLevelData, goalStr, parts, stageStr;

      parts = string.split("|");
      if (parts.length !== 2 || parts[0].length % 7 !== 0 || parts[1].length % 7 !== 0) {
        console.log(string);
        throw {
          reason: "malformed string"
        };
      }
      stageStr = parts[0];
      goalStr = parts[1];
      getLevelData = function(string) {
        var char, cidx, col, i, level, levelCol, _i, _j, _ref, _ref1;

        level = [];
        for (i = _i = 0, _ref = string.length / 7 - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          col = string.slice(i * 7, (i + 1) * 7);
          levelCol = [];
          for (cidx = _j = 0, _ref1 = col.length - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; cidx = 0 <= _ref1 ? ++_j : --_j) {
            char = col[cidx];
            if (char !== '-') {
              levelCol.push(char);
            }
          }
          level.push(levelCol);
        }
        return level;
      };
      return new Level(getLevelData(stageStr), getLevelData(goalStr), 7);
    };
    arrEq = function(arr1, arr2) {
      var col1, col2, colIdx, rowIdx, _i, _j, _ref, _ref1;

      if (arr1.length !== arr2.length) {
        return false;
      }
      for (colIdx = _i = 0, _ref = arr1.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; colIdx = 0 <= _ref ? ++_i : --_i) {
        col1 = arr1[colIdx];
        col2 = arr2[colIdx];
        if (col1.length !== col2.length) {
          return false;
        }
        for (rowIdx = _j = 0, _ref1 = col1.length - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; rowIdx = 0 <= _ref1 ? ++_j : --_j) {
          if (col1[rowIdx] !== col2[rowIdx]) {
            return false;
          }
        }
      }
      return true;
    };
    Level = (function() {
      function Level(stage, goal, maxHeight) {
        var col, _i, _len, _ref;

        this.stage = stage;
        this.goal = goal;
        this.maxHeight = maxHeight != null ? maxHeight : 0;
        if (this.stage.length !== this.goal.length) {
          throw {
            err: "Level can't created",
            reason: "stage and goal lengths are not equal"
          };
        }
        _ref = this.stage;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          col = _ref[_i];
          this.maxHeight = Math.max(this.maxHeight, col.length);
        }
      }

      Level.prototype.getWidth = function() {
        return this.stage.length;
      };

      Level.prototype.tryPop = function(col) {
        var colData;

        assert((0 <= col && col < this.getWidth()), "pop: col is out of bounds: " + col);
        colData = this.stage[col];
        if (colData.length === 0) {
          return null;
        }
        return colData.pop();
      };

      Level.prototype.tryPush = function(col, val) {
        var colData;

        assert((0 <= col && col < this.getWidth()), "tryPush: col is out of bounds: " + col);
        colData = this.stage[col];
        if (colData.length === this.maxHeight) {
          return false;
        }
        colData.push(val);
        return true;
      };

      Level.prototype.exportStage = function() {
        var col, colstr_arr, i, lvlstr_arr, _i, _j, _len, _ref, _ref1;

        lvlstr_arr = [];
        _ref = this.stage;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          col = _ref[_i];
          colstr_arr = [];
          for (i = _j = 0, _ref1 = this.maxHeight; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
            if (col[i]) {
              colstr_arr.push(col[i]);
            } else {
              colstr_arr.push("-");
            }
          }
          lvlstr_arr.push(colstr_arr.join(""));
        }
        return lvlstr_arr.join("");
      };

      return Level;

    })();
    GameEngine = (function() {
      function GameEngine(level, program, gui, targetGui, debug) {
        this.level = level;
        this.program = program;
        this.gui = gui;
        this.targetGui = targetGui;
        this.debug = debug != null ? debug : false;
        assert(this.program.length !== 0, "programs should have at least one function.");
        if (this.gui) {
          this.gui.setLevel(this.level.stage);
        } else {
          this.gui = {
            pick: function() {},
            drop: function() {},
            moveLeft: function() {},
            moveRight: function() {}
          };
        }
        if (this.targetGui) {
          this.targetGui.setLevel(this.level.goal);
        }
        this.history = [];
        this.ip = 0;
        this.currentFun = this.program[0];
        this.callStack = [];
        this.botPos = Math.floor(this.level.getWidth() / 2);
        this.botBlock = null;
      }

      GameEngine.prototype._lookupFun = function(funName) {
        var f, _i, _len, _ref;

        _ref = this.program;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          if (f.id === funName) {
            return f;
          }
        }
        return null;
      };

      GameEngine.prototype._cmdDown = function(updateGui, forceUpdate) {
        var popped;

        if (this.botBlock && this.level.tryPush(this.botPos, this.botBlock)) {
          this.botBlock = null;
          if (updateGui) {
            this.gui.drop(forceUpdate);
          }
          return true;
        } else if (!this.botBlock) {
          popped = this.level.tryPop(this.botPos);
          if (popped) {
            this.botBlock = popped;
            if (updateGui) {
              this.gui.pick(forceUpdate);
            }
            return true;
          }
        }
      };

      GameEngine.prototype._cmdMoveLeft = function(updateGui, forceUpdate) {
        if (this.botPos > 0) {
          this.botPos--;
          if (updateGui) {
            this.gui.moveLeft(forceUpdate);
          }
          return true;
        }
      };

      GameEngine.prototype._cmdMoveRight = function(updateGui, forceUpdate) {
        if (this.botPos < this.level.getWidth() - 1) {
          this.botPos++;
          if (updateGui) {
            this.gui.moveRight(forceUpdate);
          }
          return true;
        }
      };

      GameEngine.prototype._cmdCall = function(funName) {
        var fun;

        fun = this._lookupFun(funName);
        if (fun) {
          this.ip++;
          this.history.push({
            cmd: "call",
            "function": funName,
            from: this.currentFun.id,
            ip: this.ip
          });
          this.callStack.push({
            from: this.currentFun.id,
            ip: this.ip
          });
          this.ip = 0;
          return this.currentFun = fun;
        } else {
          throw new Error("unimplemedted cmd: " + instr.cmd);
        }
      };

      GameEngine.prototype.step = function(args) {
        var dir, forceUpdate, instr, jmp, updateGui;

        if (args == null) {
          args = {};
        }
        updateGui = args.updateGui == null ? true : args.updateGui;
        forceUpdate = args.forceUpdate == null ? true : args.forceUpdate;
        if (this.ip > this.currentFun.commands.length - 1) {
          jmp = this.callStack.pop();
          if (jmp) {
            this.history.push({
              cmd: "call",
              "function": jmp.from,
              from: this.currentFun.id,
              ip: this.ip
            });
            this.currentFun = this._lookupFun(jmp.from);
            this.ip = jmp.ip;
            return;
          } else {
            if (updateGui) {
              this.gui.step();
            }
            throw "halt";
          }
        }
        instr = this.currentFun.commands[this.ip];
        if (instr.cmd === "move") {
          dir = instr.dir;
          if (dir === "left") {
            if (this._cmdMoveLeft(updateGui, forceUpdate)) {
              this.history.push(instr);
              return this.ip++;
            }
          } else if (dir === "right") {
            if (this._cmdMoveRight(updateGui, forceUpdate)) {
              this.history.push(instr);
              return this.ip++;
            }
          }
        } else if (instr.cmd === "down") {
          if (this._cmdDown(updateGui, forceUpdate)) {
            this.history.push(instr);
            return this.ip++;
          }
        } else if (instr.cmd === "call") {
          return this._cmdCall(instr["function"]);
        }
      };

      GameEngine.prototype.stepBack = function(updateGui) {
        var dir, instr;

        if (updateGui == null) {
          updateGui = true;
        }
        instr = this.history.pop();
        if (!instr) {
          return;
        }
        if (instr.cmd === "move") {
          dir = instr.dir;
          if (dir === "left") {
            this._cmdMoveRight(updateGui, true);
            return this.ip--;
          } else if (dir === "right") {
            this._cmdMoveLeft(updateGui, true);
            return this.ip--;
          }
        } else if (instr.cmd === "down") {
          this._cmdDown(updateGui, true);
          return this.ip--;
        } else if (instr.cmd === "call") {
          this.currentFun = this._lookupFun(instr.from);
          return this.ip = instr.ip;
        }
      };

      GameEngine.prototype.run = function() {
        var error, _results;

        try {
          _results = [];
          while (true) {
            _results.push(this.step({
              updateGui: true,
              forceUpdate: false
            }));
          }
          return _results;
        } catch (_error) {
          error = _error;
          if (error === "halt") {
            if (arrEq(this.level.stage, this.level.goal)) {
              return "correct";
            } else {
              return "incorrect";
            }
          }
          if (error !== "halt") {
            throw error;
          }
        }
      };

      GameEngine.prototype.fastForward = function() {
        var error, _results;

        try {
          _results = [];
          while (true) {
            _results.push(this.step({
              updateGui: false
            }));
          }
          return _results;
        } catch (_error) {
          error = _error;
          if (error === "halt" && this.gui) {
            this.gui.setLevel(this.level.stage);
            this.gui.setBotPos(this.botPos);
            if (arrEq(this.level.stage, this.level.goal)) {
              throw "correct";
            } else {
              throw "incorrect";
            }
          } else if (error !== "halt") {
            throw error;
          }
        }
      };

      return GameEngine;

    })();
    return {
      Level: Level,
      GameEngine: GameEngine,
      levelFromString: levelFromString
    };
  })();

  window.Level = EngineModule.Level;

  window.GameEngine = EngineModule.GameEngine;

  window.levelFromString = EngineModule.levelFromString;

}).call(this);

/*
//@ sourceMappingURL=engine.map
*/