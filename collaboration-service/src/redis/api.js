import { createClient } from 'redis';

/**
 * Interface to connect to Redis
 */
class RedisClient {
  /** Static client instance; reusing connection */
  static client = null;

  /**
   * Creates an instance of the redis client if it is not already created, otherwise
   * return the already created redis client.
   *
   * @returns Redis client
   */
  async createIfAbsent() {
    if (RedisClient.client !== null) {
      return RedisClient.client;
    }

    // If absent, create it and store it in the static variable
    RedisClient.client = await createClient()
      .on('error', (err) => {
        console.log(`Error encountered: ${err}`);
      })
      .on('connect', (conn) => {
        console.log('Connected to Redis');
      });

    // Connect to it
    RedisClient.client.connect();

    // Create the autoincrementing ID
    await RedisClient.client.incr('_id');

    // return client
    return RedisClient.client;
  }

  /**
   * Closes the connection to the redis client and delete the instance if present, otherwise
   * do nothing.
   */
  async deleteIfPresent() {
    if (RedisClient.client === null) {
      return;
    }

    await RedisClient.client.quit();
    RedisClient.client = null;
  }

  /**
   * Increments the autoincrementing ID used for rooming.
   */
  async #autoincrementId() {
    await (await this.createIfAbsent()).incr('_id');
  }

  /**
   * Retrieves the autoincrementing ID used for rooming.
   */
  async #getAutoincrementId() {
    return await (await this.createIfAbsent()).get('_id');
  }

  /**
   * Performs both the retrieval of autoincrementing ID and the incrementing of
   * the autoincrementing ID in the same step.
   *
   * This is used mainly to assign a room, and then to find the next possible room
   * where users can be assigned to (precomputing first to minimise likelihood for
   * createRoom function to iterate through and find the next available room)
   */
  async #getAndSetAutoincrementId() {
    const id = await this.#getAutoincrementId();
    await this.#autoincrementId();

    return id;
  }

  /**
   * Creates a room given a roomId and Array of users to add to the room
   *
   * @param {Array<String>} users Array of user emails used for rooming
   * @returns roomId used to identify the room
   */
  async createRoom(users) {
    const client = await this.createIfAbsent();

    // check to make sure users are not already in a room
    const userRooms = await this.findRoomByUsers(users);

    if (userRooms.length > 0) {
      console.error(
        'Error: Users are already found in another room!',
        userRooms
      );
      return;
    }

    // autoincrement the room ID while a room is found
    // find a valid room ID to slot the room into
    // autoincrementing like this is safe as redis runs in a single thread, no race conditions
    // no worries that incrementing like this would break the DB
    while (
      (await this.findUsersFromRoom(await this.#getAutoincrementId())) !== null
    ) {
      await this.#autoincrementId();
    }

    // get and set the autoincrementing ID
    const roomId = await this.#getAndSetAutoincrementId();

    // create the room
    await client.hSet(`id-${roomId}`, 'users', this.toJson(users));

    // return the room id for the frontend
    return roomId;
  }

  /**
   * Finds the users that are part of a room based on a given room Id.
   *
   * @param {number} room Room ID
   * @returns Array of user emails if found, else null
   */
  async findUsersFromRoom(room) {
    const client = await this.createIfAbsent();

    try {
      // try to find the room that corresponds to the room ID
      const results = await client.hGetAll(room);
      const jsonifed = this.fromJson(results);

      return jsonifed.users;
    } catch (e) {
      // syntax error happens when the json object is not parsable (e.g. undefined)
      if (e instanceof SyntaxError) {
        console.error(
          `Error: Room provided is either not found or is invalid!`
        );
      } else {
        console.error(`Error: Cannot retrieve room due to ${e}`);
      }

      return null;
    }
  }

  /**
   * Asserts that a room has 2 users within it
   *
   * @param {number} room Room ID
   * @returns
   */
  async assertRoomHasTwoUsers(room) {
    const results = await this.findUsersFromRoom(room);

    return results !== null && results.length === 2;
  }

  /**
   * Finds a single user and their corresponding room.
   *
   * @param {string} user User to find
   */
  async findRoomByUser(user) {
    return await this.findRoomByUsers([user]);
  }

  /**
   * Find the users and their corresponding rooms
   *
   * @param {Array<String>} users Array or set of users to find
   * @returns Array of Array containing the roomId and corresponding user
   */
  async findRoomByUsers(users) {
    // https://stackoverflow.com/questions/37642762/using-redis-scan-in-node

    const client = await this.createIfAbsent();
    const iterator_params = {
      MATCH: 'id-*',
    };
    const results = [];

    for await (const key of client.scanIterator(iterator_params)) {
      for (const user of await this.findUsersFromRoom(key)) {
        if (users.includes(user)) {
          results.push([key, user]);
        }
      }
    }

    return results;
  }

  /**
   * Converts a JSON object containing the list of users in a room
   * into a JSON string.
   *
   * @param {Map} users Map containing Array of users in a room
   * @returns string object representing the JSON object
   */
  toJson(users) {
    return JSON.stringify({
      users: users,
    });
  }

  /**
   * Converts the JSON string representing the list of users back
   * into an Array of user emails
   *
   * @param {string} results JSON string representing the list of users
   * @returns JSON object containing the list of users in a room
   */
  fromJson(results) {
    return JSON.parse(results.users);
  }
}
