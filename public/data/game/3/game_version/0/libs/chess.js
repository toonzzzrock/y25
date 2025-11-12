// Simplified Chess.js implementation for local use
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Chess = factory();
  }
}(typeof self !== 'undefined' ? self : this, function() {
  const PAWN = 'p';
  const KNIGHT = 'n';
  const BISHOP = 'b';
  const ROOK = 'r';
  const QUEEN = 'q';
  const KING = 'k';

  const WHITE = 'w';
  const BLACK = 'b';

  const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  function Chess(fen) {
    this.board = [];
    this.turn = WHITE;
    this.castling = { wK: true, wQ: true, bK: true, bQ: true };
    this.ep_square = -1;
    this.halfmove_clock = 0;
    this.fullmove_number = 1;
    this.load(fen || DEFAULT_FEN);
  }

  Chess.prototype.load = function(fen) {
    var parts = fen.split(/\s+/);
    var boardPart = parts[0];
    this.turn = parts[1] === 'w' ? WHITE : BLACK;
    this.castling = { wK: false, wQ: false, bK: false, bQ: false };
    if (parts[2]) {
      this.castling.wK = parts[2].includes('K');
      this.castling.wQ = parts[2].includes('Q');
      this.castling.bK = parts[2].includes('k');
      this.castling.bQ = parts[2].includes('q');
    }
    this.ep_square = parts[3] === '-' ? -1 : parts[3];
    this.halfmove_clock = parseInt(parts[4]) || 0;
    this.fullmove_number = parseInt(parts[5]) || 1;

    this.board = [];
    var row = [];
    for (var i = 0; i < boardPart.length; i++) {
      var c = boardPart[i];
      if (c === '/') {
        this.board.push(row);
        row = [];
      } else if (/^\d+$/.test(c)) {
        for (var j = 0; j < parseInt(c); j++) row.push(null);
      } else {
        row.push(c);
      }
    }
    if (row.length) this.board.push(row);
  };

  Chess.prototype.fen = function() {
    var fen = '';
    for (var i = 0; i < 8; i++) {
      var empty = 0;
      for (var j = 0; j < 8; j++) {
        if (this.board[i][j]) {
          if (empty) fen += empty;
          empty = 0;
          fen += this.board[i][j];
        } else {
          empty++;
        }
      }
      if (empty) fen += empty;
      if (i < 7) fen += '/';
    }

    fen += ' ' + this.turn;
    fen += ' ';
    var castling = '';
    if (this.castling.wK) castling += 'K';
    if (this.castling.wQ) castling += 'Q';
    if (this.castling.bK) castling += 'k';
    if (this.castling.bQ) castling += 'q';
    fen += castling || '-';
    fen += ' ' + (this.ep_square === -1 ? '-' : this.ep_square);
    fen += ' ' + this.halfmove_clock;
    fen += ' ' + this.fullmove_number;

    return fen;
  };

  Chess.prototype.turn = function() {
    return this.turn;
  };

  Chess.prototype.moves = function(opts) {
    opts = opts || {};
    var moves = [];
    for (var r = 0; r < 8; r++) {
      for (var f = 0; f < 8; f++) {
        var piece = this.board[r][f];
        if (!piece || (piece.toLowerCase() === piece && this.turn === WHITE) || (piece !== piece.toLowerCase() && this.turn === BLACK)) {
          continue;
        }
        var pieceType = piece.toLowerCase();
        var color = piece === piece.toLowerCase() ? BLACK : WHITE;
        if (color !== this.turn) continue;

        var pieceMoves = this._getPieceMoves(r, f);
        for (var i = 0; i < pieceMoves.length; i++) {
          var move = pieceMoves[i];
          this.move({ from: move.from, to: move.to });
          if (!this.in_check()) {
            moves.push({ from: move.from, to: move.to, piece: piece, san: this._toSan(move.from, move.to, piece) });
          }
          this.undo_move();
        }
      }
    }
    if (opts.verbose) return moves;
    return moves.map(m => m.from + m.to);
  };

  Chess.prototype._getPieceMoves = function(r, f) {
    var moves = [];
    var piece = this.board[r][f];
    if (!piece) return moves;

    var color = piece === piece.toLowerCase() ? BLACK : WHITE;
    var type = piece.toLowerCase();

    if (type === PAWN) {
      var dir = color === WHITE ? -1 : 1;
      var startRow = color === WHITE ? 6 : 1;
      var nextR = r + dir;
      if (nextR >= 0 && nextR < 8 && !this.board[nextR][f]) {
        moves.push({ from: this._squareToNotation(r, f), to: this._squareToNotation(nextR, f) });
        if (r === startRow && !this.board[r + 2 * dir][f]) {
          moves.push({ from: this._squareToNotation(r, f), to: this._squareToNotation(r + 2 * dir, f) });
        }
      }
      for (var df of [-1, 1]) {
        var captureR = r + dir;
        var captureF = f + df;
        if (captureR >= 0 && captureR < 8 && captureF >= 0 && captureF < 8) {
          var target = this.board[captureR][captureF];
          if (target && this._getColor(target) !== color) {
            moves.push({ from: this._squareToNotation(r, f), to: this._squareToNotation(captureR, captureF) });
          }
        }
      }
    } else if (type === KNIGHT) {
      for (var [dr, df] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
        var nr = r + dr, nf = f + df;
        if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
          var target = this.board[nr][nf];
          if (!target || this._getColor(target) !== color) {
            moves.push({ from: this._squareToNotation(r, f), to: this._squareToNotation(nr, nf) });
          }
        }
      }
    } else if (type === KING) {
      for (var dr = -1; dr <= 1; dr++) {
        for (var df = -1; df <= 1; df++) {
          if (dr === 0 && df === 0) continue;
          var nr = r + dr, nf = f + df;
          if (nr >= 0 && nr < 8 && nf >= 0 && nf < 8) {
            var target = this.board[nr][nf];
            if (!target || this._getColor(target) !== color) {
              moves.push({ from: this._squareToNotation(r, f), to: this._squareToNotation(nr, nf) });
            }
          }
        }
      }
    } else {
      var directions = type === BISHOP ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : 
                       type === ROOK ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : 
                       [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (var [dr, df] of directions) {
        for (var dist = 1; dist < 8; dist++) {
          var nr = r + dr * dist, nf = f + df * dist;
          if (nr < 0 || nr >= 8 || nf < 0 || nf >= 8) break;
          var target = this.board[nr][nf];
          if (!target) {
            moves.push({ from: this._squareToNotation(r, f), to: this._squareToNotation(nr, nf) });
          } else {
            if (this._getColor(target) !== color) {
              moves.push({ from: this._squareToNotation(r, f), to: this._squareToNotation(nr, nf) });
            }
            break;
          }
        }
      }
    }

    return moves;
  };

  Chess.prototype.move = function(move) {
    var from = this._notationToSquare(move.from);
    var to = this._notationToSquare(move.to);
    if (!from || !to) return null;

    var piece = this.board[from[0]][from[1]];
    if (!piece) return null;

    var captured = this.board[to[0]][to[1]] || null;
    this.board[to[0]][to[1]] = piece;
    this.board[from[0]][from[1]] = null;

    this.turn = this.turn === WHITE ? BLACK : WHITE;
    this.halfmove_clock++;
    if (this.turn === WHITE) this.fullmove_number++;

    return { from: move.from, to: move.to, piece: piece, captured: captured, color: this.turn === BLACK ? WHITE : BLACK };
  };

  Chess.prototype.undo_move = function() {
    this.load(this.fen());
  };

  Chess.prototype.in_checkmate = function() {
    return this.in_check() && this.moves().length === 0;
  };

  Chess.prototype.in_stalemate = function() {
    return !this.in_check() && this.moves().length === 0;
  };

  Chess.prototype.in_draw = function() {
    return this.in_stalemate();
  };

  Chess.prototype.in_check = function() {
    return false;
  };

  Chess.prototype.game_over = function() {
    return this.in_checkmate() || this.in_stalemate() || this.in_draw();
  };

  Chess.prototype.reset = function() {
    this.load(DEFAULT_FEN);
  };

  Chess.prototype._getColor = function(piece) {
    return piece === piece.toLowerCase() ? BLACK : WHITE;
  };

  Chess.prototype._squareToNotation = function(r, f) {
    return String.fromCharCode(97 + f) + (8 - r);
  };

  Chess.prototype._notationToSquare = function(notation) {
    if (!notation || notation.length !== 2) return null;
    var f = notation.charCodeAt(0) - 97;
    var r = 8 - parseInt(notation[1]);
    return (r >= 0 && r < 8 && f >= 0 && f < 8) ? [r, f] : null;
  };

  Chess.prototype._toSan = function(from, to, piece) {
    return piece + from + to;
  };

  return Chess;
}));
