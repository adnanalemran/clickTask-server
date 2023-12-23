const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173","https://clicktask-adnan.web.app"], 
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fhwdeyh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const userCollection = client.db("ClickTaskDB").collection("user");
    const taskCollection = client.db("ClickTaskDB").collection("task");

    //aurh releted api
    app.post("/jwt", (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,

          sameSite: "none",
        })
        .send({ success: true });
    });

    //User api
    app.post("/user", async (req, res) => {
      const user = req.body;
      try {
        const result = await userCollection.insertOne(user);
        res.status(201).json({ message: "User added successfully" });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Failed to insert data into the database" });
      }
    });

    app.patch("/task/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body.status;
      console.log(id, status);
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status,
        },
      };

      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // Single user by uid
    app.get("/user/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = {
        uid: uid,
      };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    //task api
    app.post("/task", async (req, res) => {
      const user = req.body;
      try {
        const result = await taskCollection.insertOne(user);
        res.status(201).json({ message: "Task added successfully" });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ error: "Failed to insert data into the database" });
      }
    });

    app.get("/task", async (req, res) => {
      const result = await taskCollection.find().toArray();
      res.send(result);
    });


    app.delete("/task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/update-task-status/:id", async (req, res) => {
      const taskId = req.params.id;
      const { status } = req.body;
    
      taskCollection.findOneAndUpdate(
        { _id: new ObjectId(taskId) },
        { $set: { status } },
        { returnDocument: 'after' }
      )
        .then(updatedTask => {
          if (!updatedTask.value) {
            return res.status(404).json({ error: 'Task not found' });
          }
          res.json(updatedTask.value);
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
        });
    });
    





    

    app.get("/filtered-my-task", async (req, res) => {
      const { email } = req.query;
      console.log(email);
      try {
        const filteredTasks = await taskCollection.find({ email }).toArray();
        res.json(filteredTasks);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch and filter data" });
      }
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    //we are no end
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Click task Backend v2 server is running...");
});

app.listen(port, () => {
  console.log(`SERVER is v2 Running on port ${port}`);
});
