import { validationResult } from "express-validator";
import prisma from "../db/prisma.js";
import jwtChecker from "../scripts/JwtChecker.js";

class Photo {
    async getAll(req, res) {
        let photoIds = await prisma.photo.findMany({ select: { id: true } });

        photoIds = photoIds.map((id) => id.id);

        return res.json(photoIds);
    }

    // async postPhoto(req, res) {}

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

        const token = jwtChecker.verify(req, "photoId");

        if (!token || token?.endTime) {
            return res
                .status(400)
                .json({ error: "JWT may be wrong or has expired" });
        }

        const characterPosition = await prisma.position.findFirst({
            where: {
                horizontal: {
                    gte: parseInt(req.body.horizontal) - 5,
                    lte: parseInt(req.body.horizontal) + 5,
                },
                vertical: {
                    gte: parseInt(req.body.vertical) - 5,
                    lte: parseInt(req.body.vertical) + 5,
                },
                photoId: parseInt(req.params.photoId),
                characterId: parseInt(req.params.characterId),
            },
        });

        if (!characterPosition) {
            return res.status(404).json({ result: false });
        }

        let finalToken = null;
        if (
            !token.characters.includes(parseInt(characterPosition.characterId))
        ) {
            finalToken = jwtChecker.update(
                req,
                {
                    characters: token.characters.concat(
                        parseInt(characterPosition.characterId),
                    ),
                },
                "photoId",
            );
        }

        res.status(200).json({
            jwt: !finalToken ? jwtChecker.create(req, token) : finalToken,
            result: true,
        });
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

    async postIdConfirm(req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const token = jwtChecker.verify(req);

        let name = "anon";
        if (req?.body?.name !== undefined) {
            name = req.body.name;
        }

        let finalTokenObject = token ? { ...token, name } : false;

        if (finalTokenObject) {
            if (
                !finalTokenObject.startTime ||
                !finalTokenObject.endTime ||
                finalTokenObject.characters.length === 0
            ) {
                finalTokenObject = false;
            }

            const characterPositions = await prisma.position.findMany({
                where: {
                    photoId: parseInt(req.params.id),
                },
            });

            for (let i = 0; i < characterPositions.length; i++) {
                if (
                    !finalTokenObject.characters.includes(
                        characterPositions[i].characterId,
                    )
                ) {
                    finalTokenObject = false;

                    break;
                }
            }

            if (finalTokenObject !== false) {
                const user = await prisma.user.create({
                    select: {
                        id: true,
                    },
                    data: {
                        name: finalTokenObject.name,
                    },
                });

                await prisma.score.create({
                    data: {
                        startTime: finalTokenObject.startTime,
                        endTime: finalTokenObject.endTime,
                        userId: user.id,
                        photoId: parseInt(req.params.id),
                    },
                });
            }
        }

        res.status(finalTokenObject ? 200 : 400).json(
            finalTokenObject
                ? true
                : { error: "JWT may be wrong or has expired" },
        );
    }
}

export default new Photo();
