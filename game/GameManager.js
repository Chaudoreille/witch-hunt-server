/**
 * GameManager
 * This class will be responsible for the actual game logic
 * As we do not keep track of the games state in memory, just the db
 * the GameManager will only have static values/methods
 */
// TODO Consider whether we really need to instantiate a game manager and
// keep the instance lying around or whether game manager should have 
// static methods/properties
class GameManager {
    GAME_DATA = {
        minPlayers: 1,
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
                result = this.actionJoinGame(user, gameRoom);
                break;
            case 'leave':
                result = this.actionLeaveGame(user, gameRoom);
                break;
            case 'castVote':
                result = this.actionCastVote(user, gameState, parameters);
                break;
            case 'lockVote':
                result = this.actionLockVote(user, gameState, parameters);
                break;
            case 'start':
                result = this.actionStartGame(user, gameRoom);
                break;
            default:
                result = {
                    error: 'Action does not exist. Please check documentation for the available actions'
                };
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

        const players = gameState.players.filter(player => !player.user.equals(user._id));
        const newGameState = {...gameState, players};

        return newGameState;
    }

    /**
     * 
     * @param {User} user 
     * @param {*} gameState 
     * @param {*} parameters 
     */
    actionCastVote(user, gameState, parameters) {

    }

    actionLockVote(user, gameState, parameters) {

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
}

module.exports = GameManager;