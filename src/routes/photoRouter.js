import { Router } from "express";
import { body } from "express-validator";
import photoController from "../controllers/Photo.js";

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

const nameValidation = [
    body("name")
        .trim()
        .escape()
        .default("anon")
        .isLength({ min: 2, max: 32 })
        .withMessage("name must be between 2 and 32 characters length"),
];

const photoRouter = new Router();

photoRouter.get("/", photoController.getAll);

// photoRouter.post("/", photoController.postPhoto);

photoRouter.get("/:id", photoController.getId);

photoRouter.get("/:id/leaderboard", photoController.getIdLeaderboard);

photoRouter.post(
    "/:photoId/checkPosition/:characterId",
    positionValidation,
    photoController.postCheckPosition,
);

photoRouter.post("/:id/start", photoController.postIdStart);

photoRouter.post("/:id/end", photoController.postIdEnd);

photoRouter.post("/:id/confirm", nameValidation, photoController.postIdConfirm);

export default photoRouter;
