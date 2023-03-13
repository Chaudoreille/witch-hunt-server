/**
 * GameManager
 * This class will be responsible for the actual game logic
 * As we do not keep track of the games state in memory, just the db
 * the GameManager will only have static values/methods
 */

// static methods/properties
class GameManager {
    GAME_DATA = {
        minPlayers: 3,
        maxPlayers: 25,
        defaultGameName: (user) => `${user.username}'s Witchhunt`,
        defaultIsPublished: true,
        defaultLanguage: 'English',
        defaultMaxPlayers: 10
    }

    /**
     * Receives a user object and returns a player object that can be added to game state
     * @param {User} player 
     * @returns 
     */
    createPlayer(player){
        return {user: player._id, status: 'Alive', vote: {target: null, state: null}}
    }

    /**
     * Executes the specified action and returns the new state
     * 
     * If any errors occur during the execution, returns an object with an
     * 'error' property containing an error message instead.
     * @param {User} user 
     * @param {String} action 
     * @param {GameRoom} gameRoom
     * @param {ActionParameters} parameters
     * @returns GameState || {error: String}
     */
    takeAction(user, action, gameRoom, parameters) {
        const gameState = gameRoom.state;
        let result;
        switch (action) {
            case 'join':
                return this.actionJoinGame(user, gameRoom);

            case 'leave':
                return this.actionLeaveGame(user, gameRoom);

            case 'castVote':
                result = this.actionCastVote(user, gameState, parameters);
                break;
            case 'lockVote':
                result = this.actionLockVote(user, gameState, parameters);
                break;
            case 'start':
                result = this.actionStartGame(user, gameRoom);
                return this.startRound(result)
            default:
                return {
                    error: 'Action does not exist. Please check documentation for the available actions'
                };
        }

        if (result.error) return result;
        
        if (this.checkForEndOfRound(result)) {
            this.handleEndOfRound(result);

            // As we just finished a round, we also need to check for end of game
            if (this.checkForEndOfGame(result)) {
                this.handleEndOfGame(result);
            } else {
                this.startRound(result);
            }
        }
        

        return result;
    }

    /**
     * Adds a user to the game, as long as he was not already signed up
     * and there is still room for more players
     * @param {User} user
     * @param {GameState} gameState 
     */
    actionJoinGame(user, gameRoom) {
        const gameState = gameRoom.state;
        if (gameState.players.length >= gameRoom.maxPlayers) return {error: 'This room is already full!'};
        
        const alreadySignedUp = gameState.players.some(player => player.user.equals(user._id));
        if (alreadySignedUp) return {error: 'This user is already signed up for this game room!'}

        const newPlayer = this.createPlayer(user);
        const players = [...gameState.players]

        players.push(newPlayer);

        const newGameState = {...gameState, players};
        return newGameState
    }

    /**
     * Removes a players sign up from the game.
     * If the game is running, this action will set the player to dead
     * instead of removing him entirely from the game.
     * 
     * If the owner of the game tries to leave the room, the next player in the user
     * list will receive ownership over the game. If he is the only player, the game
     * will be set to be deleted
     * @param {User} user 
     * @param {GameRoom} gameRoom 
     */
    actionLeaveGame(user, gameRoom) {
        const gameState = gameRoom.state;

        if (user._id.equals(gameRoom.owner)) {
            return {error: 'Game Owner cannot leave. Delete the room instead!'}
        }

        // If a player leaves during the game, mark him as dead, but don't remove him from the game
        if (gameState.status !== 'Lobby') {
            const player = gameState.players.filter(player => player.user.equals(user._id))[0];
            player.status = 'Dead';
            return gameState;
        }

        const players = gameState.players.filter(player => !player.user.equals(user._id));
        const newGameState = {...gameState, players};

        return newGameState;
    }

