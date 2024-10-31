import express from 'express';
const app = express();

const port = 8006;

// Test Route for Health Checks
app.get("/healthz", (req, res) => {
  res.status(200).json({ message: "Connected to /healthz route of run-service" });
});

app.listen(port, () => console.log(`run-service listening on port ${port}`));