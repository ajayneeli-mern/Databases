const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

let database = null;
const databasePath = path.join(__dirname, "twitterClone.db");
const app = express();
app.use(express.json());

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database error is ${error.message}`);
    process.exit(1);
  }
};

initializeDBandServer();

const tweetsAndLikesOutput = (tweetData, likesCount, replyCount) => {
  return {
    tweet: tweetData.tweet,
    likes: likesCount.likes,
    replies: replyCount.replies,
    dateTime: tweetData.date_time,
  };
};
const convertUserNameReplyedDBObjectToResponseObject = (dbObject) => {
  return {
    replies: dbObject,
  };
};
const convertLikedUserNameDBObjectToResponseObject = (dbObject) => {
  return {
    likes: dbObject,
  };
};

const authenticationToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  } else {
    response.status(401);
    response.send("Invalid JWT Token");
  }

  if (jwtToken !== undefined) {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.username = payload.username;
        next();
      }
    });
  }
};

app.post("/register/", async (request, response) => {
  const { username, password, name, gender } = request.body;
  const getUserQuery = `SELECT username FROM user WHERE username='${username}';`;
  const dbUser = await database.get(getUserQuery);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const updateUserQuery = `INSERT INTO user (name,username,password,gender)
                        VALUES ('${name}','${username}','${hashedPassword}','${gender}');`;
      await database.run(updateUserQuery);
      response.send("User created successfully");
    }
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const getUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await database.get(getUserQuery);
  if (dbUser !== undefined) {
    const checkPassword = await bcrypt.compare(password, dbUser.password);
    if (checkPassword === true) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});

app.get(
  "/user/tweets/feed/",
  authenticationToken,
  async (request, response) => {
    let { username } = request;

    const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
    const dbUserId = await database.get(getUserIdQuery);

    const getFollowersIdQuery = `SELECT following_user_id FROM follower WHERE follower_user_id='${dbUserId.user_id}';`;
    const dbFollowerIds = await database.all(getFollowersIdQuery);

    const getEachFollowerIds = dbFollowerIds.map((eachUser) => {
      return eachUser.following_user_id;
    });

    const getTweetQuery = `SELECT user.username, tweet.tweet, tweet.date_time AS dateTime
        FROM user INNER JOIN tweet ON user.user_id=tweet.user_id 
        WHERE user.user_id IN (${getEachFollowerIds})
        ORDER BY tweet.date_time DESC
        LIMIT 4;`;
    const resultTweets = await database.all(getTweetQuery);
    response.send(resultTweets);
  }
);

app.get("/user/following/", authenticationToken, async (request, response) => {
  let { username } = request;

  const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
  const dbUserId = await database.get(getUserIdQuery);

  const getFollowersIdQuery = `SELECT following_user_id FROM follower WHERE follower_user_id='${dbUserId.user_id}';`;
  const dbFollowerIds = await database.all(getFollowersIdQuery);

  const getEachFollowerIds = dbFollowerIds.map((eachUser) => {
    return eachUser.following_user_id;
  });

  const getFollowingNameQuery = `SELECT name FROM user WHERE user_id IN (${getEachFollowerIds});`;
  const resultName = await database.all(getFollowingNameQuery);
  response.send(resultName);
});

app.get("/user/followers/", authenticationToken, async (request, response) => {
  let { username } = request;

  const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
  const dbUserId = await database.get(getUserIdQuery);

  const getFollowersIdQuery = `SELECT follower_user_id FROM follower WHERE following_user_id='${dbUserId.user_id}';`;
  const dbFollowerIds = await database.all(getFollowersIdQuery);

  const getEachFollowerIds = dbFollowerIds.map((eachUser) => {
    return eachUser.follower_user_id;
  });

  const getFollowerNameQuery = `SELECT name FROM user WHERE user_id IN (${getEachFollowerIds});`;
  const resultName = await database.all(getFollowerNameQuery);
  response.send(resultName);
});

app.get("/tweets/:tweetId/", authenticationToken, async (request, response) => {
  const { tweetId } = request.params;
  let { username } = request;

  const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
  const dbUserId = await database.get(getUserIdQuery);

  const getFollowersIdQuery = `SELECT following_user_id FROM follower WHERE follower_user_id='${dbUserId.user_id}';`;
  const dbFollowerIds = await database.all(getFollowersIdQuery);

  const getEachFollowerIds = dbFollowerIds.map((eachUser) => {
    return eachUser.following_user_id;
  });

  const getTweetIdsQuery = `SELECT tweet_id FROM tweet WHERE user_id IN (${getEachFollowerIds});`;
  const getTweetArray = await database.all(getTweetIdsQuery);
  const followingTweetIds = getTweetArray.map((eachTweet) => {
    return eachTweet.tweet_id;
  });

  if (followingTweetIds.includes(parseInt(tweetId))) {
    const likesQuery = `SELECT COUNT(user_id) AS likes FROM like WHERE tweet_id='${tweetId}';`;
    const likes_count = await database.get(likesQuery);

    const replyQuery = `SELECT COUNT(user_id) AS replies FROM reply WHERE tweet_id='${tweetId}';`;
    const reply_count = await database.get(replyQuery);

    const tweetDateQuery = `SELECT tweet,date_time FROM tweet WHERE tweet_id='${tweetId}';`;
    const tweetDate = await database.get(tweetDateQuery);

    response.send(tweetsAndLikesOutput(tweetDate, likes_count, reply_count));
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});

app.get(
  "/tweets/:tweetId/likes/",
  authenticationToken,
  async (request, response) => {
    const { tweetId } = request.params;
    let { username } = request;

    const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
    const dbUserId = await database.get(getUserIdQuery);

    const getFollowingIdQuery = `SELECT following_user_id FROM follower WHERE follower_user_id='${dbUserId.user_id}';`;
    const dbFollowingIdsArray = await database.all(getFollowingIdQuery);

    const getEachFollowingIds = dbFollowingIdsArray.map((eachUser) => {
      return eachUser.following_user_id;
    });

    const getTweetIdsQuery = `SELECT tweet_id FROM tweet WHERE user_id IN (${getEachFollowingIds});`;
    const getTweetArray = await database.all(getTweetIdsQuery);
    const followingTweetIds = getTweetArray.map((eachTweet) => {
      return eachTweet.tweet_id;
    });

    if (followingTweetIds.includes(parseInt(tweetId))) {
      const getLikedUserNamesQuery = `SELECT user.username AS likes FROM user
        INNER JOIN like ON user.user_id=like.user_id WHERE like.tweet_id='${tweetId}';`;
      const getLikedUserNamesArray = await database.all(getLikedUserNamesQuery);
      const getLikedUserNames = getLikedUserNamesArray.map((eachUser) => {
        return eachUser.likes;
      });

      response.send(
        convertLikedUserNameDBObjectToResponseObject(getLikedUserNames)
      );
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

app.get(
  "/tweets/:tweetId/replies/",
  authenticationToken,
  async (request, response) => {
    const { tweetId } = request.params;
    let { username } = request;

    const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
    const dbUserId = await database.get(getUserIdQuery);

    const getFollowingIdQuery = `SELECT following_user_id FROM follower WHERE follower_user_id='${dbUserId.user_id}';`;
    const dbFollowingIdsArray = await database.all(getFollowingIdQuery);

    const getEachFollowingIds = dbFollowingIdsArray.map((eachUser) => {
      return eachUser.following_user_id;
    });

    const getTweetIdsQuery = `SELECT tweet_id FROM tweet WHERE user_id IN (${getEachFollowingIds});`;
    const getTweetArray = await database.all(getTweetIdsQuery);
    const tweetIds = getTweetArray.map((eachTweet) => {
      return eachTweet.tweet_id;
    });

    if (tweetIds.includes(parseInt(tweetId))) {
      const getUserNamesReplyQuery = `SELECT user.name,reply.reply FROM user
        INNER JOIN reply ON user.user_id=reply.user_id WHERE reply.tweet_id='${tweetId}';`;
      const getUserNamesReplyArray = await database.all(getUserNamesReplyQuery);

      response.send(
        convertUserNameReplyedDBObjectToResponseObject(getUserNamesReplyArray)
      );
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

app.get("/user/tweets/", authenticationToken, async (request, response) => {
  let { username } = request;
  const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
  const getUserId = await database.get(getUserIdQuery);
  console.log(getUserId);
  const getTweetIdsQuery = `SELECT tweet_id FROM tweet WHERE user_id=${getUserId.user_id};`;
  const getTweetIdsArray = await database.all(getTweetIdsQuery);
  const getTweetIds = getTweetIdsArray.map((eachId) => {
    return parseInt(eachId.tweet_id);
  });
  const getListOfTweetQuery = `SELECT tweet.tweet AS tweet, COUNT(like.like_id) AS likes,COUNT(reply.reply_id) AS replies,tweet.date_time AS dateTime 
    FROM (tweet INNER JOIN like ON tweet.tweet_id=like.tweet_id) AS T INNER JOIN reply ON T.tweet_id=reply.tweet_id
    WHERE tweet_id IN ${getTweetIds};`;
  const getListOfTweets = await database.get(getListOfTweetQuery);
  response.send(getListOfTweets);
});

app.post("/user/tweets/", authenticationToken, async (request, response) => {
  let { username } = request;

  const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
  const dbUserId = await database.get(getUserIdQuery);

  const { tweet } = request.body;
  const currentDate = new Date();

  const postRequestQuery = `INSERT INTO tweet (tweet, user_id, date_time )
    VALUES ('${tweet}','${dbUserId.user_id}','${currentDate}');`;
  const listOfTweets = await database.run(postRequestQuery);
  response.send("Created a Tweet");
});

app.delete(
  "/tweets/:tweetId/",
  authenticationToken,
  async (request, response) => {
    const { tweetId } = request.params;
    let { username } = request;

    const getUserIdQuery = `SELECT user_id FROM user WHERE username='${username}';`;
    const dbUserId = await database.get(getUserIdQuery);

    const getTweetsListQuery = `SELECT tweet_id FROM tweet WHERE user_id='${dbUserId.user_id}';`;
    const getTweetsListArray = await database.all(getTweetsListQuery);

    const getTweetsList = getTweetsListArray.map((eachTweetId) => {
      return eachTweetId.tweet_id;
    });

    if (getTweetsList.includes(parseInt(tweetId))) {
      const deleteTweetQuery = `DELETE FROM tweet WHERE tweet_id='${tweetId}';`;
      await database.run(deleteTweetQuery);
      response.send("Tweet Removed");
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

module.exports = app;