    /**
     * Takes a user vote, verifies it is a valid action and applies it to the game state
     * @param {User} user 
     * @param {GameState} gameState 
     * @param {Array} parameters, contains one value, a targetId
     */
    actionCastVote(user, gameState, parameters) {
        const [targetId] = parameters;

        // validation steps: 
        // v1 verify the game is active
        if (gameState.status !== 'Started') return {error: 'Game is not currently active, cannot cast votes!'}

        // v2 verify user is an eligible voter (must be part of the game and alive)
        const currentPlayer = gameState.players.filter(player => {
            return player.user.equals(user._id)})[0];
        if (!currentPlayer || currentPlayer.status!=='Alive') return {error: 'User is not eligible to vote'}

        // v3 verify user has not yet locked his vote
        if (currentPlayer.vote.state === 'Locked') return {error: 'User has already locked their vote for this round!'}

        // v4 verify users target is a valid choice (must be part of the game, not the user himself, and alive)
        const target = gameState.players.filter(player=>player.user.equals(targetId))[0];
        
        if (!target || target.status !== 'Alive' || user._id.equals(targetId)) return {error: 'Invalid target!'}

        // apply vote to gamestate
        currentPlayer.vote.target = target.user;
        currentPlayer.vote.state = 'Cast';


        return gameState
    }

    actionLockVote(user, gameState) {

        // validation steps: 
        // v1 verify the game is active
        if (gameState.status !== 'Started') return {error: 'Game is not currently active, cannot cast votes!'}

        // v2 verify user is an eligible voter (must be part of the game and alive)
        const currentPlayer = gameState.players.filter(player => {
            return player.user.equals(user._id)})[0];
        if (!currentPlayer || currentPlayer.status!=='Alive') return {error: 'User is not eligible to vote'}

        // v3 verify user has not yet locked his vote
        if (currentPlayer.vote.state !== 'Cast') return {error: 'User needs to cast a vote before the vote can be locked!'}

        currentPlayer.vote.state = 'Locked'

        return gameState;
    }

    /**
     * This action will start the game, provided it was not already started,
     * there are enough players for a match, and the action was taken by the 
     * owner of the game
     * @param {User} user 
     * @param {GameRoom} gameRoom 
     */
    actionStartGame(user, gameRoom) {
        if (!user._id.equals(gameRoom.owner._id)) return {error: 'User is not the owner of this game room!'};
        if (gameRoom.state.status !== 'Lobby') return {error: 'Game was already started!'};
        if (gameRoom.state.players.length < this.GAME_DATA.minPlayers) return {error: `Need at least ${this.GAME_DATA.minPlayers} to start the game!`}

        const newGameState = {...gameRoom.state, status: 'Started'}
        return newGameState;
    }

    /**
     * Called after every successful action. Checks whether the current gameState is the end of the current round.
     * @param {GameState} gameState 
     * @returns boolean
     */
    checkForEndOfRound(gameState) {
        // the round ends when all living players have locked in their votes
        console.log(gameState)
        return !(gameState.players.some(player => ((player.status === 'Alive') && (player.vote.state !== 'Locked'))));
    }

    /**
     * Called after every round. Checks whether the current gameState indicates the end of the game.
     * @param {GameState} gameState 
     * @returns boolean
     */
    checkForEndOfGame(gameState) {
        // in the current iteration of the game, the game ends when there is only two player left alive 
        // (as they would just have to keep voting for each other and so the game could never end)
        return gameState.players.filter(player => player.status === 'Alive').length <= 2;
    }

    /**
     * Called in the beginning of each round. Resets all votes to null and increments round counter
     * @param {GameState} gamestate 
     * @returns GameState
     */
    startRound(gameState) {
        gameState.players.forEach(player => player.vote = {target: null, state: null})
        gameState.round++;
        return gameState;
    }

    /**
     * Called at the end of a round. Checks for the player with the most votes and sets his status to Dead
     * In case of a tie, no player dies and the next round begins with the same amount of players as the last
     * @param {GameState} gameState 
     */
    handleEndOfRound(gameState) {
        console.log(gameState)
        const votes = gameState.players.map(player => player.vote.target).filter(vote => vote !== null);
        votes.sort();
        const voteCount = votes.reduce((previous, target)=>{
            previous[target] ??= 0;
            previous[target] += 1;
            return previous
        }, {})
        
        const maxVotes = Math.max(...Object.values(voteCount));
        const maxVoted = gameState.players.filter(player => voteCount[player.user._id] === maxVotes);
        
        // If it's a tie, gameState stays the same
        if (maxVoted.length > 1) return gameState;

        const victim = maxVoted[0];
        victim.status = 'Dead';
        return gameState;
    }

    handleEndOfGame(gameState) {
        gameState.status = 'Completed';
        return gameState;
    }
}

module.exports = GameManager;