import transactionModel from "../models/transactionModel.js";

export const handlePayment = async (req, res) => {
  try {
    const body = req.body;
    const orderId = body.order_id;
    const transactionStatus = body.transaction_status;
    let updatedTransaction;
    switch (transactionStatus) {
      case "capture":
      case "settlement":
        updatedTransaction = await transactionModel.findByIdAndUpdate(orderId, {
          status: "success",
        });
        break;
      case "deny":
      case "cancel":
      case "expire":
      case "failure":
        updatedTransaction = await transactionModel.findByIdAndUpdate(orderId, {
          status: "failed",
        });
        break;
      default:
        break;
    }

    if (!updatedTransaction) {
      return res.status(404).json({
        message: "Transaction not found",
        data: {},
      });
    }
    return res.json({
      message: "Handle Payment Success",
      data: {},
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
