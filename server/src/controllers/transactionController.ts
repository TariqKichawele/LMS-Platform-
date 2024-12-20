import Stripe from "stripe";
import dotenv from "dotenv";
import { Request, Response } from "express";
import Course from "../models/courseModel";
import Transaction from "../models/transactionModel";
import UserCourseProgress from "../models/userCourseProgressModel";

dotenv.config();

if(!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key is not defined");
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createTransaction = async (req: Request, res: Response): Promise<void> => {
    const { userId, courseId, transactionId, amount, paymentProvider } = req.body;

    try {

        // Get course
        const course = await Course.get(courseId);


        // Create transaction
        const newTransaction = new Transaction({
            dateTime: new Date().toISOString(),
            userId,
            courseId,
            transactionId,
            amount,
            paymentProvider
        });

        await newTransaction.save();

        // Create user course progress
        const initialProgress = new UserCourseProgress({
            userId,
            courseId,
            enrollmentDate: new Date().toISOString(),
            overallProgress: 0,
            sections: course.sections.map((section: any) => ({
                sectionId: section.sectionId,
                chapters: section.chapters.map((chapter: any) => ({
                    chapterId: chapter.chapterId,
                    completed: false
                }))
            })),
            lastAccessedTimestamp: new Date().toISOString(),
        });

        await initialProgress.save();

        // Update course
        await Course.update(courseId, {
            $ADD: {
                enrollements: [{ userId }]
            }
        });

        res.json({ 
            message: "Transaction created successfully", 
            data: { 
                transaction: newTransaction, 
                courseProgress: initialProgress 
            } 
        });


    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}

export const listTransactions = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.query;
    console.log(userId);

    try {
        const transactions = userId 
            ? await Transaction.query("userId").eq(userId).exec()
            : await Transaction.scan().exec();
        
        res.json({ message: "Transactions fetched successfully", data: transactions });
        
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}

export const createStripePaymentIntent = async (req: Request, res: Response): Promise<void> => {
    let { amount } = req.body;

    if(!amount || amount <=0) {
        amount = 50;
    }

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: "usd",
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            }
        });

        res.json({ 
            message: "Payment intent created successfully", 
            data: { clientSecret: paymentIntent.client_secret } 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}