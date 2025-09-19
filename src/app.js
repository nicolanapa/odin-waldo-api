import express from "express";
import cors from "cors";
import process from "process";
import photoRouter from "./routes/photoRouter.js";

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
    }),
);

app.get("/", (req, res) => {
    res.send("/");
});

app.use("/photo", photoRouter);

app.listen(PORT);
