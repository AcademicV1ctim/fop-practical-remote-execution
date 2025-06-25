const express = require("express");
const router = express.Router();


const { getAllData,getDatabyTopicId, getDatabyQuestionId, getQuestionById} = require("../models/db.model"); // Adjust path if needed


router.get("/Data", async (req, res) => {
  try {
    const testcases = await getAllData();
    res.json({ testcases });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/Data/Topic/:Topicid", async (req, res) => {
    const { Topicid } = req.params;
  
    try {
      const testcases = await getDatabyTopicId(Topicid);
      res.json({ testcases });
    } catch (error) {
      console.error("Error fetching testcases by topicId:", error);
      res.status(500).json({ error: "Failed to fetch testcases" });
    }
});

router.get("/Data/Question/:Topicid/:Questionid", async (req, res) => {
    const { Topicid, Questionid } = req.params;
  
    try {
      if(Topicid<=2){
        res.json("No test cases provided for this topic.")
      }
      const testcases = await getDatabyQuestionId((Topicid), (Questionid));
      res.json({ testcases });
    } catch (error) {
      console.error("Error fetching testcases by Topicid and Questionid:", error);
      res.status(500).json({ error: "Failed to fetch testcases" });
    }
  });
  
router.get('/questions/:topicId/:questionId', async (req, res) => {
    const { topicId, questionId } = req.params;
  
    try {
      const question = await getQuestionById(topicId, questionId);
  
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
  
      res.json(question);
    } catch (error) {
      console.error("Error in /questions route:", error);
      res.status(500).json({ error: 'Server error' });
    }
});
  


module.exports = router;
