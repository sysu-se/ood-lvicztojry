/*
  Sudoku 领域对象 - 表示游戏局面
  职责：持有 grid 数据、提供 guess 操作、序列化/反序列化、外表化、校验、提示、探索模式

  改进说明（相比 HW1）：
  - 增加 validate() 方法，提供校验能力
  - 增加 isComplete() 方法，判断是否完成
  - 增加边界检查和数字范围验证
  - 区分题目初始 givens 与玩家输入
  - 改进职责边界，Grid 相关逻辑内聚在 Sudoku 中
  - 添加 hint 功能，提供候选提示和下一步提示
  - 添加探索模式支持，支持分支和回滚
 */

const GRID_SIZE = 9;
const BOX_SIZE = 3;
const VALID_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export function createSudoku(input, givens = null) {
  // 深拷贝输入 grid，避免外部引用污染
  const grid = input.map(row => [...row]);

  // 记录题目初始给定的格子（不可修改）
  const givenCells = new Set();
  if (givens) {
    givens.forEach(key => givenCells.add(key));
  } else {
    // 如果未提供 givens，推断所有非零格子为 given
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (grid[r][c] !== 0) {
          givenCells.add(`${r},${c}`);
        }
      }
    }
  }

  return {
    getGrid() {
      // 返回深拷贝，防止外部修改内部状态
      return grid.map(row => [...row]);
    },

    isGiven(row, col) {
      return givenCells.has(`${row},${col}`);
    },

    guess(move) {
      const { row, col, value } = move;

      // 边界检查
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        throw new Error(`Invalid position: (${row}, ${col})`);
      }

      // 数字范围检查
      if (!VALID_VALUES.includes(value)) {
        throw new Error(`Invalid value: ${value}. Must be 0-9.`);
      }

      // 不允许修改题目初始给定的格子（包括清空）
      if (this.isGiven(row, col)) {
        throw new Error(`Cannot modify given cell (${row}, ${col})`);
      }

      // 记录旧值（用于 Undo 恢复）
      const previousValue = grid[row][col];
      grid[row][col] = value;

      return previousValue;
    },

    clone() {
      // 深拷贝当前局面
      return createSudoku(grid, [...givenCells]);
    },

    validate() {
      // 返回所有冲突的单元格坐标列表
      const invalidCells = [];
      const addInvalid = (r, c) => {
        const key = `${r},${c}`;
        if (!invalidCells.includes(key)) {
          invalidCells.push(key);
        }
      };

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const value = grid[r][c];
          if (value === 0) continue;

          // 检查行
          for (let i = 0; i < GRID_SIZE; i++) {
            if (i !== c && grid[r][i] === value) {
              addInvalid(r, c);
              addInvalid(r, i);
            }
          }

          // 检查列
          for (let i = 0; i < GRID_SIZE; i++) {
            if (i !== r && grid[i][c] === value) {
              addInvalid(r, c);
              addInvalid(i, c);
            }
          }

          // 检查 3x3 宫
          const boxStartR = Math.floor(r / BOX_SIZE) * BOX_SIZE;
          const boxStartC = Math.floor(c / BOX_SIZE) * BOX_SIZE;
          for (let br = boxStartR; br < boxStartR + BOX_SIZE; br++) {
            for (let bc = boxStartC; bc < boxStartC + BOX_SIZE; bc++) {
              if ((br !== r || bc !== c) && grid[br][bc] === value) {
                addInvalid(r, c);
                addInvalid(br, bc);
              }
            }
          }
        }
      }

      return invalidCells;
    },

    isComplete() {
      // 检查是否所有格子都填了数字
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === 0) return false;
        }
      }
      // 检查是否有冲突
      return this.validate().length === 0;
    },

    // HW2: 提示功能 - 计算某个位置的候选数
    getCandidates(row, col) {
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        throw new Error(`Invalid position: (${row}, ${col})`);
      }

      if (grid[row][col] !== 0) {
        return []; // 如果已经有数字，则没有候选数
      }

      // 所有可能的数字
      const candidates = [];

      for (let num = 1; num <= 9; num++) {
        // 检查该数字是否可以在当前位置放置
        let isValid = true;

        // 检查行
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[row][c] === num) {
            isValid = false;
            break;
          }
        }

        if (!isValid) continue;

        // 检查列
        for (let r = 0; r < GRID_SIZE; r++) {
          if (grid[r][col] === num) {
            isValid = false;
            break;
          }
        }

        if (!isValid) continue;

        // 检查 3x3 宫
        const boxStartR = Math.floor(row / BOX_SIZE) * BOX_SIZE;
        const boxStartC = Math.floor(col / BOX_SIZE) * BOX_SIZE;
        for (let br = boxStartR; br < boxStartR + BOX_SIZE; br++) {
          for (let bc = boxStartC; bc < boxStartC + BOX_SIZE; bc++) {
            if (grid[br][bc] === num) {
              isValid = false;
              break;
            }
          }
          if (!isValid) break;
        }

        if (isValid) {
          candidates.push(num);
        }
      }

      return candidates;
    },

    // HW2: 提示功能 - 计算下一个可能的填入位置和数字
    getNextHint() {
      // 找到第一个只有一个候选数的位置
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === 0) {
            const candidates = this.getCandidates(r, c);
            if (candidates.length === 1) {
              return { row: r, col: c, value: candidates[0] };
            }
          }
        }
      }

      // 如果没有确定的下一步，返回第一个有候选的位置
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === 0) {
            const candidates = this.getCandidates(r, c);
            if (candidates.length > 0) {
              return { row: r, col: c, value: candidates[0] };
            }
          }
        }
      }

      // 如果所有位置都填满了
      return null;
    },

    // HW2: 检查是否可以继续前进（是否存在任何位置有候选数）
    canContinue() {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] === 0) {
            const candidates = this.getCandidates(r, c);
            if (candidates.length > 0) {
              return true;
            }
          }
        }
      }
      return false;
    },

    toJSON() {
      return {
        grid: grid.map(row => [...row]),
        givens: [...givenCells]
      };
    },

    toString() {
      let result = "Sudoku Grid:\n";
      for (let i = 0; i < GRID_SIZE; i++) {
        result += grid[i].join(" ") + "\n";
      }
      return result;
    }
  };
}

