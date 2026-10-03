import express from "express";
import ExcelJS from "exceljs";
import { authRequired } from "../middleware/auth.js";
import { managerOnly, checkProject } from "../middleware/access.js";
import { Expense } from "../models/Expense.js";
import { Contract } from "../models/Contract.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const exportRouter = express.Router();
exportRouter.use(authRequired, managerOnly);
exportRouter.get(
  "/projects/:id/:type",
  asyncHandler(async (req, res) => {
    if (!["contracts", "expenses"].includes(req.params.type))
      return res.status(400).json({ message: "Eksport turi noto'g'ri" });
    const project = await checkProject(req.user, req.params.id),
      expense = req.params.type === "expenses",
      Model = expense ? Expense : Contract;
    const items = await Model.find({
      project: project._id,
      deletedAt: null,
    }).sort({ createdAt: -1 });
    const wb = new ExcelJS.Workbook(),
      sheet = wb.addWorksheet(expense ? "Xarajatlar" : "Shartnomalar");
    sheet.columns = [
      { header: "№", key: "number", width: 6 },
      { header: "Sana", key: "date", width: 15 },
      { header: "Nomi", key: "title", width: 40 },
      { header: "Dog summa", key: "amount", width: 20 },
      { header: "Avans", key: "advance", width: 20 },
      { header: "Jami berilgan summa", key: "totalPaid", width: 25 },
      { header: "Yopildi", key: "closedAt", width: 15 },
    ];
    items.forEach((item, i) =>
      sheet.addRow({
        number: i + 1,
        date: (item.date || item.signedAt)?.toISOString().slice(0, 10),
        title: item.title,
        amount: item.amount,
        advance: item.advance,
        totalPaid: item.totalPaid,
        closedAt: item.closedAt?.toISOString().slice(0, 10),
      }),
    );
    sheet.getRow(1).font = { bold: true };
    for (const key of ["amount", "advance", "totalPaid"])
      sheet.getColumn(key).numFmt = "#,##0.00";
    res.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.set(
      "Content-Disposition",
      `attachment; filename="${expense ? "expenses" : "contracts"}.xlsx"`,
    );
    res.send(Buffer.from(await wb.xlsx.writeBuffer()));
  }),
);
