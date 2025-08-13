import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import TransactionModel from "../models/transactionModel.js";
import transactionModel from "../models/transactionModel.js";
import jwt from "jsonwebtoken";

export const signUpAction = async (req, res) => {
  const midtransUrl = process.env.MIDTRANS_URL;
  const midtransAuthString = process.env.MIDTRANS_AUTH_STRING;
  const successCheckoutUrl = process.env.SUCCESS_CHECKOUT_URL;

  try {
    const body = req.body; //name, email, password

    const hashedPassword = bcrypt.hashSync(body.password, 12);
    const user = new userModel({
      name: body.name,
      email: body.email,
      photo: "default.jpg",
      password: hashedPassword,
      role: "manager",
    });
    // payment gateway
    const transaction = new TransactionModel({
      user: user._id,
      price: 280000,
    });

    const midtrans = await fetch(midtransUrl, {
      method: "POST",
      body: JSON.stringify({
        transaction_details: {
          order_id: transaction._id.toString(),
          gross_amount: transaction.price,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          email: user.email,
        },
        callbacks: {
          finish: successCheckoutUrl,
        },
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${midtransAuthString}`,
      },
    });

    const midtransResponse = await midtrans.json();

    await user.save();
    await transaction.save();

    return res.status(200).json({
      message: "User created successfully",
      data: {
        midtrans_payment_url: midtransResponse.redirect_url,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signInAction = async (req, res) => {
  try {
    const body = req.body;
    const existingUser = await userModel.findOne({ email: body.email });
    if (existingUser === null) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const comparedPassword = bcrypt.compareSync(
      body.password,
      existingUser.password
    );

    if (!comparedPassword) {
      return res.status(400).json({
        message: "Email or password is incorrect",
      });
    }

    const isValidUser = await transactionModel.findOne({
      user: existingUser._id,
      status: "success",
    });

    if (!isValidUser && existingUser.role !== "student") {
      return res.status(403).json({
        message: "User not verified",
      });
    }

    const token = jwt.sign(
      {
        data: {
          id: existingUser._id,
        },
      },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Sign in success",
      data: {
        name: existingUser.name,
        email: existingUser.email,
        token,
        role: existingUser.role,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
