import { Router } from "express";
import prisma from "../db/prisma.js";
import { body, validationResult } from "express-validator";
import process from "process";
import jwt from "jsonwebtoken";

const positionValidation = [
    body("horizontal")
        .trim()
        .escape()
        .notEmpty()
        .isNumeric()
        .withMessage("Horizontal value must be a Number"),
    body("vertical")
        .trim()
        .escape()
        .notEmpty()
        .isNumeric()
        .withMessage("Vertical value must be a Number"),
];

const photoRouter = new Router();

photoRouter.get("/", async (req, res) => {
    let photoIds = await prisma.photo.findMany({ select: { id: true } });

    photoIds = photoIds.map((id) => id.id);

    return res.json(photoIds);
});

photoRouter.post("/", async (req, res) => {});

photoRouter.get("/:id", async (req, res) => {
    let photoElement = await prisma.photo.findUnique({
        where: {
            id: parseInt(req.params.id),
        },
        select: {
            id: true,
            link: true,
            characters: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });

    if (!photoElement) {
        return res.status(404).json({ error: "404 Not Found" });
    }

    return res.json(photoElement);
});

photoRouter.get("/:id/leaderboard", async (req, res) => {
    let leaderboard = await prisma.score.findMany({
        where: {
            photoId: parseInt(req.params.id),
        },
        select: {
            startTime: true,
            endTime: true,
            user: {
                select: {
                    name: true,
                },
            },
        },
    });

    for (let i = 0; i < leaderboard.length; i++) {
        leaderboard[i].score =
            (leaderboard[i].endTime - leaderboard[i].startTime) / 1000;

        leaderboard[i].user = leaderboard[i].user.name;
    }

    console.log(leaderboard);

    if (leaderboard.length === 0) {
        return res.status(404).json({ error: "404 Not Found" });
    }

    return res.json(leaderboard);

    /*return res.json(
        await prisma.$queryRaw`
            SELECT EXTRACT(EPOCH FROM ("endTime" - "startTime")) AS "score", "userId" FROM "Score"
            WHERE "photoId" = ${parseInt(req.params.id)}
            ORDER BY "score" ASC;
        `,
    );*/
});

photoRouter.post(
    "/:photoId/checkPosition/:characterId",
    positionValidation,
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const characterPosition = await prisma.position.findFirst({
            where: {
                horizontal: parseInt(req.body.horizontal),
                vertical: parseInt(req.body.vertical),
                photoId: parseInt(req.params.photoId),
                characterId: parseInt(req.params.characterId),
            },
        });

        console.log(parseInt(req.params.photoId), characterPosition);

        if (!characterPosition) {
            return res.status(404).json(false);
        }

        res.status(200).json(true);
    },
);

photoRouter.post("/:id/start", async (req, res) => {
    const token = jwt.sign(
        { startTime: new Date(), postId: parseInt(req.params.id), ip: req.ip },
        process.env.JWT_PRIVATE_KEY,
        { expiresIn: "5m" },
    );

    res.status(200).json({ jwt: token });
});

photoRouter.post("/:id/end", async (req, res) => {
    console.log(req.header("Authorization"));
});

photoRouter.post("/:id/confirm", async (req, res) => {});

export default photoRouter;
