import { Router } from 'express';
import { processChatAssistant } from '../controllers/assistantController';

const router = Router();

// Chatbot Assistant Routes (support both /chat and /assistant/query for universal compatibility)
router.post('/chat', processChatAssistant);
router.post('/assistant/query', processChatAssistant);
router.post('/ai/chat', processChatAssistant);

export default router;
