import { Router, type IRouter } from "express";
import healthRouter from "./health";
import examsRouter from "./exams";
import violationsRouter from "./violations";
import auditorRouter from "./auditor";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/exams", examsRouter);
router.use("/", violationsRouter);
router.use("/auditor", auditorRouter);

export default router;
