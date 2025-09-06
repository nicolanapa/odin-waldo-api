import process from "process";
import jwt from "jsonwebtoken";

class JwtChecker {
    create(req, overwrite = false) {
        if (overwrite) {
            delete overwrite.iat;
            delete overwrite.exp;
        }

        const token = jwt.sign(
            overwrite === false
                ? {
                      startTime: new Date(),
                      postId: parseInt(req.params.id),
                      characters: [],
                      ip: req.ip,
                  }
                : overwrite,
            process.env.JWT_PRIVATE_KEY,
            { expiresIn: "5m" },
        );

        return token;
    }

    update(req, objectToAdd, photoIdKey = "id") {
        let token = this.verify(req, photoIdKey);

        if (!token) {
            return token;
        }

        delete token.iat;
        delete token.exp;

        token = {
            ...token,
            ...objectToAdd,
        };

        return this.create(req, token);
    }

    verify(req, photoIdKey = "id") {
        console.log(req.header("Authorization"));

        if (!req.header("Authorization").startsWith("Bearer ")) {
            return false;
        }

        const token = req.header("Authorization").substring(7);
        let decodedJwt = null;

        try {
            decodedJwt = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        } catch {
            return false;
        }

        console.log(decodedJwt);

        if (
            decodedJwt.ip !== req.ip ||
            decodedJwt.postId !== parseInt(req.params[photoIdKey])
        ) {
            return false;
        }

        return decodedJwt;
    }
}

export default new JwtChecker();
