import express from "express"
import {sendMessage,getMessages,getConversations} from "../controllers/messageController.js"
import protect from "../middleware/authMiddleware.js"
import authorizeRoles from "../middleware/roleMiddleware.js"

const router = express.Router()

router.post("/send",protect,authorizeRoles("alumni","admin","student"),sendMessage)
router.get("/conversations",protect,authorizeRoles("alumni","admin","student"),getConversations)
router.get("/:userId",protect,authorizeRoles("alumni","admin","student"),getMessages)

export default router