/*
  Move 值对象 - 表示一次用户输入操作

  结构：
  { row: number, col: number, value: number, previousValue: number }

  设计理由：
  - previousValue 是必需的，用于 Undo 时恢复真实上一状态
  - Move 是值对象，不需要唯一 ID
  - 两个相同的 Move 是完全等价的
 */

/*
  Game 领域对象 - 管理游戏会话和历史
  职责：持有 Sudoku、管理历史记录、提供 undo/redo、序列化、提示、探索模式

  改进说明：
  - Move 现在包含 previousValue，支持正确的 Undo/Redo 语义
  - getSudoku() 返回深拷贝，防止外部绕过历史管理
  - 统一的内部实现，消除重复代码
  - 支持从历史状态恢复（反序列化）
  - 添加探索模式支持，包括分支和回滚
 */

export function createGame({ sudoku, history = [], undoStack = [], exploring = false, explorationStartState = null, explorationHistory = [] }) {
  // 深拷贝 sudoku 内部状态，防止外部引用泄漏
  let currentSudoku = sudoku.clone();
  
  // history 存储完整的 Move 值对象（包含 previousValue）
  const gameHistory = history.map(m => ({ ...m }));
  const gameUndoStack = undoStack.map(m => ({ ...m }));
  
  // 探索模式相关状态
  let isExploring = exploring;
  let explorationStartSudoku = explorationStartState ? createSudoku(explorationStartState.grid, explorationStartState.givens) : null;
  let explorationMoves = [...explorationHistory]; // 探索期间的移动记录

  // 订阅者列表（用于响应式更新）
  const subscribers = new Set();

  // 通知所有订阅者
  function notify() {
    subscribers.forEach(fn => fn());
  }

  return {
    getSudoku() {
      // 返回深拷贝，防止外部绕过 Game 的历史管理直接修改 Sudoku
      return currentSudoku.clone();
    },

    subscribe(fn) {
      subscribers.add(fn);
      // 返回取消订阅函数
      return () => {
        subscribers.delete(fn);
      };
    },

    guess(move) {
      // 深拷贝 move，避免外部引用污染
      const moveCopy = { row: move.row, col: move.col, value: move.value };
      
      // 执行 guess 并获取旧值
      const previousValue = currentSudoku.guess(moveCopy);
      
      // 记录完整的 Move（包含 previousValue）
      const fullMove = { 
        row: move.row, 
        col: move.col, 
        value: move.value,
        previousValue: previousValue
      };
      
      // 如果处于探索模式，记录到探索历史中
      if (isExploring) {
        explorationMoves.push(fullMove);
      } else {
        gameHistory.push(fullMove);
        // 新操作后，redo 历史失效
        gameUndoStack.length = 0;
      }
      
      notify();
    },

    undo() {
      if (isExploring) {
        // 探索模式下的撤销：从探索历史中撤销
        if (explorationMoves.length > 0) {
          const lastMove = explorationMoves.pop();
          
          // 恢复到 previousValue
          currentSudoku.guess({ 
            row: lastMove.row, 
            col: lastMove.col, 
            value: lastMove.previousValue 
          });
        } else {
          // 如果探索历史为空，退出探索模式
          this.exitExploration();
        }
      } else {
        // 普通模式下的撤销
        if (gameHistory.length === 0) return;
        
        const lastMove = gameHistory.pop();
        
        // 恢复到 previousValue（不是简单地设为 0）
        currentSudoku.guess({ 
          row: lastMove.row, 
          col: lastMove.col, 
          value: lastMove.previousValue 
        });
        
        // 将 move 推入 undoStack（保留完整信息）
        gameUndoStack.push({ ...lastMove });
      }
      
      notify();
    },

    redo() {
      if (isExploring) {
        // 探索模式下不支持重做
        return;
      }
      
      if (gameUndoStack.length === 0) return;
      
      const redoMove = gameUndoStack.pop();
      
      // 重做时恢复到 value
      currentSudoku.guess({ 
        row: redoMove.row, 
        col: redoMove.col, 
        value: redoMove.value 
      });
      
      // 将 move 推回 history
      gameHistory.push({ ...redoMove });
      
      notify();
    },

    canUndo() {
      if (isExploring) {
        return explorationMoves.length > 0 || explorationStartSudoku !== null;
      }
      return gameHistory.length > 0;
    },

    canRedo() {
      if (isExploring) {
        return false; // 探索模式下不支持重做
      }
      return gameUndoStack.length > 0;
    },

    // HW2: 提示功能 - 获取当前位置的候选数
    getCandidates(row, col) {
      return currentSudoku.getCandidates(row, col);
    },

    // HW2: 提示功能 - 获取下一步提示
    getNextHint() {
      return currentSudoku.getNextHint();
    },

    // HW2: 进入探索模式
    enterExploration() {
      if (isExploring) return; // 已经在探索模式中
      
      // 保存当前状态作为探索起始状态
      explorationStartSudoku = currentSudoku.clone();
      explorationMoves = []; // 清空探索历史
      isExploring = true;
      
      notify();
    },

    // HW2: 退出探索模式（不保存更改）
    exitExploration() {
      if (!isExploring) return; // 不在探索模式中
      
      // 恢复到探索前的状态
      if (explorationStartSudoku) {
        currentSudoku = explorationStartSudoku.clone();
      }
      
      // 重置探索状态
      isExploring = false;
      explorationStartSudoku = null;
      explorationMoves = [];
      
      notify();
    },

    // HW2: 提交探索结果（保存更改）
    submitExploration() {
      if (!isExploring) return; // 不在探索模式中
      
      // 保持当前状态，将探索期间的移动添加到主历史中
      explorationMoves.forEach(move => {
        gameHistory.push(move);
      });
      
      // 重置探索状态
      isExploring = false;
      explorationStartSudoku = null;
      explorationMoves = [];
      
      // 探索提交后，redo 历史失效
      gameUndoStack.length = 0;
      
      notify();
    },

    // HW2: 检查是否在探索模式中
    isInExploration() {
      return isExploring;
    },

    // 重置探索模式（保留当前状态作为新的探索起点）
    resetExploration() {
      if (!isExploring) return; // 不在探索模式中
      
      // 将当前状态设置为新的探索起点
      explorationStartSudoku = currentSudoku.clone();
      explorationMoves = []; // 清空探索历史，但保持在探索模式中
      
      notify();
    },

    // HW2: 检查当前局面是否冲突（无法继续）
    isConflicted() {
      // 如果存在空格但没有任何候选数，则局面冲突
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (currentSudoku.getGrid()[r][c] === 0) {
            const candidates = currentSudoku.getCandidates(r, c);
            if (candidates.length === 0) {
              return true; // 存在无法填入数字的位置
            }
          }
        }
      }
      return false;
    },

    toJSON() {
      return {
        sudoku: currentSudoku.toJSON(),
        history: gameHistory.map(move => ({ 
          row: move.row, 
          col: move.col, 
          value: move.value,
          previousValue: move.previousValue 
        })),
        undoStack: gameUndoStack.map(move => ({ 
          row: move.row, 
          col: move.col, 
          value: move.value,
          previousValue: move.previousValue 
        })),
        exploring: isExploring,
        explorationStartState: explorationStartSudoku ? explorationStartSudoku.toJSON() : null,
        explorationHistory: explorationMoves.map(move => ({ 
          row: move.row, 
          col: move.col, 
          value: move.value,
          previousValue: move.previousValue 
        }))
      };
    }
  };
}

/*
 从 JSON 恢复 Sudoku 对象
 */
export function createSudokuFromJSON(json) {
  return createSudoku(json.grid, json.givens);
}

/*
 从 JSON 恢复 Game 对象
 设计说明：
 - 直接使用序列化时的最终状态（不重放历史）
 - 恢复 history 和 undoStack 以支持后续 undo/redo
 - Move 中的 previousValue 是在操作发生时记录的，所以 undo/redo 语义正确
 */
export function createGameFromJSON(json) {
  // 直接使用最终状态
  const finalSudoku = createSudoku(json.sudoku.grid, json.sudoku.givens);
  
  // 创建 Game 并传入历史状态
  return createGame({ 
    sudoku: finalSudoku, 
    history: json.history.map(m => ({ ...m })),
    undoStack: json.undoStack.map(m => ({ ...m })),
    exploring: json.exploring,
    explorationStartState: json.explorationStartState,
    explorationHistory: json.explorationHistory.map(m => ({ ...m }))
  });
}