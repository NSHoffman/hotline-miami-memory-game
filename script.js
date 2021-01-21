(function() {

    // DOM ELEMENTS SEARCH

    var table       = document.getElementById('table-container');
    var startButton = document.getElementById('start-button');
    var gameField   = table.querySelector('.game-field');
    var diffBlock   = document.getElementById('difficulty');
    var results     = document.getElementById('results');
    var endOptions  = document.getElementById('finish-options');
    var gameScreen  = document.getElementById('game-screen');
    var startScreen = document.getElementById('start-screen');
    var container   = document.getElementById('container');
    var overlay     = document.getElementById('overlay');
    var pts         = document.getElementById('points');

    // GAME PROPERTIES

    var difficulty  = 0;        // 0 - NORMAL (8 CARDS), 1 - HARD (12 CARDS)
    var score       = 0;        // GAME SCORE
    var cards       = [         // ALL POSSIBLE CARD CLASS-NAMES
        'beard', 'biker',
        'corey', 'tony',
        'mark', 'swans',
        'richter', 'son',
        'mafia', 'rep',
        'pardo', 'midnight'
    ];
    var cells = [];             // DOM CARD-OBJECTS LINKS
    var cardSet = [];           // FINAL RANDOMLY MIXED SET OF CARDS
    var turnStatus  = {         // SESSION STATUS ATTRIBUTES
        cardsFlipped: 0,            // Number of cards currently flipped
        first: null,                // link to the first card
        second: null,               // link to the second card
        combo: 0,                   // combo counter
        cardsLeft: 0,               // Number of unflipped cards left
        startTime: 0                // Start breakpoint
    };

    // DOM CHANGES

    function inGame() {                             // GETS THE PLAYGROUND READY
        container.classList.remove('start');
        var timer1 = setTimeout(function() {
            startScreen.hidden = true;
            gameScreen.hidden = false;
            var timer2 = setTimeout(function() {
                container.classList.add('ingame');
                clearTimeout(timer2);
            }, 25);
            clearTimeout(timer1);
        }, 500);        
    }

    function toStart() {                            // GETS BACK TO START SCREEN
        if (!overlay.hidden) {
            hideOverlay();
        }
        container.classList.remove('ingame');
        var timer1 = setTimeout(function() {
            gameScreen.hidden = true;
            startScreen.hidden = false;
            var timer2 = setTimeout(function() {
                container.classList.add('start');
                clearTimeout(timer2);
            }, 25);
            clearTimeout(timer1);
        }, 500);
    }

    function overlayDiff() {                        // SHOWS DIFFICULTY SETTINGS
        if (overlay.hidden) overlay.hidden = false;
        var timer = setTimeout(function() {
            overlay.classList.add('visible--diff');
            if (overlay.classList.contains('visible--res')) {
                overlay.classList.remove('visible--res');
            }
            clearTimeout(timer);
        }, 25);
    }

    function overlayEnd() {                         // SHOWS TOTAL RESULTS
        overlay.hidden = false;
        var timer = setTimeout(function() {
            overlay.classList.add('visible--res');
            clearTimeout(timer);
        }, 25);
    }

    function hideOverlay() {                        // HIDES OVERLAY
        overlay.hidden = true;
        overlay.className = 'overlay';
    }

    function cardFade(first, second) {              // MAKES CARDS FADED WHEN BOTH OF TYPE FLIPPED
        first.parentNode.classList.add('faded');
        second.parentNode.classList.add('faded');
    }

    // EVENT LISTENERS

    startButton.addEventListener('click', overlayDiff);

    gameField.addEventListener('click', function(e) {
        var target = e.target;
        while (target != this) {
            if (target.classList.contains('card')) break;
            target = target.parentNode;
        }
        if (target == this) return false;
        if (target.classList.length > 1) return false;

        target.lastElementChild.classList.add( cardSet[ cells.indexOf(target.parentNode) ] );
        target.classList.toggle('flipped');
        flipCards(target);
    });

    diffBlock.addEventListener('click', function(e) {
        if (!e.target.tagName == 'button') return false;
        setDifficulty(e.target.id);
        gameStart();        
        inGame();
        hideOverlay();
    });

    endOptions.addEventListener('click', function(e) {
        var target = e.target;
        while (target != this) {
            if (target.className == 'button-option') break;
            target = target.parentNode;
        }
        if (target == this) return false;

        switch (target.firstElementChild.id) {
            case 'changeDiff':
                overlayDiff();
                break;
            case 'retry':
                gameStart();
                hideOverlay();
                break;
            case 'quit':
                toStart();
        }
    });

    // GAME OPERATIONS

    function gameStart() {                              // DATA REFRESH AND TABLE RENDERING

        reset();
        mixCards();
        gameField.innerHTML = '';
        var rows    = difficulty ? 3 : 2;
        var tbody   = document.createElement('tbody'); 
        for (let i = 0; i < rows; i++) {
            var tr = document.createElement('tr');
            for (let j = 0; j < 4; j++) {
                var td = document.createElement('td');
                td.className =  'card-holder';
                td.innerHTML =  '<div class="card">' +
                                '<div class="card__item--front"></div>' +
                                '<div class="card__item--back"></div>' +
                                '</div>';
                cells.push(td);
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
        gameField.appendChild(tbody);
        
        turnStatus.startTime = performance.now();
    }

    function getRank(score) {                           // RANKING
        return  (score >= 1000) ? 'S' :
                (score < 1000 && score >= 750) ? 'A' :
                (score < 750 && score >= 500) ? 'B' :
                (score < 500 && score >= 300) ? 'C' :
                (score < 300 && score >= 150) ? 'D' : 'F';
    }

    function getTime() {                                // TOTAL TIME CALCULATION
        var period = performance.now() - turnStatus.startTime;
        period = new Date(period);
        return (
            ((period.getMinutes() < 10) ? '0' + period.getMinutes() : period.getMinutes()) + ' : '
            + ((period.getSeconds() < 10) ? '0' + period.getSeconds() : period.getSeconds())
        );    
    }
    
    function setDifficulty(diff) {                      // DIFFICULTY CHANGING
        difficulty = ['diff-normal', 'diff-hard'].indexOf(diff);
    }
    
    function mixCards() {                               // MIXING THE CARDS
    
        var mix = cards.slice();
        mix.sort(function() {
            return [1, -1][Math.round(Math.random())];
        });
        mix = mix.slice(0, (difficulty) ? 6 : 4);
        mix = mix.concat(mix);
        mix.sort(function() {
            return [1, -1][Math.round(Math.random())];
        });
    
        cardSet = mix;
    }

    function flipCards(target) {                        // CARDS MATCHING, GAME STATUS CHECK
        turnStatus.cardsFlipped++;
        switch (turnStatus.cardsFlipped) {
            case 1:
                turnStatus.first = target;
                break;
            case 2:
                turnStatus.second = target;
                var points = 0;
                if (turnStatus.first.lastElementChild.classList[1]
                     == 
                    turnStatus.second.lastElementChild.classList[1]) 
                {
                    points = 100;
                    points += turnStatus.combo * 50;
                    cardFade(turnStatus.first, turnStatus.second);
                    turnStatus.combo++;
                    turnStatus.cardsLeft -= 2;
                } 
                else
                {
                    points = -50;
                    turnStatus.combo = 0;
                    var flipback = setTimeout(function(first, second) {
                        first.classList.remove('flipped');
                        second.classList.remove('flipped');
                        first.classList.add('cooldown');
                        second.classList.add('cooldown');
                        var timer = setTimeout(function() {
                            first.lastElementChild.className = second.lastElementChild.className = 'card__item--back';
                            first.classList.remove('cooldown');
                            second.classList.remove('cooldown');
                            clearTimeout(timer);
                        }, 500);
                        clearTimeout(flipback);
                    }, 1000, turnStatus.first, turnStatus.second);
                }
                turnStatus.cardsFlipped = 0;
                turnStatus.first = turnStatus.second = null;
                
                score += points;
                pts.innerHTML = pts.dataset.text = "" + score;

                if (turnStatus.cardsLeft == 0) gameWon();
        }
    }

    function gameWon() {                                // SESSION RESULTS OUTPUT
        var total = [score, getRank(score), getTime()];
        var resRows = results.querySelectorAll('.result__item--right');
        
        for (let i = 0; i < resRows.length; i++) {
            resRows[i].innerHTML = '' + total[i];
        }

        overlayEnd();
    }

    function reset() {                                  // DATA REFRESH
        score       = 0;
        pts.innerHTML = pts.dataset.text = "" + score;
        time        = 0;
        cells       = [];
        cardSet     = [];
        turnStatus.combo     = 0;
        turnStatus.startTime = 0;
        turnStatus.cardsLeft = difficulty ? 12 : 8;
    }

})();