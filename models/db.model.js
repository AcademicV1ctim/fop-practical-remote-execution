require('dotenv').config();
const { MongoClient} = require('mongodb');

// Replace with your own MongoDB URI
const uri = process.env.MONGODB_URI;
const dbName = 'project';

module.exports.getAllData = async function getAllData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('Testcases');

    const testcases = await collection.find().toArray();

    return testcases;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw error;
  } finally {
    await client.close();
  }
};

module.exports.getDatabyTopicId = async function getDatabyTopicId(Topicid) {
    const client = new MongoClient(uri);
  
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('Testcases');
  
      const testcases = await collection.find({ Topicid: parseInt(Topicid, 10) }).toArray();
  
      return testcases;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    } finally {
      await client.close();
    }
};

module.exports.getDatabyQuestionId = async function getDatabyQuestionId(Topicid, Questionid) {
    const client = new MongoClient(uri);
  
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection('Testcases');
  
      
      const testcases = await collection.find({
        Topicid: parseInt(Topicid, 10),
        Questionid: parseInt(Questionid, 10)
      }).toArray();
  
      return testcases;
    } catch (error) {
      console.error("Error getting testcases:", error);
      throw error;
    } finally {
      await client.close();
    }
  };
  