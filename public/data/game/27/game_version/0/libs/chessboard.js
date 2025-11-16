// Minimal local Chessboard.js replacement focused on the needs of the Y25 chess arena.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Chessboard = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  var START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
  var FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  var UNICODE_MAP = {
    p: '♟',
    n: '♞',
    b: '♝',
    r: '♜',
    q: '♛',
    k: '♚',
    P: '♙',
    N: '♘',
    B: '♗',
    R: '♖',
    Q: '♕',
    K: '♔',
  };

  function Chessboard(elementOrId, config) {
    if (!(this instanceof Chessboard)) {
      return new Chessboard(elementOrId, config);
    }

    this.config = Object.assign(
      {
        position: 'start',
        draggable: false,
        orientation: 'white',
        pieceTheme: null,
        pieceRenderer: null,
        onDrop: null,
        onSnapEnd: null,
      },
      config || {}
    );

    this.boardElement = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!this.boardElement) {
      throw new Error('Chessboard: board element not found');
    }

    this.isFlipped = this.config.orientation === 'black';
    this.currentFen = START_FEN;
    this.dragSource = null;

    applyBaseStyles(this.boardElement);
    this.setPosition(this.config.position);
  }

  Chessboard.prototype.position = function (fen) {
    this.setPosition(fen);
  };

  Chessboard.prototype.start = function () {
    this.position('start');
  };

  Chessboard.prototype.flip = function () {
    this.isFlipped = !this.isFlipped;
    this.render();
  };

  Chessboard.prototype.setPosition = function (fen) {
    if (!fen || fen === 'start') {
      this.currentFen = START_FEN;
    } else if (typeof fen === 'string') {
      this.currentFen = fen;
    } else {
      throw new Error('Chessboard: only FEN strings are supported in this build');
    }

    this.render();
  };

  Chessboard.prototype.render = function () {
    var self = this;
    var boardMatrix = parseFen(this.currentFen);

    this.boardElement.innerHTML = '';

    var rankOrder = this.isFlipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    var fileOrder = this.isFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : FILES;

    for (var r = 0; r < rankOrder.length; r++) {
      for (var f = 0; f < fileOrder.length; f++) {
        var rankNumber = rankOrder[r];
        var fileLetter = fileOrder[f];
        var fileIdx = FILES.indexOf(fileLetter);
        var boardRow = 8 - rankNumber; // rankNumber 8 -> row 0, rankNumber 1 -> row 7
        var squareValue = boardMatrix[boardRow][fileIdx];
        var squareEl = document.createElement('div');

        squareEl.className = 'cb-square';
        squareEl.dataset.square = fileLetter + rankNumber;
        squareEl.style.backgroundColor = ((fileIdx + rankNumber) % 2 === 0) ? '#f0d9b5' : '#b58863';
        squareEl.style.display = 'flex';
        squareEl.style.alignItems = 'center';
        squareEl.style.justifyContent = 'center';

        if (squareValue) {
          var pieceNode = createPieceNode(squareValue, this.config);
          if (pieceNode) {
            squareEl.appendChild(pieceNode);
          }
        }

        attachSquareEvents(squareEl, self);
        this.boardElement.appendChild(squareEl);
      }
    }
  };

  function applyBaseStyles(element) {
    element.style.position = 'relative';
    element.style.display = 'grid';
    element.style.gridTemplateColumns = 'repeat(8, 1fr)';
    element.style.gridAutoRows = '1fr';
    element.style.aspectRatio = '1 / 1';
    element.style.border = '2px solid rgba(0, 0, 0, 0.45)';
    element.style.borderRadius = '8px';
    element.style.overflow = 'hidden';
    element.style.userSelect = 'none';
    element.style.touchAction = 'none';
  }

  function attachSquareEvents(squareEl, chessboard) {
    if (!chessboard.config.draggable) {
      return;
    }

    var pieceEl = squareEl.querySelector('.cb-piece');

    var handleDragStart = function (event) {
      if (!pieceEl) {
        event.preventDefault();
        return;
      }

      chessboard.dragSource = squareEl.dataset.square;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', chessboard.dragSource);
      }
    };

    squareEl.addEventListener('dragstart', handleDragStart);
    if (pieceEl) {
      pieceEl.addEventListener('dragstart', handleDragStart);
    }

    squareEl.addEventListener('dragover', function (event) {
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
    });

    squareEl.addEventListener('drop', function (event) {
      event.preventDefault();
      if (!chessboard.dragSource) {
        return;
      }

      var targetSquare = squareEl.dataset.square;
      var dropHandler = chessboard.config.onDrop;
      var result = typeof dropHandler === 'function' ? dropHandler(chessboard.dragSource, targetSquare) : undefined;

      if (result === 'snapback') {
        chessboard.render();
      } else if (typeof chessboard.config.onSnapEnd === 'function') {
        chessboard.config.onSnapEnd();
      }

      chessboard.dragSource = null;
    });

    var handleDragEnd = function () {
      chessboard.dragSource = null;
    };

    squareEl.addEventListener('dragend', handleDragEnd);
    if (pieceEl) {
      pieceEl.addEventListener('dragend', handleDragEnd);
    }
  }

  function createPieceNode(pieceCode, config) {
    if (typeof config.pieceRenderer === 'function') {
      return config.pieceRenderer(pieceCode);
    }

    if (config.pieceTheme) {
      var img = document.createElement('img');
      img.src = config.pieceTheme.replace('{piece}', pieceName(pieceCode));
      img.alt = pieceCode;
      img.className = 'cb-piece';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.userSelect = 'none';
      img.style.cursor = config.draggable ? 'grab' : 'default';
      img.draggable = !!config.draggable;
      return img;
    }

    var span = document.createElement('span');
    span.className = 'cb-piece';
    span.textContent = UNICODE_MAP[pieceCode] || pieceCode;
    span.style.fontSize = '2.6rem';
    span.style.display = 'flex';
    span.style.alignItems = 'center';
    span.style.justifyContent = 'center';
    span.style.cursor = config.draggable ? 'grab' : 'default';
    span.draggable = !!config.draggable;
    return span;
  }

  function parseFen(fen) {
    var rows = fen.split(' ')[0].split('/');
    if (rows.length !== 8) {
      throw new Error('Chessboard: invalid FEN string');
    }

    var board = new Array(8);

    for (var rank = 0; rank < 8; rank++) {
      var row = [];
      var fenRow = rows[rank];

      for (var i = 0; i < fenRow.length; i++) {
        var symbol = fenRow.charAt(i);

        if (isFinite(symbol)) {
          var emptyCount = parseInt(symbol, 10);
          for (var j = 0; j < emptyCount; j++) {
            row.push(null);
          }
        } else {
          row.push(symbol);
        }
      }

      if (row.length !== 8) {
        throw new Error('Chessboard: invalid FEN row "' + fenRow + '"');
      }

      board[rank] = row;
    }

    return board;
  }

  function pieceName(piece) {
    var map = {
      p: 'bP',
      n: 'bN',
      b: 'bB',
      r: 'bR',
      q: 'bQ',
      k: 'bK',
      P: 'wP',
      N: 'wN',
      B: 'wB',
      R: 'wR',
      Q: 'wQ',
      K: 'wK',
    };

    return map[piece] || 'wP';
  }

  return Chessboard;
});
