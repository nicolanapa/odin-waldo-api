import { validationResult } from "express-validator";
import process from "process";
import jwt from "jsonwebtoken";
import prisma from "../db/prisma.js";
import jwtChecker from "../scripts/JwtChecker.js";

class Photo {
    async getAll(req, res) {
        let photoIds = await prisma.photo.findMany({ select: { id: true } });

        photoIds = photoIds.map((id) => id.id);

        return res.json(photoIds);
    }

    async postPhoto(req, res) {}

    async getId(req, res) {
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
    }

    async getIdLeaderboard(req, res) {
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
    }

    async postCheckPosition(req, res) {
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
    }

    async postIdStart(req, res) {
        res.status(200).json({ jwt: jwtChecker.create(req) });
    }

    async postIdEnd(req, res) {
        const token = jwtChecker.verify(req);

        const finalToken = token
            ? jwtChecker.update(req, { endTime: new Date() })
            : false;

        res.status(finalToken ? 200 : 400).json(
            finalToken
                ? { jwt: finalToken }
                : { error: "JWT may be wrong or has expired" },
        );
    }
    // check if all keys exist
    async postIdConfirm(req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        console.log(jwt.decode(req.header("Authorization").substring(7)));
    }
}

export default new Photo();
