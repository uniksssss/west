import Card from "./Card.js";
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card instanceof Duck;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, maxPower) {
        super(name, maxPower);
    }

    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        for (let oppositeCard of oppositePlayer.table) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
            });
        }

        taskQueue.continueWith(continuation);
    }
}

class Duck extends Creature {
    constructor(name='Мирная утка', maxPower=2) {
        super(name, maxPower);
    }

    quacks() {
        console.log('quack')
    };

    swims() {
        console.log('float: both;')
    };
}

class Dog extends Creature {
    constructor(name='Пес бандит', maxPower=3) {
        super(name, maxPower);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {super.modifyTakenDamage(value - 1, fromCard, gameContext, continuation);});
    }

    getDescriptions() {
        return ['Получает на 1 единицу меньше урона', ...super.getDescriptions()];
    }
}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static inGameCount;

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        super.doBeforeRemoving(continuation);
    }

    static getBonus() {
        return Lad.getInGameCount() * (Lad.getInGameCount() + 1) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        super.modifyDealedDamageToCreature(value + Lad.getBonus(), toCard, gameContext, continuation);
    };

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (Lad.getBonus() > 0) {
            this.view.signalAbility(() => {
                super.modifyTakenDamage(value - Lad.getBonus(), fromCard, gameContext, continuation);
            });
            return;
        }

        super.modifyTakenDamage(value, fromCard, gameContext, continuation);
    };

    getDescriptions() {
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')) {
            return ['Чем их больше, тем они сильнее', ...super.getDescriptions()];
        }

        return super.getDescriptions();
    }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});