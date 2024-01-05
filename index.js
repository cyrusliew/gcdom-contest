require('dotenv').config();

const token = process.env?.TOKEN;
const postId = process.env?.POST_ID;
const baseUrl = "https://graph.facebook.com/v18.0";
const fields = "username,user,text";
const commentListUrl = `${baseUrl}/${postId}/comments?fields=${fields}&access_token=${token}`;

let comments = [];

const getAllComments = async (url) => {
    try {
        const response = await fetch(url, (response) => response);
        const data = await response.json();

        if (data.error) {
            throw new Error("Something is wrong - ", data.error);
        }

        comments.push(...data.data);
        
        const nextPageUrl = data.paging?.next;
        if (nextPageUrl) {
            await getAllComments(nextPageUrl);
        } else {
            console.log(`Found ${comments.length} comments`);
        }
    } catch (e) {
        console.log("Error - ", {e});
    }
};

function selectWinners(comments) {
    const userCommentCount = {};
    const userTagCount = {};
  
    comments.forEach((comment) => {
      const user = comment.user;
      const tags = comment.tags.filter(tag => tag.startsWith('@')).map(tag => tag.slice(1));
  
      // Count comments by user
      if (!userCommentCount[user]) {
        userCommentCount[user] = 1;
      } else {
        userCommentCount[user]++;
      }
  
      // Count tags by user
      tags.forEach(taggedUser => {
        if (!userTagCount[taggedUser]) {
          userTagCount[taggedUser] = 1;
        } else {
          userTagCount[taggedUser]++;
        }
      });
    });
  
    // Randomly select 2 commenters
    const commentWinners = getRandomWinners(userCommentCount, 2);
  
    // Filter tagged friends based on selected commenters
    const commenters = Object.keys(commentWinners);
    const filteredTagWinners = Object.keys(userTagCount).filter(taggedUser => !commenters.includes(taggedUser));
  
    // Randomly select 2 tagged friends from the filtered list
    const tagWinners = getRandomWinners(filteredTagWinners.reduce((acc, user) => {
      acc[user] = userTagCount[user];
      return acc;
    }, {}), 2);
  
    return { commentWinners, tagWinners };
  }
  
  function getRandomWinners(userCounts, numWinners) {
    const users = Object.keys(userCounts);
    const weights = users.map(user => userCounts[user]);
  
    const winners = [];
    for (let i = 0; i < numWinners; i++) {
      const winner = getRandomWeightedElement(users, weights);
      winners.push(winner);
      // Remove the winner to avoid duplicate selection
      users.splice(users.indexOf(winner), 1);
      weights.splice(weights.indexOf(userCounts[winner]), 1);
    }
  
    return winners;
  }
  
  function getRandomWeightedElement(elements, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let randomValue = Math.random() * totalWeight;
  
    for (let i = 0; i < elements.length; i++) {
      randomValue -= weights[i];
      if (randomValue <= 0) {
        return elements[i];
      }
    }
  
    // This should not happen, but just in case
    return elements[elements.length - 1];
  }
  
  // Example usage
  const commentsData = [
    { user: 'user1', tags: ['@friend1', '@friend2'] },
    { user: 'user2', tags: ['@friend2', '@friend3'] },
    { user: 'user1', tags: ['@friend4'] },
    { user: 'user3', tags: ['@friend5', '@friend6', '@friend7'] },
    // Add more comments as needed
  ];
  
  const { commentWinners, tagWinners } = selectWinners(commentsData);
  console.log("Comment Winners:", commentWinners);
  console.log("Tag Winners from Commenters:", tagWinners);