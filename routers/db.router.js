const express = require("express");
const router = express.Router();


const { getAllData,getDatabyTopicId, getDatabyQuestionId } = require("../models/db.model"); // Adjust path if needed


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
  

module.exports = router;
